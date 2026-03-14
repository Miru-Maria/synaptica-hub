# Synaptica Knowledge Systems

A personal portfolio/landing page for Synaptica Knowledge Systems — an AI knowledge architecture consultancy. Includes the DocAudit documentation gap analysis tool.

## Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 7
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- **Routing**: Wouter
- **Animations**: Framer Motion
- **UI Components**: Radix UI primitives + shadcn-style components
- **Data Fetching**: TanStack Query
- **Backend**: Express (port 3001) for DocAudit API
- **AI**: OpenAI (text-embedding-3-small + GPT-4o)

## Project Structure

```
src/
  App.tsx              # Root component with Wouter router
  main.tsx             # React entry point
  index.css            # Global styles + Tailwind theme
  pages/
    Home.tsx           # Main landing page
    DocAudit.tsx       # DocAudit gap analysis tool page
    Legal.tsx          # Legal/terms page
    not-found.tsx      # 404 page
  components/
    Navbar.tsx         # Fixed top nav with scroll-spy
    Hero.tsx           # Hero section
    About.tsx          # About section
    ServicesAndTools.tsx  # Services + featured tool cards
    Contact.tsx        # Contact section
    Footer.tsx         # Footer
    PhoenixLogo.tsx    # SVG logo component
    docaudit/          # DocAudit tool components
      InputPanel.tsx   # Multi-source document ingestion (file/text/URL/Notion)
      TaxonomyConfig.tsx # Topic taxonomy selection and custom topics
      GapReport.tsx    # Results view with charts, gaps, PDF export
    ui/                # Radix-based UI primitives
  hooks/               # Custom React hooks
  lib/                 # Utilities (cn, etc.)
server/
  index.ts             # Express server entry (port 3001)
  middleware/
    auth.ts            # JWT auth middleware (requireAuth, signToken, verifyToken)
  routes/
    audit.ts           # DocAudit API routes (parse-files, parse-text, parse-url, parse-notion, analyze)
    admin.ts           # Protected admin routes (login, logout, me, packages CRUD, tools CRUD, sessions list, metrics, pipeline CRM CRUD, notifications CRUD, admin settings, projects CRUD with nested tasks)
    public.ts          # Public read-only routes (packages, tools, discovery call + email capture with notification triggers)
    blog.ts            # Blog article CRUD (admin) + public listing/detail routes
    ka-sprint.ts       # KA Sprint AI-powered knowledge architecture routes + session CRUD + export
    prompt-workshop.ts # Prompt Engineering Workshop CRUD + test + style guide + session CRUD + export routes
  data/
    db.ts              # PostgreSQL pool (pg), initDb() — creates 14 tables and seeds defaults on first run
    store.ts           # Async PostgreSQL-backed data store for packages, tools, blog articles, tool usage metrics, pipeline contacts, notifications, and admin settings
    prompt-workshop-store.ts  # JSON file-persisted store for prompt templates and style guide
    sessions-store.ts  # JSON file-persisted store for KA Sprint and Prompt Workshop sessions
    persist/           # Legacy JSON files (superseded by PostgreSQL; still used by sessions-store and prompt-workshop-store)
  services/
    parser.ts          # PDF, DOCX, Markdown, text parsing + chunking
    scraper.ts         # URL scraping with SSRF protection
    analyzer.ts        # OpenAI embeddings + GPT-4o gap analysis pipeline
public/
  phoenix-logo.png     # Logo asset
```

## Dev Server

Run with: `npm run dev` (starts both Vite frontend and Express backend via concurrently)

Workflow: **Start application** → `npm run dev` on port 5000 (webview)

### Environment Variables

- `OPENAI_API_KEY` — Required for DocAudit analysis (embeddings + GPT-4o)
- `ADMIN_USERNAME` — Username for admin dashboard login
- `ADMIN_PASSWORD` — Password for admin dashboard login
- `JWT_SECRET` — Secret key for JWT token signing (required, server fails to start without it)
- `DATABASE_URL` — PostgreSQL connection string (Replit-managed, required for all store functions)

### Vite Configuration Notes

- `hmr.clientPort: 443` — required for HMR WebSocket to work through Replit's HTTPS proxy
- `watch.ignored` — excludes `.cache/`, `.local/`, and `node_modules/` from file watching
- `/api` proxy → `http://localhost:3001` for DocAudit backend

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

## KA Sprint Session Management

The KA Sprint Tool at `/admin/ka-sprint` supports session persistence:
- Save current session state (taxonomy, retrieval, document) with client name and date
- List, reopen, continue, and delete past sessions
- Export completed sessions as structured Markdown "Knowledge Architecture Deliverable" documents
- Sessions visible in admin dashboard Sessions tab with client name association
- API routes at `/api/admin/ka-sprint/sessions/*` (CRUD + export)

## Blog & Thought Leadership

A public blog section accessible at `/blog` for publishing articles on knowledge architecture, RAG, and document strategy. Features:
- Blog listing page with article cards (title, date, reading time, category, excerpt) and category filtering
- Individual article pages with full Markdown rendering (react-markdown + remark-gfm), proper heading hierarchy, code blocks, and tables
- SEO meta tags (title, description, Open Graph) per article via custom Helmet component
- Admin blog management tab in dashboard: create, edit, publish/unpublish, delete articles
- Markdown editor with slug auto-generation, category, featured image, and publish date fields
- 3 pre-loaded placeholder articles (2 published, 1 draft) demonstrating the format
- Public API: `GET /api/blog/public` (listing), `GET /api/blog/public/:slug` (detail)
- Admin API: `GET/POST /api/blog`, `PUT/DELETE /api/blog/:id` (auth-protected)
- Blog link in main site navigation (desktop + mobile)

