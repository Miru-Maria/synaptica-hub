import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";
import {
  getPrompts,
  getPromptById,
  createPrompt,
  updatePrompt,
  deletePrompt,
  getStyleGuide,
  saveStyleGuide,
  extractVariables,
} from "../data/prompt-workshop-store.js";
import {
  getPWSessions,
  getPWSessionById,
  createPWSession,
  updatePWSession,
  deletePWSession,
} from "../data/sessions-store.js";
import OpenAI from "openai";

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set.");
  }
  return new OpenAI({ apiKey });
}

export const promptWorkshopRouter = Router();

promptWorkshopRouter.use(requireAuth);

promptWorkshopRouter.get("/prompts", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const prompts = getPrompts();
    res.json(prompts);
  } catch (error: unknown) {
    console.error("Prompt workshop list error:", error);
    res.status(500).json({ error: "Failed to load prompts" });
  }
});

promptWorkshopRouter.get("/prompts/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prompt = getPromptById(req.params.id);
    if (!prompt) {
      res.status(404).json({ error: "Prompt not found" });
      return;
    }
    res.json(prompt);
  } catch (error: unknown) {
    console.error("Prompt workshop get error:", error);
    res.status(500).json({ error: "Failed to load prompt" });
  }
});

promptWorkshopRouter.post("/prompts", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, category, description, body, tags, useStyleGuide } = req.body;
    if (!title || !body) {
      res.status(400).json({ error: "Title and body are required" });
      return;
    }
    const prompt = createPrompt({
      title,
      category: category || "Uncategorized",
      description: description || "",
      body,
      tags: tags || [],
      useStyleGuide: useStyleGuide || false,
    });
    res.status(201).json(prompt);
  } catch (error: unknown) {
    console.error("Prompt workshop create error:", error);
    res.status(500).json({ error: "Failed to create prompt" });
  }
});

promptWorkshopRouter.put("/prompts/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, category, description, body, tags, useStyleGuide } = req.body;
    const updated = updatePrompt(req.params.id, {
      ...(title !== undefined && { title }),
      ...(category !== undefined && { category }),
      ...(description !== undefined && { description }),
      ...(body !== undefined && { body }),
      ...(tags !== undefined && { tags }),
      ...(useStyleGuide !== undefined && { useStyleGuide }),
    });
    if (!updated) {
      res.status(404).json({ error: "Prompt not found" });
      return;
    }
    res.json(updated);
  } catch (error: unknown) {
    console.error("Prompt workshop update error:", error);
    res.status(500).json({ error: "Failed to update prompt" });
  }
});

promptWorkshopRouter.delete("/prompts/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = deletePrompt(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Prompt not found" });
      return;
    }
    res.json({ success: true });
  } catch (error: unknown) {
    console.error("Prompt workshop delete error:", error);
    res.status(500).json({ error: "Failed to delete prompt" });
  }
});

promptWorkshopRouter.post("/test", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { renderedPrompt } = req.body;
    if (!renderedPrompt || typeof renderedPrompt !== "string" || !renderedPrompt.trim()) {
      res.status(400).json({ error: "Rendered prompt text is required" });
      return;
    }

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "user", content: renderedPrompt },
      ],
      temperature: 0.7,
    });

    const output = response.choices[0].message.content || "";
    res.json({ output });
  } catch (error: unknown) {
    console.error("Prompt workshop test error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to run prompt" });
  }
});

promptWorkshopRouter.get("/style-guide", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const guide = getStyleGuide();
    res.json(guide);
  } catch (error: unknown) {
    console.error("Prompt workshop style guide get error:", error);
    res.status(500).json({ error: "Failed to load style guide" });
  }
});

promptWorkshopRouter.put("/style-guide", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (content === undefined || typeof content !== "string") {
      res.status(400).json({ error: "Content is required" });
      return;
    }
    const guide = saveStyleGuide(content);
    res.json(guide);
  } catch (error: unknown) {
    console.error("Prompt workshop style guide save error:", error);
    res.status(500).json({ error: "Failed to save style guide" });
  }
});

promptWorkshopRouter.get("/categories", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const prompts = getPrompts();
    const categories = [...new Set(prompts.map((p) => p.category))].filter(Boolean).sort();
    res.json(categories);
  } catch (error: unknown) {
    console.error("Prompt workshop categories error:", error);
    res.status(500).json({ error: "Failed to load categories" });
  }
});

promptWorkshopRouter.get("/sessions", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const sessions = getPWSessions();
    res.json(sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  } catch (error: unknown) {
    console.error("Prompt workshop sessions list error:", error);
    res.status(500).json({ error: "Failed to load sessions" });
  }
});

