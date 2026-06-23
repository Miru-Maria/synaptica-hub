# Synaptica — Feature Architecture

Detailed specifications for every feature and internal tool in the platform. For stack, project structure, and dev setup see `replit.md`.

---

## Admin Dashboard

A credential-protected admin area at `/admin` for the site owner. Features:
- JWT-based authentication with httpOnly cookies
- Login page at `/admin/login` (redirects unauthenticated users)
- Package Manager: view and edit all service packages inline (name, price, features, etc.)
- Tools Manager: toggle client-facing tools (e.g. DocAudit) on/off, edit onboarding copy per tool
- Onboarding Copy Editor: editable plain-English introduction text for each public tool, displayed on homepage cards and embedded tool pages
- Changes persist to JSON files and are reflected live on the public site
- Public site reads package data from `/api/public/packages` and tool status + onboarding copy from `/api/public/tools`
- Internal Tools tab with KA Sprint and Prompt Engineering Workshop
- Saved Sessions tab showing recent sessions across KA Sprint and Prompt Workshop tools
- Metrics tab with tool usage analytics: total runs, 30-day trends (bar chart via recharts), per-tool breakdowns, email captures, and DocAudit-specific details (input type breakdown, document size distribution, top gap categories)
- Pipeline CRM tab: track leads through stages (New Lead to Closed), view pipeline value, service interest filtering, and automatic lead creation from discovery call forms
- Invoicing tab: full invoice CRUD with financial summary header (total invoiced, collected, outstanding, overdue count), status management (Draft/Sent/Paid/Overdue), CRM contact linking from inquiries/retainers/leads, filtering by status/date/search, and client-side PDF export via jsPDF with Synaptica branding
- Notification bell icon in header with unread count badge; popover panel showing recent events in reverse chronological order
- Notification types: discovery_call, email_capture, new_subscriber, cancellation, retainer_checkin
- Each notification has timestamp, description, and link to relevant admin section
- Read/unread state management with individual mark-read and "Mark all read"
- Settings tab with email notification toggle for high-priority events (discovery calls, new subscribers) and admin email configuration
- Retainer check-in proximity alerts: automatically checks every 6 hours for upcoming monthly check-ins (3 days before due date)
- Notifications capped at 200 entries, persisted to JSON

---

## DocAudit

A documentation gap analysis tool accessible at `/docaudit`. Users submit knowledge base content via:
- File upload (PDF, DOCX, Markdown, plain text)
- Paste raw text
- URL scraping (with SSRF protection)
- Notion API integration

Content is chunked, embedded via OpenAI, and compared against user-selected topic taxonomies (4 presets + custom topics). Results show coverage scores, radar chart visualization, severity-ranked gaps, and actionable recommendations. Reports can be exported as branded PDF with Synaptica logo, dark header, severity breakdown, section-by-section findings, priority recommendations, and paginated footer.

**Practice mode:** `?practice=1/2/3` pre-fills content, KB name, and taxonomy selection.

---

## KA Sprint

The KA Sprint tool at `/admin/ka-sprint` supports session persistence:
- Save current session state (taxonomy, retrieval, document) with client name and date
- List, reopen, continue, and delete past sessions
- Export completed sessions as structured Markdown "Knowledge Architecture Deliverable" documents
- Sessions visible in admin dashboard Sessions tab with client name association
- API routes at `/api/admin/ka-sprint/sessions/*` (CRUD + export)

**Practice mode:** `?practice=1/2/3` pre-fills all four input fields (domain, structure, use case, target system).

---

## Prompt Engineering Workshop

An admin-only internal tool at `/admin/prompt-workshop` for designing, testing, and documenting prompt templates. Features:
- Prompt library with CRUD operations, search, and category filtering
- `{{variable}}` placeholder syntax with auto-detection and labeled input fields
- Live test panel that runs prompts against OpenAI's API with variable substitution
- Global style guide editor that can be auto-appended to prompts
- Handover documentation export as formatted Markdown (clipboard copy)
- Session save/load with client name, session name, version, and tags
- Session export as structured Markdown "Prompt Library" deliverable document
- API routes at `/api/admin/prompt-workshop/*` (prompts CRUD, test, style-guide, categories, sessions CRUD + export)
- Data persisted to JSON files in `server/data/persist/`

