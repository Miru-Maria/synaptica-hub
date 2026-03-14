import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Minus,
  ExternalLink,
  BookOpen,
  Brain,
  Map,
  FolderKanban,
  StickyNote,
  Sparkles,
  ChevronDown,
  Target,
  Layers,
  Zap,
  Users,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { CurrencyProvider, useCurrency } from "@/context/currency";
import { CurrencySelector } from "@/components/CurrencySelector";
import { PhoenixLogo } from "@/components/PhoenixLogo";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { Link } from "wouter";

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
  { icon: <Map className="w-5 h-5 text-primary" />, label: "Skill Map", description: "Visualize your competencies across AI, knowledge architecture, and systems thinking. Track growth and identify gaps." },
  { icon: <BookOpen className="w-5 h-5 text-secondary" />, label: "Learning Paths", description: "Three progressive tiers of structured curriculum — from AI Transition fundamentals to expert-level Knowledge Systems." },
  { icon: <FolderKanban className="w-5 h-5 text-primary" />, label: "Project Tracker", description: "Apply what you learn through guided projects. Track progress, set milestones, and build a portfolio of real work." },
  { icon: <StickyNote className="w-5 h-5 text-secondary" />, label: "Knowledge Notes", description: "Capture insights, connect ideas, and build your personal knowledge base as you learn." },
  { icon: <Brain className="w-5 h-5 text-primary" />, label: "AI Tutor", description: "An AI assistant trained on the curriculum that answers questions, explains concepts, and guides your learning." },
];

const audiences = [
  { icon: <Target className="w-6 h-6 text-primary" />, title: "Knowledge Managers", description: "You organize information for teams but want to understand how AI changes the game." },
  { icon: <Layers className="w-6 h-6 text-primary" />, title: "Information Architects", description: "You design taxonomies and content structures and need to integrate AI-driven approaches." },
  { icon: <Zap className="w-6 h-6 text-primary" />, title: "AI-Curious Professionals", description: "You see AI transforming your industry and want a structured path to build real skills." },
  { icon: <Users className="w-6 h-6 text-primary" />, title: "Team Leads & Consultants", description: "You need to guide teams through AI adoption with a framework, not just buzzwords." },
];

const faqs = [
  {
    q: "How much time do I need to commit each week?",
    a: "Most learners spend 3–5 hours per week. The curriculum is self-paced, so you can adjust based on your schedule. Each module is designed for focused, practical sessions rather than long lectures.",
  },
  {
    q: "Do I need prior AI or technical knowledge?",
    a: "No. The Learning OS starts with Tier 1 (AI Transition), which assumes no prior AI experience. You should be comfortable with digital tools and have some professional experience in knowledge work, but no coding or data science background is required.",
  },
  {
    q: "What happens after I enroll?",
    a: "You'll get immediate access to the Learning OS dashboard. From there, you can take a skill assessment, start your first learning path, and begin tracking projects. Paid plans include a 7-day free trial.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle. The Explorer plan is always free — no credit card required.",
  },
  {
    q: "What is your refund policy?",
    a: "All paid plans include a 7-day free trial. If you cancel within the trial period, you won't be charged. After the trial, subscriptions are billed monthly and you can cancel anytime — no refunds for partial months. See our full Refund Policy for details.",
  },
  {
    q: "Is this a certification program?",
    a: "Not currently. The Learning OS is focused on practical skill-building and portfolio development. You'll build real projects and a visible skill map, which is often more valuable than a certificate in this emerging field.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4"
      >
        <span className="text-sm font-medium text-foreground">{q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="pb-5"
        >
          <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
        </motion.div>
      )}
    </div>
  );
}

