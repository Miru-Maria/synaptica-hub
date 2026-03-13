import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Minus, ExternalLink, BookOpen, Brain, Map, FolderKanban, StickyNote, Sparkles } from "lucide-react";
import { useCurrency } from "@/context/currency";
import { CurrencySelector } from "./CurrencySelector";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

const LEARNING_OS_URL = "https://synaptica-knowledge-systems-learning-os.replit.app/";

const tierData = [
  {
    name: "Explorer",
    usdPrice: null,
    priceLabel: "Free",
    priceNote: "No credit card required",
    description: "Get a feel for the platform before committing.",
    cta: "Start Free",
    paddleId: null,
    highlighted: false,
    badge: null,
    features: [
      { label: "Dashboard overview", included: true },
      { label: "Skill Map (5 skills)", included: true },
      { label: "Learning Path preview", included: true },
      { label: "Project Tracker", included: false },
      { label: "Knowledge Notes", included: false },
      { label: "AI Tutor", included: false },
      { label: "Priority support", included: false },
    ],
  },
  {
    name: "Foundation",
    usdPrice: 25,
    priceLabel: null,
    priceNote: "per month",
    description: "Full access to Tier 1 — the AI Transition curriculum.",
    cta: "Get Started",
    paddleId: import.meta.env.VITE_PADDLE_FOUNDATION_PRICE as string,
    highlighted: false,
    badge: null,
    features: [
      { label: "Dashboard overview", included: true },
      { label: "Skill Map (unlimited)", included: true },
      { label: "Tier 1: AI Transition path", included: true },
      { label: "Project Tracker (3 projects)", included: true },
      { label: "Knowledge Notes", included: true },
      { label: "AI Tutor", included: false },
      { label: "Priority support", included: false },
    ],
  },
  {
    name: "Architect",
    usdPrice: 65,
    priceLabel: null,
    priceNote: "per month",
    description: "The full Knowledge Systems curriculum plus AI-assisted learning.",
    cta: "Become an Architect",
    paddleId: import.meta.env.VITE_PADDLE_ARCHITECT_PRICE as string,
    highlighted: true,
    badge: "Recommended",
    features: [
      { label: "Dashboard overview", included: true },
      { label: "Skill Map (unlimited)", included: true },
      { label: "Tier 1 + 2: Knowledge Systems", included: true },
      { label: "Project Tracker (unlimited)", included: true },
      { label: "Knowledge Notes", included: true },
      { label: "AI Tutor (50 msgs/month)", included: true },
      { label: "Priority support", included: false },
    ],
  },
  {
    name: "Expert",
    usdPrice: 125,
    priceLabel: null,
    priceNote: "per month",
    description: "Every tier, unlimited AI Tutor, and direct access to support.",
    cta: "Go Expert",
    paddleId: import.meta.env.VITE_PADDLE_EXPERT_PRICE as string,
    highlighted: false,
    badge: null,
    features: [
      { label: "Dashboard overview", included: true },
      { label: "Skill Map (unlimited)", included: true },
      { label: "All 3 learning path tiers", included: true },
      { label: "Project Tracker (unlimited)", included: true },
      { label: "Knowledge Notes", included: true },
      { label: "AI Tutor (unlimited)", included: true },
      { label: "Priority support", included: true },
    ],
  },
];

const modules = [
  { icon: <Map className="w-5 h-5 text-primary" />, label: "Skill Map" },
  { icon: <BookOpen className="w-5 h-5 text-secondary" />, label: "Learning Paths" },
  { icon: <FolderKanban className="w-5 h-5 text-primary" />, label: "Project Tracker" },
  { icon: <StickyNote className="w-5 h-5 text-secondary" />, label: "Knowledge Notes" },
  { icon: <Brain className="w-5 h-5 text-primary" />, label: "AI Tutor" },
];

export function LearningOS() {
  const { format } = useCurrency();
  const [paddle, setPaddle] = useState<Paddle | undefined>();

  useEffect(() => {
    initializePaddle({
      token: import.meta.env.VITE_PADDLE_TOKEN as string,
      environment: "production",
    }).then(setPaddle);
  }, []);

  const openCheckout = (priceId: string) => {
    paddle?.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      settings: {
        successUrl: LEARNING_OS_URL,
      },
    });
  };

  return (
    <section id="learning-os" className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center sm:text-left max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Product
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Synaptica Learning OS
            </h2>
            <p className="text-lg text-muted-foreground">
              A structured operating system for professionals transitioning into AI knowledge architecture. Five integrated modules. Three progressive learning tiers. One AI tutor that knows the field.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="sm:pt-10 flex sm:justify-end"
          >
            <CurrencySelector />
          </motion.div>
        </div>

        {/* Module chips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center sm:justify-start gap-3 mb-6"
        >
          {modules.map((m) => (
            <span
              key={m.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/10 text-sm text-muted-foreground"
            >
              {m.icon}
              {m.label}
            </span>
          ))}
        </motion.div>

        {/* Preview link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="flex justify-center sm:justify-start mb-12"
        >
          <a
            href={LEARNING_OS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Preview the Learning OS
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {tierData.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: idx * 0.08 }}
              className={`relative flex flex-col rounded-2xl p-6 ${
                tier.highlighted
                  ? "bg-primary/10 border border-primary/40 shadow-[0_0_40px_-8px_rgba(0,200,160,0.25)]"
                  : "glass border border-white/8"
              }`}
            >
              {tier.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full bg-primary text-background whitespace-nowrap">
                  {tier.badge}
                </span>
              )}

              <div className="mb-5">
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">
                  {tier.name}
                </p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-3xl font-bold ${tier.highlighted ? "text-primary" : "text-foreground"}`}>
                    {tier.usdPrice !== null ? format(tier.usdPrice) : tier.priceLabel}
                  </span>
                  <span className="text-sm text-muted-foreground">{tier.priceNote}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tier.description}
                </p>
              </div>

              <ul className="space-y-2.5 mb-6 flex-grow">
                {tier.features.map((f) => (
                  <li key={f.label} className="flex items-start gap-2.5 text-sm">
                    {f.included ? (
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    ) : (
                      <Minus className="w-4 h-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                    )}
                    <span className={f.included ? "text-foreground/90" : "text-muted-foreground/50"}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              {tier.paddleId ? (
                <button
                  onClick={() => openCheckout(tier.paddleId!)}
                  className={`w-full text-center py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                    tier.highlighted
                      ? "bg-primary text-background hover:bg-primary/90"
                      : "border border-white/10 text-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  {tier.cta}
                </button>
              ) : (
                <a
                  href={LEARNING_OS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center py-2.5 px-4 rounded-xl text-sm font-medium transition-all border border-white/10 text-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                >
                  {tier.cta}
                </a>
              )}
            </motion.div>
          ))}
        </div>

        {/* Footnote */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8 space-y-2"
        >
          <p className="text-xs text-muted-foreground">
            All paid plans include a 7-day free trial. Cancel any time.
          </p>
          <p className="text-xs text-muted-foreground/50">
            By subscribing you agree to our{" "}
            <a href="/legal#terms" className="underline underline-offset-2 hover:text-primary transition-colors">
              Terms of Service
            </a>
            ,{" "}
            <a href="/legal#privacy" className="underline underline-offset-2 hover:text-primary transition-colors">
              Privacy Policy
            </a>
            , and{" "}
            <a href="/legal#refund" className="underline underline-offset-2 hover:text-primary transition-colors">
              Refund Policy
            </a>
            .
          </p>
        </motion.div>

      </div>
    </section>
  );
}
