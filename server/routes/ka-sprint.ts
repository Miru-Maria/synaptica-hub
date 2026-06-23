import { Router, Response } from "express";
import { requireAdminOrDemo, AuthenticatedRequest } from "../middleware/auth.js";
import OpenAI from "openai";
import {
  getKASessions,
  getKASessionById,
  createKASession,
  updateKASession,
  deleteKASession,
} from "../data/sessions-store.js";

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set.");
  }
  return new OpenAI({ apiKey });
}

export const kaSprintRouter = Router();

kaSprintRouter.use(requireAdminOrDemo("ka-sprint"));

kaSprintRouter.post("/taxonomy", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { domain, currentStructure, primaryUseCase, targetSystem } = req.body;

    if (!domain || typeof domain !== "string" || !domain.trim()) {
      res.status(400).json({ error: "Domain description is required" });
      return;
    }

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a senior knowledge architect specializing in taxonomy design for RAG systems and knowledge bases. Generate a detailed, actionable taxonomy proposal. Return valid JSON with the following structure:
{
  "categories": [
    {
      "name": "Category Name",
      "description": "Brief description of what this category covers",
      "subcategories": [
        {
          "name": "Subcategory Name",
          "description": "Brief description"
        }
      ]
    }
  ],
  "taggingConventions": [
    {
      "convention": "Convention name or rule",
      "example": "Example of the convention in practice",
      "rationale": "Why this convention matters"
    }
  ],
  "designRationale": "A paragraph explaining the overall taxonomy design decisions and how they support the stated use case."
}`,
        },
        {
          role: "user",
          content: `Design a taxonomy for the following knowledge base:

Domain: ${domain}
${currentStructure ? `Current Structure: ${currentStructure}` : ""}
${primaryUseCase ? `Primary Use Case: ${primaryUseCase}` : ""}
${targetSystem ? `Target RAG System / Audience: ${targetSystem}` : ""}

Provide a comprehensive taxonomy with categories, subcategories, tagging conventions, and design rationale.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4096,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    res.json(result);
  } catch (error: unknown) {
    console.error("KA Sprint taxonomy error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate taxonomy" });
  }
});

kaSprintRouter.post("/retrieval-schema", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { domain, currentStructure, primaryUseCase, targetSystem, taxonomy } = req.body;

    if (!taxonomy || typeof taxonomy !== "string" || !taxonomy.trim()) {
      res.status(400).json({ error: "Taxonomy content is required" });
      return;
    }

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a senior knowledge architect specializing in retrieval logic and metadata schema design for RAG pipelines and knowledge management systems. Based on the provided taxonomy, generate retrieval patterns and a metadata schema. Return valid JSON with the following structure:
{
  "retrievalPatterns": [
    {
      "pattern": "Name of retrieval pattern",
      "description": "How this pattern works",
      "queryExample": "Example query that uses this pattern",
      "taxonomyMapping": "Which taxonomy categories/subcategories this maps to"
    }
  ],
  "metadataSchema": {
    "fields": [
      {
        "name": "field_name",
        "type": "string | number | array | boolean | date",
        "required": true,
        "description": "What this field captures",
        "example": "Example value"
      }
    ],
    "chunkingStrategy": "Description of recommended chunking approach",
    "embeddingRecommendation": "Recommended embedding model and approach"
  },
  "designRationale": "A paragraph explaining the retrieval logic and metadata schema design decisions."
}`,
        },
        {
          role: "user",
          content: `Design retrieval logic and a metadata schema for the following knowledge base:

Domain: ${domain}
${currentStructure ? `Current Structure: ${currentStructure}` : ""}
${primaryUseCase ? `Primary Use Case: ${primaryUseCase}` : ""}
${targetSystem ? `Target RAG System / Audience: ${targetSystem}` : ""}

Approved Taxonomy:
${taxonomy}

Generate retrieval patterns and a metadata schema that align with the taxonomy above.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4096,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    res.json(result);
  } catch (error: unknown) {
    console.error("KA Sprint retrieval schema error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate retrieval schema" });
  }
});

