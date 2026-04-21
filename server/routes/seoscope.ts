import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { validateBody, schemas } from "../middleware/validate.js";
import OpenAI from "openai";
import * as cheerio from "cheerio";

export const seoscopeRouter = Router();
seoscopeRouter.use(requireAuth);

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey: key });
}

const typePrompts: Record<string, string> = {
  full: "Perform a comprehensive SEO analysis covering: 1) Title & meta description assessment, 2) Heading structure (H1-H6), 3) Keyword usage and density, 4) Content depth and relevance, 5) Internal linking opportunities, 6) Readability score, 7) Structured data recommendations, 8) Prioritized action list.",
  keywords: "Analyze keyword usage and optimization opportunities: 1) Primary keyword identification, 2) Keyword placement analysis (title, H1, first paragraph, etc.), 3) Missing keyword opportunities, 4) Keyword cannibalization risks, 5) Semantic/LSI keyword recommendations.",
  content: "Analyze content quality for SEO: 1) Content depth and comprehensiveness, 2) E-E-A-T signals, 3) User intent alignment, 4) Readability and structure, 5) Content gaps vs. top-ranking pages, 6) Featured snippet opportunities.",
  technical: "Analyze technical SEO elements visible in the content: 1) Title tag quality, 2) Meta description, 3) Heading hierarchy, 4) Image alt text usage, 5) Internal link anchor text, 6) Schema markup opportunities, 7) URL structure if provided.",
};

async function fetchPageContent(url: string): Promise<{ content: string; error?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SEOScope/1.0; +https://synapticaks.com)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { content: "", error: `Page returned HTTP ${response.status}` };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return { content: "", error: `Page is not HTML (${contentType.split(";")[0]})` };
    }

    const html = await response.text();
    const extracted = extractSEOContent(url, html);
    return { content: extracted };
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      return { content: "", error: "Request timed out after 15 seconds" };
    }
    return { content: "", error: err instanceof Error ? err.message : "Failed to fetch URL" };
  }
}

function extractSEOContent(url: string, html: string): string {
  const $ = cheerio.load(html);

  $("script, style, noscript, svg, iframe, nav, footer, header").remove();

  const title = $("title").first().text().trim();
  const metaDesc = $('meta[name="description"]').attr("content")?.trim() || "";
  const metaKeywords = $('meta[name="keywords"]').attr("content")?.trim() || "";
  const canonical = $('link[rel="canonical"]').attr("href")?.trim() || "";
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() || "";
  const ogDesc = $('meta[property="og:description"]').attr("content")?.trim() || "";

  const headings: string[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const level = el.tagName.toUpperCase();
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text) headings.push(`${level}: ${text}`);
  });

  const paragraphs: string[] = [];
  $("p, li, td, th, blockquote, figcaption").each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text.length > 20) paragraphs.push(text);
  });

  const images: string[] = [];
  $("img[alt]").each((_, el) => {
    const alt = $(el).attr("alt")?.trim();
    if (alt) images.push(alt);
  });

  const schemaTypes: string[] = [];
  $('[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "{}");
      const type = data["@type"] || data.type;
      if (type) schemaTypes.push(Array.isArray(type) ? type.join(", ") : type);
    } catch { }
  });

  const sections: string[] = [];

  sections.push(`URL: ${url}`);
  if (title) sections.push(`\nTITLE TAG: ${title}`);
  if (canonical && canonical !== url) sections.push(`CANONICAL: ${canonical}`);
  if (metaDesc) sections.push(`META DESCRIPTION: ${metaDesc}`);
  if (metaKeywords) sections.push(`META KEYWORDS: ${metaKeywords}`);
  if (ogTitle && ogTitle !== title) sections.push(`OG TITLE: ${ogTitle}`);
  if (ogDesc && ogDesc !== metaDesc) sections.push(`OG DESCRIPTION: ${ogDesc}`);
  if (schemaTypes.length > 0) sections.push(`SCHEMA MARKUP TYPES: ${schemaTypes.join(", ")}`);

  if (headings.length > 0) {
    sections.push(`\nHEADING STRUCTURE:\n${headings.join("\n")}`);
  }

  if (paragraphs.length > 0) {
    const bodyText = paragraphs.join("\n\n");
    sections.push(`\nBODY CONTENT:\n${bodyText.slice(0, 12000)}`);
  }

  if (images.length > 0) {
    sections.push(`\nIMAGE ALT TEXTS (${images.length} images):\n${images.slice(0, 30).map((a) => `- ${a}`).join("\n")}`);
  }

  return sections.join("\n");
}

seoscopeRouter.post("/fetch-url", async (req: AuthenticatedRequest, res: Response) => {
  const { url } = req.body;
  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "url is required" });
    return;
  }

  try {
    new URL(url);
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  const { content, error } = await fetchPageContent(url);
  if (error) {
    res.status(422).json({ error });
    return;
  }

  res.json({ content });
});

seoscopeRouter.post("/analyze", validateBody(schemas.seoscopeAnalyze), async (req: AuthenticatedRequest, res: Response) => {
  let { content, url, targetKeywords, analysisType } = req.body;

  if (!content && !url) {
    res.status(400).json({ error: "Provide page content or a URL to analyze" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  if (!content && url) {
    res.write(`data: ${JSON.stringify({ status: "Fetching page content from URL..." })}\n\n`);
    const { content: fetched, error: fetchError } = await fetchPageContent(url);
    if (fetchError) {
      res.write(`data: ${JSON.stringify({ error: `Could not fetch URL: ${fetchError}` })}\n\n`);
      res.end();
      return;
    }
    content = fetched;
    res.write(`data: ${JSON.stringify({ status: "Page fetched. Running SEO analysis..." })}\n\n`);
  }

  const inputDescription = content
    ? `${url ? `URL being analyzed: ${url}\n\n` : ""}${content}`
    : `Page URL: ${url}`;

  const systemPrompt = `You are an expert SEO strategist and content analyst. ${typePrompts[analysisType as string] || typePrompts.full}

${targetKeywords ? `Target keywords to focus on: ${targetKeywords}` : ""}

Be specific and actionable. Include concrete examples and suggested rewrites where relevant. Score sections where appropriate (e.g. 7/10) with clear reasoning.`;

  try {
    const client = getOpenAI();
    const stream = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2048,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: inputDescription.slice(0, 20000) },
      ],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("[seoscope] analyze error:", err);
    res.write(`data: ${JSON.stringify({ error: "Analysis failed" })}\n\n`);
    res.end();
  }
});
