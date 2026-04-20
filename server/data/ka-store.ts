import { pool } from "./db.js";

export interface KAKnowledgeBase {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  chunk_count: number;
}

export interface KAChunk {
  id: string;
  kb_id: string;
  content: string;
  chunk_index: number;
  token_count: number;
  metadata: Record<string, unknown>;
}

export interface KAOnboardingSession {
  id: string;
  kb_id: string | null;
  role: string;
  title: string;
  messages: KAChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface KAChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface KAPromptTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  prompt: string;
  variables: string[];
  tags: string[];
  is_builtin: boolean;
  created_at: string;
  updated_at: string;
}

export async function listKnowledgeBases(): Promise<KAKnowledgeBase[]> {
  const result = await pool.query(
    `SELECT * FROM ka_knowledge_bases ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function getKnowledgeBase(id: string): Promise<KAKnowledgeBase | null> {
  const result = await pool.query(
    `SELECT * FROM ka_knowledge_bases WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createKnowledgeBase(name: string, description: string): Promise<KAKnowledgeBase> {
  const result = await pool.query(
    `INSERT INTO ka_knowledge_bases (name, description) VALUES ($1, $2) RETURNING *`,
    [name, description]
  );
  return result.rows[0];
}

export async function deleteKnowledgeBase(id: string): Promise<void> {
  await pool.query(`DELETE FROM ka_knowledge_bases WHERE id = $1`, [id]);
}

export async function insertChunks(
  kb_id: string,
  chunks: { content: string; chunk_index: number; token_count: number; embedding: number[]; metadata?: Record<string, unknown> }[]
): Promise<void> {
  for (const chunk of chunks) {
    await pool.query(
      `INSERT INTO ka_chunks (kb_id, content, chunk_index, token_count, embedding, metadata)
       VALUES ($1, $2, $3, $4, $5::vector, $6)`,
      [
        kb_id,
        chunk.content,
        chunk.chunk_index,
        chunk.token_count,
        `[${chunk.embedding.join(",")}]`,
        JSON.stringify(chunk.metadata || {}),
      ]
    );
  }
  await pool.query(
    `UPDATE ka_knowledge_bases SET chunk_count = $1, updated_at = NOW() WHERE id = $2`,
    [chunks.length, kb_id]
  );
}

export async function clearChunks(kb_id: string): Promise<void> {
  await pool.query(`DELETE FROM ka_chunks WHERE kb_id = $1`, [kb_id]);
  await pool.query(
    `UPDATE ka_knowledge_bases SET chunk_count = 0, updated_at = NOW() WHERE id = $1`,
    [kb_id]
  );
}

export async function searchChunks(
  kb_id: string,
  queryEmbedding: number[],
  topK: number = 5
): Promise<(KAChunk & { similarity: number })[]> {
  const result = await pool.query(
    `SELECT id, kb_id, content, chunk_index, token_count, metadata,
            1 - (embedding <=> $2::vector) AS similarity
     FROM ka_chunks
     WHERE kb_id = $1
       AND embedding IS NOT NULL
     ORDER BY embedding <=> $2::vector
     LIMIT $3`,
    [kb_id, `[${queryEmbedding.join(",")}]`, topK]
  );
  return result.rows;
}

export async function getChunksByKb(kb_id: string): Promise<KAChunk[]> {
  const result = await pool.query(
    `SELECT id, kb_id, content, chunk_index, token_count, metadata
     FROM ka_chunks WHERE kb_id = $1 ORDER BY chunk_index`,
    [kb_id]
  );
  return result.rows;
}

export async function listOnboardingSessions(): Promise<KAOnboardingSession[]> {
  const result = await pool.query(
    `SELECT * FROM ka_onboarding_sessions ORDER BY updated_at DESC`
  );
  return result.rows.map((r) => ({ ...r, messages: r.messages as KAChatMessage[] }));
}

export async function getOnboardingSession(id: string): Promise<KAOnboardingSession | null> {
  const result = await pool.query(
    `SELECT * FROM ka_onboarding_sessions WHERE id = $1`,
    [id]
  );
  const r = result.rows[0];
  if (!r) return null;
  return { ...r, messages: r.messages as KAChatMessage[] };
}

export async function createOnboardingSession(
  kb_id: string | null,
  role: string,
  title: string
): Promise<KAOnboardingSession> {
  const result = await pool.query(
    `INSERT INTO ka_onboarding_sessions (kb_id, role, title) VALUES ($1, $2, $3) RETURNING *`,
    [kb_id, role, title]
  );
  return { ...result.rows[0], messages: [] };
}

export async function appendOnboardingMessage(
  session_id: string,
  message: KAChatMessage
): Promise<void> {
  await pool.query(
    `UPDATE ka_onboarding_sessions
     SET messages = messages || $1::jsonb, updated_at = NOW()
     WHERE id = $2`,
    [JSON.stringify([message]), session_id]
  );
}

export async function deleteOnboardingSession(id: string): Promise<void> {
  await pool.query(`DELETE FROM ka_onboarding_sessions WHERE id = $1`, [id]);
}

export async function listPromptTemplates(): Promise<KAPromptTemplate[]> {
  const result = await pool.query(
    `SELECT * FROM ka_prompt_templates ORDER BY category, title`
  );
  return result.rows.map((r) => ({
    ...r,
    variables: r.variables as string[],
    tags: r.tags as string[],
  }));
}

export async function getPromptTemplate(id: string): Promise<KAPromptTemplate | null> {
  const result = await pool.query(
    `SELECT * FROM ka_prompt_templates WHERE id = $1`,
    [id]
  );
  const r = result.rows[0];
  if (!r) return null;
  return { ...r, variables: r.variables as string[], tags: r.tags as string[] };
}

export async function createPromptTemplate(data: {
  title: string;
  category: string;
  description: string;
  prompt: string;
  variables: string[];
  tags: string[];
}): Promise<KAPromptTemplate> {
  const result = await pool.query(
    `INSERT INTO ka_prompt_templates (title, category, description, prompt, variables, tags)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      data.title,
      data.category,
      data.description,
      data.prompt,
      JSON.stringify(data.variables),
      JSON.stringify(data.tags),
    ]
  );
  const r = result.rows[0];
  return { ...r, variables: r.variables as string[], tags: r.tags as string[] };
}

export async function updatePromptTemplate(
  id: string,
  data: Partial<{ title: string; category: string; description: string; prompt: string; variables: string[]; tags: string[] }>
): Promise<KAPromptTemplate | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.title !== undefined) { fields.push(`title = $${idx++}`); values.push(data.title); }
  if (data.category !== undefined) { fields.push(`category = $${idx++}`); values.push(data.category); }
  if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description); }
  if (data.prompt !== undefined) { fields.push(`prompt = $${idx++}`); values.push(data.prompt); }
  if (data.variables !== undefined) { fields.push(`variables = $${idx++}`); values.push(JSON.stringify(data.variables)); }
  if (data.tags !== undefined) { fields.push(`tags = $${idx++}`); values.push(JSON.stringify(data.tags)); }

  if (fields.length === 0) return getPromptTemplate(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query(
    `UPDATE ka_prompt_templates SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  const r = result.rows[0];
  if (!r) return null;
  return { ...r, variables: r.variables as string[], tags: r.tags as string[] };
}

export async function deletePromptTemplate(id: string): Promise<void> {
  await pool.query(`DELETE FROM ka_prompt_templates WHERE id = $1 AND is_builtin = false`, [id]);
}