kaSprintRouter.post("/architecture-document", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { domain, currentStructure, primaryUseCase, targetSystem, taxonomy, retrievalSchema } = req.body;

    if (!taxonomy || typeof taxonomy !== "string" || !taxonomy.trim()) {
      res.status(400).json({ error: "Taxonomy content is required" });
      return;
    }
    if (!retrievalSchema || typeof retrievalSchema !== "string" || !retrievalSchema.trim()) {
      res.status(400).json({ error: "Retrieval schema content is required" });
      return;
    }

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a senior knowledge architect producing a final, client-ready Knowledge Architecture Document. This document should be comprehensive, well-structured, and immediately actionable. Write it in clean Markdown format. The document should include:

1. Executive Summary
2. Knowledge Domain Overview
3. Taxonomy Design (categories, subcategories, tagging conventions)
4. Retrieval Logic & Patterns
5. Metadata Schema
6. Content Hierarchy & Organization
7. Implementation Recommendations
8. Appendix: Quick Reference Tables

Make the document detailed, professional, and ready for direct use by an engineering or content team.`,
        },
        {
          role: "user",
          content: `Generate a complete Knowledge Architecture Document for the following:

Domain: ${domain}
${currentStructure ? `Current Structure: ${currentStructure}` : ""}
${primaryUseCase ? `Primary Use Case: ${primaryUseCase}` : ""}
${targetSystem ? `Target RAG System / Audience: ${targetSystem}` : ""}

Approved Taxonomy:
${taxonomy}

Approved Retrieval Logic & Metadata Schema:
${retrievalSchema}

Produce the complete, final architecture document.`,
        },
      ],
      temperature: 0.7,
    });

    const document = response.choices[0].message.content || "";
    res.json({ document });
  } catch (error: unknown) {
    console.error("KA Sprint architecture document error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate architecture document" });
  }
});

kaSprintRouter.get("/sessions", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const sessions = getKASessions();
    res.json(sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  } catch (error: unknown) {
    console.error("KA Sprint sessions list error:", error);
    res.status(500).json({ error: "Failed to load sessions" });
  }
});

kaSprintRouter.get("/sessions/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = getKASessionById(req.params.id);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json(session);
  } catch (error: unknown) {
    console.error("KA Sprint session get error:", error);
    res.status(500).json({ error: "Failed to load session" });
  }
});

kaSprintRouter.post("/sessions", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientName, sessionDate, step, domain, currentStructure, primaryUseCase, targetSystem, taxonomyContent, retrievalContent, documentContent } = req.body;
    if (!clientName || typeof clientName !== "string" || !clientName.trim()) {
      res.status(400).json({ error: "Client name is required" });
      return;
    }
    const session = createKASession({
      clientName: clientName.trim(),
      sessionDate: sessionDate || new Date().toISOString().split("T")[0],
      step: step || "input",
      domain: domain || "",
      currentStructure: currentStructure || "",
      primaryUseCase: primaryUseCase || "",
      targetSystem: targetSystem || "",
      taxonomyContent: taxonomyContent || "",
      retrievalContent: retrievalContent || "",
      documentContent: documentContent || "",
    });
    res.status(201).json(session);
  } catch (error: unknown) {
    console.error("KA Sprint session save error:", error);
    res.status(500).json({ error: "Failed to save session" });
  }
});

kaSprintRouter.put("/sessions/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientName, sessionDate, step, domain, currentStructure, primaryUseCase, targetSystem, taxonomyContent, retrievalContent, documentContent } = req.body;
    const session = updateKASession(req.params.id, {
      clientName: clientName || "",
      sessionDate: sessionDate || "",
      step: step || "input",
      domain: domain || "",
      currentStructure: currentStructure || "",
      primaryUseCase: primaryUseCase || "",
      targetSystem: targetSystem || "",
      taxonomyContent: taxonomyContent || "",
      retrievalContent: retrievalContent || "",
      documentContent: documentContent || "",
    });
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json(session);
  } catch (error: unknown) {
    console.error("KA Sprint session update error:", error);
    res.status(500).json({ error: "Failed to update session" });
  }
});

kaSprintRouter.delete("/sessions/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = deleteKASession(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json({ success: true });
  } catch (error: unknown) {
    console.error("KA Sprint session delete error:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

kaSprintRouter.get("/sessions/:id/export", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = getKASessionById(req.params.id);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const lines: string[] = [];
    lines.push("# Knowledge Architecture Deliverable\n");
    lines.push(`**Client:** ${session.clientName}`);
    lines.push(`**Date:** ${session.sessionDate}`);
    lines.push(`**Generated:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}\n`);
    lines.push("---\n");

    lines.push("## 1. Knowledge Domain Inputs\n");
    lines.push(`**Domain:** ${session.domain || "Not specified"}\n`);
    if (session.currentStructure) {
      lines.push(`**Current Structure:** ${session.currentStructure}\n`);
    }
    if (session.primaryUseCase) {
      lines.push(`**Primary Use Case:** ${session.primaryUseCase}\n`);
    }
    if (session.targetSystem) {
      lines.push(`**Target System / Audience:** ${session.targetSystem}\n`);
    }
    lines.push("---\n");

    if (session.taxonomyContent) {
      lines.push("## 2. Taxonomy Design\n");
      lines.push("```json");
      lines.push(session.taxonomyContent);
      lines.push("```\n");
      lines.push("---\n");
    }

    if (session.retrievalContent) {
      lines.push("## 3. Retrieval Logic & Metadata Schema\n");
      lines.push("```json");
      lines.push(session.retrievalContent);
      lines.push("```\n");
      lines.push("---\n");
    }

    if (session.documentContent) {
      lines.push("## 4. Architecture Document\n");
      lines.push(session.documentContent);
      lines.push("\n---\n");
    }

    lines.push("*Document generated by Knowledge Architecture Sprint Tool*\n");

    const markdown = lines.join("\n");
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="KA-Deliverable-${session.clientName.replace(/[^a-zA-Z0-9]/g, "-")}-${session.sessionDate}.md"`);
    res.send(markdown);
  } catch (error: unknown) {
    console.error("KA Sprint session export error:", error);
    res.status(500).json({ error: "Failed to export session" });
  }
});
