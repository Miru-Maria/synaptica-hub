# Synaptica Knowledge Systems

Consulting/product landing site for Synaptica Knowledge Systems (Miruna Cristiana Paun PFA). Full admin suite with AI tools, blog, Paddle billing, and a documentation engineering platform.

For full feature specifications see **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

---

## Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 7
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- **Routing**: Wouter
- **Animations**: Framer Motion
- **UI Components**: Radix UI primitives + shadcn-style components
- **Data Fetching**: TanStack Query
- **Backend**: Express (port 3001)
- **AI**: OpenAI (text-embedding-3-small + GPT-4o)
- **Database**: PostgreSQL (Replit-managed, via `pg`)

---

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
    admin/             # All admin tool pages
  components/
    Navbar.tsx         # Fixed top nav with scroll-spy
    Hero.tsx           # Hero section
    About.tsx          # About section
    ServicesAndTools.tsx
    Contact.tsx
    Footer.tsx
    PhoenixLogo.tsx    # SVG logo component
    ChatWidget.tsx     # AI sales assistant chat bubble
    docaudit/          # DocAudit tool components
    ui/                # Radix-based UI primitives
  hooks/               # Custom React hooks
  lib/                 # Utilities (cn, etc.)
server/
  index.ts             # Express entry (port 3001)
  middleware/
    auth.ts            # JWT auth middleware
  routes/
    audit.ts           # DocAudit API
    admin.ts           # Protected admin routes
    public.ts          # Public read-only routes
    blog.ts            # Blog CRUD + public routes
    ka-sprint.ts       # KA Sprint routes + session CRUD
    prompt-workshop.ts # Prompt Workshop CRUD + test + sessions
    chat.ts            # AI chat widget + lead capture
    ux-agent.ts        # Autonomous UX testing agent
    tool-tester.ts     # Autonomous tool functionality tester
    rag.ts             # RAG pipeline routes
    practice.ts        # Practice Kit seed-prompts route
  data/
    db.ts              # PostgreSQL pool + initDb()
    store.ts           # PostgreSQL-backed data store
    prompt-workshop-store.ts
    sessions-store.ts
    persist/           # Legacy JSON files (sessions + prompt workshop)
  services/
    email.ts           # Resend email service
    parser.ts          # PDF, DOCX, Markdown parsing + chunking
    scraper.ts         # URL scraping with SSRF protection
    analyzer.ts        # OpenAI embeddings + GPT-4o gap analysis
public/
  phoenix-logo.png
```

---

## Dev Server

Run with: `npm run dev` (starts Vite frontend + Express backend via concurrently)

**Workflow**: Start application → `npm run dev` → port 5000 (webview)

### Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | Yes (AI features) | Embeddings + GPT-4o |
| `ADMIN_USERNAME` | Yes | Admin login |
| `ADMIN_PASSWORD` | Yes | Admin login |
| `JWT_SECRET` | Yes | JWT signing (server won't start without it) |
| `DATABASE_URL` | Yes | PostgreSQL connection (Replit-managed) |
| `RESEND_API_KEY` | Optional | Email notifications |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Optional | Gmail fallback for email |
| `PADDLE_WEBHOOK_SECRET` | Optional | Paddle billing webhooks |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Optional | Pushing to GitHub (`repo` scope) |

### Vite Configuration Notes

- `hmr.clientPort: 443` — required for HMR WebSocket through Replit's HTTPS proxy
- `watch.ignored` — excludes `.cache/`, `.local/`, and `node_modules/`
- `/api` proxy → `http://localhost:3001`

---

## Admin Tools Summary

| Tool | Route | Purpose |
|---|---|---|
| Dashboard | `/admin` | Packages, CRM, invoicing, metrics, notifications |
| DocAudit | `/docaudit` | Documentation gap analysis (public-facing) |
| KA Sprint | `/admin/ka-sprint` | Knowledge architecture sprint |
| Prompt Workshop | `/admin/prompt-workshop` | Prompt design + testing |
| RAG Pipeline | `/admin/rag-pipeline` | Ingest + query documents |
| SEOScope | `/admin/seoscope` | SEO + content quality analysis |
| DocScope | `/admin/docscope` | Document intelligence (gaps, inconsistencies, structure) |
| DocForge | `/admin/docforge` | Raw notes → polished documents |
| DiffLens | `/admin/difflens` | Side-by-side document comparison |
| Knowledge Arch | `/admin/knowledge-arch` | KB manager + search + gap analysis + FAQ builder |
| Practice Kit | `/admin/practice-kit` | Demo preparation — pre-loaded scenarios for all 9 tools |
| UX Tester | `/admin/ux-tester` | Autonomous AI-driven UX testing |
| Tool Tester | `/admin/tool-tester` | Autonomous tool functionality evaluation |
| Blog | `/admin` (Blog tab) | Article CRUD + publish/unpublish |
| Chat Sessions | `/admin` (Chat tab) | AI chat transcript viewer |

---

## User Preferences

- British/Irish English spelling preferred (e.g. "organised", "colour", "recognise")