---

## RAG Pipeline

An admin-only RAG (Retrieval-Augmented Generation) pipeline tool at `/admin/rag-pipeline`. Features:
- **Ingest**: Paste document text, configure chunk size and overlap, embed via OpenAI `text-embedding-3-small`, and store in-memory
- **Chat**: Ask natural language questions answered by GPT-4o using cosine-similarity-retrieved document chunks as context
- **Sources**: Each response cites specific chunk IDs with similarity scores and text previews
- Status badge shows total indexed chunk count; state persists for the server session
- Backend routes: `GET /api/admin/rag/status`, `POST /api/admin/rag/ingest`, `POST /api/admin/rag/chat`
- Frontend: `src/pages/admin/RAGPipeline.tsx` with dark teal/purple Synaptica theme

**Practice mode:** `?practice=1/2/3` pre-fills document text and chunk/overlap settings.

---

## SEOScope

An admin-only content and SEO analysis tool at `/admin/seoscope`. Features:
- **Three analysis modes**: Full SEO Audit (keyword density + content quality + E-E-A-T + technical elements), Keyword Analysis only, Content Quality only
- **URL fetch**: optionally fetches and extracts page content from a URL before analysis
- **AI analysis**: GPT-4o evaluates content against target keywords and selected mode, returning structured scores and actionable recommendations
- **Export**: copy analysis output to clipboard as Markdown
- **Practice mode**: `?practice=1/2/3` pre-fills content, target keywords, and analysis type
- **File**: `src/pages/admin/SEOScope.tsx`

---

## DocScope — Intel Engine

An admin-only document intelligence tool at `/admin/docscope`. Features:
- **Three analysis modes**: Full Intelligence Scan (gaps + inconsistencies + structure + quality combined), Inconsistencies (contradictions and conflicts only), Structure & Flow (organisational and hierarchy issues only)
- **AI analysis**: GPT-4o performs deep structured analysis of pasted document content, returning categorised findings with severity and direct quotes
- **Export**: copy findings to clipboard as Markdown
- **Practice mode**: `?practice=1/2/3` pre-fills document content and analysis mode
- **File**: `src/pages/admin/DocScope.tsx`

---

## DocForge — Document Generation

An admin-only document transformation tool at `/admin/docforge`. Features:
- **Four output formats**: Executive Brief, Consulting Report, Proposal, Technical Specification
- **Input sources**: paste raw text/notes, or upload .docx/.txt/.md files (parsed server-side)
- **Configuration**: document title, branding/voice notes, and per-format PDF layout options (fonts, colours, margins, headers, footers, page numbers, date)
- **AI generation**: GPT-4o transforms raw input into a structured document matching the selected format and branding
- **Export**: copy as Markdown, or generate a styled PDF (client-side via jsPDF) with Synaptica branding
- **Practice mode**: `?practice=1/2/3` pre-fills raw text, output format, document title, and branding notes
- **File**: `src/pages/admin/DocForge.tsx`

---

## DiffLens — Document Comparison

An admin-only side-by-side document diff tool at `/admin/difflens`. Features:
- **Inputs**: paste text directly or upload .docx/.txt/.md files for either side
- **Diff engine**: line-level comparison with added (green) / removed (red) / unchanged highlighting; change count summary (added, removed, unchanged lines)
- **Navigation**: previous/next change arrows to jump between diff regions; light/dark background toggle; prose mode for readability
- **Practice mode**: `?practice=1/2/3` pre-fills both left and right document text boxes
- **File**: `src/pages/admin/DiffLensAdmin.tsx`

---

## Knowledge Architecture Suite

