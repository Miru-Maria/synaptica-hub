import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileSearch, Shield, Zap, Target } from "lucide-react";
import { InputPanel } from "@/components/docaudit/InputPanel";
import { TaxonomyConfig } from "@/components/docaudit/TaxonomyConfig";
import { GapReport } from "@/components/docaudit/GapReport";

type Step = "input" | "configure" | "report";

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

export default function DocAudit() {
  const [step, setStep] = useState<Step>("input");
  const [chunks, setChunks] = useState<string[]>([]);
  const [kbName, setKbName] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChunksReady = (newChunks: string[]) => {
    setChunks(newChunks);
    setStep("configure");
  };

  const handleStartAnalysis = async (topics: string[]) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch("/api/audit/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chunks, topics, kbName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data);
      setStep("report");
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
  };

  const features = [
    { icon: <FileSearch className="w-5 h-5" />, title: "Multi-Source Ingestion", desc: "Upload files, paste text, scrape URLs, or import from Notion" },
    { icon: <Target className="w-5 h-5" />, title: "Semantic Gap Detection", desc: "AI-powered topic coverage mapping using embeddings" },
    { icon: <Zap className="w-5 h-5" />, title: "Actionable Insights", desc: "Prioritized recommendations powered by GPT-4o" },
    { icon: <Shield className="w-5 h-5" />, title: "Exportable Reports", desc: "Download your gap analysis as a branded PDF" },
  ];

  return (
    <div className="bg-background min-h-screen text-foreground selection:bg-primary/30 selection:text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
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
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
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
            />
          )}

          {step === "report" && result && (
            <GapReport result={result} kbName={kbName} onReset={handleReset} />
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
