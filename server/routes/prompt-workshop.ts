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