## DocAudit Feature

A documentation gap analysis tool accessible at `/docaudit`. Users submit knowledge base content via:
- File upload (PDF, DOCX, Markdown, plain text)
- Paste raw text
- URL scraping (with SSRF protection)
- Notion API integration

Content is chunked, embedded via OpenAI, and compared against user-selected topic taxonomies (4 presets + custom topics). Results show coverage scores, radar chart visualization, severity-ranked gaps, and actionable recommendations. Reports can be exported as branded PDF with Synaptica logo, dark header, severity breakdown, section-by-section findings, priority recommendations, and paginated footer.

## AI Sales Assistant Chat Widget

A GPT-4o powered chat widget on the public site acting as a knowledgeable sales assistant. Features:
- **Chat bubble**: Floating emerald bubble on all public pages (hidden on `/admin/*` routes). Opens into an expandable chat panel with message history and typing indicator.
- **AI backend**: `POST /api/chat` endpoint uses GPT-4o with a system prompt encoding Synaptica's services, pricing tiers, tools, and Miruna's tone. Rate-limited to 10 messages/minute per IP.
- **Lead capture**: When the assistant detects buying intent and collects name + email, it automatically creates a pipeline contact tagged as "ai_chat" source, updates the chat session, and triggers a notification.
- **Session persistence**: Chat sessions and messages stored in `chat_sessions` and `chat_messages` PostgreSQL tables. Sessions track visitor name/email, lead capture status, and linked pipeline contact.
- **Admin transcript viewer**: "Chat Sessions" tab in admin dashboard. Browse all conversations, see which resulted in a captured lead, and read full transcripts.
- **Admin controls**: Settings panel includes chat widget on/off toggle and system prompt editor. Widget status checked via `GET /api/chat/widget-status` (public endpoint).
- **Source type**: `ai_chat` added to `ContactSource` type in both backend and PipelineManager frontend.
- **Files**: `server/routes/chat.ts`, `src/components/ChatWidget.tsx`, `src/pages/admin/ChatSessionsViewer.tsx`
- **DB tables**: `chat_sessions`, `chat_messages`; `admin_settings` extended with `chat_widget_enabled` and `chat_system_prompt` columns.

## Autonomous UX Testing Agent

An admin-only tool at `/admin/ux-tester` for running autonomous AI-driven UX tests across the entire platform. Features:
- **5 AI Personas**: Skeptical CTO, First-time Visitor, Freelance Technical Writer, Enterprise IT Manager, AI Enthusiast Startup Founder — each with distinct backgrounds, intents, and tones
- **35+ test scenarios** across 4 areas: Chat Assistant, Lab Tools (DocAudit, KA Sprint, Prompt Workshop), Navigation (route checks), and Lead Capture (email validation)
- **Autonomous execution**: Server-side agent iterates through all personas and scenarios, calling live internal APIs
- **LLM evaluation**: Each interaction is evaluated by a second GPT-4o call judging coherence, helpfulness, accuracy, and persona-appropriateness
- **Live progress**: Polling-based UI shows real-time progress with percentage bar during test runs
- **Structured findings**: Results categorized by severity (Good / Needs Attention / Issue) with expandable detail cards showing raw input/output
- **Report history**: Past test runs stored in PostgreSQL and viewable from the run history panel
- **Markdown export**: Full findings report downloadable as structured Markdown
- **DB tables**: `ux_test_runs`, `ux_test_findings` in PostgreSQL
- **API routes**: `GET /api/admin/ux-agent/personas`, `POST /api/admin/ux-agent/run`, `GET /api/admin/ux-agent/runs`, `GET /api/admin/ux-agent/runs/:id`, `GET /api/admin/ux-agent/runs/:id/export`
- **Files**: `server/routes/ux-agent.ts`, `server/services/ux-agent.ts`, `server/services/ux-personas.ts`, `server/data/ux-test-store.ts`, `src/pages/admin/UXTester.tsx`

## Known Notes (Non-Critical)

- **Production SSL deprecation warning** — On startup, the `pg` library prints a "SECURITY WARNING" about SSL mode changes coming in pg v9. This is cosmetic. The database connects and initializes correctly ("Database initialized" always follows). No action needed until upgrading to pg v9.
- **Double tool-run query in analytics** — The `/api/admin/analytics/overview` endpoint calls `getMetrics()` (which internally calls `getToolRuns()`) and then also calls `getToolRuns()` directly for its own date-range filtering. This results in two identical DB queries per analytics page load. At current data volumes this is imperceptible. If tool run volume grows significantly, refactor to pass the runs array into `getMetrics()` instead of fetching internally.

## RAG Pipeline Tool

An admin-only RAG (Retrieval-Augmented Generation) pipeline tool at `/admin/rag-pipeline`. Features:
- **Ingest**: Paste document text, configure chunk size and overlap, embed via OpenAI `text-embedding-3-small`, and store in-memory
- **Chat**: Ask natural language questions answered by GPT-4o using cosine-similarity-retrieved document chunks as context
- **Sources**: Each response cites specific chunk IDs with similarity scores and text previews
- Status badge shows total indexed chunk count; state persists for the server session
- Backend routes: `GET /api/admin/rag/status`, `POST /api/admin/rag/ingest`, `POST /api/admin/rag/chat`
- Frontend: `src/pages/admin/RAGPipeline.tsx` with dark teal/purple Synaptica theme
- Accessible from Admin Dashboard "Internal Tools" tab via "Launch Tool" card
