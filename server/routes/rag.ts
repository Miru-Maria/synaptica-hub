import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";
import OpenAI from "openai";

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set.");
  }
  return new OpenAI({ apiKey });
}

interface Chunk {
  id: number;
  text: string;
  embedding: number[];
}

const chunkStore: Chunk[] = [];

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    if (end >= text.length) break;
    start += chunkSize - overlap;
  }
  return chunks;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export const ragRouter = Router();

ragRouter.use(requireAuth);

ragRouter.get("/status", (_req: AuthenticatedRequest, res: Response) => {
  res.json({ chunkCount: chunkStore.length });
});

ragRouter.post("/ingest", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text, chunkSize = 500, overlap = 50 } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "Text content is required" });
      return;
    }

    const size = Math.max(100, Math.min(Number(chunkSize), 5000));
    const lap = Math.max(0, Math.min(Number(overlap), size - 1));

    const chunks = chunkText(text.trim(), size, lap);

    const openai = getOpenAI();

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks,
    });

    const startId = chunkStore.length;
    for (let i = 0; i < chunks.length; i++) {
      chunkStore.push({
        id: startId + i + 1,
        text: chunks[i],
        embedding: embeddingResponse.data[i].embedding,
      });
    }

    res.json({
      ingested: chunks.length,
      totalChunks: chunkStore.length,
    });
  } catch (error: unknown) {
    console.error("RAG ingest error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to ingest text" });
  }
});

ragRouter.post("/chat", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { question, topK = 3 } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      res.status(400).json({ error: "Question is required" });
      return;
    }

    if (chunkStore.length === 0) {
      res.status(400).json({ error: "No documents have been ingested yet. Please ingest some text first." });
      return;
    }

    const openai = getOpenAI();

    const queryEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question.trim(),
    });

    const queryVector = queryEmbedding.data[0].embedding;

    const k = Math.max(1, Math.min(Number(topK) || 3, 20));

    const scored = chunkStore.map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryVector, chunk.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    const topChunks = scored.slice(0, Math.min(k, chunkStore.length));

    const contextBlock = topChunks
      .map((item) => `[Chunk ${item.chunk.id}] (similarity: ${item.score.toFixed(3)})\n${item.chunk.text}`)
      .join("\n\n---\n\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that answers questions based on the provided document chunks. Ground your answers in the retrieved context. When referencing information, cite the chunk number (e.g., "Source: Chunk 3"). If the context doesn't contain enough information to answer, say so clearly.`,
        },
        {
          role: "user",
          content: `Context from retrieved documents:\n\n${contextBlock}\n\n---\n\nQuestion: ${question.trim()}\n\nAnswer the question using the context above. Cite specific chunk numbers when referencing information.`,
        },
      ],
      temperature: 0.3,
    });

    const answer = completion.choices[0].message.content || "";

    res.json({
      answer,
      sources: topChunks.map((item) => ({
        chunkId: item.chunk.id,
        score: parseFloat(item.score.toFixed(3)),
        preview: item.chunk.text.slice(0, 150) + (item.chunk.text.length > 150 ? "…" : ""),
      })),
    });
  } catch (error: unknown) {
    console.error("RAG chat error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to process question" });
  }
});
