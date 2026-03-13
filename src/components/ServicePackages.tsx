import { motion } from "framer-motion";
import { Clock, ArrowRight, RefreshCw, MessageSquare } from "lucide-react";
import { useCurrency } from "@/context/currency";
import { CurrencySelector } from "./CurrencySelector";

const packages = [
  {
    id: "audit",
    name: "Documentation Audit",
    duration: "1 week",
    type: "Fixed price",
    problem: "\"We don't know what our knowledge base is missing.\"",
    priceLow: 1500,
    priceHigh: 2000,
    deliverables: [
      "Gap analysis across existing documentation",
      "Semantic search audit of coverage holes",
      "Prioritized gap report with action recommendations",
    ],
    ideal: "Teams preparing for an AI initiative or post-merger knowledge consolidation.",
  },
  {
    id: "sprint",
    name: "Knowledge Architecture Sprint",
    duration: "1–2 weeks",
    type: "Fixed price",
    problem: "\"Our AI can't find anything useful in our docs.\"",
    priceLow: 2500,
    priceHigh: 4000,
    deliverables: [
      "Taxonomy and knowledge structure design",
      "Retrieval logic mapping and metadata schema",
      "Content hierarchy design",
      "Structured knowledge architecture document",
    ],
    ideal: "SaaS companies preparing for a RAG build, or teams rebuilding a knowledge base from scratch.",
  },
  {
    id: "workshop",
    name: "Prompt Engineering Workshop",
    duration: "1–2 weeks",
    type: "Fixed price",
    problem: "\"Our team wastes hours writing the same kinds of content.\"",
    priceLow: 2000,
    priceHigh: 3000,
    deliverables: [
      "Prompt library design, testing, and documentation",
      "Variable-template system for consistent team output",
      "Style-guide enforcement prompts",
      "Full team handover with usage documentation",
    ],
    ideal: "Marketing, support, and content teams with repetitive writing workflows.",
  },
];

const retainer = {
  priceLow: 800,
  priceHigh: 1200,
};

export function ServicePackages() {
  const { formatRange } = useCurrency();

  return (
    <section id="packages" className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-2xl"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Service Packages</h2>
            <p className="text-lg text-muted-foreground">
              Fixed-price engagements built around the problem you're trying to solve — not the technology involved.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <CurrencySelector />
          </motion.div>
        </div>

        {/* Package cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {packages.map((pkg, idx) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: idx * 0.08 }}
              className="glass rounded-2xl p-7 flex flex-col group hover:border-white/20 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {pkg.duration}
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-xs text-muted-foreground">{pkg.type}</span>
              </div>

              <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                {pkg.name}
              </h3>

              <p className="text-xs text-muted-foreground italic mb-5 leading-relaxed border-l border-white/10 pl-3">
                {pkg.problem}
              </p>

              <ul className="space-y-2 mb-6 flex-grow">
                {pkg.deliverables.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>

              <div className="border-t border-white/8 pt-5 mt-auto">
                <p className="text-xs text-muted-foreground mb-1">Starting from</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatRange(pkg.priceLow, pkg.priceHigh)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{pkg.ideal}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* RAG + Retainer row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* RAG Pipeline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            className="glass rounded-2xl p-7 flex flex-col group hover:border-white/20 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                4–8 weeks
              </span>
              <span className="text-muted-foreground/30">·</span>
              <span className="text-xs text-muted-foreground">Project-based</span>
            </div>

            <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
              RAG Pipeline Design & Build
            </h3>

            <p className="text-xs text-muted-foreground italic mb-5 leading-relaxed border-l border-white/10 pl-3">
              "We need a chatbot trained on our internal documentation."
            </p>

            <ul className="space-y-2 mb-6 flex-grow">
              {[
                "End-to-end retrieval-augmented generation pipeline",
                "Document ingestion and chunking strategy",
                "Embedding and vector store setup",
                "Conversational interface grounded in your documentation",
              ].map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>

            <div className="border-t border-white/8 pt-5 mt-auto">
              <p className="text-xs text-muted-foreground mb-1">Pricing</p>
              <p className="text-2xl font-bold text-foreground">Custom — quoted on scope</p>
              <p className="text-xs text-muted-foreground mt-1">
                For companies with existing documentation ready for AI-powered retrieval.
              </p>
            </div>
          </motion.div>

          {/* Retainer */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.08 }}
            className="glass rounded-2xl p-7 flex flex-col border-secondary/20 hover:border-secondary/40 hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Monthly
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-xs text-muted-foreground">Ongoing</span>
              </div>
              <span className="text-xs font-semibold text-secondary bg-secondary/10 border border-secondary/20 px-2.5 py-1 rounded-full">
                Advisory
              </span>
            </div>

            <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-secondary transition-colors">
              Monthly Retainer
            </h3>

            <p className="text-xs text-muted-foreground italic mb-5 leading-relaxed border-l border-white/10 pl-3">
              "We need ongoing knowledge architecture support as we scale."
            </p>

            <ul className="space-y-2 mb-6 flex-grow">
              {[
                "Dedicated async support and review cycles",
                "Monthly knowledge health check and recommendations",
                "Priority access for new requests and scope expansions",
                "Continuity across documentation, prompts, and architecture",
              ].map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="w-3.5 h-3.5 text-secondary mt-0.5 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>

            <div className="border-t border-white/8 pt-5 mt-auto">
              <p className="text-xs text-muted-foreground mb-1">Per month</p>
              <p className="text-2xl font-bold text-foreground">
                {formatRange(retainer.priceLow, retainer.priceHigh)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 3-month commitment. Ideal for teams in active knowledge build-out.
              </p>
            </div>
          </motion.div>
        </div>

        {/* CTA note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-3 mt-10 text-sm text-muted-foreground"
        >
          <MessageSquare className="w-4 h-4 text-primary shrink-0" />
          All engagements begin with a free 30-minute scoping call. Prices shown are indicative ranges — final quotes depend on scope.
        </motion.div>

      </div>
    </section>
  );
}
