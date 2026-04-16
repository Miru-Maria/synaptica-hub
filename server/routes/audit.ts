import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { parsePDF, parseDOCX, parseMarkdown, chunkText } from "../services/parser.js";
import { scrapeUrl } from "../services/scraper.js";
import { analyzeDocumentation, AuditResult } from "../services/analyzer.js";
import { getTools, logToolRun, createProcessingCertificate } from "../data/store.js";
import crypto from "crypto";

async function requireToolEnabled(req: Request, res: Response, next: NextFunction) {
  try {
    const tools = await getTools();
    const docaudit = tools.find((t) => t.slug === "docaudit");
    if (docaudit && !docaudit.enabled) {
      res.status(503).json({ error: "DocAudit is currently disabled" });
      return;
    }
    next();
  } catch {
    next();
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const MAX_URLS = 10;
const MAX_TOPICS = 30;
const MAX_CHUNKS = 500;
const MAX_NOTION_PAGES = 20;

const analyzeRateMap = new Map<string, number>();
const RATE_LIMIT_MS = 10000;
const LOOPBACK_IPS = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1", "0.0.0.0", "::ffff:0.0.0.0"]);

function checkRateLimit(ip: string, isInternal: boolean): boolean {
  if (isInternal || LOOPBACK_IPS.has(ip)) return true;
  const last = analyzeRateMap.get(ip);
  const now = Date.now();
  if (last && now - last < RATE_LIMIT_MS) return false;
  analyzeRateMap.set(ip, now);
  if (analyzeRateMap.size > 10000) {
    const entries = [...analyzeRateMap.entries()];
    entries.slice(0, 5000).forEach(([k]) => analyzeRateMap.delete(k));
  }
  return true;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

interface NotionRichText {
  plain_text: string;
}

interface NotionBlock {
  id: string;
  type: string;
  has_children: boolean;
  [key: string]: unknown;
}

interface NotionBlockContent {
  rich_text?: NotionRichText[];
}

interface NotionListResponse {
  results: NotionBlock[];
  has_more: boolean;
  next_cursor: string | null;
}

export const auditRouter = Router();

auditRouter.use(requireToolEnabled);

auditRouter.post("/parse-files", upload.array("files", 20), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }

    const allText: string[] = [];

    for (const file of files) {
      const ext = file.originalname.split(".").pop()?.toLowerCase();

      let text = "";
      if (ext === "pdf") {
        text = await parsePDF(file.buffer);
      } else if (ext === "docx") {
        text = await parseDOCX(file.buffer);
      } else if (ext === "md") {
        text = await parseMarkdown(file.buffer.toString("utf-8"));
      } else {
        text = file.buffer.toString("utf-8");
      }

      if (text.trim()) {
        allText.push(text);
      }
    }

    const chunks = allText.flatMap((t) => chunkText(t));
    res.json({ chunks, fileCount: files.length, totalChunks: chunks.length, _inputType: "file-upload" });
  } catch (error: unknown) {
    console.error("File parse error:", error);
    res.status(500).json({ error: getErrorMessage(error) || "Failed to parse files" });
  }
});

auditRouter.post("/parse-text", async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      res.status(400).json({ error: "No text provided" });
      return;
    }

    const chunks = chunkText(text);
    res.json({ chunks, totalChunks: chunks.length, _inputType: "paste" });
  } catch (error: unknown) {
    console.error("Text parse error:", error);
    res.status(500).json({ error: getErrorMessage(error) || "Failed to parse text" });
  }
});

auditRouter.post("/parse-url", async (req: Request, res: Response) => {
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      res.status(400).json({ error: "No URLs provided" });
      return;
    }

    if (urls.length > MAX_URLS) {
      res.status(400).json({ error: `Maximum ${MAX_URLS} URLs allowed per request` });
      return;
    }

    const allText: string[] = [];
    const errors: string[] = [];

    for (const url of urls) {
      try {
        const text = await scrapeUrl(url);
        if (text.trim()) {
          allText.push(text);
        }
      } catch (err: unknown) {
        errors.push(`${url}: ${getErrorMessage(err)}`);
      }
    }

    const chunks = allText.flatMap((t) => chunkText(t));
    res.json({ chunks, totalChunks: chunks.length, urlsProcessed: urls.length - errors.length, errors, _inputType: "url" });
  } catch (error: unknown) {
    console.error("URL parse error:", error);
    res.status(500).json({ error: getErrorMessage(error) || "Failed to parse URLs" });
  }
});

interface NotionSearchResult {
  id: string;
  title: string;
  type: "page" | "database";
  url: string;
}

interface NotionSearchResponse {
  results: Array<{
    id: string;
    object: string;
    url: string;
    properties?: Record<string, { title?: Array<{ plain_text: string }> }>;
    title?: Array<{ plain_text: string }>;
  }>;
  has_more: boolean;
  next_cursor: string | null;
}

