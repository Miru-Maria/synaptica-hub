import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getArticles, saveArticles, getPublishedArticles, getArticleBySlug, estimateReadingTime } from "../data/store.js";
import type { BlogArticle } from "../data/store.js";

export const blogRouter = Router();

blogRouter.get("/public", async (_req: Request, res: Response) => {
  try {
    const articles = await getPublishedArticles();
    const publicArticles = articles.map(({ body, ...rest }) => rest);
    res.json(publicArticles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load articles" });
  }
});

blogRouter.get("/public/:slug", async (req: Request, res: Response) => {
  try {
    const article = await getArticleBySlug(req.params.slug);
    if (!article || !article.published) {
      res.status(404).json({ error: "Article not found" });
      return;
    }
    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load article" });
  }
});

blogRouter.get("/", requireAuth, async (_req: Request, res: Response) => {
  try {
    const articles = (await getArticles()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    res.json(articles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load articles" });
  }
});

blogRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  const { title, slug, excerpt, body, category, featuredImage, publishDate, published } = req.body;
  if (!title || !slug || !body) {
    res.status(400).json({ error: "title, slug, and body are required" });
    return;
  }
  try {
    const articles = await getArticles();
    if (articles.some((a) => a.slug === slug)) {
      res.status(400).json({ error: "An article with this slug already exists" });
      return;
    }
    const now = new Date().toISOString();
    const newArticle: BlogArticle = {
      id: `art-${Date.now()}`,
      title,
      slug,
      excerpt: excerpt || "",
      body,
      category: category || "General",
      featuredImage: featuredImage || undefined,
      publishDate: publishDate || now.split("T")[0],
      published: published ?? false,
      readingTime: estimateReadingTime(body),
      createdAt: now,
      updatedAt: now,
    };
    articles.push(newArticle);
    await saveArticles(articles);
    res.json(newArticle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create article" });
  }
});

blogRouter.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const articles = await getArticles();
    const idx = articles.findIndex((a) => a.id === req.params.id);
    if (idx === -1) { res.status(404).json({ error: "Article not found" }); return; }

    const { title, slug, excerpt, body, category, featuredImage, publishDate, published } = req.body;

    if (slug && slug !== articles[idx].slug && articles.some((a, i) => i !== idx && a.slug === slug)) {
      res.status(400).json({ error: "An article with this slug already exists" });
      return;
    }

    if (title !== undefined) articles[idx].title = title;
    if (slug !== undefined) articles[idx].slug = slug;
    if (excerpt !== undefined) articles[idx].excerpt = excerpt;
    if (body !== undefined) {
      articles[idx].body = body;
      articles[idx].readingTime = estimateReadingTime(body);
    }
    if (category !== undefined) articles[idx].category = category;
    if (featuredImage !== undefined) articles[idx].featuredImage = featuredImage || undefined;
    if (publishDate !== undefined) articles[idx].publishDate = publishDate;
    if (published !== undefined) articles[idx].published = published;
    articles[idx].updatedAt = new Date().toISOString();

    await saveArticles(articles);
    res.json(articles[idx]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update article" });
  }
});

blogRouter.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const articles = await getArticles();
    const idx = articles.findIndex((a) => a.id === req.params.id);
    if (idx === -1) { res.status(404).json({ error: "Article not found" }); return; }
    articles.splice(idx, 1);
    await saveArticles(articles);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete article" });
  }
});

blogRouter.post("/generate-draft", requireAuth, async (req: Request, res: Response) => {
  try {
    const { topic } = req.body;
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    const chosenTopic = (typeof topic === "string" && topic.trim())
      ? topic.trim()
      : ROTATING_TOPICS[new Date().getMonth() % ROTATING_TOPICS.length];

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

    const categories = ["Knowledge Architecture", "Documentation Strategy", "RAG & Retrieval", "Prompt Engineering"];
    const category = categories.find((c) => {
      const lc = chosenTopic.toLowerCase();
      if (c === "RAG & Retrieval" && (lc.includes("rag") || lc.includes("retriev"))) return true;
      if (c === "Prompt Engineering" && (lc.includes("prompt") || lc.includes("hallucin"))) return true;
      if (c === "Documentation Strategy" && (lc.includes("doc") || lc.includes("knowledge base"))) return true;
      return false;
    }) || "Knowledge Architecture";

    const { pool } = await import("../data/db.js");
    await pool.query(
      `INSERT INTO blog_articles (id, title, slug, excerpt, body, category, featured_image, publish_date, published, reading_time, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NULL,$7,false,$8,$9,$9)`,
      [id, title, slug, excerpt, rawBody, category, now.slice(0, 10), Math.ceil(body.split(/\s+/).length / 200), now]
    );

    const { addNotification } = await import("../data/store.js");
    await addNotification(
      "new_subscriber",
      "New Monthly Blog Draft Ready",
      `Draft: "${title}" saved for your review. Publish it from the Blog editor.`,
      "/admin?tab=blog"
    );

    res.json({ ok: true, id, title, slug, category });
  } catch (err) {
    console.error("[blog/generate-draft]", err);
    res.status(500).json({ error: "Failed to generate draft" });
  }
});