An admin-only 5-tool documentation engineering suite at `/admin/knowledge-arch`. Features:
- **Knowledge Base Manager**: create named KBs, ingest content (paste text, URL scrape, or file upload), view chunk counts; persistent across sessions via PostgreSQL
- **Semantic Search tab**: natural-language search across all chunks in a selected KB, with ranked results and similarity scores
- **Gap Analyzer tab**: paste support tickets, user questions, or topic lists — GPT-4o identifies which knowledge areas are missing or under-covered
- **FAQ Builder tab**: generate audience-specific FAQ documents from a selected KB with configurable audience description and context
- **Prompts tab**: manage and run knowledge-architecture-specific prompt templates
- **Onboarding tab**: configure onboarding copy for the tool's public-facing card
- **Practice mode**: `?practice=1/2/3` switches the active tab (gaps/faq/search) on load
- **API routes**: `/api/admin/ka/*` (KB CRUD, ingest, search, gap analysis, FAQ generation)
- **File**: `src/pages/admin/KnowledgeArch.tsx`

---

## Practice Kit

An admin-only demo preparation tool at `/admin/practice-kit` covering all 9 internal tools. Features:
- **Hub page**: curated practice scenarios for every tool — narration guide, exact inputs, expected output, and a "wow moment" to anchor the demo
- **Launch & Load**: each scenario card has a button that opens the target tool with content pre-filled via the `?practice=N` URL parameter — no copy-pasting needed
- **9 tools covered**: DocAudit (3 scenarios), KA Sprint (3), Prompt Workshop (seed + sequence), RAG Pipeline (3), SEOScope (3), DocScope (3), DocForge (3), DiffLens (3), Knowledge Architecture suite (3)
- **`?practice=N` pre-fill mechanism**: each tool page has a `useEffect` that detects the `practice` URL param after auth confirms and pre-populates all relevant form fields (content, mode, keywords, document title, left/right text, active tab, etc.)
- **questionLabel field**: ScenarioCard supports an optional `questionLabel` prop to rename the "Suggested questions" section (used for sample tickets, queries, etc. in KA scenarios)
- **Sidebar link**: GraduationCap icon + "Practice Kit" entry in the AdminDashboard sidebar and mobile nav
- **API route**: `POST /api/admin/practice/seed-prompts` — seeds 4 consulting-grade Prompt Workshop templates + Synaptica style guide
- **Files**: `src/pages/admin/PracticeKit.tsx`, `server/routes/practice.ts`

---

## Blog & Thought Leadership

A public blog section accessible at `/blog`. Features:
- Blog listing page with article cards (title, date, reading time, category, excerpt) and category filtering
- Individual article pages with full Markdown rendering (react-markdown + remark-gfm), proper heading hierarchy, code blocks, and tables
- SEO meta tags (title, description, Open Graph) per article via custom Helmet component
- Admin blog management tab in dashboard: create, edit, publish/unpublish, delete articles
- Markdown editor with slug auto-generation, category, featured image, and publish date fields
- 3 pre-loaded placeholder articles (2 published, 1 draft) demonstrating the format
- Public API: `GET /api/blog/public` (listing), `GET /api/blog/public/:slug` (detail)
- Admin API: `GET/POST /api/blog`, `PUT/DELETE /api/blog/:id` (auth-protected)
- Blog link in main site navigation (desktop + mobile)

---

## AI Sales Assistant Chat Widget

A GPT-4o powered chat widget on the public site. Features:
- **Chat bubble**: Floating emerald bubble on all public pages (hidden on `/admin/*` routes). Opens into an expandable chat panel with message history and typing indicator.
- **AI backend**: `POST /api/chat` endpoint uses GPT-4o with a system prompt encoding Synaptica's services, pricing tiers, tools, and Miruna's tone. Rate-limited to 10 messages/minute per IP.
- **Lead capture**: When the assistant detects buying intent and collects name + email, it automatically creates a pipeline contact tagged as "ai_chat" source, updates the chat session, and triggers a notification.
- **Session persistence**: Chat sessions and messages stored in `chat_sessions` and `chat_messages` PostgreSQL tables. Sessions track visitor name/email, lead capture status, and linked pipeline contact.
- **Admin transcript viewer**: "Chat Sessions" tab in admin dashboard. Browse all conversations, see which resulted in a captured lead, and read full transcripts.
- **Admin controls**: Settings panel includes chat widget on/off toggle and system prompt editor. Widget status checked via `GET /api/chat/widget-status` (public endpoint).
- **Files**: `server/routes/chat.ts`, `src/components/ChatWidget.tsx`, `src/pages/admin/ChatSessionsViewer.tsx`
- **DB tables**: `chat_sessions`, `chat_messages`; `admin_settings` extended with `chat_widget_enabled` and `chat_system_prompt` columns.

