import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileSearch, Shield, Zap, Target, AlertTriangle } from "lucide-react";
import { Helmet } from "@/components/Helmet";
import { InputPanel } from "@/components/docaudit/InputPanel";
import { TaxonomyConfig } from "@/components/docaudit/TaxonomyConfig";
import { GapReport } from "@/components/docaudit/GapReport";
import { EmailCaptureModal } from "@/components/EmailCaptureModal";

async function safeJsonParse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("Service unavailable, please try again");
  }
}

type Step = "input" | "configure" | "gate" | "report";

interface AuditResult {
  overallScore: number;
  topicCoverages: {
    topic: string;
    score: number;
    severity: "critical" | "high" | "medium" | "low";
    recommendation: string;
  }[];
  summary: string;
}

const DOCAUDIT_SCENARIOS = [
  {
    kbName: "AI Startup Knowledge Base — Practice Audit",
    preset: "AI Readiness Checklist",
    text: `AI Strategy Overview

We are building an AI-powered product recommendation engine. Our team uses machine learning to improve user outcomes. We plan to integrate large language models into our core product workflow in Q3.

Team & Tools

Our engineering team has 8 people. We use Python and TensorFlow, deployed on AWS EC2. We are evaluating several vendors for embeddings and inference.

Current Status

A prototype is running in staging. We expect to reach production by end of year.`,
  },
  {
    kbName: "Advanced Search v2.1 — Launch Package",
    preset: "Feature Launch Docs",
    text: `Advanced Search v2.1 — Product Requirements Document

Overview
Advanced Search v2.1 introduces semantic search to our document management platform. Users can search by meaning rather than exact keywords, with results ranked by relevance score.

Target Users
Primary: Power users managing 500+ document libraries. Secondary: Team administrators configuring search behavior for their workspace.

Acceptance Criteria
- Search results return within 1.5 seconds for libraries up to 10,000 documents
- Semantic relevance score displayed alongside each result
- Filter options: document type, date range, author, custom tags
- Saved search presets accessible via bookmark icon

API Documentation
GET /api/v2/search
Parameters: q (string, required), type (enum: document|folder|all), from/to (ISO8601), limit (int, 1-100, default 20), semantic (bool, default true)
Response: { results: [...], total: int, took_ms: int }

User Guide
Click the search bar at the top of your workspace. Type naturally — "budget documents from last quarter" works as well as specific keywords. Use the left filter panel to narrow by type, date, or author. Save any search configuration as a named preset with the bookmark icon.`,
  },
  {
    kbName: "Consulting Knowledge Base — General Audit",
    preset: "General Technical Docs",
    text: `Getting Started

Welcome to the documentation hub. This guide covers our consulting methodology and how to work with us.

Engagement Process
Our typical engagement begins with a discovery call to understand your knowledge management challenges. We then conduct a structured 4-stage process producing a complete knowledge architecture blueprint.

Stage 1: Domain Mapping — we define knowledge domain boundaries and inventory existing content.
Stage 2: Taxonomy Design — we create a categorization hierarchy tailored to your content and use cases.
Stage 3: Retrieval Architecture — we design the metadata schema, chunking strategy, and retrieval patterns.
Stage 4: Deliverable — a comprehensive architecture document ready for your engineering team.

Working With Our Team
Your primary contact is your Knowledge Architect. Weekly check-ins are scheduled throughout. All deliverables are provided in Markdown format.

Frequently Asked Questions
How long does a typical engagement take? Approximately 2 weeks from kickoff to deliverable.
What document formats do you accept? PDF, DOCX, Markdown, Notion exports, and web URLs.
Do you offer ongoing support? Yes — retainer clients receive monthly reviews and priority support.`,
  },
];