function LearningOSContent() {
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-background min-h-screen text-foreground selection:bg-primary/30 selection:text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-white/10 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <PhoenixLogo size={22} glowIntensity="medium" />
            </div>
            <span className="font-semibold tracking-wide text-sm md:text-base hidden sm:block">
              Synaptica <span className="text-muted-foreground font-normal">Knowledge Systems</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollToSection("curriculum")} className="nav-link text-sm font-medium">Curriculum</button>
            <button onClick={() => scrollToSection("pricing")} className="nav-link text-sm font-medium">Pricing</button>
            <button onClick={() => scrollToSection("faq")} className="nav-link text-sm font-medium">FAQ</button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="btn-primary py-2 px-5 text-sm"
            >
              Start Learning
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="pt-32 pb-20 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center"
            >
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary mb-6">
                <GraduationCap className="w-4 h-4" /> Synaptica Learning OS
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Master AI Knowledge Architecture —{" "}
                <span className="text-primary">Systematically</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                A structured operating system for professionals transitioning into AI knowledge architecture.
                Five integrated modules. Three progressive learning tiers. One AI tutor that knows the field.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => scrollToSection("pricing")}
                  className="btn-primary py-3 px-8 text-base inline-flex items-center justify-center gap-2"
                >
                  Start Learning <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href={LEARNING_OS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 py-3 px-8 rounded-xl text-base font-medium border border-white/10 text-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                >
                  Preview Platform <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center mb-14"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Who Is This For?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The Learning OS is built for professionals who work with knowledge and want to lead the AI transition — not just survive it.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {audiences.map((a, i) => (
                <motion.div
                  key={a.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.08 }}
                  className="glass border border-white/8 rounded-2xl p-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    {a.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{a.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="curriculum" className="py-20 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center mb-14"
            >
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary mb-4">
                <Sparkles className="w-3.5 h-3.5" /> Curriculum
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Five Integrated Modules</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Each module works on its own, but they're designed to work together — building a complete system for learning, applying, and mastering AI knowledge architecture.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.08 }}
                  className="glass border border-white/8 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {m.icon}
                    </div>
                    <h3 className="font-semibold text-foreground">{m.label}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: 0.4 }}
              className="mt-12 glass border border-white/8 rounded-2xl p-8 text-center"
            >
              <h3 className="text-xl font-bold mb-3">Three Progressive Tiers</h3>
              <div className="flex flex-col md:flex-row justify-center gap-6 md:gap-12 mt-6">
                <div>
                  <p className="text-primary font-semibold mb-1">Tier 1: AI Transition</p>
                  <p className="text-sm text-muted-foreground">Foundations of AI in knowledge work</p>
                </div>
                <div className="hidden md:block text-muted-foreground/30">→</div>
                <div>
                  <p className="text-primary font-semibold mb-1">Tier 2: Knowledge Systems</p>
                  <p className="text-sm text-muted-foreground">Building and managing AI-augmented systems</p>
                </div>
                <div className="hidden md:block text-muted-foreground/30">→</div>
                <div>
                  <p className="text-primary font-semibold mb-1">Tier 3: Expert Practice</p>
                  <p className="text-sm text-muted-foreground">Advanced strategies and leadership</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="pricing" className="py-20 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="text-center sm:text-left max-w-2xl"
              >
                <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary mb-4">
                  <Sparkles className="w-3.5 h-3.5" /> Pricing
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Path</h2>
                <p className="text-lg text-muted-foreground">
                  Start free, then unlock the full curriculum when you're ready. All paid plans include a 7-day free trial.
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

        <section id="faq" className="py-20 relative z-10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">
                Everything you need to know before getting started.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              {faqs.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-20 relative z-10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join professionals who are building real AI knowledge architecture skills — not just reading about them.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => scrollToSection("pricing")}
                  className="btn-primary py-3 px-8 text-base inline-flex items-center justify-center gap-2"
                >
                  Enroll Now <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href={LEARNING_OS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 py-3 px-8 rounded-xl text-base font-medium border border-white/10 text-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                >
                  Try Free First <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-background/80 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="opacity-60">
              <PhoenixLogo size={28} glowIntensity="low" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground tracking-wide">Synaptica <span className="font-normal text-muted-foreground">Knowledge Systems</span></h4>
              <p className="text-xs text-muted-foreground">Designing the intelligence layer of the modern organization</p>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground/60">
            <p>© 2026 Miruna Cristiana Paun · Synaptica Knowledge Systems · All rights reserved</p>
            <div className="flex items-center gap-4">
              <a href="/legal#terms" className="hover:text-primary transition-colors">Terms</a>
              <a href="/legal#privacy" className="hover:text-primary transition-colors">Privacy</a>
              <a href="/legal#refund" className="hover:text-primary transition-colors">Refunds</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LearningOSPage() {
  return (
    <CurrencyProvider>
      <LearningOSContent />
    </CurrencyProvider>
  );
}
