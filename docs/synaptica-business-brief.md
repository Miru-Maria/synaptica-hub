# Synaptica Knowledge Systems — Business & Technical Brief

**For use as:** ChatGPT context document · Upwork profile reference · Proposal writing guide

---

## 1. Who I Am

**Miruna Cristiana Paun** — Knowledge Architecture Consultant and AI Documentation Strategist operating as a solo practitioner under **Synaptica Knowledge Systems** (registered PFA).

I work at the intersection of how organisations store, structure, and retrieve knowledge — and how AI systems can be built on top of that knowledge to produce reliable, auditable, and useful outputs. My background spans documentation engineering, information architecture, and applied AI (specifically RAG pipelines, embedding systems, and LLM-integrated tooling).

I am **not** a generalist AI consultant. I specialise in one domain — making organisational knowledge machine-readable and AI-ready — and I build production-grade tooling to deliver that.

---

## 2. Core Positioning

> "I turn your organisation's scattered documentation into structured, AI-ready knowledge systems — so your team can find what they need instantly, your AI tools actually work, and your knowledge doesn't walk out the door."

**The problem I solve:** Most organisations have valuable knowledge trapped in PDFs, Notion pages, Slack threads, SharePoint folders, and the heads of long-tenure employees. That knowledge is invisible to AI systems, inconsistently maintained, and impossible to audit. When organisations try to build AI assistants on top of this chaos, the AI hallucinates, cites the wrong source, or fails to answer obvious questions.

**My approach:** Before building any AI on top of your documentation, I fix the documentation. I design the taxonomy, the metadata schema, the retrieval logic, and the governance model — then build the AI layer on top of a foundation that actually works.

---

## 3. Services

### 3.1 Documentation Audit
**Format:** Fixed-price · 1 week
**Price:** $1,500 – $2,000
**Client trigger:** *"We don't know what our knowledge base is missing."*

I analyse an existing knowledge base against a defined topic taxonomy and produce a structured gap report. Deliverables include:

- Gap analysis across existing documentation
- Semantic search audit of coverage holes
- Prioritised gap report with action recommendations