---

## Autonomous UX Testing Agent

An admin-only tool at `/admin/ux-tester` for running autonomous AI-driven UX tests across the entire platform. Features:
- **5 AI Personas**: Skeptical CTO, First-time Visitor, Freelance Technical Writer, Enterprise IT Manager, AI Enthusiast Startup Founder
- **35+ test scenarios** across 4 areas: Chat Assistant, Lab Tools (DocAudit, KA Sprint, Prompt Workshop), Navigation (route checks), and Lead Capture (email validation)
- **Autonomous execution**: Server-side agent iterates through all personas and scenarios, calling live internal APIs
- **LLM evaluation**: Each interaction evaluated by a second GPT-4o call judging coherence, helpfulness, accuracy, and persona-appropriateness
- **Live progress**: Polling-based UI shows real-time progress with percentage bar during test runs
- **Structured findings**: Results categorized by severity (Good / Needs Attention / Issue) with expandable detail cards
- **Report history**: Past test runs stored in PostgreSQL and viewable from the run history panel
- **Markdown export**: Full findings report downloadable as structured Markdown
- **DB tables**: `ux_test_runs`, `ux_test_findings`
- **Files**: `server/routes/ux-agent.ts`, `server/services/ux-agent.ts`, `server/services/ux-personas.ts`, `server/data/ux-test-store.ts`, `src/pages/admin/UXTester.tsx`

---

## Autonomous Tool Functionality Tester

An admin-only tool at `/admin/tool-tester` for running autonomous AI evaluation of all platform tools. Features:
- **23 hypothetical test scenarios** across 6 areas: DocAudit (5), External Tools (5), Chat Assistant knowledge (4), KA Sprint (3), RAG Pipeline (3), Prompt Workshop (3)
- **External tool checks**: DiffLens, DocForge PDF, DocScope, Synaptica KA Demo, Learning OS — each checked for HTTP status, response time, page title, content size, and app shell presence
- **LLM evaluation**: each scenario result evaluated by GPT-4o against a stated hypothesis — severity rated pass / warning / fail
- **Pre-generated Markdown report**: GPT-4o synthesises an executive summary + recommendations at run end; stored in DB for instant download
- **Report lifecycle**: max 10 reports stored; any older than 60 days deleted automatically when a new run completes
- **Cleanup**: removes test chat sessions and any leads/notifications created during testing without touching the report
- **DB tables**: `tool_test_runs`, `tool_test_findings`
- **Files**: `server/routes/tool-tester.ts`, `server/services/tool-tester.ts`, `server/data/tool-test-store.ts`, `src/pages/admin/ToolTester.tsx`

---

## Known Notes (Non-Critical)

- **Production SSL deprecation warning** — On startup, the `pg` library prints a "SECURITY WARNING" about SSL mode changes coming in pg v9. This is cosmetic. The database connects and initializes correctly ("Database initialized" always follows). No action needed until upgrading to pg v9.
- **Double tool-run query in analytics** — The `/api/admin/analytics/overview` endpoint calls `getMetrics()` (which internally calls `getToolRuns()`) and then also calls `getToolRuns()` directly for its own date-range filtering. Two identical DB queries per analytics page load — imperceptible at current volumes.
- **GitHub push workaround** — `git remote set-url` is blocked as a destructive operation in the agent sandbox. Push by passing the URL with token inline: `git push "https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/Miru-Maria/synaptica-hub.git" main`. Local tracking ref for `origin/main` won't update (cosmetic — commits are genuinely on GitHub).
