# Synaptica Knowledge Systems — Technical Specification

**Version:** 2.0  
**Date:** April 2026  
**Audience:** CTOs, Engineering Leads, Development Teams

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Application Structure](#3-application-structure)
4. [Authentication and Authorization](#4-authentication-and-authorization)
5. [Database Schema](#5-database-schema)
6. [AI Subsystems](#6-ai-subsystems)
   - 6.1 [DocAudit — Documentation Gap Analysis](#61-docaudit--documentation-gap-analysis)
   - 6.2 [Knowledge Architecture Suite](#62-knowledge-architecture-suite)
   - 6.3 [RAG Pipeline Tool](#63-rag-pipeline-tool)
   - 6.4 [AI Sales Assistant Chat Widget](#64-ai-sales-assistant-chat-widget)
7. [Admin Platform](#7-admin-platform)
   - 7.1 [KA Sprint Tool](#71-ka-sprint-tool)
   - 7.2 [Prompt Engineering Workshop](#72-prompt-engineering-workshop)
   - 7.3 [DocScope Intel Engine](#73-docscope-intel-engine)
   - 7.4 [DocForge](#74-docforge)
   - 7.5 [SEOScope](#75-seoscope)
   - 7.6 [DiffLens](#76-difflens)
   - 7.7 [Pipeline CRM](#77-pipeline-crm)
   - 7.8 [Invoicing Manager](#78-invoicing-manager)
   - 7.9 [Analytics Dashboard](#79-analytics-dashboard)
   - 7.10 [Blog & Content Management](#710-blog--content-management)
   - 7.11 [Notification System](#711-notification-system)
   - 7.12 [Autonomous AI UX Testing Agent](#712-autonomous-ai-ux-testing-agent)
   - 7.13 [Project Management](#713-project-management)
8. [Security Hardening](#8-security-hardening)
9. [Deployment Model](#9-deployment-model)
10. [Email Notifications](#10-email-notifications)
11. [Extensibility and Integration Points](#11-extensibility-and-integration-points)
12. [Known Trade-Offs and Technical Debt](#12-known-trade-offs-and-technical-debt)

---

## 1. System Architecture Overview

Synaptica Knowledge Systems is a full-stack monorepo application combining a React single-page application with a Node.js/Express API server, backed by PostgreSQL (with pgvector for semantic search). The system serves two distinct user populations:

- **Public visitors** interact with a marketing site, blog, free tool redirects, and a GPT-4o-powered sales chat widget.
- **The site owner (admin)** operates a credential-protected dashboard with CRM, invoicing, analytics, internal AI tools, content management, and a full documentation engineering suite.

All tools in the admin panel are operated exclusively by Miruna Cristiana Paun on behalf of clients. Clients provide documentation access; they do not interact with the tools directly.

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  Browser (React 19 SPA)                                 │
│  Wouter routing · TanStack Query · Framer Motion        │
│  Radix UI primitives · Tailwind CSS v4                  │
└───────────┬─────────────────────────────────────────────┘
            │  HTTP (JSON + SSE) via /api/* proxy
            ▼
┌─────────────────────────────────────────────────────────┐
│  Express Server (Node.js, port 3001 dev / 5000 prod)    │
│  Middleware: Helmet · CORS · JWT auth · Rate limiters   │
│             Zod validation · cookie-parser · multer     │
│  Routes: audit · admin · public · blog · chat ·         │
│          ka-sprint · rag · prompt-workshop · ux-agent   │
│          ka (Knowledge Architecture) · docscope ·       │
│          docforge · seoscope · webhooks                 │
└───────────┬──────────────┬──────────────────────────────┘
            │              │
            ▼              ▼
     ┌────────────┐  ┌──────────────┐
     │ PostgreSQL  │  │  OpenAI API  │
     │  + pgvector │  │  GPT-4o      │
     │  (24 tables)│  │  text-emb-   │
     │             │  │  3-small     │
     └────────────┘  └──────────────┘
```

In development, Vite serves the frontend on port 5000 and proxies `/api` requests to the Express server on port 3001. In production, Express serves both the built static assets from `dist/` and the API on a single port (defaulting to 5000, configurable via `PORT` env var).

---

## 2. Technology Stack

### Frontend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| UI framework | React | 19.x | Component rendering and state |
| Language | TypeScript | — | Type safety across the stack |
| Bundler | Vite | 7.x | Dev server, HMR, production builds |
| Styling | Tailwind CSS | v4 | Utility-first CSS via `@tailwindcss/vite` plugin |
| Routing | Wouter | — | Lightweight client-side routing (~1.5 KB) |
| Data fetching | TanStack Query | 5.x | Server state management, caching, refetching |
| Animations | Framer Motion | 12.x | Page transitions and micro-interactions |
| UI primitives | Radix UI | — | Accessible, unstyled component primitives |
| Charts | Recharts | 2.x | Bar charts and data visualizations in admin analytics |
| Markdown | react-markdown + remark-gfm | — | Blog article rendering with GFM support |
| PDF export | jsPDF | 4.x | Client-side branded PDF generation |
| Icons | Lucide React | — | Icon library |
| Diff | diff | — | Client-side word-level document comparison (DiffLens) |

### Backend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Node.js | — | Server runtime |
| Framework | Express | 5.x | HTTP routing and middleware |
| Database driver | pg (node-postgres) | 8.x | PostgreSQL connection pool |
| Vector extension | pgvector | 0.8.0 | Semantic similarity search via cosine distance |
| Authentication | jsonwebtoken | 9.x | JWT token signing and verification |
| Security headers | helmet | — | HTTP security headers, CSP, referrer policy |
| Rate limiting | express-rate-limit | — | Per-endpoint request throttling |
| Input validation | zod | 3.x | Schema-based request body validation |
| File parsing | mammoth | — | DOCX text extraction |
| HTML parsing | cheerio | 1.x | URL scraping and HTML content extraction |
| File uploads | multer | 2.x | Multipart form data handling (memory storage) |
| AI | openai (official SDK) | 6.x | GPT-4o completions and text-embedding-3-small |
| Email | resend | — | Transactional email delivery |
| Payments | Paddle | — | Webhook-based subscription event handling |
| Cookies | cookie-parser | — | HTTP cookie parsing |
| CORS | cors | — | Cross-origin request support |

### Infrastructure

| Concern | Solution |
|---|---|
| Hosting | Replit (containerized Linux environment) |
| Database | Replit-managed PostgreSQL with pgvector extension |
| Version control | Git with GitHub remote (Miru-Maria/synaptica-hub) |
| Process management | `concurrently` runs Vite + Express in development |
| Build | `vite build` produces optimized static assets in `dist/` |
| Production server | Express serves `dist/` static files + API on the same port |

---

## 3. Application Structure

```
├── src/                          # Frontend (React)
│   ├── App.tsx                   # Root with Wouter router + all routes
│   ├── pages/
│   │   ├── Home.tsx              # Public landing page
│   │   ├── DocAudit.tsx          # DocAudit tool
│   │   ├── Blog.tsx / BlogArticle.tsx
│   │   ├── WorkWithMe.tsx        # Services/engagement page
│   │   ├── LearningOS.tsx        # Learning OS product page
│   │   ├── Legal.tsx             # GDPR-compliant legal / data processing
│   │   └── admin/
│   │       ├── AdminLogin.tsx
│   │       ├── AdminDashboard.tsx
│   │       ├── KnowledgeArch.tsx # 5-tool documentation engineering suite
│   │       ├── KASprint.tsx
│   │       ├── RAGPipeline.tsx
│   │       ├── PromptWorkshop.tsx
│   │       ├── DocScope.tsx
│   │       ├── DocForge.tsx
│   │       ├── SEOScope.tsx
│   │       ├── DiffLensAdmin.tsx
│   │       ├── MonthlyRetainer.tsx
│   │       ├── UXTester.tsx
│   │       ├── ToolTester.tsx
│   │       └── ProjectManager.tsx
│
├── server/
│   ├── index.ts                  # Server entry — Helmet, CORS, rate limiters, route mounts
│   ├── middleware/
│   │   ├── auth.ts               # JWT auth (requireAuth, signToken, verifyToken)
│   │   ├── security.ts           # Rate limiter instances (public, chat, AI, audit, login, embedding)
│   │   └── validate.ts           # Zod schemas + validateBody middleware factory
│   ├── routes/
│   │   ├── audit.ts              # DocAudit API
│   │   ├── admin.ts              # Protected admin routes (login with rate limit + zod)
│   │   ├── knowledge-arch.ts     # Knowledge Architecture suite API (all 5 tools)
│   │   ├── docscope.ts           # DocScope Intel Engine (GPT-4o SSE)
│   │   ├── docforge.ts           # DocForge document formatter (GPT-4o SSE)
│   │   ├── seoscope.ts           # SEOScope SEO analyzer (GPT-4o SSE)
│   │   ├── ka-sprint.ts          # KA Sprint taxonomy tool
│   │   ├── rag.ts                # In-memory RAG sandbox
│   │   ├── prompt-workshop.ts    # Prompt Workshop
│   │   ├── blog.ts               # Blog CRUD + auto-draft scheduler
│   │   ├── chat.ts               # AI Sales Assistant (rate-limited)
│   │   ├── ux-agent.ts           # UX Testing Agent
│   │   ├── tool-tester.ts        # Tool testing utilities
│   │   ├── webhooks.ts           # Paddle webhook (HMAC-SHA256 verified)
│   │   └── public.ts             # Public read-only data
│   ├── data/
│   │   ├── db.ts                 # PostgreSQL pool + main schema init
│   │   ├── ka-db.ts              # KA schema init (pgvector + 4 KA tables) + prompt seeding
│   │   ├── ka-store.ts           # KA data access layer
│   │   ├── store.ts              # Main data access layer
│   │   ├── sessions-store.ts     # JSON-persisted KA/PW session store
│   │   ├── ux-test-store.ts      # UX test runs schema + DAL
│   │   └── tool-test-store.ts    # Tool test runs schema + DAL
│   └── services/
│       ├── blog-generator.ts     # Monthly draft scheduler + OpenAI generation
│       ├── parser.ts             # PDF, DOCX, Markdown extraction
│       ├── scraper.ts            # URL scraping with SSRF protection
│       ├── analyzer.ts           # OpenAI embeddings + GPT-4o gap analysis
│       ├── ux-agent.ts           # UX test suite orchestration
│       └── email.ts              # Resend-based email delivery
│
├── docs/
│   ├── synaptica-technical-spec.md   # This document
│   └── synaptica-white-paper.md      # Client-facing positioning paper
│
└── demo/meridian-hr/             # Demo documentation files (4 files with deliberate gaps)
```

### Routing Architecture

**Frontend routing** — all admin routes (`/admin/*`) are client-side auth-gated via JWT token check before render.

**Backend routing** — organized by domain with Express routers:

| Mount Point | Router | Auth | Rate Limit | Purpose |
|---|---|---|---|---|
| `/api/audit/*` | `auditRouter` | None | 10/10min | DocAudit ingestion and analysis |
| `/api/admin/login` | `adminRouter` | None | 10 attempts/15min | Admin authentication |
| `/api/admin/*` | `adminRouter` | JWT required | public (120/min) | Admin CRUD operations |
| `/api/admin/ka/*` | `kaRouter` | JWT required | varies by endpoint | Knowledge Architecture suite |
| `/api/admin/ka/search` | `kaRouter` | JWT required | 8/min | Embedding search |
| `/api/admin/ka/kb/:id/ingest` | `kaRouter` | JWT required | 8/min | Document ingestion + embedding |
| `/api/admin/ka/gaps` | `kaRouter` | JWT required | 15/min | AI gap analysis (SSE) |
| `/api/admin/ka/faq` | `kaRouter` | JWT required | 15/min | AI FAQ generation (SSE) |
| `/api/admin/ka/onboarding/:id/chat` | `kaRouter` | JWT required | 15/min | RAG chat (SSE) |
| `/api/admin/docscope/*` | `docscopeRouter` | JWT required | 15/min | Content analysis (SSE) |
| `/api/admin/docforge/*` | `docforgeRouter` | JWT required | 15/min | Document generation (SSE) |
| `/api/admin/seoscope/*` | `seoscopeRouter` | JWT required | 15/min | SEO analysis (SSE) |
| `/api/admin/ka-sprint/*` | `kaSprintRouter` | JWT required | public | KA Sprint taxonomy |
| `/api/admin/rag/*` | `ragRouter` | JWT required | public | In-memory RAG sandbox |
| `/api/blog/*` | `blogRouter` | Mixed | public | Public listing + admin CRUD |
| `/api/chat/*` | `chatRouter` | None | 12/min | AI Sales Assistant |
| `/api/webhooks/*` | `webhookRouter` | HMAC-SHA256 | skipped | Paddle webhooks |
| `/api/public/*` | `publicRouter` | None | public | Public data reads |

---

## 4. Authentication and Authorization

### Auth Model

Single-admin authentication model. One admin user whose credentials are defined via environment variables (`ADMIN_USERNAME`, `ADMIN_PASSWORD`).

### JWT Implementation

- **Token signing:** `jsonwebtoken.sign()` with the `JWT_SECRET` environment variable. Tokens contain a `sub` claim and expire after 8 hours.
- **Token delivery:** Frontend sends JWT via `Authorization: Bearer <token>` header.
- **Token verification:** `requireAuth` middleware verifies and attaches admin username to the request. Invalid/expired tokens return `401`.
- **Server startup gate:** Server exits immediately if `JWT_SECRET` is not set.

### Brute-Force Protection

The login endpoint (`POST /api/admin/login`) is protected by a dedicated rate limiter: 10 failed attempts per 15-minute window per IP, with `skipSuccessfulRequests: true`. Successful logins do not count against the limit.

### Webhook Authentication

Paddle webhook events are verified using HMAC-SHA256 signature verification against the `PADDLE_WEBHOOK_SECRET` environment variable before any processing occurs. Invalid signatures return `400`.

---

## 5. Database Schema

The application uses a single PostgreSQL database with the `vector` extension (pgvector 0.8.0) for semantic search. The schema is initialized on server startup via `initDb()`, `initUXTestTables()`, `initToolTestTables()`, and `initKATables()`. All initialization is idempotent (`CREATE TABLE IF NOT EXISTS`).

### Core Tables (initialized by `initDb`)

| Table | Purpose |
|---|---|
| `service_packages` | Consulting service offerings |
| `client_tools` | Public-facing tool registry |
| `retainer_clients` | Monthly retainer client tracking |
| `discovery_inquiries` | Inbound discovery call submissions |
| `testimonials` | Client testimonials |
| `case_studies` | Case study summaries |
| `outcome_stats` | Social proof statistics |
| `blog_articles` | Blog posts (Markdown body, published flag) |
| `invoices` | Client invoices |
| `notifications` | Admin notification feed |
| `admin_settings` | Singleton config (email, Calendly URL, chat toggle) |
| `email_leads` | Email capture records |
| `tool_runs` | Tool usage tracking |
| `pipeline_contacts` | CRM contacts with pipeline stage |
| `chat_sessions` | AI chat conversations |
| `chat_messages` | Individual chat messages (FK → chat_sessions, cascade delete) |
| `projects` | Client and internal projects |
| `project_tasks` | Tasks within projects (FK → projects, cascade delete) |

### UX Test Tables (initialized by `initUXTestTables`)

| Table | Purpose |
|---|---|
| `ux_test_runs` | UX test suite executions (status, persona IDs, summary) |
| `ux_test_findings` | Individual test findings (severity: good/needs_attention/issue) |

### Knowledge Architecture Tables (initialized by `initKATables`)

| Table | Purpose | Notes |
|---|---|---|
| `ka_knowledge_bases` | Named KB containers | id UUID, name, description, chunk_count |
| `ka_chunks` | Text chunks with vector embeddings | `embedding vector(1536)` column; HNSW/IVFFlat compatible |
| `ka_onboarding_sessions` | Persisted conversation history | messages stored as JSONB array |
| `ka_prompt_templates` | Reusable prompt library | 10 built-in prompts seeded on first init |

**pgvector usage:** Cosine similarity search is performed using the `<=>` distance operator. Queries use `ORDER BY embedding <=> $query_vector LIMIT K` with the index on `ka_chunks(kb_id)`.

---

## 6. AI Subsystems

All AI features use OpenAI via the official `openai` Node.js SDK. Two models are used:

- **text-embedding-3-small** — 1536-dimension embeddings. Used in DocAudit and the Knowledge Architecture semantic search.
- **GPT-4o** — Used in DocAudit recommendations, all KA tools, DocScope, DocForge, SEOScope, RAG chat, and the Sales Assistant.

The `OPENAI_API_KEY` environment variable is required for all AI features. The SDK is instantiated per-request with an explicit error if the key is missing.

All AI response endpoints use **Server-Sent Events (SSE)** for real-time streaming, with a consistent protocol:
- `data: {"text": "..."}` — content chunk
- `data: {"error": "..."}` — error message
- `data: [DONE]` — stream complete

### 6.1 DocAudit — Documentation Gap Analysis

Client-facing multi-format documentation ingestion and gap analysis pipeline. Produces severity-ranked findings and branded PDF reports.

**Ingestion:** Four input methods — file upload (PDF/DOCX/MD/TXT), pasted text, URL scraping, Notion API. Outputs sentence-boundary chunks (default 1000 chars), max 500 chunks.

**Analysis:** Embeds chunks + topic queries → cosine similarity → severity levels (critical/high/medium/low) → GPT-4o recommendations → structured result with overall score.

**URL Scraping Security (SSRF):** Protocol whitelist, hostname blocklist, private IP detection (RFC 1918), DNS resolution re-validation, redirect re-validation (up to 5 hops), 5 MB response cap, 15s timeout.

**Rate limiting:** 10 requests per 10-minute window.

### 6.2 Knowledge Architecture Suite

Admin-only documentation engineering platform at `/admin/knowledge-arch`. Five tools sharing a common knowledge base layer:

#### Knowledge Base Management
Documents are ingested via file upload (DOCX/TXT/MD) or paste. Text is chunked using sentence-boundary algorithm (≈400 tokens per chunk), each chunk embedded with `text-embedding-3-small` and stored in `ka_chunks` with a `vector(1536)` column. Re-ingesting a knowledge base replaces all existing chunks.

#### Tool 1 — Semantic Search
User submits a query → embedded via `text-embedding-3-small` → pgvector cosine similarity search → top-K results returned with similarity scores. Configurable top-K (1–10). Color-coded confidence badges (>80% emerald, >60% yellow, else neutral).

#### Tool 2 — Gap Analyzer
Retrieves all chunks from the selected KB → concatenates (up to 60 chunks) → sends to GPT-4o with the user's support tickets/questions → SSE-streamed structured gap report (executive summary, critical/medium/low gaps, content to retire, writing queue).

#### Tool 3 — FAQ Builder
Retrieves all chunks → GPT-4o prompt with target audience → SSE-streamed Markdown FAQ (minimum 15 Q&A pairs, grouped under headings, calibrated to audience vocabulary).

#### Tool 4 — Onboarding Assistant
RAG-powered chat agent with full conversation persistence in `ka_onboarding_sessions`. Each user message triggers:
1. `text-embedding-3-small` embedding of the message
2. pgvector search for top-4 relevant chunks
3. GPT-4o completion with the retrieved context + last 12 conversation messages
4. Response streamed via SSE, both user and assistant messages persisted to DB immediately

#### Tool 5 — Prompt Toolkit
Reusable prompt library (10 built-in templates + user-created) with category filtering and live sandbox. Variables in prompts use `{{variable_name}}` syntax. Sandbox sends the filled prompt directly to GPT-4o and streams the response. Built-in prompts cannot be deleted.

### 6.3 RAG Pipeline Tool

Admin-only in-memory RAG sandbox for prototyping retrieval strategies. No persistence — resets on server restart. Uses sliding-window character chunking with configurable overlap.

### 6.4 AI Sales Assistant Chat Widget

GPT-4o-powered chat widget on all public pages. Rate-limited to 12 messages/minute. Admin can toggle on/off and configure the system prompt via admin settings. Conversations persisted to `chat_sessions` + `chat_messages`.

---

## 7. Admin Platform

All admin pages live under `/admin/*` and require a valid JWT stored in `localStorage`. The admin dashboard provides navigation cards to all tools.

### 7.1 KA Sprint Tool
Taxonomy design assistant. Generates structured taxonomies, tagging conventions, and design rationale for knowledge architecture projects. Sessions persisted as JSON.

### 7.2 Prompt Engineering Workshop
Prompt template library with category management, variable filling, and live sandbox. Persisted as JSON files.

### 7.3 DocScope Intel Engine
Content intelligence tool. Analyzes pasted content (emails, Slack threads, docs, meeting notes) using GPT-4o to surface gaps, inconsistencies, structure problems, or performs a comprehensive full analysis. Four modes. SSE streaming. Rate-limited to 15 req/min. Validated with Zod.

### 7.4 DocForge
Document formatter. Accepts file uploads (DOCX/TXT/MD) or pasted content. Transforms raw material into structured professional documents — report, brief, guide, audit, or proposal format. Supports custom branding/tone notes. Download as `.md`. SSE streaming. Rate-limited to 15 req/min.

### 7.5 SEOScope
SEO analysis tool. Analyzes page content against optional target keywords. Four analysis modes: full audit, keyword analysis, content quality, technical elements. GPT-4o SSE streaming. Rate-limited to 15 req/min. Validated with Zod.

### 7.6 DiffLens
Client-side word-level document comparison using the `diff` npm library. No server call — runs entirely in the browser. Supports paste or file upload (TXT/MD/DOCX/JSON/CSV). Displays color-coded additions (emerald) and deletions (red strikethrough) with word-count statistics.

### 7.7 Pipeline CRM
Contact management with pipeline stages (New Lead → Discovery → Proposal → Negotiation → Closed Won/Lost). Full CRUD. Estimated deal value tracking. Notes and next-action fields.

### 7.8 Invoicing Manager
Invoice creation and tracking with status workflow (Draft → Sent → Paid → Overdue). Client-side PDF generation via jsPDF with Synaptica branding.

### 7.9 Analytics Dashboard
Aggregated metrics: tool run counts, lead capture rates, document type breakdown, pipeline summary, retainer health.

### 7.10 Blog & Content Management
Full blog CRUD with Markdown editor, category management, and publish/unpublish toggle. Monthly auto-draft scheduler: checks every 24 hours, generates a new AI-drafted post if 30 days have elapsed since last draft, notifies via email.

### 7.11 Notification System
Admin notification feed with read/unread states. Notifications generated for new discovery inquiries, chat leads captured, retainer check-in reminders.

### 7.12 Autonomous AI UX Testing Agent
Simulates multiple user personas navigating the application and evaluating UX quality. Runs scenarios in parallel, produces structured findings with severity ratings (good/needs_attention/issue).

### 7.13 Project Management
Full project and task management with status, priority, owner, and due date fields. Nested tasks under projects.

---

## 8. Security Hardening

### HTTP Security Headers (Helmet)

All responses include security headers via `helmet`:
- `Content-Security-Policy` — restricts script, style, font, image, connect, frame, and object sources
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security` (production)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Powered-By` removed

### Rate Limiting (express-rate-limit)

| Limiter | Window | Max Requests | Applied To |
|---|---|---|---|
| `publicLimiter` | 1 min | 120 | All routes (global baseline) |
| `loginLimiter` | 15 min | 10 (skip successful) | `POST /api/admin/login` only |
| `chatLimiter` | 1 min | 12 | `/api/chat/*` |
| `auditLimiter` | 10 min | 10 | `/api/audit/*` |
| `aiToolLimiter` | 1 min | 15 | DocScope, DocForge, SEOScope, KA gaps/faq/onboarding/prompts |
| `embeddingLimiter` | 1 min | 8 | KA search + ingest (embedding API calls) |

All limiters use `standardHeaders: true` (RateLimit-* headers) and return `429` with a JSON error message.

### Input Validation (Zod)

Request bodies for sensitive endpoints are validated with Zod schemas before reaching handler logic. Schema enforcement covers: type checking, string length limits, enum values, UUID format, and cross-field refinements (e.g. SEOScope requires either content or URL).

Validated endpoints: admin login, all KA POST routes (kb create, search, gaps, faq, onboarding create, onboarding chat, prompt create), DocScope analyze, SEOScope analyze.

### CORS Configuration

In production, CORS is restricted to `*.replit.app` and `*.replit.dev` patterns plus an optional `ALLOWED_ORIGIN` environment variable. In development, `origin: true` is used for convenience.

### SSRF Protection

The DocAudit URL scraper implements defense-in-depth: protocol whitelist, hostname blocklist, RFC 1918 private IP detection, DNS resolution validation, redirect re-validation (up to 5 hops), 5 MB response cap, 15s timeout.

### File Upload Security

- Multer is configured with `memoryStorage()` — no files are written to disk
- File size limited to 10 MB (DocAudit) / 20 MB (KA ingest)
- Allowed MIME types and extensions are checked before processing
- DOCX parsing via mammoth isolates untrusted content extraction

### Webhook Security

Paddle webhooks are verified using HMAC-SHA256 signature verification before any event processing. The raw request body is preserved for verification using `express.raw()` middleware. Invalid signatures return `400` immediately.

### Secrets Management

All credentials are stored as Replit-managed environment variable secrets. The server performs explicit checks for required secrets on startup (`JWT_SECRET`) and per-request (`OPENAI_API_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`). Missing required credentials result in an error rather than silent fallback.

---

## 9. Deployment Model

The application is deployed on Replit. In production (`NODE_ENV=production`), Express serves both the built static assets from `dist/` and all API routes on a single port (default 5000, configurable via `PORT`). The `trust proxy: 1` setting is enabled in production to ensure rate limiters correctly identify client IPs behind Replit's proxy layer.

Static assets are served with `Cache-Control: max-age=86400` and ETag support.

---

## 10. Email Notifications

Email delivery uses the Resend API (`RESEND_API_KEY` environment variable). Notifications are sent for:
- Monthly blog draft generation (sent to admin email configured in admin settings)

The `sendBlogDraftNotification` function in `server/services/email.ts` handles email composition and delivery.

---

## 11. Extensibility and Integration Points

- **New AI tools:** Follow the pattern in `server/routes/docscope.ts` (Zod validation + `requireAuth` + SSE streaming). Mount in `server/index.ts` with appropriate rate limiter.
- **New knowledge bases:** The KA store is fully abstracted — `ka-store.ts` provides typed functions for all KB/chunk/session/prompt operations.
- **Payments:** Paddle webhooks are handled at `/api/webhooks/paddle`. Additional event types can be added to the switch statement in `server/routes/webhooks.ts`.
- **New admin pages:** Add route to `App.tsx`, create page component in `src/pages/admin/`, add dashboard card in `AdminDashboard.tsx`.

---

## 12. Known Trade-Offs and Technical Debt

| Item | Description | Mitigation Plan |
|---|---|---|
| JSON file persistence | KA Sprint sessions and Prompt Workshop templates use JSON files in `server/data/persist/` rather than PostgreSQL | Migrate to PostgreSQL tables when volume justifies |
| In-memory RAG store | The RAG Pipeline tool's vector store resets on server restart | Acceptable — tool is a prototyping sandbox, not production retrieval |
| Single-admin model | Only one admin user; no role system | Sufficient for current solo-operator use case |
| No CSRF tokens | Auth uses Bearer tokens in headers, not cookies — CSRF attacks require cookie-based auth, so this is not exploitable with the current architecture | Monitor if auth model changes |
| CSP `unsafe-inline` / `unsafe-eval` | Required by Vite in development; tighten in production via nonce-based CSP if needed | Accept current risk; tighten if moving to strict production CSP |
