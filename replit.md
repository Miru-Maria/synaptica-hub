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
  routes/
    audit.ts           # DocAudit API routes (parse-files, parse-text, parse-url, parse-notion, analyze)
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

### Vite Configuration Notes

- `hmr.clientPort: 443` — required for HMR WebSocket to work through Replit's HTTPS proxy
- `watch.ignored` — excludes `.cache/`, `.local/`, and `node_modules/` from file watching
- `/api` proxy → `http://localhost:3001` for DocAudit backend

## DocAudit Feature

A documentation gap analysis tool accessible at `/docaudit`. Users submit knowledge base content via:
- File upload (PDF, DOCX, Markdown, plain text)
- Paste raw text
- URL scraping (with SSRF protection)
- Notion API integration

Content is chunked, embedded via OpenAI, and compared against user-selected topic taxonomies (4 presets + custom topics). Results show coverage scores, radar chart visualization, severity-ranked gaps, and actionable recommendations. Reports can be exported to PDF.
