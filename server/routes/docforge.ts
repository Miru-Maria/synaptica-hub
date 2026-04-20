import { Router, Response } from "express";
import multer from "multer";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";
import Anthropic from "@anthropic-ai/sdk";

export const docforgeRouter = Router();
docforgeRouter.use(requireAuth);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey: key });
}

docforgeRouter.post("/generate", upload.single("file"), async (req: AuthenticatedRequest, res: Response) => {
  const { rawText, outputFormat, documentTitle, brandingNotes } = req.body;

  let content = rawText || "";

  if (req.file) {
    const { buffer, mimetype, originalname } = req.file;
    if (mimetype === "text/plain" || originalname.endsWith(".md") || originalname.endsWith(".txt")) {
      content = buffer.toString("utf-8");
    } else if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        content = result.value;
      } catch {
        res.status(400).json({ error: "Could not parse DOCX file" });
        return;
      }
    } else {
      res.status(400).json({ error: "Unsupported file type. Use .docx, .txt, or .md" });
      return;
    }
  }

  if (!content.trim()) {
    res.status(400).json({ error: "No content provided. Upload a file or paste text." });
    return;
  }

  const formatInstructions: Record<string, string> = {
    report: "Format this as a professional consulting report with: Executive Summary, Key Findings, Detailed Analysis, and Recommendations sections.",
    brief: "Format this as a concise executive brief with: Overview, Key Points, and Next Steps.",
    guide: "Format this as a structured guide with: Introduction, step-by-step sections with clear headings, and a Summary.",
    audit: "Format this as a documentation audit report with: Scope, Current State Assessment, Gap Analysis, and Prioritized Recommendations.",
    proposal: "Format this as a professional proposal with: Background, Proposed Approach, Deliverables, Timeline, and Investment.",
  };

  const formatInstruction = formatInstructions[outputFormat as string] || formatInstructions.report;

  const systemPrompt = `You are a professional document formatter and editor. Your job is to take raw content and transform it into a polished, well-structured document.

${formatInstruction}

Rules:
- Use proper Markdown formatting (# for title, ## for sections, ### for subsections)
- Write in clear, professional prose
- Fix grammar and improve clarity where needed without changing meaning
- Do not invent facts — only work with what is provided
- Add a document title at the top using the provided title or derive one from the content
${brandingNotes ? `- Branding/tone notes: ${brandingNotes}` : ""}
${documentTitle ? `- Document title: ${documentTitle}` : ""}`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const client = getAnthropic();
    const stream = await client.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `${systemPrompt}\n\n---\n\nRAW CONTENT:\n\n${content.slice(0, 20000)}`,
        },
      ],
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("[docforge] generate error:", err);
    res.write(`data: ${JSON.stringify({ error: "Generation failed" })}\n\n`);
    res.end();
  }
});
