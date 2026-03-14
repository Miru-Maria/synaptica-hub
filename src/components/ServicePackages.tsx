import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, ArrowRight, RefreshCw, MessageSquare } from "lucide-react";
import { useCurrency } from "@/context/currency";
import { CurrencySelector } from "./CurrencySelector";

interface PackageData {
  id: string;
  name: string;
  tagline: string;
  priceLow: number;
  priceHigh: number;
  priceLabel?: string;
  duration: string;
  type: string;
  features: string[];
  ideal: string;
  highlighted: boolean;
}

const fallbackPackages: PackageData[] = [
  {
    id: "audit",
    name: "Documentation Audit",
    tagline: "We don't know what our knowledge base is missing.",
    priceLow: 1500,
    priceHigh: 2000,
    duration: "1 week",
    type: "Fixed price",
    features: [
      "Gap analysis across existing documentation",
      "Semantic search audit of coverage holes",
      "Prioritized gap report with action recommendations",
    ],
    ideal: "Teams preparing for an AI initiative or post-merger knowledge consolidation.",
    highlighted: false,
  },
  {
    id: "sprint",
    name: "Knowledge Architecture Sprint",
    tagline: "Our AI can't find anything useful in our docs.",
    priceLow: 2500,
    priceHigh: 4000,
    duration: "1–2 weeks",
    type: "Fixed price",
    features: [
      "Taxonomy and knowledge structure design",
      "Retrieval logic mapping and metadata schema",
      "Content hierarchy design",
      "Structured knowledge architecture document",
    ],
    ideal: "SaaS companies preparing for a RAG build, or teams rebuilding a knowledge base from scratch.",
    highlighted: false,
  },
  {
    id: "workshop",
    name: "Prompt Engineering Workshop",
    tagline: "Our team wastes hours writing the same kinds of content.",
    priceLow: 2000,
    priceHigh: 3000,
    duration: "1–2 weeks",
    type: "Fixed price",
    features: [
      "Prompt library design, testing, and documentation",
      "Variable-template system for consistent team output",
      "Style-guide enforcement prompts",
      "Full team handover with usage documentation",
    ],
    ideal: "Marketing, support, and content teams with repetitive writing workflows.",
    highlighted: false,
  },
  {
    id: "rag",
    name: "RAG Pipeline Design & Build",
    tagline: "We need a chatbot trained on our internal documentation.",
    priceLow: 0,
    priceHigh: 0,
    priceLabel: "Custom — quoted on scope",
    duration: "4–8 weeks",
    type: "Project-based",
    features: [
      "End-to-end retrieval-augmented generation pipeline",
      "Document ingestion and chunking strategy",
      "Embedding and vector store setup",
      "Conversational interface grounded in your documentation",
    ],
    ideal: "For companies with existing documentation ready for AI-powered retrieval.",
    highlighted: false,
  },
  {
    id: "retainer",
    name: "Monthly Retainer",
    tagline: "We need ongoing knowledge architecture support as we scale.",
    priceLow: 800,
    priceHigh: 1200,
    duration: "Monthly",
    type: "Ongoing",
    features: [
      "Dedicated async support and review cycles",
      "Monthly knowledge health check and recommendations",
      "Priority access for new requests and scope expansions",
      "Continuity across documentation, prompts, and architecture",
    ],
    ideal: "Minimum 3-month commitment. Ideal for teams in active knowledge build-out.",
    highlighted: true,
  },
];

export function ServicePackages() {
  const { formatRange } = useCurrency();
  const [packages, setPackages] = useState<PackageData[]>(fallbackPackages);

  useEffect(() => {
    fetch("/api/public/packages")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setPackages(data);
      })
      .catch(() => {});
  }, []);

  const standardPkgs = packages.filter((p) => !p.highlighted && p.id !== "rag" && p.id !== "retainer");
  const ragPkg = packages.find((p) => p.id === "rag");
  const retainerPkg = packages.find((p) => p.highlighted || p.id === "retainer");

  return (
    <section id="packages" className="py-16 sm:py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {standardPkgs.map((pkg, idx) => (
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
                "{pkg.tagline}"
              </p>

              <ul className="space-y-2 mb-6 flex-grow">
                {pkg.features.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>

              <div className="border-t border-white/8 pt-5 mt-auto">
                <p className="text-xs text-muted-foreground mb-1">Starting from</p>
                <p className="text-2xl font-bold text-foreground">
                  {pkg.priceLabel || formatRange(pkg.priceLow, pkg.priceHigh)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{pkg.ideal}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ragPkg && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              className="glass rounded-2xl p-7 flex flex-col group hover:border-white/20 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {ragPkg.duration}
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-xs text-muted-foreground">{ragPkg.type}</span>
              </div>

              <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                {ragPkg.name}
              </h3>

              <p className="text-xs text-muted-foreground italic mb-5 leading-relaxed border-l border-white/10 pl-3">
                "{ragPkg.tagline}"
              </p>

              <ul className="space-y-2 mb-6 flex-grow">
                {ragPkg.features.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>

              <div className="border-t border-white/8 pt-5 mt-auto">
                <p className="text-xs text-muted-foreground mb-1">Pricing</p>
                <p className="text-2xl font-bold text-foreground">
                  {ragPkg.priceLabel || formatRange(ragPkg.priceLow, ragPkg.priceHigh)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{ragPkg.ideal}</p>
              </div>
            </motion.div>
          )}

          {retainerPkg && (
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
                    {retainerPkg.duration}
                  </span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-xs text-muted-foreground">{retainerPkg.type}</span>
                </div>
                <span className="text-xs font-semibold text-secondary bg-secondary/10 border border-secondary/20 px-2.5 py-1 rounded-full">
                  Advisory
                </span>
              </div>

              <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-secondary transition-colors">
                {retainerPkg.name}
              </h3>

              <p className="text-xs text-muted-foreground italic mb-5 leading-relaxed border-l border-white/10 pl-3">
                "{retainerPkg.tagline}"
              </p>

              <ul className="space-y-2 mb-6 flex-grow">
                {retainerPkg.features.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="w-3.5 h-3.5 text-secondary mt-0.5 shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>

              <div className="border-t border-white/8 pt-5 mt-auto">
                <p className="text-xs text-muted-foreground mb-1">Per month</p>
                <p className="text-2xl font-bold text-foreground">
                  {retainerPkg.priceLabel || formatRange(retainerPkg.priceLow, retainerPkg.priceHigh)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{retainerPkg.ideal}</p>
              </div>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-3 mt-10 text-sm text-muted-foreground"
        >
          <MessageSquare className="w-4 h-4 text-primary shrink-0" />
          <span>All engagements begin with a free 30-minute scoping call. Prices shown are indicative ranges — final quotes depend on scope.</span>
        </motion.div>

      </div>
    </section>
  );
}
