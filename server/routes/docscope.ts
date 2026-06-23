import { Router, Response } from "express";
import { requireAdminOrDemo, AuthenticatedRequest } from "../middleware/auth.js";
import { validateBody, schemas } from "../middleware/validate.js";
import OpenAI from "openai";

export const docscopeRouter = Router();
docscopeRouter.use(requireAdminOrDemo("docscope"));

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey: key });
}

const modePrompts: Record<string, string> = {
  gaps: "Analyze the content below for knowledge gaps, missing context, and coverage issues. Structure your findings as: 1) Summary of what IS covered, 2) Key gaps identified, 3) Missing context or assumptions, 4) Recommended additions. Be specific and actionable.",
  inconsistencies: "Analyze the content below for internal inconsistencies, contradictions, unclear statements, and logical conflicts. Structure your findings as: 1) Summary of content, 2) Inconsistencies found, 3) Ambiguous or unclear sections, 4) Recommendations to resolve conflicts.",
  structure: "Analyze the content below for structural and organizational issues. Structure your findings as: 1) Current structure summary, 2) Structural problems, 3) Hierarchy and flow issues, 4) Recommended restructuring approach.",
  full: "Perform a comprehensive intelligence analysis of the content below. Cover: 1) Executive summary, 2) Knowledge gaps, 3) Inconsistencies and contradictions, 4) Structural issues, 5) Content quality assessment, 6) Prioritized recommendations.",
};

docscopeRouter.post("/analyze", validateBody(schemas.docscopeAnalyze), async (req: AuthenticatedRequest, res: Response) => {
  const { content, mode } = req.body;
  if (!content || typeof content !== "string" || !content.trim()) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  const systemPrompt = modePrompts[mode as string] || modePrompts.full;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const client = getOpenAI();
    const stream = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2048,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this content:\n\n${content.slice(0, 20000)}` },
      ],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("[docscope] analyze error:", err);
    res.write(`data: ${JSON.stringify({ error: "Analysis failed" })}\n\n`);
    res.end();
  }
});
