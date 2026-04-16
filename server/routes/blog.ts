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
    const { generateBlogDraft } = await import("../services/blog-generator.js");
    const draft = await generateBlogDraft(topic);
    res.json({ ok: true, ...draft });
  } catch (err) {
    console.error("[blog/generate-draft]", err);
    res.status(500).json({ error: "Failed to generate draft" });
  }
});
