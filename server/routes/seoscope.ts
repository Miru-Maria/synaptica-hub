import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";
import Anthropic from "@anthropic-ai/sdk";

export const seoscopeRouter = Router();
seoscopeRouter.use(requireAuth);

function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey: key });
}

seoscopeRouter.post("/analyze", async (req: AuthenticatedRequest, res: Response) => {
  const { content, url, targetKeywords, analysisType } = req.body;

  if (!content && !url) {
    res.status(400).json({ error: "Provide page content or a URL to analyze" });
    return;
  }

  const inputDescription = url
    ? `Page URL: ${url}\n\nPage content:\n${content || "(content not provided — analyze from URL context)"}`
    : `Page content:\n${content}`;

  const typePrompts: Record<string, string> = {
    full: "Perform a comprehensive SEO analysis covering: 1) Title & meta description assessment, 2) Heading structure (H1-H6), 3) Keyword usage and density, 4) Content depth and relevance, 5) Internal linking opportunities, 6) Readability score, 7) Structured data recommendations, 8) Prioritized action list.",
    keywords: "Analyze keyword usage and optimization opportunities: 1) Primary keyword identification, 2) Keyword placement analysis (title, H1, first paragraph, etc.), 3) Missing keyword opportunities, 4) Keyword cannibalization risks, 5) Semantic/LSI keyword recommendations.",
    content: "Analyze content quality for SEO: 1) Content depth and comprehensiveness, 2) E-E-A-T signals, 3) User intent alignment, 4) Readability and structure, 5) Content gaps vs. top-ranking pages, 6) Featured snippet opportunities.",
    technical: "Analyze technical SEO elements visible in the content: 1) Title tag quality, 2) Meta description, 3) Heading hierarchy, 4) Image alt text usage, 5) Internal link anchor text, 6) Schema markup opportunities, 7) URL structure if provided.",
  };

  const systemPrompt = `You are an expert SEO strategist and content analyst. ${typePrompts[analysisType as string] || typePrompts.full}

${targetKeywords ? `Target keywords to focus on: ${targetKeywords}` : ""}

Be specific and actionable. Include concrete examples and suggested rewrites where relevant. Score sections where appropriate (e.g. 7/10) with clear reasoning.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const client = getAnthropic();
    const stream = await client.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `${systemPrompt}\n\n---\n\n${inputDescription.slice(0, 20000)}`,
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
    console.error("[seoscope] analyze error:", err);
    res.write(`data: ${JSON.stringify({ error: "Analysis failed" })}\n\n`);
    res.end();
  }
});