**Best for:** Teams preparing for an AI initiative or post-merger knowledge consolidation. Also available as a self-service tool at [synapticaknowledge.com/docaudit](https://synapticaknowledge.com/docaudit).

---

### 3.2 Knowledge Architecture Sprint
**Format:** Fixed-price · 1–2 weeks
**Price:** $2,500 – $4,000
**Client trigger:** *"Our AI can't find anything useful in our docs."*

A structured, AI-assisted sprint to design and document a complete knowledge architecture. Deliverables include:

- Taxonomy and knowledge structure design
- Retrieval logic mapping and metadata schema
- Content hierarchy design
- Structured knowledge architecture document — client-ready, formatted for handover

**Best for:** SaaS companies preparing for a RAG build, or teams rebuilding a knowledge base from scratch.

---

### 3.3 Prompt Engineering Workshop
**Format:** Fixed-price · 1–2 weeks
**Price:** $2,000 – $3,000
**Client trigger:** *"Our team wastes hours writing the same kinds of content."*

Design of structured prompt libraries for teams using AI in their daily workflows:

- Prompt library design, testing, and documentation
- Variable-template system for consistent team output (`{{variable}}` syntax)
- Style-guide enforcement prompts
- Full team handover with usage documentation

**Best for:** Marketing, support, and content teams with repetitive writing workflows.

---

### 3.4 RAG Pipeline Design & Build
**Format:** Project-based · 4–8 weeks
**Price:** Custom — quoted on scope
**Client trigger:** *"We need a chatbot trained on our internal documentation."*

Full design and build of a Retrieval-Augmented Generation pipeline. I handle everything from document ingestion through to the chat interface:

- End-to-end retrieval-augmented generation pipeline
- Document ingestion and chunking strategy (PDF, DOCX, Notion, SharePoint, web scraping)
- Embedding and vector store setup (pgvector, Pinecone, Weaviate, or Chroma)
- Conversational interface grounded in your documentation with source citation
- GPT-4o generation layer with hallucination guardrails
- Admin interface for document management, re-ingestion, and monitoring

**What I deliver:** A working system, a technical handover document, and training for the team who will maintain it.

**Best for:** Companies with existing documentation that is ready for AI-powered retrieval.

---

### 3.5 Monthly Knowledge Retainer
**Format:** Ongoing · monthly
**Price:** $800 – $1,200 / month · minimum 3-month commitment
**Client trigger:** *"We need ongoing knowledge architecture support as we scale."*

For clients who need continuous knowledge architecture support after the initial build:

- Dedicated async support and review cycles
- Monthly knowledge health check and recommendations
- Priority access for new requests and scope expansions
- Continuity across documentation, prompts, and architecture

---

## 4. Tools & Products

These are production tools I have built — both to serve clients directly and to demonstrate technical capability:

| Tool | What it does | Access |
|------|-------------|--------|
| **DocAudit** | Documentation gap analysis — content vs. taxonomy coverage scoring | Public (synapticaknowledge.com/docaudit) |
| **DocScope** | Paste any content, get structured AI analysis of gaps, inconsistencies, and structure problems | Admin / client demo |
| **DocForge** | AI-assisted document generation with PDF, DOCX, and Markdown export; full formatting control | Admin / client demo |
| **DiffLens** | Side-by-side document comparison with AI analysis of semantic changes | Admin / client demo |
| **SEOScope** | Content analysis for search optimisation — keyword gaps, structure, readability | Admin / client demo |
| **KA Sprint Tool** | Guided AI-powered knowledge architecture sprint with full deliverable export | Admin |
| **RAG Pipeline Demo** | Live RAG system — ingest documents, configure chunking/embedding, chat with retrieval | Admin / client demo |
| **Prompt Workshop** | Prompt library management, live testing, style guide, and handover documentation | Admin |

---

## 5. Technical Stack & Capabilities

### Languages & Frameworks
- **TypeScript** (frontend and backend) — full-stack
- **React 19 + Vite 7** — frontend
- **Express.js** — API server
- **Tailwind CSS v4 + Framer Motion** — UI

### AI & ML
- **OpenAI API** — GPT-4o (generation), `text-embedding-3-small` / `text-embedding-3-large` (embeddings)
- **RAG pipeline design and implementation** — chunking strategies, vector search, reranking, hybrid retrieval
- **Prompt engineering** — system prompt design, context injection, citation prompting, hallucination guardrails

### Data & Infrastructure
- **PostgreSQL + pgvector** — relational + vector storage
- **Multer** — file upload handling (PDF, DOCX, TXT, Markdown)
- **pdf-parse + mammoth** — document text extraction
- **Resend / Gmail SMTP** — transactional email

### Document Formats
- PDF parsing and text extraction
- DOCX (Word) reading and generation (via `mammoth` + `docx`)
- Markdown rendering with full GFM support
- Notion API integration

### Security
- JWT authentication with 8h expiry and server-enforced secret
- Route-level rate limiting (login: 10/15min; embeddings: 8/min; AI generation: 15/min; public: 120/min)
- Helmet CSP, CORS locked to production domains
- SSRF protection on URL scraping
- Paddle webhook signature verification

---

## 6. Ideal Client Profile

**By sector:**
- SaaS companies (especially those building AI features on top of their own documentation)
- Professional services (consulting, legal, financial) with large internal knowledge libraries
- Technical writing and documentation teams
- HR and L&D teams building onboarding systems
- Compliance-heavy industries where answers must cite sources

**By situation:**
- "We tried building an AI chatbot on our docs and it keeps hallucinating"
- "Our knowledge base has grown for years and no one knows what's in it anymore"
- "We're about to implement a new AI tool and need our documentation to be AI-ready first"
- "We need a RAG system but don't have the internal expertise to build it"
- "We have a documentation problem but we've been calling it an AI problem"

**By size:** Works best with companies of 10–500 employees. Large enough to have a real documentation problem; small enough that one focused engagement moves the needle significantly.

---

## 7. Upwork Profile — Framing Guide

### Title options (pick one)
- `Knowledge Architecture Consultant | RAG Pipeline Design | AI-Ready Documentation Systems`
- `AI Documentation Strategist | RAG Systems | Knowledge Architecture | GPT-4o Integrations`
- `Technical Knowledge Architect | RAG Pipelines | OpenAI | pgvector | TypeScript`

### Overview / bio (adapt to word limit)

> I help organisations structure their knowledge so AI systems can actually use it.
>
> Most AI chatbot and RAG projects fail not because of the AI — but because the underlying documentation is inconsistent, incomplete, or unstructured. I fix that first, then build the AI layer on top.
>
> My work sits at the intersection of information architecture, technical writing strategy, and applied AI engineering. I design taxonomies, metadata schemas, and retrieval logic — then implement full RAG pipelines using OpenAI embeddings, pgvector, and GPT-4o with source citation and hallucination guardrails.
>
> **What I deliver:**
> - Knowledge architecture documents (taxonomy, metadata schema, retrieval design, governance model)
> - Documentation gap analysis with coverage scoring and prioritised recommendations
> - Full RAG pipeline implementation (ingestion → chunking → embedding → retrieval → generation)
> - Prompt libraries with templates, style guides, and handover documentation
>
> I've built production tooling across all of these areas — including a live RAG demo, a documentation gap analyser, and an AI-assisted knowledge architecture sprint tool.
>
> If your team is trying to make AI work on top of your internal knowledge — or if your documentation has outgrown its structure — I'd be glad to take a look.

### Skills tags to include on Upwork
`Knowledge Management` · `Information Architecture` · `Technical Writing` · `Prompt Engineering` · `OpenAI API` · `RAG Systems` · `LangChain` · `PostgreSQL` · `TypeScript` · `React` · `API Development` · `Documentation` · `AI Chatbot Development` · `Natural Language Processing` · `Vector Databases`

### Proposal structure for RAG / AI documentation projects

1. **Acknowledge the real problem** — most clients posting RAG projects don't realise the documentation quality is the bottleneck. Naming this earns immediate credibility.
2. **Reference your tooling** — you have a live RAG demo you can show in a discovery call. This is a significant differentiator.
3. **Scope clearly** — RAG projects have a natural three-phase shape: (1) knowledge audit, (2) architecture design, (3) implementation. Propose all three even if they initially only want the third.
4. **Offer a discovery call** — your DocAudit tool can produce a gap analysis of their content before the first invoice. Use this as the entry point.

---

## 8. Context Block for ChatGPT

*Paste this at the top of any ChatGPT session where you want it to understand your business:*

---

```
You are helping Miruna Cristiana Paun, a knowledge architecture consultant
operating as Synaptica Knowledge Systems.

WHAT SHE DOES:
She designs and builds knowledge architecture systems and RAG (Retrieval-Augmented
Generation) pipelines for organisations that need AI to work reliably on top of
their internal documentation. Her work combines information architecture (taxonomy
design, metadata schemas, content governance) with applied AI engineering (OpenAI
embeddings, pgvector, GPT-4o, chunking strategy, retrieval design).

HER SERVICES:
1. Knowledge Architecture Sprint — structured 2-3 week engagement to design a
   complete knowledge architecture (taxonomy, metadata, retrieval logic, gap
   analysis, governance). Produces a formatted deliverable document.
2. RAG Pipeline Design & Build — full implementation from document ingestion
   through to a production chat interface. Handles PDF/DOCX/Notion ingestion,
   chunking, embedding, vector storage, retrieval, and GPT-4o generation with
   source citation.
3. Documentation Gap Analysis — analyses a client's existing content against a
   topic taxonomy and scores coverage. Available as a self-service tool or as
   part of an engagement.
4. Monthly Retainer — ongoing knowledge architecture support after initial build.
5. Prompt Engineering Workshop — prompt library design, testing, style guide,
   and team handover documentation.

HER TOOLS (built and live):
- DocAudit: public gap analysis tool at synapticaknowledge.com/docaudit
- RAG Pipeline Demo: live system for client demos (persistent pgvector storage,
  file upload, chunk browser, similarity-scored retrieval)
- DocScope, DocForge, DiffLens, SEOScope, KA Sprint Tool, Prompt Workshop

TECH STACK: TypeScript, React, Express, OpenAI API (GPT-4o + embeddings),
PostgreSQL + pgvector, Tailwind CSS, Framer Motion.

IDEAL CLIENTS: SaaS companies building AI features on their docs, professional
services firms with large knowledge libraries, teams where "the AI keeps
hallucinating" is actually a documentation quality problem.

TONE: Professional, direct, knowledgeable. Not salesy. She explains things
clearly and charges for real expertise. She is based in Romania (EU timezone).
```

---

*End of document.*
