import { motion } from "framer-motion";
import { Network, FileSearch, MessageSquareCode, Terminal, ExternalLink, Database, Rocket } from "lucide-react";

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

  const tools = [
    {
      id: "synaptica-knowledge",
      title: "Synaptica Knowledge Architecture",
      description: "A suite of 5 AI-powered knowledge tools: semantic search, documentation gap analysis, smart FAQ builder, RAG onboarding assistant, and a prompt engineering toolkit.",
      tech: ["React", "OpenAI GPT", "PostgreSQL", "SSE Streaming"],
      link: "https://synaptica-knowledge-architecture-mcp.replit.app/search",
      linkLabel: "Open Tool",
      icon: <Database className="w-6 h-6" />,
      featured: true,
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
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2">Live in the Lab</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* ── Tools ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4" id="tools">Live Tools</h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Working demonstrations of AI knowledge systems in action. These prototypes showcase how structured data meets generative AI.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {tools.map((tool, idx) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1 }}
              className="glass p-8 rounded-2xl flex flex-col h-full relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 lg:col-span-2 border-primary/20 hover:border-primary/50 glow-ambient"
            >
              <div className="absolute top-6 right-6 bg-primary/10 text-primary border border-primary/20 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                Featured
              </div>

              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6 border bg-primary/10 text-primary border-primary/20">
                {tool.icon}
              </div>

              <h3 className="text-2xl font-semibold mb-3">{tool.title}</h3>
              <p className="text-muted-foreground mb-6 flex-grow">{tool.description}</p>

              <div className="flex flex-wrap gap-2 mb-8">
                {tool.tech.map(t => (
                  <span key={t} className="text-xs font-medium bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-gray-300">
                    {t}
                  </span>
                ))}
              </div>

              <a
                href={tool.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium transition-all bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,200,160,0.3)]"
              >
                {tool.linkLabel}
                <ExternalLink className="w-4 h-4" />
              </a>
            </motion.div>
          ))}

          {/* Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1 }}
            className="glass p-8 rounded-2xl border-dashed border-2 border-white/10 flex flex-col h-full items-center justify-center text-center hover:border-white/20 transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Rocket className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-300">More Tools Coming</h3>
            <p className="text-muted-foreground mb-8 text-sm">
              New AI knowledge tools are in development. Follow along or get in touch to discuss a custom solution for your team.
            </p>
            <button
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors border-b border-transparent hover:border-primary pb-0.5"
            >
              Discuss a project &rarr;
            </button>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