auditRouter.post("/notion-search", async (req: Request, res: Response) => {
  try {
    const { apiToken, query } = req.body;
    if (!apiToken || typeof apiToken !== "string") {
      res.status(400).json({ error: "Notion API token required" });
      return;
    }

    const searchResponse = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query || "",
        page_size: 50,
      }),
    });

    if (!searchResponse.ok) {
      const status = searchResponse.status;
      if (status === 401) {
        throw new Error("Invalid Notion API token. Please check your integration token.");
      }
      throw new Error(`Notion API error: ${status}`);
    }

    const data = (await searchResponse.json()) as NotionSearchResponse;
    const results: NotionSearchResult[] = [];

    for (const item of data.results) {
      let title = "Untitled";

      if (item.object === "page" && item.properties) {
        const titleProp = Object.values(item.properties).find((p) => p.title);
        if (titleProp?.title?.[0]) {
          title = titleProp.title[0].plain_text;
        }
      } else if (item.object === "database" && item.title) {
        title = item.title.map((t) => t.plain_text).join("") || "Untitled Database";
      }

      results.push({
        id: item.id.replace(/-/g, ""),
        title,
        type: item.object === "database" ? "database" : "page",
        url: item.url,
      });
    }

    res.json({ results });
  } catch (error: unknown) {
    console.error("Notion search error:", error);
    res.status(500).json({ error: getErrorMessage(error) || "Failed to search Notion" });
  }
});

interface NotionItem {
  id: string;
  type: "page" | "database";
}

auditRouter.post("/parse-notion", async (req: Request, res: Response) => {
  try {
    const { apiToken, pageIds, items } = req.body;
    if (!apiToken || typeof apiToken !== "string") {
      res.status(400).json({ error: "Notion API token required" });
      return;
    }

    const notionItems: NotionItem[] = [];

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (item && typeof item.id === "string" && item.id.trim()) {
          notionItems.push({
            id: item.id.trim(),
            type: item.type === "database" ? "database" : "page",
          });
        }
      }
    } else if (Array.isArray(pageIds) && pageIds.length > 0) {
      for (const id of pageIds) {
        if (typeof id === "string" && id.trim()) {
          notionItems.push({ id: id.trim(), type: "page" });
        }
      }
    }

    if (notionItems.length === 0) {
      res.status(400).json({ error: "At least one page or database is required" });
      return;
    }

    if (notionItems.length > MAX_NOTION_PAGES) {
      res.status(400).json({ error: `Maximum ${MAX_NOTION_PAGES} items allowed per request` });
      return;
    }

    const allText: string[] = [];
    const errors: string[] = [];

    for (const item of notionItems) {
      try {
        let text: string;
        if (item.type === "database") {
          text = await fetchNotionDatabaseText(apiToken, item.id);
        } else {
          text = await fetchNotionPageText(apiToken, item.id);
        }
        if (text.trim()) {
          allText.push(text);
        }
      } catch (err: unknown) {
        errors.push(`${item.type} ${item.id}: ${getErrorMessage(err)}`);
      }
    }

    const chunks = allText.flatMap((t) => chunkText(t));
    res.json({ chunks, totalChunks: chunks.length, pagesProcessed: notionItems.length - errors.length, errors, _inputType: "notion" });
  } catch (error: unknown) {
    console.error("Notion parse error:", error);
    res.status(500).json({ error: getErrorMessage(error) || "Failed to parse Notion content" });
  }
});

