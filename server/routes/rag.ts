import { Router, Response } from "express";
import multer from "multer";
import { createRequire } from "module";
import mammoth from "mammoth";
const _require = createRequire(import.meta.url);
const pdfParse = _require("pdf-parse/lib/pdf-parse.js");
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";
import OpenAI from "openai";
import {
  saveDocument,
  saveChunks,
  listDocuments,
  listChunks,
  getAllChunkEmbeddings,
  getTotalChunkCount,
  deleteDocument,
  clearAll,
} from "../data/rag-store.js";

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is not set.");
  return new OpenAI({ apiKey });
}

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
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

async function extractTextFromBuffer(buffer: Buffer, mimetype: string, originalname: string): Promise<string> {
  const lower = originalname.toLowerCase();
  if (lower.endsWith(".pdf") || mimetype === "application/pdf") {
    const result = await pdfParse(buffer);
    return result.text;
  }
  if (lower.endsWith(".docx") || mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  return buffer.toString("utf8");
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
    ];
    const ext = file.originalname.toLowerCase();
    if (
      allowed.includes(file.mimetype) ||
      ext.endsWith(".pdf") ||
      ext.endsWith(".docx") ||
      ext.endsWith(".txt") ||
      ext.endsWith(".md")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOCX, TXT, and MD files are supported"));
    }
  },
});

async function ingestText(
  text: string,
  name: string,
  sourceType: "text" | "file",
  chunkSize: number,
  overlap: number
): Promise<{ ingested: number; totalChunks: number; documentId: string }> {
  const size = Math.max(100, Math.min(Number(chunkSize), 5000));
  const lap = Math.max(0, Math.min(Number(overlap), size - 1));
  const rawChunks = chunkText(text.trim(), size, lap);

  const openai = getOpenAI();
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: rawChunks,
  });

  const documentId = await saveDocument(name, sourceType, size, lap, rawChunks.length);
  await saveChunks(
    documentId,
    rawChunks.map((content, i) => ({
      index: i,
      content,
      embedding: embeddingResponse.data[i].embedding,
    }))
  );

  const totalChunks = await getTotalChunkCount();
  return { ingested: rawChunks.length, totalChunks, documentId };
}

export const ragRouter = Router();
ragRouter.use(requireAuth);

ragRouter.get("/status", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const chunkCount = await getTotalChunkCount();
    res.json({ chunkCount });
  } catch (err) {
    res.status(500).json({ error: "Failed to get status" });
  }
});

ragRouter.get("/documents", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const docs = await listDocuments();
    res.json({ documents: docs });
  } catch (err) {
    res.status(500).json({ error: "Failed to list documents" });
  }
});

ragRouter.get("/chunks", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const chunks = await listChunks(300);
    res.json({ chunks });
  } catch (err) {
    res.status(500).json({ error: "Failed to list chunks" });
  }
});

ragRouter.delete("/documents/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await deleteDocument(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    const totalChunks = await getTotalChunkCount();
    res.json({ success: true, totalChunks });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete document" });
  }
});

ragRouter.delete("/clear", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    await clearAll();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear index" });
  }
});

ragRouter.post("/ingest", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text, chunkSize = 500, overlap = 50, name } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "Text content is required" });
      return;
    }
    const docName = (name && typeof name === "string" && name.trim()) ? name.trim() : `Pasted text — ${new Date().toLocaleDateString()}`;
    const result = await ingestText(text, docName, "text", Number(chunkSize), Number(overlap));
    res.json(result);
  } catch (err) {
    console.error("RAG ingest error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to ingest text" });
  }
});

ragRouter.post("/upload", upload.single("file"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const { chunkSize = 500, overlap = 50 } = req.body;
    const text = await extractTextFromBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
    if (!text.trim()) {
      res.status(400).json({ error: "Could not extract text from file — it may be empty or image-only" });
      return;
    }
    const result = await ingestText(text, req.file.originalname, "file", Number(chunkSize), Number(overlap));
    res.json(result);
  } catch (err) {
    console.error("RAG upload error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to process file" });
  }
});

ragRouter.post("/chat", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { question, topK = 4 } = req.body;
    if (!question || typeof question !== "string" || !question.trim()) {
      res.status(400).json({ error: "Question is required" });
      return;
    }

    const totalChunks = await getTotalChunkCount();
    if (totalChunks === 0) {
      res.status(400).json({ error: "No documents have been ingested yet. Please ingest some content first." });
      return;
    }

    const openai = getOpenAI();

    const queryEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question.trim(),
    });
    const queryVector = queryEmbedding.data[0].embedding;

    const k = Math.max(1, Math.min(Number(topK) || 4, 20));
    const allChunks = await getAllChunkEmbeddings();

    const scored = allChunks.map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryVector, chunk.embedding),
    }));
    scored.sort((a, b) => b.score - a.score);
    const topChunks = scored.slice(0, Math.min(k, allChunks.length));

    const contextBlock = topChunks
      .map(
        (item, idx) =>
          `[Source ${idx + 1} — "${item.chunk.documentName}", chunk ${item.chunk.chunkIndex + 1}] (relevance: ${(item.score * 100).toFixed(0)}%)\n${item.chunk.content}`
      )
      .join("\n\n---\n\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a precise assistant that answers questions using ONLY the document context provided. Do not use any external knowledge. If the context does not contain enough information to answer, say so clearly. When referencing information, cite the source by its number (e.g., "Source 1") and document name.`,
        },
        {
          role: "user",
          content: `Retrieved context:\n\n${contextBlock}\n\n---\n\nQuestion: ${question.trim()}\n\nAnswer using only the context above. Cite sources by number and document name.`,
        },
      ],
      temperature: 0.2,
    });

    const answer = completion.choices[0].message.content || "";

    res.json({
      answer,
      sources: topChunks.map((item, idx) => ({
        sourceNum: idx + 1,
        chunkId: item.chunk.id,
        documentName: item.chunk.documentName,
        chunkIndex: item.chunk.chunkIndex,
        score: parseFloat(item.score.toFixed(3)),
        scorePercent: Math.round(item.score * 100),
        preview: item.chunk.content.slice(0, 200) + (item.chunk.content.length > 200 ? "…" : ""),
      })),
    });
  } catch (err) {
    console.error("RAG chat error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to process question" });
  }
});
