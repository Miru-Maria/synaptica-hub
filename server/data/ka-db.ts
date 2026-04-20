import { pool } from "./db.js";

export async function initKATables(): Promise<void> {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ka_knowledge_bases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      chunk_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ka_chunks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      kb_id UUID NOT NULL REFERENCES ka_knowledge_bases(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      token_count INTEGER NOT NULL DEFAULT 0,
      embedding vector(1536),
      metadata JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ka_onboarding_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      kb_id UUID REFERENCES ka_knowledge_bases(id) ON DELETE SET NULL,
      role TEXT NOT NULL DEFAULT 'new employee',
      title TEXT NOT NULL DEFAULT 'Onboarding Session',
      messages JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ka_prompt_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      prompt TEXT NOT NULL,
      variables JSONB NOT NULL DEFAULT '[]',
      tags JSONB NOT NULL DEFAULT '[]',
      is_builtin BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS ka_chunks_kb_id_idx ON ka_chunks(kb_id);
    CREATE INDEX IF NOT EXISTS ka_onboarding_sessions_kb_id_idx ON ka_onboarding_sessions(kb_id);
    CREATE INDEX IF NOT EXISTS ka_prompt_templates_category_idx ON ka_prompt_templates(category);
  `);

  await seedBuiltinPrompts();
}

async function seedBuiltinPrompts(): Promise<void> {
  const existing = await pool.query(
    `SELECT COUNT(*) FROM ka_prompt_templates WHERE is_builtin = true`
  );
  if (parseInt(existing.rows[0].count) > 0) return;

  const prompts = [
    {
      title: "Documentation Gap Analysis",
      category: "Analysis",
      description: "Identifies gaps between existing documentation and user support needs.",
      prompt: `You are a documentation strategist. Analyze the following documentation against the listed user questions or support tickets.

EXISTING DOCUMENTATION:
{{documentation}}

USER QUESTIONS / SUPPORT TICKETS:
{{questions}}

Provide:
1. A prioritized list of documentation gaps (what's missing or insufficient)
2. The frequency/impact of each gap
3. Recommended articles or sections to write next
4. Any outdated content that should be revised

Be specific and actionable.`,
      variables: ["documentation", "questions"],
      tags: ["gaps", "analysis", "support"],
    },
    {
      title: "FAQ Generator — End Users",
      category: "FAQ",
      description: "Generates a user-friendly FAQ from dense technical documentation.",
      prompt: `You are a technical writer specializing in end-user documentation. Transform the following source material into a clear, friendly FAQ for non-technical users.

SOURCE DOCUMENTATION:
{{documentation}}

Target audience: {{audience}}

Requirements:
- Write questions as users would naturally ask them
- Keep answers concise (2-4 sentences each)
- Group related questions under clear headings
- Avoid jargon — explain any necessary technical terms
- Include at least 10 Q&A pairs

Format as Markdown with ## headings for categories.`,
      variables: ["documentation", "audience"],
      tags: ["faq", "end-users", "plain-language"],
    },
    {
      title: "FAQ Generator — Developers",
      category: "FAQ",
      description: "Generates a developer-oriented FAQ with technical depth.",
      prompt: `You are a senior developer advocate. Create a comprehensive technical FAQ from the following documentation.

SOURCE DOCUMENTATION:
{{documentation}}

Target audience: {{audience}}

Requirements:
- Include implementation details, code examples where relevant
- Address common integration pitfalls
- Cover authentication, rate limits, error handling
- Use precise technical language
- Minimum 12 Q&A pairs

Format as Markdown with ## headings for categories and \`\`\` code blocks where appropriate.`,
      variables: ["documentation", "audience"],
      tags: ["faq", "developers", "technical"],
    },
    {
      title: "Onboarding Guide — New Employee",
      category: "Onboarding",
      description: "Creates a structured onboarding guide for a specific role.",
      prompt: `You are an onboarding specialist. Create a comprehensive onboarding guide for a new {{role}} joining {{company}}.

SOURCE KNOWLEDGE BASE:
{{knowledge_base}}

The guide should include:
1. Welcome and first-day essentials
2. Key systems and tools they will use
3. Core processes and workflows (step-by-step)
4. Who to contact for what (key stakeholders)
5. Common questions and answers
6. Week 1, Week 2, and Month 1 milestones

Tone: warm, encouraging, and professional.`,
      variables: ["role", "company", "knowledge_base"],
      tags: ["onboarding", "hr", "new-hire"],
    },
    {
      title: "Content Audit Checklist",
      category: "Audit",
      description: "Audits existing documentation for quality, accuracy, and completeness.",
      prompt: `You are a content quality auditor. Evaluate the following documentation against these criteria and produce a structured audit report.

DOCUMENTATION TO AUDIT:
{{documentation}}

Evaluate:
1. **Accuracy** — Is the information correct and up to date?
2. **Completeness** — Are all necessary topics covered?
3. **Clarity** — Is the language clear and appropriate for the audience?
4. **Structure** — Is the content logically organized?
5. **Findability** — Can users easily locate what they need?

For each criterion, score 1-10 and explain your reasoning with specific examples. End with a prioritized improvement plan.`,
      variables: ["documentation"],
      tags: ["audit", "quality", "review"],
    },
    {
      title: "Taxonomy Design Proposal",
      category: "Architecture",
      description: "Designs a knowledge taxonomy for a specific domain.",
      prompt: `You are a knowledge architect. Design a comprehensive taxonomy for the following domain and use case.

DOMAIN: {{domain}}
PRIMARY USE CASE: {{use_case}}
EXISTING STRUCTURE (if any): {{existing_structure}}

Provide:
1. Top-level categories (5-10) with descriptions
2. Subcategories for each top-level category
3. Tagging conventions and naming rules
4. Metadata schema recommendations
5. Design rationale — why this structure supports the stated use case

Return as structured Markdown.`,
      variables: ["domain", "use_case", "existing_structure"],
      tags: ["taxonomy", "architecture", "ia"],
    },
    {
      title: "Semantic Search Query Optimizer",
      category: "Search",
      description: "Reformulates a vague query into a high-precision search query.",
      prompt: `You are a search relevance expert. A user has entered the following query into a semantic knowledge base search. Rewrite and expand it to improve retrieval quality.

ORIGINAL QUERY: {{query}}
KNOWLEDGE DOMAIN: {{domain}}

Provide:
1. An optimized primary query (clear, specific)
2. 3-5 alternative phrasings that might surface different relevant results
3. Key concepts the system should prioritize
4. Any ambiguities in the original query that should be clarified

Format as a JSON object:
{
  "primary": "...",
  "alternatives": ["...", "..."],
  "key_concepts": ["...", "..."],
  "ambiguities": ["..."]
}`,
      variables: ["query", "domain"],
      tags: ["search", "query", "retrieval"],
    },
    {
      title: "Process Documentation Writer",
      category: "Writing",
      description: "Converts rough notes into a clear, step-by-step process document.",
      prompt: `You are a technical process writer. Convert the following rough notes into a clear, professional process document.

RAW NOTES:
{{notes}}

PROCESS NAME: {{process_name}}
TARGET AUDIENCE: {{audience}}

Format the output as:
# {{process_name}}

## Overview
[Brief description of the process and its purpose]

## Prerequisites
[What the reader needs before starting]

## Steps
[Numbered steps, each with a clear action and expected outcome]

## Troubleshooting
[Common issues and how to resolve them]

## Related Resources
[Links or references — use placeholders if unknown]`,
      variables: ["notes", "process_name", "audience"],
      tags: ["writing", "process", "sop"],
    },
    {
      title: "Knowledge Base Health Check",
      category: "Audit",
      description: "Evaluates an entire knowledge base for structural health and coverage.",
      prompt: `You are a knowledge management consultant. Perform a health check on the following knowledge base structure and content sample.

KNOWLEDGE BASE OVERVIEW:
{{kb_overview}}

SAMPLE CONTENT:
{{sample_content}}

Assess:
1. **Coverage breadth** — What topics are well covered vs. sparse?
2. **Structural coherence** — Is the organization logical and consistent?
3. **Duplication** — Are there redundant articles or overlapping content?
4. **Currency** — Does the content appear up to date?
5. **Searchability** — Are articles titled and tagged effectively?

Produce a health score (A-F) for each dimension with detailed findings and a 90-day improvement roadmap.`,
      variables: ["kb_overview", "sample_content"],
      tags: ["audit", "health-check", "knowledge-base"],
    },
    {
      title: "Stakeholder Communication Template",
      category: "Writing",
      description: "Drafts a stakeholder update about a documentation project.",
      prompt: `You are a project communicator. Draft a professional stakeholder update for the following documentation project status.

PROJECT: {{project_name}}
CURRENT STATUS: {{status}}
KEY ACHIEVEMENTS THIS PERIOD: {{achievements}}
BLOCKERS OR RISKS: {{blockers}}
NEXT MILESTONES: {{next_milestones}}
AUDIENCE: {{audience}}

Write a concise update (300-400 words) that:
- Leads with the most important news
- Uses clear, non-technical language
- Addresses any risks with proposed mitigations
- Ends with clear next steps and dates
- Maintains a confident, professional tone`,
      variables: ["project_name", "status", "achievements", "blockers", "next_milestones", "audience"],
      tags: ["writing", "stakeholder", "communication"],
    },
  ];

  for (const p of prompts) {
    await pool.query(
      `INSERT INTO ka_prompt_templates (title, category, description, prompt, variables, tags, is_builtin)
       VALUES ($1, $2, $3, $4, $5, $6, true)`,
      [p.title, p.category, p.description, p.prompt, JSON.stringify(p.variables), JSON.stringify(p.tags)]
    );
  }

  console.log(`[ka-db] Seeded ${prompts.length} built-in prompt templates`);
}