async function fetchNotionPageText(apiToken: string, blockId: string): Promise<string> {
  const allTexts: string[] = [];
  let cursor: string | undefined;

  do {
    const url = `https://api.notion.com/v1/blocks/${blockId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Notion-Version": "2022-06-28",
      },
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }

    const data = (await response.json()) as NotionListResponse;

    for (const block of data.results || []) {
      const text = extractNotionText(block);
      if (text) allTexts.push(text);

      if (block.has_children) {
        try {
          const childText = await fetchNotionPageText(apiToken, block.id);
          if (childText) allTexts.push(childText);
        } catch (childErr: unknown) {
          console.warn(`Failed to fetch child block ${block.id}: ${getErrorMessage(childErr)}`);
        }
      }
    }

    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return allTexts.join("\n");
}

interface NotionDatabaseQueryResponse {
  results: Array<{
    id: string;
    object: string;
    properties: Record<string, {
      type: string;
      title?: NotionRichText[];
      rich_text?: NotionRichText[];
      number?: number | null;
      select?: { name: string } | null;
      multi_select?: Array<{ name: string }>;
      date?: { start: string; end: string | null } | null;
      checkbox?: boolean;
      url?: string | null;
      email?: string | null;
      phone_number?: string | null;
    }>;
  }>;
  has_more: boolean;
  next_cursor: string | null;
}

async function fetchNotionDatabaseText(apiToken: string, databaseId: string): Promise<string> {
  const allTexts: string[] = [];
  let cursor: string | undefined;

  do {
    const url = `https://api.notion.com/v1/databases/${databaseId}/query`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      }),
    });

    if (!response.ok) {
      throw new Error(`Notion database query error: ${response.status}`);
    }

    const data = (await response.json()) as NotionDatabaseQueryResponse;

    for (const page of data.results) {
      const propTexts: string[] = [];
      for (const [key, prop] of Object.entries(page.properties)) {
        let value = "";
        if (prop.title) {
          value = prop.title.map((t) => t.plain_text).join("");
        } else if (prop.rich_text) {
          value = prop.rich_text.map((t) => t.plain_text).join("");
        } else if (prop.number !== undefined && prop.number !== null) {
          value = String(prop.number);
        } else if (prop.select) {
          value = prop.select.name;
        } else if (prop.multi_select) {
          value = prop.multi_select.map((s) => s.name).join(", ");
        } else if (prop.date) {
          value = prop.date.start + (prop.date.end ? ` to ${prop.date.end}` : "");
        } else if (prop.checkbox !== undefined) {
          value = prop.checkbox ? "Yes" : "No";
        } else if (prop.url) {
          value = prop.url;
        } else if (prop.email) {
          value = prop.email;
        } else if (prop.phone_number) {
          value = prop.phone_number;
        }

        if (value) {
          propTexts.push(`${key}: ${value}`);
        }
      }

      if (propTexts.length > 0) {
        allTexts.push(propTexts.join(". "));
      }

      try {
        const pageContent = await fetchNotionPageText(apiToken, page.id);
        if (pageContent.trim()) {
          allTexts.push(pageContent);
        }
      } catch (err: unknown) {
        console.warn(`Failed to fetch database page content ${page.id}: ${getErrorMessage(err)}`);
      }
    }

    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return allTexts.join("\n\n");
}

function extractNotionText(block: NotionBlock): string {
  const type = block.type;
  const content = block[type] as NotionBlockContent | undefined;
  if (!content) return "";

  const richText = content.rich_text;
  if (Array.isArray(richText)) {
    return richText.map((t: NotionRichText) => t.plain_text || "").join("");
  }

  return "";
}

auditRouter.post("/analyze", async (req: Request, res: Response) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    const isInternal = req.headers["x-internal-tool-tester"] === "1";
    if (!checkRateLimit(clientIp, isInternal)) {
      res.status(429).json({ error: "Please wait before running another analysis" });
      return;
    }

    const { chunks, topics, kbName } = req.body;

    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      res.status(400).json({ error: "No content chunks to analyze" });
      return;
    }

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      res.status(400).json({ error: "No topics defined" });
      return;
    }

    if (chunks.length > MAX_CHUNKS) {
      res.status(400).json({ error: `Maximum ${MAX_CHUNKS} content chunks allowed` });
      return;
    }

    if (topics.length > MAX_TOPICS) {
      res.status(400).json({ error: `Maximum ${MAX_TOPICS} topics allowed` });
      return;
    }

    const safeChunks = chunks.filter((c: string) => typeof c === "string" && c.trim()).slice(0, MAX_CHUNKS);
    const safeTopics = topics.filter((t: string) => typeof t === "string" && t.trim()).slice(0, MAX_TOPICS);

    const result: AuditResult = await analyzeDocumentation(safeChunks, safeTopics, kbName || "Untitled Knowledge Base");

    const totalChars = safeChunks.reduce((sum, c) => sum + c.length, 0);
    let documentSizeCategory = "small";
    if (totalChars > 50000) documentSizeCategory = "large";
    else if (totalChars > 10000) documentSizeCategory = "medium";

    const gapCategories = result.topicCoverages
      ?.filter((t) => t.severity === "critical" || t.severity === "high")
      .map((t) => t.topic)
      .slice(0, 10) || [];

    const completedAt = new Date().toISOString();
    const sessionHash = crypto
      .createHash("sha256")
      .update(safeChunks.join("\n"))
      .digest("hex")
      .slice(0, 24);

    try {
      await logToolRun({
        toolName: "DocAudit",
        toolSlug: "docaudit",
        inputType: (req.body._inputType as string) || "unknown",
        emailCaptured: false,
        documentSizeCategory,
        gapCategories,
      });
    } catch (logErr) {
      console.error("Failed to log tool run:", logErr);
    }

    try {
      await createProcessingCertificate({
        toolName: "DocAudit",
        toolSlug: "docaudit",
        documentCount: (req.body._documentCount as number) || 1,
        chunkCount: safeChunks.length,
        approximateChars: totalChars,
        contentTypes: (req.body._inputType as string) || "unknown",
        clientReference: (req.body._clientRef as string) || "",
        sessionHash,
        processedAt: new Date(Date.now() - 1000).toISOString(),
        completedAt,
      });
    } catch (certErr) {
      console.error("Failed to create processing certificate:", certErr);
    }

    res.json(result);
  } catch (error: unknown) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: getErrorMessage(error) || "Analysis failed" });
  }
});
