import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";
import OpenAI from "openai";

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set.");
  }
  return new OpenAI({ apiKey });
}

export const kaSprintRouter = Router();

kaSprintRouter.use(requireAuth);

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
