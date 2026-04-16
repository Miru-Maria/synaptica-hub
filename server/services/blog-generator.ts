import OpenAI from "openai";
import { pool } from "../data/db.js";
import { addNotification, getAdminSettings } from "../data/store.js";
import { sendBlogDraftNotification } from "./email.js";

const ROTATING_TOPICS = [
  "How to measure the ROI of a knowledge architecture project",
  "The difference between a knowledge base and a knowledge graph",
  "When to use RAG versus fine-tuning for enterprise AI",
  "How to write documentation that AI can actually use",
  "The hidden cost of unstructured knowledge in large organizations",
  "Building a prompt library your whole team will actually use",
  "Why your AI assistant keeps hallucinating — and how to fix it",
  "What a knowledge audit reveals that a tech audit cannot",
  "Semantic search vs keyword search: what the difference means for your team",
  "How to future-proof your documentation for AI",
];

const CATEGORIES = ["Knowledge Architecture", "Documentation Strategy", "RAG & Retrieval", "Prompt Engineering"];

function pickCategory(topic: string): string {
  const lc = topic.toLowerCase();
  if (lc.includes("rag") || lc.includes("retriev") || lc.includes("fine-tun")) return "RAG & Retrieval";
  if (lc.includes("prompt") || lc.includes("hallucin")) return "Prompt Engineering";
  if (lc.includes("doc") || lc.includes("knowledge base") || lc.includes("write")) return "Documentation Strategy";
  return "Knowledge Architecture";
}

export interface GeneratedDraft {
  id: string;
  title: string;
  slug: string;
  category: string;
}

export async function generateBlogDraft(topicOverride?: string): Promise<GeneratedDraft> {
  const chosenTopic = (typeof topicOverride === "string" && topicOverride.trim())
    ? topicOverride.trim()
    : ROTATING_TOPICS[new Date().getMonth() % ROTATING_TOPICS.length];

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = `You are a knowledge architecture expert writing for a professional B2B blog.
Your name is Miruna Paun and your company is Synaptica Knowledge Systems.
Write in a clear, authoritative, and practical tone — no fluff, no hype.
Output a full blog post in Markdown. Include:
- A clear H1 title
- 2-4 H2 sections with substantive content
- Practical takeaways
- A brief conclusion
Aim for 600-900 words. Do not use excessive buzzwords.`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Write a blog post about: ${chosenTopic}` },
    ],
    max_tokens: 1800,
  });

  const rawBody = completion.choices[0]?.message?.content || "";

  const titleMatch = rawBody.match(/^#\s+(.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : chosenTopic;
  const body = rawBody.replace(/^#\s+.+\n/, "").trim();
  const excerpt = body.replace(/^#+.*\n/gm, "").replace(/\n+/g, " ").trim().slice(0, 200) + "…";

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);

  const now = new Date().toISOString();
  const id = `art-draft-${Date.now()}`;
  const category = pickCategory(chosenTopic);
  const readingTime = Math.ceil(body.split(/\s+/).length / 200);

  await pool.query(
    `INSERT INTO blog_articles (id, title, slug, excerpt, body, category, featured_image, publish_date, published, reading_time, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,NULL,$7,false,$8,$9,$9)`,
    [id, title, slug, excerpt, rawBody, category, now.slice(0, 10), readingTime, now]
  );

  await pool.query(
    `UPDATE admin_settings SET last_blog_draft_at = NOW() WHERE id = 1`
  );

  await addNotification(
    "new_subscriber",
    "New Monthly Blog Draft Ready",
    `Draft: "${title}" saved for your review. Publish it from the Blog editor.`,
    "/admin?tab=blog"
  );

  const settings = await getAdminSettings();
  if (settings.emailNotificationsEnabled && settings.adminEmail) {
    try {
      await sendBlogDraftNotification({
        toEmail: settings.adminEmail,
        title,
        category,
        articleId: id,
      });
      console.log(`[blog-generator] Draft notification email sent to ${settings.adminEmail}`);
    } catch (err) {
      console.error("[blog-generator] Email notification failed (draft still saved):", err);
    }
  }

  console.log(`[blog-generator] Draft created: "${title}" (${id})`);
  return { id, title, slug, category };
}

export async function shouldGenerateDraft(): Promise<boolean> {
  try {
    const { rows } = await pool.query("SELECT last_blog_draft_at FROM admin_settings WHERE id = 1");
    if (!rows.length || !rows[0].last_blog_draft_at) return true;
    const last = new Date(rows[0].last_blog_draft_at);
    const diffMs = Date.now() - last.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 30;
  } catch {
    return false;
  }
}