export default function DocAudit() {
  const [toolEnabled, setToolEnabled] = useState(true);
  const [checkingTool, setCheckingTool] = useState(true);
  const [onboardingCopy, setOnboardingCopy] = useState<string>("");
  const [practiceText, setPracticeText] = useState("");
  const [practicePreset, setPracticePreset] = useState("");

  useEffect(() => {
    fetch("/api/public/tools")
      .then((res) => (res.ok ? res.json() : null))
      .then((tools) => {
        if (Array.isArray(tools)) {
          const docaudit = tools.find((t: { slug: string; enabled: boolean; onboardingCopy?: string }) => t.slug === "docaudit");
          if (docaudit && !docaudit.enabled) setToolEnabled(false);
          if (docaudit?.onboardingCopy) setOnboardingCopy(docaudit.onboardingCopy);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingTool(false));
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("practice");
    if (p) {
      const num = parseInt(p, 10);
      const scenario = DOCAUDIT_SCENARIOS[num - 1];
      if (scenario) {
        setPracticeText(scenario.text);
        setPracticePreset(scenario.preset);
        setKbName(scenario.kbName);
      }
    }
  }, []);

  const [step, setStep] = useState<Step>("input");
  const [chunks, setChunks] = useState<string[]>([]);
  const [kbName, setKbName] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGate, setShowGate] = useState(false);
  const [gateUnlocked, setGateUnlocked] = useState(false);
  const [inputType, setInputType] = useState<string>("unknown");

  const handleChunksReady = (newChunks: string[], detectedInputType: string) => {
    setChunks(newChunks);
    setInputType(detectedInputType);
    setStep("configure");
  };

  const handleStartAnalysis = async (topics: string[]) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch("/api/audit/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chunks, topics, kbName, _inputType: inputType }),
      });

      const data = await safeJsonParse(res);
      if (!res.ok) throw new Error((data.error as string) || "Request failed");

      setResult(data as unknown as AuditResult);
      setShowGate(true);
      setStep("gate");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setStep("input");
    setChunks([]);
    setKbName("");
    setResult(null);
    setError(null);
    setShowGate(false);
    setGateUnlocked(false);
  };

  const handleEmailSubmit = async (data: { email: string; firstName: string }): Promise<boolean> => {
    try {
      const res = await fetch("/api/public/capture-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          firstName: data.firstName,
          toolSource: "docaudit",
          documentType: kbName || undefined,
        }),
      });
      if (!res.ok) return false;
    } catch {
      return false;
    }
    setShowGate(false);
    setGateUnlocked(true);
    setStep("report");
    return true;
  };

  const handleGateSkip = () => {
    setShowGate(false);
    setGateUnlocked(false);
    setStep("report");
  };

  const features = [
    { icon: <FileSearch className="w-5 h-5" />, title: "Multi-Source Ingestion", desc: "Upload files, paste text, scrape URLs, or import from Notion" },
    { icon: <Target className="w-5 h-5" />, title: "Semantic Gap Detection", desc: "AI-powered topic coverage mapping using embeddings" },
    { icon: <Zap className="w-5 h-5" />, title: "Actionable Insights", desc: "Prioritized recommendations powered by GPT-4o" },
    { icon: <Shield className="w-5 h-5" />, title: "Exportable Reports", desc: "Download your gap analysis as a branded PDF" },
  ];

  if (checkingTool) {
    return (
      <div className="bg-background min-h-screen text-foreground flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!toolEnabled) {
    return (
      <div className="bg-background min-h-screen text-foreground flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Tool Unavailable</h1>
          <p className="text-muted-foreground mb-6">DocAudit is currently disabled. Please check back later.</p>
          <a href="/" className="text-primary hover:underline">← Back to home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen text-foreground selection:bg-primary/30 selection:text-white overflow-x-hidden">
      <Helmet
        title="DocAudit — Documentation Gap Analysis · Synaptica Knowledge Systems"
        description="Submit your knowledge base content and get an AI-powered audit of coverage gaps, with prioritized recommendations for what to document next."
        ogTitle="DocAudit — Documentation Gap Analysis"
        ogDescription="AI-powered documentation gap analysis — find what's missing from your knowledge base before your users do."
        ogType="website"
      />
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">Synaptica</span>
            </a>
            <div className="w-px h-6 bg-white/10" />
            <span className="gradient-text font-bold text-lg">DocAudit</span>
          </div>

          {step !== "input" && step !== "report" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className={step === "configure" ? "text-primary" : ""}>
                {step === "configure" && "Step 2: Configure Audit"}
              </span>
            </div>
          )}
        </div>
      </nav>

      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {step === "input" && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
              >
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  <span className="gradient-text">Documentation</span> Gap Analysis
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Submit your knowledge base content and get an AI-powered audit of coverage gaps,
                  with prioritized recommendations for what to document next.
                </p>
                {onboardingCopy && (
                  <p className="mt-4 text-sm text-primary/80 max-w-2xl mx-auto leading-relaxed">
                    {onboardingCopy}
                  </p>
                )}
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {features.map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass rounded-xl p-4 text-center"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3 text-primary">
                      {f.icon}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{f.title}</h3>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </motion.div>
                ))}
              </div>

              <InputPanel
                onChunksReady={handleChunksReady}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                practiceText={practiceText || undefined}
              />
            </>
          )}

          {step === "configure" && (
            <TaxonomyConfig
              kbName={kbName}
              setKbName={setKbName}
              onStartAnalysis={handleStartAnalysis}
              isAnalyzing={isAnalyzing}
              chunkCount={chunks.length}
              practicePreset={practicePreset || undefined}
            />
          )}

          {step === "gate" && result && (
            <EmailCaptureModal
              open={showGate}
              onSubmit={handleEmailSubmit}
              onSkip={handleGateSkip}
              toolName="Your DocAudit report"
            />
          )}

          {step === "report" && result && (
            <GapReport result={result} kbName={kbName} onReset={handleReset} gateUnlocked={gateUnlocked} />
          )}

          {error && step === "configure" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive"
            >
              {error}
            </motion.div>
          )}
        </div>
      </main>

      <footer className="border-t border-white/5 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            DocAudit — Part of the Synaptica Knowledge Systems Suite
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by OpenAI Embeddings & GPT-4o
          </p>
        </div>
      </footer>
    </div>
  );
}
