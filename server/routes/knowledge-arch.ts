import { Router, Request, Response } from "express";
import multer from "multer";
import OpenAI from "openai";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";
import {
  listKnowledgeBases, getKnowledgeBase, createKnowledgeBase, deleteKnowledgeBase,
  insertChunks, clearChunks, searchChunks, getChunksByKb,
  listOnboardingSessions, getOnboardingSession, createOnboardingSession,
  appendOnboardingMessage, deleteOnboardingSession,
  listPromptTemplates, getPromptTemplate, createPromptTemplate,
  updatePromptTemplate, deletePromptTemplate,
} from "../data/ka-store.js";

export const kaRouter = Router();
kaRouter.use(requireAuth);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
}

function sseWrite(res: Response, data: unknown) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function sseEnd(res: Response) {
  res.write("data: [DONE]\n\n");
  res.end();
}

function startSSE(res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
}

function chunkText(text: string, maxTokens = 400): string[] {
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const approxTokens = (current + sentence).length / 4;
    if (approxTokens > maxTokens && current.trim()) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.filter((c) => c.length > 20);
}

async function embedText(openai: OpenAI, text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

async function streamCompletion(
  openai: OpenAI,
  res: Response,
  systemPrompt: string,
  userMessage: string,
  maxTokens = 2048
) {
  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: maxTokens,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) sseWrite(res, { text });
  }
}

// ─────────────────────────────────────────────
// KNOWLEDGE BASE MANAGEMENT
// ─────────────────────────────────────────────

kaRouter.get("/kb", async (_req: Request, res: Response) => {
  try {
    const kbs = await listKnowledgeBases();
    res.json(kbs);
  } catch (err) {
    console.error("[ka] list kb error:", err);
    res.status(500).json({ error: "Failed to list knowledge bases" });
  }
});

kaRouter.post("/kb", async (req: AuthenticatedRequest, res: Response) => {
  const { name, description } = req.body;
  if (!name?.trim()) { res.status(400).json({ error: "Name is required" }); return; }
  try {
    const kb = await createKnowledgeBase(name.trim(), description?.trim() || "");
    res.json(kb);
  } catch (err) {
    console.error("[ka] create kb error:", err);
    res.status(500).json({ error: "Failed to create knowledge base" });
  }
});

kaRouter.delete("/kb/:id", async (req: Request, res: Response) => {
  try {
    await deleteKnowledgeBase(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("[ka] delete kb error:", err);
    res.status(500).json({ error: "Failed to delete knowledge base" });
  }
});

// ─────────────────────────────────────────────
// INGEST (embed + store chunks)
// ─────────────────────────────────────────────

kaRouter.post("/kb/:id/ingest", upload.single("file"), async (req: Request, res: Response) => {
  const { id } = req.params;

  let text = req.body.rawText || "";

  if (req.file) {
    const { buffer, mimetype, originalname } = req.file;
    if (mimetype === "text/plain" || originalname.endsWith(".md") || originalname.endsWith(".txt")) {
      text = buffer.toString("utf-8");
    } else if (
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      originalname.endsWith(".docx")
    ) {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } catch {
        res.status(400).json({ error: "Could not parse DOCX file" });
        return;
      }
    } else {
      res.status(400).json({ error: "Unsupported file type. Use .txt, .md, or .docx" });
      return;
    }
  }

  if (!text.trim()) {
    res.status(400).json({ error: "No content to ingest" });
    return;
  }

  const kb = await getKnowledgeBase(id);
  if (!kb) { res.status(404).json({ error: "Knowledge base not found" }); return; }

  try {
    const openai = getOpenAI();
    const textChunks = chunkText(text);
    await clearChunks(id);

    const chunksToInsert: { content: string; chunk_index: number; token_count: number; embedding: number[] }[] = [];

    for (let i = 0; i < textChunks.length; i++) {
      const embedding = await embedText(openai, textChunks[i]);
      chunksToInsert.push({
        content: textChunks[i],
        chunk_index: i,
        token_count: Math.ceil(textChunks[i].length / 4),
        embedding,
      });
    }

    await insertChunks(id, chunksToInsert);
    res.json({ ok: true, chunks: chunksToInsert.length });
  } catch (err) {
    console.error("[ka] ingest error:", err);
    res.status(500).json({ error: "Ingestion failed" });
  }
});

// ─────────────────────────────────────────────
// SEMANTIC SEARCH
// ─────────────────────────────────────────────

