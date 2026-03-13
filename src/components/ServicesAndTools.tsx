import { motion } from "framer-motion";
import {
  Network, FileSearch, MessageSquareCode, Terminal,
  ExternalLink, Database, GitCompare, ScanSearch, FileOutput,
} from "lucide-react";

export function ServicesAndTools() {
  const services = [
    {
      icon: <Network className="w-8 h-8 text-primary" />,
      title: "Knowledge Architecture",
      description: "Designing the taxonomy, structure, and retrieval logic of your organization's knowledge systems — so the right information reaches the right people, every time."
    },
    {
      icon: <FileSearch className="w-8 h-8 text-secondary" />,
      title: "AI Documentation Systems",
      description: "Gap analysis, content strategy, and AI-assisted documentation workflows that keep your knowledge base accurate, complete, and useful."
    },
    {
      icon: <MessageSquareCode className="w-8 h-8 text-primary" />,
      title: "RAG & Conversational AI",
      description: "Building retrieval-augmented generation pipelines and AI assistants grounded in your company's own documentation and processes."
    },
    {
      icon: <Terminal className="w-8 h-8 text-secondary" />,
      title: "Prompt Engineering",
      description: "Designing and testing systematic prompt libraries for knowledge work — from FAQ generation to onboarding scripts and style-guide enforcement."
    }
  ];

  const featuredTool = {
    title: "Synaptica Knowledge Architecture",
    description: "A suite of 5 AI-powered knowledge tools: semantic search, documentation gap analysis, smart FAQ builder, RAG onboarding assistant, and a prompt engineering toolkit.",
    tech: ["React", "OpenAI GPT", "PostgreSQL", "SSE Streaming"],
    link: "https://synaptica-knowledge-architecture-mcp.replit.app/search",
    linkLabel: "Open Tool",
    icon: <Database className="w-6 h-6" />,
  };

  const liveTools = [
    {
      id: "difflens",
      icon: <GitCompare className="w-6 h-6 text-primary" />,
      title: "DiffLens",
      description: "Side-by-side document comparison with word-level diff highlighting. Supports PDF, DOCX, TXT, Markdown, CSV, JSON, and code files — with synchronized scrolling across panels.",
      tech: ["Claude AI", "React", "Multi-format"],
      link: "https://diff-lens.replit.app/",
      linkLabel: "Open Tool",
    },
    {
      id: "docforge",
      icon: <FileOutput className="w-6 h-6 text-secondary" />,
      title: "DocForge PDF",
      description: "Upload DOCX, TXT, or Markdown files and receive polished, branded PDFs — AI detects document structure and applies your headers, footers, and confidentiality stamps automatically.",
      tech: ["OpenAI", "PDF Engine", "React"],
      link: "https://docforge-pdf.replit.app/",
      linkLabel: "Open Tool",
    },
    {
      id: "docscope",
      icon: <ScanSearch className="w-6 h-6 text-primary" />,
      title: "DocScope Intel Engine",
      description: "Paste or upload any content — Slack threads, email chains, work items, or documents — and get a structured AI analysis of gaps, inconsistencies, and coverage issues.",
      tech: ["Claude AI", "NLP", "React"],
      link: "https://intel-engine-scope.replit.app/",
      linkLabel: "Open Tool",
    },
  ];

  return (
    <section id="services" className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Services ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What I Design</h2>
          <p className="text-lg text-muted-foreground">
            Custom AI knowledge architecture for organizations that need more than just keyword search.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-24">
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1 }}
              className="glass p-8 rounded-2xl group hover:border-primary/50 transition-colors duration-500 hover:bg-white/[0.03]"
            >
              <div className="w-16 h-16 rounded-xl bg-background border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:glow-primary">
                {service.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
                {service.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-6 mb-16">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2">Free AI Tools — No Login Required</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* ── Tools header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4" id="tools">Try the Tools</h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Four working AI tools built around real knowledge work problems. Use them on your own content — no account, no paywall.
          </p>
        </motion.div>

        {/* ── Featured tool ── */}
        <div className="mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="glass p-8 rounded-2xl flex flex-col md:flex-row gap-8 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border-primary/20 hover:border-primary/50 glow-ambient"
          >
            <div className="absolute top-6 right-6 bg-primary/10 text-primary border border-primary/20 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Featured
            </div>

            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center border bg-primary/10 text-primary border-primary/20 mb-4">
                {featuredTool.icon}
              </div>
              <div className="hidden md:flex flex-wrap gap-2 max-w-[200px]">
                {featuredTool.tech.map(t => (
                  <span key={t} className="text-xs font-medium bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-gray-300">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col flex-grow">
              <h3 className="text-2xl font-semibold mb-3 pr-24">{featuredTool.title}</h3>
              <p className="text-muted-foreground mb-6 flex-grow leading-relaxed">{featuredTool.description}</p>

              <div className="flex md:hidden flex-wrap gap-2 mb-6">
                {featuredTool.tech.map(t => (
                  <span key={t} className="text-xs font-medium bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-gray-300">
                    {t}
                  </span>
                ))}
              </div>

              <a
                href={featuredTool.link}
                target="_blank"
                rel="noopener noreferrer"
                className="self-start inline-flex items-center gap-2 py-3 px-6 rounded-xl font-medium transition-all bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,200,160,0.3)]"
              >
                {featuredTool.linkLabel}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>

        {/* ── Three live tools ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {liveTools.map((tool, idx) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1 }}
              className="glass p-7 rounded-2xl flex flex-col group hover:-translate-y-1 transition-all duration-300 hover:border-white/20"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center border border-white/10 bg-white/5 group-hover:bg-white/8 transition-colors">
                  {tool.icon}
                </div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                  Live
                </span>
              </div>

              <h3 className="text-lg font-semibold mb-3 text-gray-200 group-hover:text-foreground transition-colors">
                {tool.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-grow mb-5">
                {tool.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-6">
                {tool.tech.map(t => (
                  <span key={t} className="text-xs font-medium bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400">
                    {t}
                  </span>
                ))}
              </div>

              <a
                href={tool.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-sm font-medium transition-all border border-white/10 text-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5"
              >
                {tool.linkLabel}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
