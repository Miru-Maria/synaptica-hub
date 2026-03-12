# Synaptica Knowledge Systems

A personal portfolio/landing page for Synaptica Knowledge Systems — an AI knowledge architecture consultancy.

## Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 7
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- **Routing**: Wouter
- **Animations**: Framer Motion
- **UI Components**: Radix UI primitives + shadcn-style components
- **Data Fetching**: TanStack Query

## Project Structure

```
src/
  App.tsx              # Root component with Wouter router
  main.tsx             # React entry point
  index.css            # Global styles + Tailwind theme
  pages/
    Home.tsx           # Main landing page
    not-found.tsx      # 404 page
  components/
    Navbar.tsx         # Fixed top nav with scroll-spy
    Hero.tsx           # Hero section
    About.tsx          # About section
    ServicesAndTools.tsx  # Services + featured tool cards
    Contact.tsx        # Contact section
    Footer.tsx         # Footer
    PhoenixLogo.tsx    # SVG logo component
    ui/                # Radix-based UI primitives
  hooks/               # Custom React hooks
  lib/                 # Utilities (cn, etc.)
public/
  phoenix-logo.png     # Logo asset used in PhoenixLogo component
```

## Dev Server

Run with: `npm run dev`

Workflow: **Start application** → `npm run dev` on port 5000 (webview)

### Vite Configuration Notes

- `hmr.clientPort: 443` — required for HMR WebSocket to work through Replit's HTTPS proxy
- `watch.ignored` — excludes `.cache/`, `.local/`, and `node_modules/` from file watching to prevent Replit's internal cache files from triggering constant rebuilds
