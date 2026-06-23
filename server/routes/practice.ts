import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getPrompts,
  createPrompt,
  saveStyleGuide,
} from "../data/prompt-workshop-store.js";

export const practiceRouter = Router();

const PRACTICE_STYLE_GUIDE = `# Synaptica Voice & Style Guide

**Tone:** Expert but accessible. Authoritative without being academic. The reader is smart — never condescending, never jargon-heavy without translation.

**Formatting rules:**
- Lead with the most important finding, not background context
- Use bullet points for lists of three or more items
- Avoid passive voice ("the system identified" → "the audit found")
- Define technical acronyms on first use — e.g. RAG (Retrieval-Augmented Generation), KA (Knowledge Architecture)

**Prohibited phrases:**
- "leverage" → use "use" instead
- "synergize" / "synergies"
- "circle back"
- "move the needle"
- "low-hanging fruit"
- "game changer"

**Closing convention:** Always end client-facing recommendations with a concrete, time-bound next action. Example: "Schedule a 30-minute taxonomy review call by [date]."

**Numbers:** Write out one through nine; use numerals for 10 and above.`;

const PRACTICE_TEMPLATES = [
  {
    title: "Gap Analysis Executive Summary",
    category: "Consulting Deliverables",
    description:
      "Turns raw audit scores into a polished executive summary for the client report. Use after running DocAudit — feed in the overall score and top gaps.",
    body: `You are a senior knowledge management consultant at Synaptica Knowledge Systems. Write a concise executive summary (3–4 short paragraphs) for a documentation gap analysis report.

Client: {{client_name}}
Industry: {{industry}}
Topics audited: {{num_topics}}
Overall coverage score: {{coverage_score}}%
Critical gaps identified: {{critical_gaps}}
High-priority gaps: {{high_gaps}}

The summary should:
1. Open with a direct statement of the overall finding
2. Highlight the two or three most significant gaps and their business impact
3. Note any areas of strength
4. Close with a single recommended next action

Tone: {{tone}} (options: direct, diplomatic, encouraging)`,
    tags: ["docaudit", "executive-summary", "gap-analysis", "consulting"],
    useStyleGuide: true,
  },
  {
    title: "KA Sprint Recommendation Memo",
    category: "Consulting Deliverables",
    description:
      "Converts a KA Sprint output into a structured internal recommendation memo. Use after completing a sprint — give it the client context and timeline.",
    body: `You are writing a recommendation memo on behalf of Synaptica Knowledge Systems for the client {{client_name}}.

Context:
- Current knowledge structure: {{current_structure}}
- Primary use case: {{use_case}}
- Target system: {{target_system}}

Write a structured memo with:
1. Situation (2 sentences: what exists today and why it is a problem)
2. Recommendation (3–5 bullet points, each with a one-sentence rationale)
3. Implementation roadmap ({{timeline}}-week plan in three phases with concrete milestones)
4. Risks & mitigations (2–3 items)
5. Recommended next step (one action, who owns it, by when)

Keep total length under 400 words. Be specific — avoid generic advice.`,
    tags: ["ka-sprint", "memo", "recommendation", "consulting"],
    useStyleGuide: true,
  },
  {
    title: "Stakeholder Briefing Email",
    category: "Client Communications",
    description:
      "Drafts a concise briefing email for a non-technical stakeholder after an audit or sprint. No jargon — written for decision-makers.",
    body: `Draft a briefing email from Synaptica to {{recipient_name}}, {{recipient_role}} at {{company_name}}.

Subject of the email: Results from the {{engagement_type}} engagement

Key findings to communicate:
- Overall assessment: {{overall_assessment}}
- Top strength: {{top_strength}}
- Priority gap: {{priority_gap}}
- Recommended next step: {{next_step}}

Requirements:
- Maximum {{word_count}} words
- No jargon (define any technical terms used)
- Professional but warm tone
- Clear subject line included in your response
- End with a specific proposed meeting time or action`,
    tags: ["email", "stakeholder", "communications", "briefing"],
    useStyleGuide: false,
  },
  {
    title: "RAG Chunk Quality Evaluator",
    category: "Technical Prompts",
    description:
      "Evaluates a document chunk for RAG pipeline suitability. Use during content audits to find chunks that need reworking before ingestion.",
    body: `You are a knowledge engineering expert specialising in RAG (Retrieval-Augmented Generation) pipelines.

Evaluate the following document chunk for RAG pipeline quality:

---
{{chunk_text}}
---

Score it on three dimensions (1–10 each):
1. **Self-containedness**: Does this chunk make sense without surrounding context? (10 = fully standalone)
2. **Information density**: Signal-to-noise ratio — is every sentence earning its place? (10 = highly dense)
3. **Retrieval likelihood**: Would a realistic user query surface this chunk? (10 = highly likely for relevant questions)

Then provide:
- **Overall verdict**: Pass / Needs editing / Rewrite
- **One concrete improvement**: A specific change that would improve the lowest-scoring dimension`,
    tags: ["rag", "chunk-quality", "technical", "evaluation"],
    useStyleGuide: false,
  },
];

practiceRouter.post(
  "/api/admin/practice/seed-prompts",
  requireAuth,
  async (_req, res) => {
    try {
      const existing = getPrompts();
      const existingTitles = new Set(existing.map((p) => p.title));
      const added: string[] = [];

      for (const tpl of PRACTICE_TEMPLATES) {
        if (existingTitles.has(tpl.title)) continue;
        createPrompt(tpl);
        added.push(tpl.title);
      }

      saveStyleGuide(PRACTICE_STYLE_GUIDE);

      res.json({
        ok: true,
        added,
        skipped: PRACTICE_TEMPLATES.length - added.length,
        message:
          added.length > 0
            ? `Added ${added.length} template(s) and updated the style guide.`
            : "All templates already exist. Style guide updated.",
      });
    } catch (err) {
      console.error("practice seed-prompts error:", err);
      res.status(500).json({ error: "Failed to seed templates" });
    }
  }
);
