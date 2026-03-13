import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, RefreshCw, Copy, Check, ChevronRight } from "lucide-react";

function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

type Step = "input" | "taxonomy" | "retrieval" | "document";

const stepLabels: Record<Step, string> = {
  input: "Knowledge Base Input",
  taxonomy: "Taxonomy Design",
  retrieval: "Retrieval Logic & Metadata Schema",
  document: "Architecture Document",
};

const stepNumbers: Record<Step, number> = {
  input: 1,
  taxonomy: 2,
  retrieval: 3,
  document: 4,
};

export default function KASprint() {
  const [, setLocation] = useLocation();
  const [authed, setAuthed] = useState(false);
  const [step, setStep] = useState<Step>("input");

  const [domain, setDomain] = useState("");
  const [currentStructure, setCurrentStructure] = useState("");
  const [primaryUseCase, setPrimaryUseCase] = useState("");
  const [targetSystem, setTargetSystem] = useState("");

  const [taxonomyContent, setTaxonomyContent] = useState("");
  const [retrievalContent, setRetrievalContent] = useState("");
  const [documentContent, setDocumentContent] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me", { headers: authHeaders() });
      if (!res.ok) {
        setLocation("/admin/login");
        return;
      }
      setAuthed(true);
    } catch {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const generateTaxonomy = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ka-sprint/taxonomy", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ domain, currentStructure, primaryUseCase, targetSystem }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate taxonomy");
      }
      const data = await res.json();
      setTaxonomyContent(JSON.stringify(data, null, 2));
      setStep("taxonomy");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const generateRetrieval = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ka-sprint/retrieval-schema", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          domain,
          currentStructure,
          primaryUseCase,
          targetSystem,
          taxonomy: taxonomyContent,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate retrieval schema");
      }
      const data = await res.json();
      setRetrievalContent(JSON.stringify(data, null, 2));
      setStep("retrieval");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const generateDocument = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ka-sprint/architecture-document", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          domain,
          currentStructure,
          primaryUseCase,
          targetSystem,
          taxonomy: taxonomyContent,
          retrievalSchema: retrievalContent,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate document");
      }
      const data = await res.json();
      setDocumentContent(data.document);
      setStep("document");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(documentContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = documentContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <p className="text-neutral-400">Loading…</p>
      </div>
    );
  }

  const steps: Step[] = ["input", "taxonomy", "retrieval", "document"];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="flex items-center gap-2 text-neutral-400 hover:text-neutral-100 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </a>
            <div className="w-px h-6 bg-neutral-700" />
            <h1 className="font-semibold text-lg">
              <span className="text-emerald-400">KA</span> Sprint
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  step === s
                    ? "bg-emerald-400/15 text-emerald-400 border border-emerald-400/30"
                    : stepNumbers[step] > stepNumbers[s]
                    ? "bg-neutral-800/50 text-neutral-300 border border-neutral-700"
                    : "bg-neutral-900 text-neutral-500 border border-neutral-800"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s ? "bg-emerald-400 text-neutral-950" : stepNumbers[step] > stepNumbers[s] ? "bg-neutral-600 text-neutral-300" : "bg-neutral-800 text-neutral-500"
                }`}>
                  {stepNumbers[s]}
                </span>
                <span className="hidden sm:inline">{stepLabels[s]}</span>
              </div>
              {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-neutral-600 shrink-0" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {step === "input" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Describe Your Knowledge Base</h2>
              <p className="text-sm text-neutral-400">
                Provide details about your knowledge domain to generate a tailored architecture.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Domain / Subject Area <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g., Internal engineering documentation for a SaaS platform covering APIs, SDKs, deployment guides, and troubleshooting..."
                  className="w-full h-28 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-neutral-100 placeholder:text-neutral-600 resize-none focus:outline-none focus:border-emerald-400/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Current Structure (optional)
                </label>
                <textarea
                  value={currentStructure}
                  onChange={(e) => setCurrentStructure(e.target.value)}
                  placeholder="e.g., Currently organized by product feature with a flat folder structure in Confluence..."
                  className="w-full h-24 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-neutral-100 placeholder:text-neutral-600 resize-none focus:outline-none focus:border-emerald-400/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Primary Use Case (optional)
                </label>
                <textarea
                  value={primaryUseCase}
                  onChange={(e) => setPrimaryUseCase(e.target.value)}
                  placeholder="e.g., Power an internal support chatbot using RAG, improve onboarding for new engineers..."
                  className="w-full h-24 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-neutral-100 placeholder:text-neutral-600 resize-none focus:outline-none focus:border-emerald-400/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Target RAG System / Audience (optional)
                </label>
                <textarea
                  value={targetSystem}
                  onChange={(e) => setTargetSystem(e.target.value)}
                  placeholder="e.g., Pinecone + LangChain RAG pipeline, audience is L1-L2 support agents..."
                  className="w-full h-24 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-neutral-100 placeholder:text-neutral-600 resize-none focus:outline-none focus:border-emerald-400/50 transition-colors"
                />
              </div>
            </div>

            <button
              onClick={generateTaxonomy}
              disabled={loading || !domain.trim()}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Taxonomy…
                </>
              ) : (
                <>
                  Generate Taxonomy
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {step === "taxonomy" && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">Taxonomy Design</h2>
                <p className="text-sm text-neutral-400">
                  Review and edit the proposed taxonomy. Modify categories, subcategories, and tagging conventions as needed.
                </p>
              </div>
              <button
                onClick={generateTaxonomy}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Regenerate
              </button>
            </div>

            <textarea
              value={taxonomyContent}
              onChange={(e) => setTaxonomyContent(e.target.value)}
              className="w-full h-[500px] bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-neutral-100 font-mono text-sm resize-none focus:outline-none focus:border-emerald-400/50 transition-colors"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setStep("input")}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-sm transition-colors"
              >
                Back
              </button>
              <button
                onClick={generateRetrieval}
                disabled={loading || !taxonomyContent.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Schema…
                  </>
                ) : (
                  <>
                    Generate Retrieval Schema
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === "retrieval" && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">Retrieval Logic & Metadata Schema</h2>
                <p className="text-sm text-neutral-400">
                  Review and edit the retrieval patterns and metadata schema. Adjust field definitions and chunking strategy as needed.
                </p>
              </div>
              <button
                onClick={generateRetrieval}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Regenerate
              </button>
            </div>

            <textarea
              value={retrievalContent}
              onChange={(e) => setRetrievalContent(e.target.value)}
              className="w-full h-[500px] bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-neutral-100 font-mono text-sm resize-none focus:outline-none focus:border-emerald-400/50 transition-colors"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setStep("taxonomy")}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-sm transition-colors"
              >
                Back
              </button>
              <button
                onClick={generateDocument}
                disabled={loading || !retrievalContent.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Document…
                  </>
                ) : (
                  <>
                    Generate Architecture Document
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === "document" && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">Knowledge Architecture Document</h2>
                <p className="text-sm text-neutral-400">
                  Your complete architecture document is ready. Copy it or regenerate if needed.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={generateDocument}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  Regenerate
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Document
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-700 rounded-lg px-6 py-5 prose prose-invert prose-sm max-w-none overflow-auto max-h-[600px]">
              <pre className="whitespace-pre-wrap font-sans text-sm text-neutral-200 leading-relaxed">{documentContent}</pre>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("retrieval")}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-sm transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setStep("input");
                  setDomain("");
                  setCurrentStructure("");
                  setPrimaryUseCase("");
                  setTargetSystem("");
                  setTaxonomyContent("");
                  setRetrievalContent("");
                  setDocumentContent("");
                }}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-sm transition-colors"
              >
                Start New Sprint
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