kaRouter.post("/search", async (req: Request, res: Response) => {
  const { kb_id, query, topK = 5 } = req.body;
  if (!kb_id || !query?.trim()) {
    res.status(400).json({ error: "kb_id and query are required" });
    return;
  }

  try {
    const openai = getOpenAI();
    const queryEmbedding = await embedText(openai, query);
    const results = await searchChunks(kb_id, queryEmbedding, Math.min(topK, 10));
    res.json({ results });
  } catch (err) {
    console.error("[ka] search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

// ─────────────────────────────────────────────
// GAP ANALYZER
// ─────────────────────────────────────────────

kaRouter.post("/gaps", async (req: Request, res: Response) => {
  const { kb_id, tickets } = req.body;
  if (!kb_id || !tickets?.trim()) {
    res.status(400).json({ error: "kb_id and tickets are required" });
    return;
  }

  const kb = await getKnowledgeBase(kb_id);
  if (!kb) { res.status(404).json({ error: "Knowledge base not found" }); return; }

  startSSE(res);

  try {
    const openai = getOpenAI();
    const chunks = await getChunksByKb(kb_id);

    if (chunks.length === 0) {
      sseWrite(res, { error: "Knowledge base has no content. Please ingest documents first." });
      sseEnd(res);
      return;
    }

    const docsContent = chunks
      .slice(0, 60)
      .map((c) => c.content)
      .join("\n\n---\n\n");

    const systemPrompt = `You are a documentation strategist analyzing gaps between existing documentation and user support needs.

Your output must follow this exact structure:

## Executive Summary
[2-3 sentences summarizing the overall gap situation]

## Critical Gaps (High Priority)
[3-5 gaps that are urgent — users are blocked, raising many tickets, or dealing with serious confusion]

For each gap:
**Gap: [Topic Name]**
- Evidence: [specific ticket examples or patterns]
- Impact: [what users can't do or understand]
- Recommended action: [what to write or update]

## Significant Gaps (Medium Priority)
[3-5 gaps that matter but aren't urgent]

## Minor Gaps (Low Priority)
[2-3 smaller gaps]

## Content to Update or Retire
[Existing documentation that appears outdated, contradictory, or redundant]

## Recommended Writing Queue
[Numbered prioritized list of next articles/sections to produce]`;

    const userMessage = `EXISTING DOCUMENTATION:
${docsContent.slice(0, 12000)}

SUPPORT TICKETS / USER QUESTIONS:
${tickets.slice(0, 4000)}

Analyze the gaps between what the documentation covers and what users are asking about.`;

    await streamCompletion(openai, res, systemPrompt, userMessage, 2048);
    sseEnd(res);
  } catch (err) {
    console.error("[ka] gaps error:", err);
    sseWrite(res, { error: "Gap analysis failed" });
    sseEnd(res);
  }
});

// ─────────────────────────────────────────────
// FAQ BUILDER
// ─────────────────────────────────────────────

kaRouter.post("/faq", async (req: Request, res: Response) => {
  const { kb_id, audience, additionalContext } = req.body;
  if (!kb_id || !audience?.trim()) {
    res.status(400).json({ error: "kb_id and audience are required" });
    return;
  }

  const kb = await getKnowledgeBase(kb_id);
  if (!kb) { res.status(404).json({ error: "Knowledge base not found" }); return; }

  startSSE(res);

  try {
    const openai = getOpenAI();
    const chunks = await getChunksByKb(kb_id);

    if (chunks.length === 0) {
      sseWrite(res, { error: "Knowledge base has no content. Please ingest documents first." });
      sseEnd(res);
      return;
    }

    const docsContent = chunks
      .slice(0, 80)
      .map((c) => c.content)
      .join("\n\n---\n\n");

    const systemPrompt = `You are a technical writer creating a structured FAQ for a specific audience. Write questions exactly as that audience would naturally phrase them — not as the documentation phrases things.

Requirements:
- Minimum 15 Q&A pairs
- Group under clear ## Category headings
- Each answer: 2-5 sentences, complete and self-contained
- Language calibrated to the audience — not too technical, not condescending
- Cover the most common confusion points, not just what the docs cover most
- End with a "Still Have Questions?" section with placeholder contact info
- Format as Markdown`;

    const userMessage = `SOURCE DOCUMENTATION:
${docsContent.slice(0, 14000)}

TARGET AUDIENCE: ${audience}
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ""}

Generate a comprehensive FAQ for this audience based on the documentation.`;

    await streamCompletion(openai, res, systemPrompt, userMessage, 3000);
    sseEnd(res);
  } catch (err) {
    console.error("[ka] faq error:", err);
    sseWrite(res, { error: "FAQ generation failed" });
    sseEnd(res);
  }
});

// ─────────────────────────────────────────────
// ONBOARDING SESSIONS
// ─────────────────────────────────────────────

kaRouter.get("/onboarding", async (_req: Request, res: Response) => {
  try {
    const sessions = await listOnboardingSessions();
    res.json(sessions);
  } catch (err) {
    console.error("[ka] list sessions error:", err);
    res.status(500).json({ error: "Failed to list sessions" });
  }
});

kaRouter.post("/onboarding", async (req: Request, res: Response) => {
  const { kb_id, role, title } = req.body;
  if (!role?.trim()) { res.status(400).json({ error: "Role is required" }); return; }
  try {
    const session = await createOnboardingSession(
      kb_id || null,
      role.trim(),
      title?.trim() || `${role} Onboarding`
    );
    res.json(session);
  } catch (err) {
    console.error("[ka] create session error:", err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

kaRouter.get("/onboarding/:id", async (req: Request, res: Response) => {
  try {
    const session = await getOnboardingSession(req.params.id);
    if (!session) { res.status(404).json({ error: "Session not found" }); return; }
    res.json(session);
  } catch (err) {
    console.error("[ka] get session error:", err);
    res.status(500).json({ error: "Failed to get session" });
  }
});

kaRouter.delete("/onboarding/:id", async (req: Request, res: Response) => {
  try {
    await deleteOnboardingSession(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("[ka] delete session error:", err);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

kaRouter.post("/onboarding/:id/chat", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message?.trim()) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const session = await getOnboardingSession(id);
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }

  startSSE(res);

  try {
    const openai = getOpenAI();
    const userMsg: import("../data/ka-store.js").KAChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };
    await appendOnboardingMessage(id, userMsg);

    let contextDocs = "";
    if (session.kb_id) {
      const queryEmbedding = await embedText(openai, message);
      const relevant = await searchChunks(session.kb_id, queryEmbedding, 4);
      if (relevant.length > 0) {
        contextDocs = relevant.map((c) => c.content).join("\n\n");
      }
    }

    const systemPrompt = `You are an intelligent onboarding assistant for a ${session.role}. Your job is to help them get up to speed quickly by answering questions clearly and pointing them to the right information.

${contextDocs ? `RELEVANT KNOWLEDGE BASE CONTENT:\n${contextDocs}\n\n` : ""}Guidelines:
- Answer in a friendly, encouraging, and professional tone
- Be concise but complete — don't pad your answers
- If the answer is in the knowledge base, cite it clearly
- If you don't know or the knowledge base doesn't cover it, say so honestly and suggest who to ask
- Format your response clearly with Markdown where it helps`;

    const conversationMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...session.messages.slice(-12).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1024,
      stream: true,
      messages: conversationMessages,
    });

    let assistantContent = "";
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        assistantContent += text;
        sseWrite(res, { text });
      }
    }

    const assistantMsg: import("../data/ka-store.js").KAChatMessage = {
      role: "assistant",
      content: assistantContent,
      timestamp: new Date().toISOString(),
    };
    await appendOnboardingMessage(id, assistantMsg);

    sseEnd(res);
  } catch (err) {
    console.error("[ka] onboarding chat error:", err);
    sseWrite(res, { error: "Chat failed" });
    sseEnd(res);
  }
});

// ─────────────────────────────────────────────
// PROMPT TOOLKIT
// ─────────────────────────────────────────────

kaRouter.get("/prompts", async (_req: Request, res: Response) => {
  try {
    const prompts = await listPromptTemplates();
    res.json(prompts);
  } catch (err) {
    console.error("[ka] list prompts error:", err);
    res.status(500).json({ error: "Failed to list prompts" });
  }
});

kaRouter.post("/prompts", async (req: Request, res: Response) => {
  const { title, category, description, prompt, variables, tags } = req.body;
  if (!title?.trim() || !prompt?.trim()) {
    res.status(400).json({ error: "Title and prompt are required" });
    return;
  }
  try {
    const template = await createPromptTemplate({
      title: title.trim(),
      category: category?.trim() || "Custom",
      description: description?.trim() || "",
      prompt: prompt.trim(),
      variables: Array.isArray(variables) ? variables : [],
      tags: Array.isArray(tags) ? tags : [],
    });
    res.json(template);
  } catch (err) {
    console.error("[ka] create prompt error:", err);
    res.status(500).json({ error: "Failed to create prompt" });
  }
});

kaRouter.put("/prompts/:id", async (req: Request, res: Response) => {
  try {
    const updated = await updatePromptTemplate(req.params.id, req.body);
    if (!updated) { res.status(404).json({ error: "Prompt not found" }); return; }
    res.json(updated);
  } catch (err) {
    console.error("[ka] update prompt error:", err);
    res.status(500).json({ error: "Failed to update prompt" });
  }
});

kaRouter.delete("/prompts/:id", async (req: Request, res: Response) => {
  try {
    await deletePromptTemplate(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("[ka] delete prompt error:", err);
    res.status(500).json({ error: "Failed to delete prompt" });
  }
});

kaRouter.post("/prompts/:id/test", async (req: Request, res: Response) => {
  const { variables: filledVars } = req.body;
  const template = await getPromptTemplate(req.params.id);
  if (!template) { res.status(404).json({ error: "Prompt not found" }); return; }

  let filledPrompt = template.prompt;
  if (filledVars && typeof filledVars === "object") {
    for (const [key, val] of Object.entries(filledVars)) {
      filledPrompt = filledPrompt.replaceAll(`{{${key}}}`, String(val));
    }
  }

  startSSE(res);

  try {
    const openai = getOpenAI();
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2048,
      stream: true,
      messages: [{ role: "user", content: filledPrompt }],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) sseWrite(res, { text });
    }

    sseEnd(res);
  } catch (err) {
    console.error("[ka] prompt test error:", err);
    sseWrite(res, { error: "Test failed" });
    sseEnd(res);
  }
});
