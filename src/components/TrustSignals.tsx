import { motion } from "framer-motion";
import { FileSearch, Network, MessageSquareCode, GitMerge, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

const process = [
  {
    icon: <FileSearch className="w-5 h-5 text-primary" />,
    step: "01",
    title: "Knowledge Audit",
    description: "Map what you have, identify gaps, and clarify what your AI systems actually need to know.",
  },
  {
    icon: <Network className="w-5 h-5 text-primary" />,
    step: "02",
    title: "Architecture Design",
    description: "Design the taxonomy, retrieval schema, and document structure before a single embedding is generated.",
  },
  {
    icon: <MessageSquareCode className="w-5 h-5 text-primary" />,
    step: "03",
    title: "Pipeline & Prompts",
    description: "Build the RAG pipeline and prompt layer that turns your structured knowledge into reliable AI responses.",
  },
  {
    icon: <GitMerge className="w-5 h-5 text-primary" />,
    step: "04",
    title: "Handover & Docs",
    description: "Full documentation, maintenance guidelines, and a team handover so nothing lives only in my head.",
  },
];

const credentials = [
  { label: "Specialisation", value: "AI Knowledge Systems" },
  { label: "Stack", value: "OpenAI · LangChain · PostgreSQL · pgvector" },
  { label: "Languages", value: "English · Romanian" },
  { label: "Entity", value: "Miruna Paun PFA · Romania" },
];

export function TrustSignals() {
  const [, navigate] = useLocation();

  return (
    <section className="py-16 sm:py-24 relative z-10 border-t border-white/5">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-primary/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary mb-4">
            How I Work
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            A deliberate process, not a quick fix
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Every engagement follows a structured methodology — from knowledge audit through to handover — so your team inherits a system they can maintain, not a black box.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {process.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-6 border border-white/8 relative overflow-hidden group hover:border-primary/30 transition-colors"
            >
              <span className="absolute top-4 right-4 text-4xl font-bold text-white/4 group-hover:text-primary/8 transition-colors select-none">
                {item.step}
              </span>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          className="glass rounded-2xl border border-white/8 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 flex-1">
            {credentials.map((c) => (
              <div key={c.label}>
                <p className="text-xs text-muted-foreground/60 uppercase tracking-widest mb-1">{c.label}</p>
                <p className="text-sm font-medium text-foreground">{c.value}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/work-with-me")}
            className="btn-primary py-3 px-6 flex items-center gap-2 shrink-0 whitespace-nowrap"
          >
            Start a project <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