promptWorkshopRouter.get("/sessions/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = getPWSessionById(req.params.id);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json(session);
  } catch (error: unknown) {
    console.error("Prompt workshop session get error:", error);
    res.status(500).json({ error: "Failed to load session" });
  }
});

promptWorkshopRouter.post("/sessions", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientName, sessionName, version, tags } = req.body;
    if (!clientName || typeof clientName !== "string" || !clientName.trim()) {
      res.status(400).json({ error: "Client name is required" });
      return;
    }
    if (!sessionName || typeof sessionName !== "string" || !sessionName.trim()) {
      res.status(400).json({ error: "Session name is required" });
      return;
    }

    const currentPrompts = getPrompts();
    const currentGuide = getStyleGuide();

    const session = createPWSession({
      clientName: clientName.trim(),
      sessionName: sessionName.trim(),
      version: version || "1.0",
      tags: tags || [],
      prompts: currentPrompts.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        description: p.description,
        body: p.body,
        tags: p.tags,
        variables: p.variables,
        useStyleGuide: p.useStyleGuide,
      })),
      styleGuideContent: currentGuide.content,
    });
    res.status(201).json(session);
  } catch (error: unknown) {
    console.error("Prompt workshop session save error:", error);
    res.status(500).json({ error: "Failed to save session" });
  }
});

promptWorkshopRouter.put("/sessions/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientName, sessionName, version, tags } = req.body;

    const currentPrompts = getPrompts();
    const currentGuide = getStyleGuide();

    const session = updatePWSession(req.params.id, {
      clientName: clientName || "",
      sessionName: sessionName || "",
      version: version || "1.0",
      tags: tags || [],
      prompts: currentPrompts.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        description: p.description,
        body: p.body,
        tags: p.tags,
        variables: p.variables,
        useStyleGuide: p.useStyleGuide,
      })),
      styleGuideContent: currentGuide.content,
    });
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json(session);
  } catch (error: unknown) {
    console.error("Prompt workshop session update error:", error);
    res.status(500).json({ error: "Failed to update session" });
  }
});

promptWorkshopRouter.delete("/sessions/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = deletePWSession(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json({ success: true });
  } catch (error: unknown) {
    console.error("Prompt workshop session delete error:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

promptWorkshopRouter.get("/sessions/:id/export", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = getPWSessionById(req.params.id);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const lines: string[] = [];
    lines.push("# Prompt Library — Client Deliverable\n");
    lines.push(`**Client:** ${session.clientName}`);
    lines.push(`**Session:** ${session.sessionName}`);
    lines.push(`**Version:** ${session.version}`);
    if (session.tags.length > 0) {
      lines.push(`**Tags:** ${session.tags.join(", ")}`);
    }
    lines.push(`**Generated:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}\n`);
    lines.push("---\n");

    if (session.styleGuideContent) {
      lines.push("## Style Guide\n");
      lines.push(session.styleGuideContent);
      lines.push("\n---\n");
    }

    const grouped: Record<string, typeof session.prompts> = {};
    for (const p of session.prompts) {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    }

    lines.push("## Prompt Library\n");

    for (const [category, categoryPrompts] of Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))) {
      lines.push(`### ${category}\n`);
      for (const p of categoryPrompts) {
        lines.push(`#### ${p.title}\n`);
        if (p.description) lines.push(`${p.description}\n`);
        if (p.variables.length > 0) {
          lines.push("**Variables:**\n");
          for (const v of p.variables) {
            lines.push(`- \`{{${v}}}\` — Replace with the appropriate ${v.replace(/_/g, " ")} value`);
          }
          lines.push("");
        }
        lines.push("**Prompt Template:**\n");
        lines.push("```");
        lines.push(p.body);
        lines.push("```\n");
        if (p.useStyleGuide) {
          lines.push("*This prompt auto-appends the style guide when used.*\n");
        }
        if (p.tags.length > 0) {
          lines.push(`**Tags:** ${p.tags.join(", ")}\n`);
        }
        lines.push("---\n");
      }
    }

    lines.push("*Document generated by Prompt Engineering Workshop*\n");

    const markdown = lines.join("\n");
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="Prompt-Library-${session.clientName.replace(/[^a-zA-Z0-9]/g, "-")}-${session.version}.md"`);
    res.send(markdown);
  } catch (error: unknown) {
    console.error("Prompt workshop session export error:", error);
    res.status(500).json({ error: "Failed to export session" });
  }
});
