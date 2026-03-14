# Synaptica Knowledge Systems — Technical Specification

**Version:** 1.0  
**Date:** March 2026  
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
   - 6.2 [RAG Pipeline Tool](#62-rag-pipeline-tool)
   - 6.3 [AI Sales Assistant Chat Widget](#63-ai-sales-assistant-chat-widget)
7. [Admin Platform](#7-admin-platform)
   - 7.1 [KA Sprint Tool](#71-ka-sprint-tool)
   - 7.2 [Prompt Engineering Workshop](#72-prompt-engineering-workshop)
   - 7.3 [Pipeline CRM](#73-pipeline-crm)
   - 7.4 [Invoicing Manager](#74-invoicing-manager)
   - 7.5 [Analytics Dashboard](#75-analytics-dashboard)
   - 7.6 [Blog & Content Management](#76-blog--content-management)
   - 7.7 [Notification System](#77-notification-system)
   - 7.8 [Autonomous AI UX Testing Agent](#78-autonomous-ai-ux-testing-agent)
   - 7.9 [Project Management](#79-project-management)
8. [Security Considerations](#8-security-considerations)
9. [Deployment Model](#9-deployment-model)
10. [Email Notifications](#10-email-notifications)
11. [Extensibility and Integration Points](#11-extensibility-and-integration-points)
12. [Known Trade-Offs and Technical Debt](#12-known-trade-offs-and-technical-debt)

---

## 1. System Architecture Overview

Synaptica Knowledge Systems is a full-stack monorepo application combining a React single-page application with a Node.js/Express API server, backed by PostgreSQL. The system serves two distinct user populations:

- **Public visitors** interact with a marketing site, blog, free tool redirects, and a GPT-4o-powered sales chat widget.
- **The site owner (admin)** operates a credential-protected dashboard with CRM, invoicing, analytics, internal AI tools, and content management.

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  Browser (React 19 SPA)                                 │
│  Wouter routing · TanStack Query · Framer Motion        │
│  Radix UI primitives · Tailwind CSS v4                  │
└───────────┬─────────────────────────────────────────────┘
            │  HTTP (JSON) via /api/* proxy
            ▼
┌─────────────────────────────────────────────────────────┐
│  Express Server (Node.js, port 3001 dev / 5000 prod)    │
│  Routes: audit · admin · public · blog · chat ·         │
│          ka-sprint · rag · prompt-workshop · ux-agent    │
│  Middleware: JWT auth · CORS · cookie-parser · multer    │
└───────────┬──────────────┬──────────────────────────────┘
            │              │
            ▼              ▼
     ┌────────────┐  ┌──────────────┐
     │ PostgreSQL  │  │  OpenAI API  │
     │  (20 tables)│  │  GPT-4o      │
     │  via pg Pool│  │  text-emb-   │
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
| UI primitives | Radix UI | — | Accessible, unstyled component primitives (dialog, dropdown, tabs, popover, select, accordion, tooltip, etc.) |
| Charts | Recharts | 2.x | Bar charts and data visualizations in admin analytics |
| Markdown | react-markdown + remark-gfm | — | Blog article rendering with GFM support |
| PDF export | jsPDF | 4.x | Client-side branded PDF generation (invoices, gap reports) |
| Icons | Lucide React | — | Icon library |
| Forms | React Hook Form + Zod resolvers | — | Form validation |

### Backend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Node.js | — | Server runtime |
| Framework | Express | 5.x | HTTP routing and middleware |
| Database driver | pg (node-postgres) | 8.x | PostgreSQL connection pool |
| Authentication | jsonwebtoken | 9.x | JWT token signing and verification |
| File parsing | pdf-parse, mammoth | — | PDF and DOCX text extraction |
| HTML parsing | cheerio | 1.x | URL scraping and HTML content extraction |
| File uploads | multer | 2.x | Multipart form data handling (memory storage) |
| AI | openai (official SDK) | 6.x | GPT-4o completions and text-embedding-3-small |
| Cookies | cookie-parser | — | HTTP cookie parsing for auth flow |
| CORS | cors | — | Cross-origin request support |

### Infrastructure

| Concern | Solution |
|---|---|
| Hosting | Replit (containerized Linux environment) |
| Database | Replit-managed PostgreSQL |
| Process management | `concurrently` runs Vite + Express in development |
| Build | `vite build` produces optimized static assets in `dist/` |
| Production server | Express serves `dist/` static files + API on the same port |

---

## 3. Application Structure

The project follows a monorepo layout with clear separation between frontend and backend:

```
├── src/                          # Frontend (React)
│   ├── App.tsx                   # Root component with Wouter router
│   ├── main.tsx                  # React entry point
│   ├── index.css                 # Global styles + Tailwind theme
│   ├── pages/                    # Route-level page components
│   │   ├── Home.tsx              # Public landing page
│   │   ├── DocAudit.tsx          # DocAudit tool page
│   │   ├── Blog.tsx              # Blog listing
│   │   ├── BlogArticle.tsx       # Individual article view
│   │   ├── WorkWithMe.tsx        # Services/engagement page
│   │   ├── Results.tsx           # Results/case studies page
│   │   ├── LearningOS.tsx        # Learning OS product page
│   │   ├── Legal.tsx             # Legal/terms
│   │   ├── not-found.tsx         # 404 page
│   │   └── admin/                # Admin dashboard pages
│   │       ├── AdminLogin.tsx
│   │       ├── AdminDashboard.tsx
│   │       ├── KASprint.tsx
│   │       ├── RAGPipeline.tsx
│   │       ├── PromptWorkshop.tsx
│   │       ├── MonthlyRetainer.tsx
│   │       ├── ChatSessionsViewer.tsx
│   │       ├── UXTester.tsx
│   │       └── ProjectManager.tsx
│   ├── components/               # Reusable UI components
│   │   ├── Navbar.tsx            # Fixed top nav with scroll-spy
│   │   ├── Hero.tsx              # Hero section
│   │   ├── ChatWidget.tsx        # AI Sales Assistant chat bubble
│   │   ├── docaudit/             # DocAudit-specific components
│   │   │   ├── InputPanel.tsx    # Multi-source document ingestion
│   │   │   ├── TaxonomyConfig.tsx # Topic taxonomy selection
│   │   │   └── GapReport.tsx     # Results view with charts + PDF export
│   │   └── ui/                   # Radix-based UI primitives
│   ├── hooks/                    # Custom React hooks
│   └── lib/                      # Utilities (cn helper, etc.)
│
├── server/                       # Backend (Express)
│   ├── index.ts                  # Server entry point
│   ├── middleware/
│   │   └── auth.ts               # JWT auth middleware
│   ├── routes/
│   │   ├── audit.ts              # DocAudit API
│   │   ├── admin.ts              # Protected admin routes
│   │   ├── public.ts             # Public read-only routes
│   │   ├── blog.ts               # Blog CRUD
│   │   ├── chat.ts               # AI Sales Assistant
│   │   ├── ka-sprint.ts          # KA Sprint tool
│   │   ├── rag.ts                # RAG Pipeline tool
│   │   ├── prompt-workshop.ts    # Prompt Workshop tool
│   │   └── ux-agent.ts           # UX Testing Agent
│   ├── data/
│   │   ├── db.ts                 # PostgreSQL pool + schema init
│   │   ├── store.ts              # PostgreSQL-backed data store
│   │   ├── prompt-workshop-store.ts  # JSON-persisted prompt store
│   │   ├── sessions-store.ts     # JSON-persisted session store
│   │   ├── ux-test-store.ts      # UX test runs and findings data access
│   │   └── persist/              # JSON file storage directory
│   └── services/
│       ├── parser.ts             # PDF, DOCX, Markdown text extraction
│       ├── scraper.ts            # URL scraping with SSRF protection
│       ├── analyzer.ts           # OpenAI embeddings + GPT-4o analysis
│       ├── ux-agent.ts           # UX test suite orchestration service
│       └── ux-personas.ts        # Persona definitions and test scenarios
│
├── public/                       # Static assets
├── vite.config.ts                # Vite configuration
├── package.json                  # Dependencies and scripts
└── tsconfig.json                 # TypeScript configuration
```

### Routing Architecture

**Frontend routing** uses Wouter's `<Switch>` / `<Route>` components. All public routes are client-side rendered. Admin routes (`/admin/*`) are protected by a login gate that checks for a stored JWT token. External tool routes (`/synaptica-ka`, `/docforge`, `/difflens`, `/docscope`) redirect to separate Replit-hosted applications.

**Backend routing** is organized by domain with Express routers:

| Mount Point | Router | Auth | Purpose |
|---|---|---|---|
| `/api/audit/*` | `auditRouter` | None (tool-enable check) | DocAudit ingestion and analysis |
| `/api/admin/*` | `adminRouter` | JWT required | Admin CRUD operations |
| `/api/admin/ka-sprint/*` | `kaSprintRouter` | JWT required | KA Sprint sessions |
| `/api/admin/rag/*` | `ragRouter` | JWT required | RAG Pipeline ingestion and chat |
| `/api/admin/prompt-workshop/*` | `promptWorkshopRouter` | JWT required | Prompt template management |
| `/api/admin/ux-agent/*` | `uxAgentRouter` | JWT required | UX test suite runs and findings |
| `/api/admin/projects/*` | `adminRouter` | JWT required | Project and task management |
| `/api/blog/*` | `blogRouter` | Mixed | Public listing + admin CRUD |
| `/api/chat/*` | `chatRouter` | None (rate-limited) | AI Sales Assistant |
| `/api/public/*` | `publicRouter` | None | Public data reads, discovery forms |

---

## 4. Authentication and Authorization

### Auth Model

The application uses a single-admin authentication model. There is one admin user whose credentials are defined via environment variables (`ADMIN_USERNAME`, `ADMIN_PASSWORD`).

### JWT Implementation

- **Token signing:** `jsonwebtoken.sign()` with the `JWT_SECRET` environment variable. Tokens contain a `sub` claim (the admin username) and expire after 8 hours.
- **Token delivery:** The frontend sends the JWT via `Authorization: Bearer <token>` header on admin API requests.
- **Token verification:** The `requireAuth` middleware extracts the Bearer token from the `Authorization` header, verifies it with `jwt.verify()`, and attaches the admin username to the request object. Invalid or expired tokens return a `401` response.
- **Server startup gate:** The server exits immediately (`process.exit(1)`) if `JWT_SECRET` is not set, preventing operation without proper auth configuration.

### Cookie and CORS Configuration

`cookie-parser` middleware is mounted for cookie reading. CORS is configured with `credentials: true` and `origin: true`. In development, the Vite dev server proxies `/api` requests to the Express backend on a different port, so these settings ensure cross-origin API calls work during development. In production, Express serves both static files and API on a single port, making cross-origin less relevant. Note: the current auth implementation uses Bearer tokens in the `Authorization` header rather than httpOnly cookies for token transport. The cookie-parser middleware is available for future use or supplementary session data.

### Authorization Boundaries

- **Public routes:** No authentication required. DocAudit endpoints check whether the tool is admin-enabled before processing.
- **Admin routes:** All admin API requests require a valid JWT, with the exception of `POST /api/admin/login` (which authenticates credentials and issues a token) and `POST /api/admin/logout`. Unauthorized requests receive `401 Not authenticated` or `401 Invalid or expired session`.
- **Chat endpoint:** No authentication, but IP-based rate limiting (10 messages/minute) and an admin-controlled on/off toggle.

---

## 5. Database Schema

The application uses a single PostgreSQL database initialized on server startup via `initDb()` in `server/data/db.ts`. The original schema comprised 14 tables; subsequent feature additions (the AI Sales Assistant chat widget, UX Testing Agent, and Project Management) added `chat_sessions`, `chat_messages`, `ux_test_runs`, `ux_test_findings`, `projects`, and `project_tasks`, bringing the current total to 20 tables. The schema uses `CREATE TABLE IF NOT EXISTS` statements, making initialization idempotent. A `seedDefaults()` function populates initial data for packages, tools, blog articles, and admin settings on first run.

### Table Overview

| Table | Purpose | Key Columns |
|---|---|---|
| `service_packages` | Consulting service offerings | `id` (PK), name, tagline, price range, duration, type, features (JSONB), ideal client, highlighted flag, sort order |
| `client_tools` | Public-facing tool registry | `slug` (PK), name, enabled toggle, onboarding copy, sort order |
| `retainer_clients` | Monthly retainer client tracking | `id` (PK), name, start date, monthly rate, health checks / support sessions / priority requests (all JSONB) |
| `discovery_inquiries` | Inbound discovery call submissions | `id` (PK), name, company, challenge, timeline, created_at |
| `testimonials` | Client testimonials | `id` (PK), name, role, company, quote, photo URL |
| `case_studies` | Case study summaries | `id` (PK), title, industry, challenge, outcome |
| `outcome_stats` | Social proof statistics | `id` (PK), label, value |
| `blog_articles` | Blog posts | `id` (PK), title, slug (unique), excerpt, body (Markdown), category, featured image, publish date, published flag, reading time, timestamps |
| `invoices` | Client invoices | `id` (PK), client name, contact_id (FK to pipeline_contacts), description, amount, currency, dates, status (Draft/Sent/Paid/Overdue), timestamps |
| `notifications` | Admin notification feed | `id` (PK), type, title, description, link, read flag, created_at |
| `admin_settings` | Singleton config row | `id` (always 1), email notification toggle, admin email, Calendly URL, chat widget toggle, chat system prompt |
| `email_leads` | Email capture records | `id` (PK), email, first name, tool source, document type, captured_at |
| `tool_runs` | Tool usage tracking | `id` (PK), tool name/slug, timestamp, input type, email captured flag, document size category, gap categories (JSONB) |
| `pipeline_contacts` | CRM contacts | `id` (PK), name, email, company, source, service interest, stage (New Lead → Closed), estimated value, next action, notes, timestamps |
| `chat_sessions` | AI chat conversations | `id` (PK), visitor name/email, lead captured flag, pipeline contact ID, timestamps |
| `chat_messages` | Individual chat messages | `id` (PK), session_id (FK, cascading delete), role (user/assistant), content, created_at |
| `ux_test_runs` | UX test suite executions | `id` (PK), triggered_at, status (running/completed/failed), persona_ids (JSONB), total_scenarios, completed_scenarios, summary |
| `ux_test_findings` | Individual UX test findings | `id` (PK), run_id (FK to ux_test_runs), persona, area, scenario, severity (`good` / `needs_attention` / `issue`), summary, raw_input, raw_output, evaluated_at |
| `projects` | Client and internal projects | `id` (PK), name, description, status (active/on-hold/complete), start_date, due_date, archived flag, timestamps |
| `project_tasks` | Tasks within projects | `id` (PK), project_id (FK to projects, cascading delete), title, description, status (todo/in-progress/done), owner, priority (low/medium/high), due_date, timestamps |

### Data Storage Notes

- Primary data storage is PostgreSQL via `pg.Pool`.
- Two subsystems (Prompt Workshop templates and KA Sprint / Prompt Workshop sessions) still use JSON file persistence in `server/data/persist/`. This is a legacy pattern that predates the PostgreSQL migration; both stores are isolated behind their own modules (`prompt-workshop-store.ts`, `sessions-store.ts`).
- The `withTransaction` helper provides explicit `BEGIN` / `COMMIT` / `ROLLBACK` semantics for multi-statement operations.
- IDs are application-generated strings (typically UUIDs or slugs), not database-generated sequences.

---

## 6. AI Subsystems

All AI features use the OpenAI API via the official `openai` Node.js SDK (v6). Two models are used:

- **text-embedding-3-small** — For vector embeddings (1536 dimensions). Used in DocAudit gap analysis and the RAG Pipeline.
- **GPT-4o** — For natural language generation. Used in DocAudit recommendations, RAG chat answers, and the Sales Assistant.

The `OPENAI_API_KEY` environment variable is required for all AI features. The SDK is lazily instantiated per-request, and each service throws an explicit error if the key is missing.

### 6.1 DocAudit — Documentation Gap Analysis

DocAudit is the primary client-facing AI tool: a multi-format documentation ingestion and gap analysis pipeline that produces severity-ranked findings and branded PDF reports.

#### Ingestion Pipeline

Content enters the system through four input methods, each with its own API endpoint:

| Input | Endpoint | Parser | Limits |
|---|---|---|---|
| File upload (PDF, DOCX, MD, TXT) | `POST /api/audit/parse-files` | `pdf-parse`, `mammoth`, regex strip, raw UTF-8 | 20 files, 10 MB each |
| Pasted text | `POST /api/audit/parse-text` | Direct pass-through | — |
| URL scraping | `POST /api/audit/parse-url` | `cheerio` HTML extraction | 10 URLs, 5 MB response limit, 15s timeout |
| Notion API | `POST /api/audit/parse-notion` | Notion API block-level extraction | 20 pages |

All ingestion endpoints produce an array of text chunks using a sentence-boundary chunking algorithm (default 1000-character chunks, split at sentence endings). Maximum 500 chunks are forwarded to analysis.

#### Analysis Pipeline

The analysis endpoint (`POST /api/audit/analyze`) executes the following steps:

1. **Embed document chunks:** Batch-embed all content chunks using `text-embedding-3-small` (batches of 20, each chunk truncated to 800 characters).
2. **Embed topic queries:** Embed each user-selected topic as `"Documentation about: {topic}"` for semantic alignment.
3. **Compute coverage scores:** For each topic, find the maximum cosine similarity against all chunk embeddings. Normalize the raw similarity score from a `[0.15, 0.70]` range to `[0, 1]`.
4. **Assign severity levels:** Based on the normalized score — critical (<0.2), high (<0.4), medium (<0.6), low (≥0.6).
5. **Generate recommendations:** For all topics scoring below 0.7, send the gap list to GPT-4o with a JSON response format to get specific, actionable recommendations per topic.
6. **Return structured result:** Overall score (percentage), per-topic coverages with severity and recommendations, and a summary string.

**Topic taxonomies:** The frontend offers 4 preset taxonomies (not hardcoded on the backend — passed by the client) plus support for custom user-defined topics. Maximum 30 topics per analysis.

**Rate limiting:** One analysis per IP per 10 seconds, enforced via an in-memory map with LRU-style cleanup.

#### PDF Export

Gap reports are exportable as branded PDFs generated client-side via `jsPDF`. The PDF includes:

- Dark-themed header with Synaptica branding and logo
- Overall score and severity breakdown
- Section-by-section findings with per-topic scores and recommendations
- Priority recommendations
- Paginated footer

#### URL Scraping Security (SSRF Protection)

The URL scraper (`server/services/scraper.ts`) implements defense-in-depth against SSRF:

1. **Protocol whitelist:** Only `http:` and `https:` schemes are allowed.
2. **Hostname blocklist:** Blocks `localhost`, `127.0.0.1`, `0.0.0.0`, `169.254.169.254`, `[::1]`, and `metadata.google.internal`.
3. **Private IP detection:** Checks resolved IP addresses against RFC 1918 (10.x, 172.16-31.x, 192.168.x), loopback (127.x), link-local (169.254.x), and IPv6 equivalents (::1, fc/fd, fe80, ::ffff: mapped).
4. **DNS resolution validation:** After hostname-level checks, resolves via `dns.lookup()` and re-validates the resolved IP.
5. **Redirect following:** Manual redirect handling (up to 5 hops) with re-validation at each hop to prevent DNS rebinding via redirects.
6. **Response size cap:** 5 MB maximum response body.
7. **Timeout:** 15-second abort signal per request.

### 6.2 RAG Pipeline Tool

An admin-only tool (`/admin/rag-pipeline`) providing a self-contained Retrieval-Augmented Generation sandbox for testing document retrieval strategies.

#### Architecture

The RAG Pipeline uses an in-memory vector store (no external vector database). This is intentional — the tool is designed for prototyping and demonstrating RAG concepts within a session, not for production-scale retrieval.

#### Ingestion (`POST /api/admin/rag/ingest`)

1. Accept raw text input with configurable chunk size (100–5000 characters, default 500) and overlap (0 to chunk_size - 1, default 50).
2. Split text using a sliding-window character chunking strategy with overlap.
3. Embed all chunks via `text-embedding-3-small` in a single batch request.
4. Store chunks with their embeddings in an in-memory array (`chunkStore`), assigning sequential IDs.
5. Return the count of newly ingested chunks and total store size.

#### Retrieval and Chat (`POST /api/admin/rag/chat`)

1. Embed the user's question using `text-embedding-3-small`.
2. Compute cosine similarity between the query vector and every stored chunk embedding.
3. Select the top-K most similar chunks (default K=3, max 20).
4. Construct a GPT-4o prompt with the retrieved chunks as context, instructing the model to ground answers in the provided context and cite chunk IDs.
5. Return the model's answer along with source chunk metadata (chunk ID, similarity score, text preview).

#### Status (`GET /api/admin/rag/status`)

Returns the current chunk count in the in-memory store. Resets to zero on server restart.

### 6.3 AI Sales Assistant Chat Widget

A GPT-4o-powered conversational widget embedded on all public pages, acting as a knowledgeable sales assistant for Synaptica's services.

#### Frontend Component (`ChatWidget.tsx`)

- Floating emerald bubble on all public pages, hidden on `/admin/*` routes.
- Checks widget enabled status via `GET /api/chat/widget-status` on mount.
- Expandable chat panel with message history, typing indicator, and session persistence.

#### Backend (`POST /api/chat`)

1. **Rate limiting:** 10 messages per minute per IP, enforced via in-memory sliding window.
2. **Widget toggle check:** Respects the `chat_widget_enabled` admin setting; returns `503` when disabled.
3. **Session management:** Creates or resumes a chat session (stored in `chat_sessions` table). Each message is persisted to `chat_messages`.
4. **Conversation context:** Sends the last 20 messages as conversation history to GPT-4o (each truncated to 2000 characters). User input is capped at 2000 characters.
5. **System prompt:** Uses a detailed system prompt encoding Synaptica's full service catalog, pricing tiers, Learning OS product details, free tool availability, lead capture instructions, and conversational boundaries. The system prompt is editable by the admin via the Settings panel.
6. **Lead capture:** The system prompt instructs GPT-4o to emit a `<<<LEAD_CAPTURE:{"name":"...","email":"..."}>>>` marker when it detects buying intent and collects contact information. The backend parses this marker, strips it from the visible reply, creates a `pipeline_contacts` record with source `ai_chat`, updates the chat session with visitor details, and triggers an admin notification.
7. **Model settings:** GPT-4o, temperature 0.7, max 800 tokens per response.

#### Admin Controls

- **Chat Sessions Viewer:** Browse all conversations, see which resulted in lead capture, read full transcripts.
- **Settings:** Chat widget on/off toggle and system prompt editor in the admin Settings tab.

---

## 7. Admin Platform

The admin dashboard (`/admin`) provides a comprehensive back-office for the site owner. It is a single-page application within the React app, protected by JWT authentication.

### 7.1 KA Sprint Tool

An AI-powered knowledge architecture design tool at `/admin/ka-sprint`.

- Guides the user through taxonomy design, retrieval logic mapping, and document structure planning.
- Session persistence: save, list, reopen, continue, and delete sessions with client name and date metadata.
- Export completed sessions as structured Markdown documents formatted as "Knowledge Architecture Deliverable" handover documents.
- API: `GET/POST/PUT/DELETE /api/admin/ka-sprint/sessions/*` plus an export endpoint.
- Data storage: JSON files in `server/data/persist/`.

### 7.2 Prompt Engineering Workshop

A prompt template design, testing, and documentation tool at `/admin/prompt-workshop`.

- **Prompt library:** Full CRUD for prompt templates with search and category filtering.
- **Variable substitution:** `{{variable}}` placeholder syntax with auto-detection. The UI generates labeled input fields for each detected variable.
- **Live testing:** Runs assembled prompts (with variable substitution applied) against the OpenAI API directly from the UI.
- **Style guide:** Global style guide editor that can be auto-appended to prompts for consistent tone and formatting.
- **Session management:** Save/load sessions with client name, session name, version, and tags.
- **Export:** Generates structured Markdown "Prompt Library" deliverable documents. Supports clipboard copy.
- **API:** `GET/POST/PUT/DELETE /api/admin/prompt-workshop/prompts`, `POST /api/admin/prompt-workshop/test`, style guide CRUD, category listing, session CRUD + export.
- **Data storage:** JSON files in `server/data/persist/`.

### 7.3 Pipeline CRM

A lightweight sales pipeline manager embedded in the admin dashboard.

- **Lead stages:** Tracks contacts through a defined pipeline — New Lead → Contacted → Proposal Sent → Active Client → Closed (defined as `PipelineStage` union type in `store.ts`).
- **Contact sources:** `discovery_call`, `tool_email_capture`, `manual`, `ai_chat` (defined as `ContactSource` union type in `store.ts`).
- **Lead creation triggers:** Contacts are automatically created from discovery call form submissions and AI chat lead captures. Manual creation is also supported.
- **Contact fields:** Name, email, company, source, service interest, stage, estimated value, next action, notes, timestamps.
- **Filtering:** Filter by stage, source, service interest, and text search.
- **Pipeline value:** Aggregated estimated value across active contacts.
- **API:** Full CRUD at `/api/admin/pipeline/*`.

### 7.4 Invoicing Manager

A full invoice management system within the admin dashboard.

- **Invoice lifecycle:** Draft → Sent → Paid → Overdue.
- **Financial summary header:** Total invoiced, total collected, total outstanding, overdue count — calculated from invoice data.
- **CRM integration:** Invoices can be linked to pipeline contacts via `contact_id`.
- **Filtering:** By status, date range, and free-text search.
- **PDF export:** Client-side generation via jsPDF with Synaptica branding, clean formatting, and structured layout.
- **Fields:** Client name, description, amount, currency (default USD), invoice date, due date, status, timestamps.

### 7.5 Analytics Dashboard

A metrics and analytics tab in the admin dashboard, powered by Recharts visualizations.

- **Tool usage metrics:** Total runs across all tools, 30-day trend bar charts, per-tool breakdowns.
- **Email capture tracking:** Count and source of captured email leads.
- **DocAudit-specific analytics:** Input type breakdown (file upload, paste, URL, Notion), document size distribution, top gap categories.
- **Data source:** Queries the `tool_runs` and `email_leads` tables. Each DocAudit analysis and tool usage logs a record to `tool_runs` with metadata about the input type, document size, and gap categories (stored as JSONB).

### 7.6 Blog & Content Management

- **Public blog:** Listing page with article cards (title, date, reading time, category, excerpt) and category filtering. Individual article pages render full Markdown via `react-markdown` with `remark-gfm` for GitHub Flavored Markdown support.
- **SEO:** Per-article meta tags (title, description, Open Graph) via a custom Helmet component.
- **Admin management:** Create, edit, publish/unpublish, and delete articles. Markdown editor with slug auto-generation, category, featured image, and publish date fields.
- **Seeded content:** 3 pre-loaded articles (2 published, 1 draft) demonstrating the blog format.
- **API:** Public `GET /api/blog/public` and `GET /api/blog/public/:slug`; admin `GET/POST /api/blog` and `PUT/DELETE /api/blog/:id`.

### 7.7 Notification System

- **In-app notifications:** Bell icon in the admin header with unread count badge. Popover panel showing recent events in reverse chronological order.
- **Notification types:** `discovery_call`, `email_capture`, `new_subscriber`, `cancellation`, `retainer_checkin`.
- **Automatic triggers:** Discovery call form submissions, email captures, and AI chat lead captures generate notifications. Retainer check-in proximity alerts run every 6 hours and notify 3 days before a monthly check-in is due.
- **Read state management:** Individual mark-read and "Mark all read" operations.
- **Storage cap:** 200 notification entries maximum, persisted to the `notifications` table.

### 7.8 Autonomous AI UX Testing Agent

An admin-only tool at `/admin/ux-tester` that replaces manual test checklists with a fully autonomous AI agent. When triggered, the agent inhabits user personas, exercises the platform's tools and public-facing features, evaluates every response, and produces a structured findings report — all without human interaction.

#### Personas and Scenarios

The agent ships with 5 predefined personas, each defined as a structured TypeScript constant in `server/services/ux-personas.ts`. Each persona has a name, background, intent, and tone descriptor, along with 6–10 scenario definitions. Scenarios specify the area under test (Chat Assistant, Lab Tools, Navigation, Lead Capture), the action type (chat message, tool input, route check), sample inputs appropriate for that persona's background, and the criteria for a passing evaluation.

Example personas include a skeptical Technical Director evaluating AI vendors, a Content Strategist comparing tools, and a first-time visitor unfamiliar with knowledge architecture concepts.

#### Agent Orchestration Service (`server/services/ux-agent.ts`)

When a test run is triggered via `POST /api/admin/ux-agent/run`, the server-side `UXAgentService` executes the following flow:

1. **Create a run record** in the `ux_test_runs` table with status `running`.
2. **Iterate through all personas and their scenarios** sequentially. A run lock prevents concurrent test runs.
3. **For each scenario**, the agent calls the relevant internal endpoint as that persona's inputs:
   - **Chat scenarios:** Sends multi-turn messages to `POST /api/chat` from the persona's viewpoint (curious questions, buying intent, confusion, off-topic requests, edge cases like short or empty inputs).
   - **DocAudit scenarios:** Submits persona-appropriate document samples and topic lists to the DocAudit analysis endpoint and evaluates the returned analysis.
   - **KA Sprint scenarios:** Sends inputs to the KA Sprint taxonomy endpoint and evaluates output quality.
   - **Prompt Workshop scenarios:** Sends test prompts to the Prompt Workshop test endpoint and evaluates response quality.
   - **Route checks:** Verifies that all major public routes return correct HTTP responses with non-empty content.
   - **Email gate scenarios:** Tests email capture gate behavior and form validation.
4. **After each test**, a second GPT-4o call acts as an evaluator — judging the interaction from the persona's perspective for coherence, helpfulness, accuracy, and persona-appropriateness. The evaluation produces a severity tag: `good`, `needs_attention`, or `issue`.
5. **Write a finding record** to the `ux_test_findings` table with the persona, area, scenario name, severity, summary, raw input/output, and evaluation timestamp.
6. **Update run progress** (completed scenario count) after each scenario, enabling live progress reporting.
7. **On completion**, update the run status to `completed` with a summary. Errors and timeouts for individual scenarios are handled gracefully — the scenario is marked as failed without stopping the entire run.

#### API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/admin/ux-agent/personas` | GET | Returns available personas and their scenario definitions |
| `/api/admin/ux-agent/run` | POST | Starts a new test suite run (locked to prevent concurrent runs) |
| `/api/admin/ux-agent/runs` | GET | Lists all historical test runs |
| `/api/admin/ux-agent/runs/:id` | GET | Returns detailed findings for a specific run |
| `/api/admin/ux-agent/runs/:id/export` | GET | Generates a Markdown export of the findings report |

#### Database Tables

- **`ux_test_runs`:** Stores run metadata — ID, trigger timestamp, status (running/completed/failed), persona IDs (JSONB), total and completed scenario counts, and a summary string.
- **`ux_test_findings`:** Stores individual findings — ID, run ID (FK), persona name, area, scenario name, severity, plain-English summary, raw input, raw output, and evaluation timestamp.

Table initialization is handled by `initUXTestTables()` in `server/data/ux-test-store.ts`.

#### Frontend (`UXTester.tsx`)

The admin page provides:

- A persona overview grid showing each persona's name, background, and scenario count.
- A "Run Test Suite" button that triggers a run and polls for progress.
- A live feed of findings as they arrive, color-coded by severity (green for `good`, amber for `needs_attention`, red for `issue`).
- Area-based filtering (Chat Assistant, Lab Tools, Navigation, Lead Capture).
- A final summary section once the run completes.
- A run history list for revisiting past reports.
- A Markdown export button for the full findings report.

### 7.9 Project Management

A project and task management system embedded in the admin dashboard, accessible via a "Projects" tab alongside Pipeline and Invoicing. Designed for tracking client engagements and internal projects with progress visibility and deadline management.

#### Data Model

Two PostgreSQL tables, defined in `server/data/db.ts`:

- **`projects`:** `id` (PK), name, description, status (`active` / `on-hold` / `complete`), start_date, due_date, archived flag, created_at, updated_at.
- **`project_tasks`:** `id` (PK), project_id (FK to projects, cascading delete), title, description, status (`todo` / `in-progress` / `done`), owner, priority (`low` / `medium` / `high`), due_date, created_at, updated_at.

Data access functions follow the existing pattern in `server/data/store.ts`: `getProjects()`, `getProject()`, `createProject()`, `updateProject()`, `deleteProject()`, `getProjectTasks()`, `createProjectTask()`, `updateProjectTask()`, `deleteProjectTask()`.

#### API Endpoints

All endpoints are nested under `/api/admin/projects` and protected by `requireAuth` middleware, defined in `server/routes/admin.ts`:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/admin/projects` | GET | List all projects with computed progress (completed tasks / total tasks) |
| `/api/admin/projects/:id` | GET | Get a single project with full details |
| `/api/admin/projects` | POST | Create a new project |
| `/api/admin/projects/:id` | PUT | Update a project (including archiving) |
| `/api/admin/projects/:id` | DELETE | Delete a project and all its tasks (cascade) |
| `/api/admin/projects/:id/tasks` | GET | List all tasks for a project |
| `/api/admin/projects/:id/tasks` | POST | Create a task within a project |
| `/api/admin/projects/:projectId/tasks/:taskId` | PUT | Update a task |
| `/api/admin/projects/:projectId/tasks/:taskId` | DELETE | Delete a task |

#### Frontend (`ProjectManager.tsx`)

The projects UI provides:

- **Projects list view:** Displays each project's name, status, deadline, and a progress bar computed from task completion ratio. Overdue projects are visually flagged.
- **Project creation and editing:** Form with name, description, status, start date, and due date fields.
- **Project detail view:** Shows project metadata and a full task list grouped by status (To Do, In Progress, Done). Includes an overall completion progress bar.
- **Task management:** Inline creation, editing, and deletion of tasks. Each task has a title, description, owner, priority, due date, and status.
- **Overdue flagging:** Tasks and projects past their due date are visually highlighted.
- **Archiving:** Projects can be archived to remove them from the active view without deletion.

---

## 8. Security Considerations

### Authentication

- Single-admin credential model via environment variables. No user registration or multi-tenancy.
- JWT tokens expire after 8 hours. No refresh token mechanism — the admin re-authenticates after expiry.
- The server will not start without `JWT_SECRET` configured, preventing accidental unprotected operation.

### Input Validation and Limits

- File uploads are limited to 10 MB via multer's memory storage (no disk writes for uploaded files).
- JSON request bodies are limited to 10 MB (`express.json({ limit: "10mb" })`).
- URL scraping has SSRF protections including protocol whitelisting, hostname blocklisting, private IP detection (IPv4 and IPv6), DNS resolution validation, redirect re-validation, response size caps, and request timeouts (see Section 6.1 for details).
- Chat messages are truncated to 2000 characters. Conversation history is limited to the last 20 messages.
- DocAudit analysis is rate-limited to one request per IP per 10 seconds. Chat is rate-limited to 10 messages per IP per minute.
- Topic count is capped at 30 per DocAudit analysis; URL count at 10; Notion pages at 20; chunks at 500.

### Environment Variables

All sensitive configuration is managed via environment variables, never hardcoded:

| Variable | Purpose | Required |
|---|---|---|
| `JWT_SECRET` | JWT token signing key | Yes (server exits without it) |
| `ADMIN_USERNAME` | Admin login username | Yes |
| `ADMIN_PASSWORD` | Admin login password | Yes |
| `OPENAI_API_KEY` | OpenAI API access | Yes (for AI features) |
| `DATABASE_URL` | PostgreSQL connection string | Yes |

### Data Isolation

- Admin routes are uniformly gated behind `requireAuth` middleware.
- Public routes are read-only (packages, tools, blog articles) or create-only (discovery inquiries, email captures).
- The DocAudit tool respects its admin-controlled enabled/disabled state — requests to a disabled tool return `503`.

### CORS

CORS is configured permissively (`origin: true`, `credentials: true`) to support the development proxy setup. In production, the single-origin deployment (Express serves both static files and API) mitigates cross-origin risks.

---

## 9. Deployment Model

### Development

```bash
npm run dev
# Runs concurrently:
#   vite --host 0.0.0.0      (port 5000, frontend + HMR)
#   npx tsx server/index.ts   (port 3001, API server)
```

Vite proxies `/api` requests to `localhost:3001`. HMR WebSocket uses `clientPort: 443` for compatibility with Replit's HTTPS proxy. File watching excludes `.cache/`, `.local/`, and `node_modules/`.

### Production

```bash
npm run build   # vite build → dist/ + copy index.html to 404.html
npm start       # NODE_ENV=production npx tsx server/index.ts
```

In production, Express serves the Vite-built static assets from `dist/` and handles API routes on the same port. The `/{*splat}` catch-all route serves `index.html` for client-side routing support.

### Build Optimization

Vite is configured with manual chunk splitting to optimize bundle size:

- `vendor-react`: React and ReactDOM
- `vendor-motion`: Framer Motion
- `vendor-radix`: Core Radix UI primitives (dialog, dropdown, tooltip, popover, select, tabs, accordion)

### Replit-Specific Configuration

- `server.host: "0.0.0.0"` — Binds to all interfaces for Replit's container networking.
- `server.allowedHosts: true` — Accepts requests from Replit's proxy domain.
- `server.hmr.clientPort: 443` — Routes HMR WebSocket through Replit's HTTPS proxy.
- The `@replit/vite-plugin-runtime-error-modal` plugin provides runtime error overlay in development.
- Path aliases: `@` maps to `src/` for clean imports.

---

## 10. Email Notifications

The platform includes configuration infrastructure for email notifications, though the actual email sending provider is not yet integrated:

- **Toggle:** `email_notifications_enabled` in `admin_settings` table, configurable from the Settings tab.
- **Admin email:** Stored in `admin_settings.admin_email`, configurable from Settings.
- **Current state:** The configuration surface (toggle + admin email address) is implemented and persisted in the database. The in-app notification system is fully operational. Wiring to an external email sending provider (e.g., Resend, SendGrid, or SES) would require adding an API integration in the notification creation flow to dispatch emails when `email_notifications_enabled` is true.
- **Intended scope:** High-priority events (discovery calls, new subscribers) would trigger email notifications to the configured admin email once a provider is connected.

---

## 11. Extensibility and Integration Points

### API Surface for External Integration

The Express API is organized into clearly separated routers, making it straightforward to add new routes or consume existing ones from external systems:

- **Public data endpoints** (`/api/public/*`) return service packages and tool listings as JSON. These can be consumed by external marketing sites, landing pages, or partner integrations.
- **Blog API** (`/api/blog/public`, `/api/blog/public/:slug`) provides a headless CMS-style interface. External frontends could render Synaptica blog content by consuming these endpoints.
- **Pipeline CRM** (`/api/admin/pipeline/*`) exposes full CRUD for contact management. An external webhook handler could push leads from third-party forms, CRMs, or marketing automation platforms into the Synaptica pipeline.
- **Chat API** (`POST /api/chat`) could be embedded in external sites by pointing a custom chat widget at this endpoint (respecting rate limits and CORS configuration).

### Extending the AI Pipeline

- **New document parsers:** The ingestion pipeline's modular parser design (`parser.ts`) makes it straightforward to add new file format support. Add a new parse function, register the file extension in the audit route's switch statement, and the existing chunking and analysis pipeline handles the rest.
- **Custom embeddings:** The `getEmbeddings` function in `analyzer.ts` is a clear abstraction point. Swapping to a different embedding model or a self-hosted model requires changing the model name and potentially adjusting the normalization range.
- **Additional AI tools:** New admin tools can follow the pattern established by KA Sprint, RAG Pipeline, and Prompt Workshop: create a new Express router, gate it behind `requireAuth`, add a frontend page, and register the route in `App.tsx` and `server/index.ts`.

### Database Extension

- The `initDb()` function uses `CREATE TABLE IF NOT EXISTS`, so new tables can be added to the initialization block without affecting existing data.
- The `withTransaction` helper supports multi-table operations with rollback safety.
- Application-generated string IDs (rather than auto-increment) simplify potential future data migration or multi-instance scenarios.

### Webhook and Event Hooks

The notification system provides natural hook points for external integrations. Currently, notifications are stored in PostgreSQL and surfaced via the admin UI. The `admin_settings` table includes `email_notifications_enabled` and `admin_email` fields, providing the configuration surface for an email notification channel (not yet wired to a sending provider). Additional notification channels (email via Resend/SendGrid, Slack webhook, Microsoft Teams, custom webhooks) could be added by extending the notification creation flow in `store.ts`.

### External Tool Redirects

The platform already demonstrates an integration pattern for external tools via redirect routes (`/difflens`, `/docscope`, `/docforge`, `/synaptica-ka`). Each redirects to a separately deployed Replit application. This pattern can be extended for additional tools or partner services.

---

## 12. Known Trade-Offs and Technical Debt

### Intentional Design Decisions

1. **In-memory RAG store:** The RAG Pipeline uses an in-memory vector store that resets on server restart. This is a deliberate choice for a prototyping and demonstration tool — not a production retrieval system. It avoids the operational complexity of a dedicated vector database for what is an internal admin utility.

2. **Single-admin model:** The JWT auth system supports only one admin user, defined by environment variables. This is appropriate for a solo consultancy. Multi-user support would require a users table, password hashing, role-based access control, and invitation flow.

3. **JSON file persistence for sessions:** KA Sprint and Prompt Workshop sessions use JSON file storage rather than PostgreSQL. This predates the database migration and works reliably for low-volume admin usage. Moving these to PostgreSQL would provide consistency and enable querying.

4. **Permissive CORS:** CORS is configured as `origin: true` to support the development proxy. In production, same-origin serving neutralizes this, but a stricter CORS policy would be appropriate if the API were exposed to third-party consumers.

### Operational Notes

- **pg v9 SSL warning:** On startup, the `pg` library prints a cosmetic SSL deprecation warning. The database connects and initializes correctly. No action required until upgrading to pg v9.
- **Analytics double query:** The analytics overview endpoint fetches tool runs twice (once inside `getMetrics()` and once directly for date filtering). At current data volumes this is imperceptible. At scale, refactor to pass runs into `getMetrics()`.
- **Rate limit state:** Both DocAudit and chat rate limiters use in-memory maps. These reset on server restart and do not share state across instances. Acceptable for single-instance deployment; would need Redis or similar for horizontal scaling.
- **Notification cap:** Notifications are capped at 200 entries. There is no archival or pagination strategy beyond this cap.

---

*This document describes the Synaptica Knowledge Systems platform as of March 2026. It is intended for technical evaluation and due diligence by engineering teams considering integration with, extension of, or investment in the platform.*
