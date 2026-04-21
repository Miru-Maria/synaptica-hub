import { pool } from "./db.js";

export interface RagDocument {
  id: string;
  name: string;
  sourceType: "text" | "file";
  chunkSize: number;
  overlap: number;
  chunkCount: number;
  createdAt: string;
}

export interface RagChunk {
  id: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
  createdAt: string;
}

export interface RagChunkWithEmbedding extends RagChunk {
  embedding: number[];
}

export async function initRagTables(): Promise<void> {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rag_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'text',
      chunk_size INTEGER NOT NULL DEFAULT 500,
      overlap INTEGER NOT NULL DEFAULT 50,
      chunk_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rag_chunks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      embedding vector(1536),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS rag_chunks_document_id_idx ON rag_chunks(document_id)
  `);
}

export async function saveDocument(
  name: string,
  sourceType: "text" | "file",
  chunkSize: number,
  overlap: number,
  chunkCount: number
): Promise<string> {
  const { rows } = await pool.query(
    `INSERT INTO rag_documents (name, source_type, chunk_size, overlap, chunk_count)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [name, sourceType, chunkSize, overlap, chunkCount]
  );
  return rows[0].id as string;
}

export async function saveChunks(
  documentId: string,
  chunks: { index: number; content: string; embedding: number[] }[]
): Promise<void> {
  for (const chunk of chunks) {
    const embeddingStr = `[${chunk.embedding.join(",")}]`;
    await pool.query(
      `INSERT INTO rag_chunks (document_id, chunk_index, content, embedding)
       VALUES ($1, $2, $3, $4::vector)`,
      [documentId, chunk.index, chunk.content, embeddingStr]
    );
  }
}

export async function listDocuments(): Promise<RagDocument[]> {
  const { rows } = await pool.query(
    `SELECT id, name, source_type, chunk_size, overlap, chunk_count, created_at
     FROM rag_documents
     ORDER BY created_at DESC`
  );
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    sourceType: r.source_type as "text" | "file",
    chunkSize: Number(r.chunk_size),
    overlap: Number(r.overlap),
    chunkCount: Number(r.chunk_count),
    createdAt: r.created_at as string,
  }));
}

export async function listChunks(limit = 200): Promise<RagChunk[]> {
  const { rows } = await pool.query(
    `SELECT c.id, c.document_id, d.name as document_name, c.chunk_index, c.content, c.created_at
     FROM rag_chunks c
     JOIN rag_documents d ON d.id = c.document_id
     ORDER BY d.created_at DESC, c.chunk_index ASC
     LIMIT $1`,
    [limit]
  );
  return rows.map((r) => ({
    id: r.id as string,
    documentId: r.document_id as string,
    documentName: r.document_name as string,
    chunkIndex: Number(r.chunk_index),
    content: r.content as string,
    createdAt: r.created_at as string,
  }));
}

export async function getAllChunkEmbeddings(): Promise<RagChunkWithEmbedding[]> {
  const { rows } = await pool.query(
    `SELECT c.id, c.document_id, d.name as document_name, c.chunk_index, c.content, c.embedding, c.created_at
     FROM rag_chunks c
     JOIN rag_documents d ON d.id = c.document_id
     ORDER BY c.created_at ASC`
  );
  return rows.map((r) => ({
    id: r.id as string,
    documentId: r.document_id as string,
    documentName: r.document_name as string,
    chunkIndex: Number(r.chunk_index),
    content: r.content as string,
    embedding: parseVectorString(r.embedding as string),
    createdAt: r.created_at as string,
  }));
}

export async function getTotalChunkCount(): Promise<number> {
  const { rows } = await pool.query(`SELECT COUNT(*) as count FROM rag_chunks`);
  return Number(rows[0].count);
}

export async function deleteDocument(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM rag_documents WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function clearAll(): Promise<void> {
  await pool.query(`DELETE FROM rag_documents`);
}

function parseVectorString(raw: string | number[]): number[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    return raw
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split(",")
      .map(Number);
  }
  return [];
}
