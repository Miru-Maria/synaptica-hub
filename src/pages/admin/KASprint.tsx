import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, RefreshCw, Copy, Check, ChevronRight, Save, FolderOpen, Download, Trash2, X, Clock } from "lucide-react";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token") || sessionStorage.getItem("demo_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

type Step = "input" | "taxonomy" | "retrieval" | "document";

const KASPRINT_SCENARIOS = [
  {
    domain: "Customer onboarding and product knowledge for a B2B project management SaaS platform targeting marketing teams. Covers product features, workflow guides, integrations, FAQs, and best practices for teams of 10–200 people.",
    currentStructure: "Confluence wiki with ~200 pages, Loom video tutorial library, and PDF getting-started guides. No consistent naming conventions, minimal tagging, no cross-referencing between sources.",
    primaryUseCase: "AI-powered support chatbot to answer new customer questions during the 30-day onboarding window. Goal: reduce L1 support ticket volume by 40% and improve time-to-first-value for new accounts.",
    targetSystem: "Pinecone for vector storage, LangChain for orchestration, Intercom integration for handoff to human agents. End users are new customers and L1 support agents handling onboarding calls.",
  },
  {
    domain: "Internal compliance documentation, regulatory guidelines, and audit checklists for a Series B fintech startup operating across EU markets. Covers GDPR, PSD2, AML/KYC requirements, and internal compliance procedures.",
    currentStructure: "Shared Google Drive organized by regulation (GDPR/, PSD2/, AML/). Outdated and current document versions mixed together, no version control, no tagging, no full-text search.",
    primaryUseCase: "Employee self-service so non-legal business staff can find compliance answers independently. Target: 60% reduction in routine legal team interruptions, with audit trail for queries that inform business decisions.",
    targetSystem: "Internal Slack bot using OpenAI GPT-4o with a custom retrieval layer. Audience is non-legal staff (finance, product, ops) who need plain-language answers to compliance questions.",
  },
  {
    domain: "DevOps runbooks, incident response playbooks, and infrastructure documentation for a 40-person engineering team running Kubernetes microservices on AWS. Covers service runbooks, on-call procedures, post-mortem templates, and architecture decision records.",
    currentStructure: "Three disconnected systems: Notion (SOPs and runbooks), GitHub READMEs (service-level docs), legacy Confluence (historical architecture decisions). All three used inconsistently with no cross-referencing or unified search.",
    primaryUseCase: "Faster incident response — engineers must find the correct runbook within 2 minutes during an active outage. Current average search time is 8–12 minutes. Secondary: onboarding new engineers to service boundaries.",
    targetSystem: "PagerDuty integration triggers runbook retrieval on alert creation. Slack slash command /runbook [service] [issue-type] for direct queries. Audience is on-call engineers under pressure needing precise, step-by-step guidance.",
  },
];

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

interface KASession {
  id: string;
  clientName: string;
  sessionDate: string;
  step: string;
  domain: string;
  currentStructure: string;
  primaryUseCase: string;
  targetSystem: string;
  taxonomyContent: string;
  retrievalContent: string;
  documentContent: string;
  createdAt: string;
  updatedAt: string;
}

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

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSessionsList, setShowSessionsList] = useState(false);
  const [sessions, setSessions] = useState<KASession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [saveClientName, setSaveClientName] = useState("");
  const [saveSessionDate, setSaveSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState("");

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

  useEffect(() => {
    if (!authed) return;
    const params = new URLSearchParams(window.location.search);
    const p = params.get("practice");
    if (!p) return;
    const num = parseInt(p, 10);
    const scenario = KASPRINT_SCENARIOS[num - 1];
    if (scenario) {
      setDomain(scenario.domain);
      setCurrentStructure(scenario.currentStructure);
      setPrimaryUseCase(scenario.primaryUseCase);
      setTargetSystem(scenario.targetSystem);
    }
  }, [authed]);

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/admin/ka-sprint/sessions", { headers: authHeaders() });
      if (res.ok) setSessions(await res.json());
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
    setSessionsLoading(false);
  };

  const saveSession = async () => {
    if (!saveClientName.trim()) return;
    setSaving(true);
    try {
      const payload = {
        clientName: saveClientName,
        sessionDate: saveSessionDate,
        step,
        domain,
        currentStructure,
        primaryUseCase,
        targetSystem,
        taxonomyContent,
        retrievalContent,
        documentContent,
      };

      let res;
      if (currentSessionId) {
        res = await fetch(`/api/admin/ka-sprint/sessions/${currentSessionId}`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/ka-sprint/sessions", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const saved = await res.json();
        setCurrentSessionId(saved.id);
        setShowSaveModal(false);
        setSaveStatus("Session saved");
        setTimeout(() => setSaveStatus(""), 3000);
      }
    } catch (err) {
      console.error("Failed to save session:", err);
    }
    setSaving(false);
  };

  const loadSession = (session: KASession) => {
    setDomain(session.domain);
    setCurrentStructure(session.currentStructure);
    setPrimaryUseCase(session.primaryUseCase);
    setTargetSystem(session.targetSystem);
    setTaxonomyContent(session.taxonomyContent);
    setRetrievalContent(session.retrievalContent);
    setDocumentContent(session.documentContent);
    setStep(session.step as Step);
    setCurrentSessionId(session.id);
    setSaveClientName(session.clientName);
    setSaveSessionDate(session.sessionDate);
    setShowSessionsList(false);
  };

  const deleteSession = async (id: string) => {
    if (!confirm("Delete this saved session?")) return;
    try {
      const res = await fetch(`/api/admin/ka-sprint/sessions/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (currentSessionId === id) setCurrentSessionId(null);
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const exportSession = async () => {
    if (!currentSessionId) {
      setError("Save the session first before exporting.");
      return;
    }
    try {
      const res = await fetch(`/api/admin/ka-sprint/sessions/${currentSessionId}/export`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "KA-Deliverable.md";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Failed to export session:", err);
    }
  };

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
            <button
              onClick={() => setLocation("/admin")}
              className="flex items-center gap-2 text-neutral-400 hover:text-neutral-100 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
            <div className="w-px h-6 bg-neutral-700" />
            <h1 className="font-semibold text-lg">
              <span className="text-emerald-400">KA</span> Sprint
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus && <span className="text-sm text-emerald-400">{saveStatus}</span>}
            {currentSessionId && (
              <span className="text-xs text-neutral-500 hidden sm:inline">
                {saveClientName}
              </span>
            )}
            <button
              onClick={() => {
                loadSessions();
                setShowSessionsList(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sessions</span>
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium rounded-lg transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>
            {currentSessionId && (
              <button
                onClick={exportSession}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
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
                  setCurrentSessionId(null);
                  setSaveClientName("");
                }}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-sm transition-colors"
              >
                Start New Sprint
              </button>
            </div>
          </div>
        )}
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <h2 className="font-semibold text-lg text-neutral-100">
                {currentSessionId ? "Update Session" : "Save Session"}
              </h2>
              <button onClick={() => setShowSaveModal(false)} className="text-neutral-400 hover:text-neutral-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Client Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={saveClientName}
                  onChange={(e) => setSaveClientName(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-emerald-400/50"
                  placeholder="e.g., Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Session Date</label>
                <input
                  type="date"
                  value={saveSessionDate}
                  onChange={(e) => setSaveSessionDate(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-emerald-400/50"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-800">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSession}
                disabled={saving || !saveClientName.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {currentSessionId ? "Update" : "Save"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSessionsList && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <h2 className="font-semibold text-lg text-neutral-100">Saved Sessions</h2>
              <button onClick={() => setShowSessionsList(false)} className="text-neutral-400 hover:text-neutral-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400 text-sm">No saved sessions yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 hover:border-neutral-600 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-neutral-100 text-sm">{s.clientName}</span>
                            <span className="text-xs bg-emerald-400/15 text-emerald-400 px-2 py-0.5 rounded-full">
                              Step: {s.step}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 truncate">{s.domain || "No domain specified"}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-neutral-500">
                            <Clock className="w-3 h-3" />
                            {s.sessionDate} · Updated {new Date(s.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 ml-3 shrink-0">
                          <button
                            onClick={() => loadSession(s)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-md text-xs text-emerald-300 transition-colors"
                          >
                            <FolderOpen className="w-3 h-3" />
                            Open
                          </button>
                          <button
                            onClick={() => deleteSession(s.id)}
                            className="flex items-center gap-1 px-2 py-1.5 bg-neutral-800 hover:bg-red-500/15 border border-neutral-700 hover:border-red-500/30 rounded-md text-xs text-neutral-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
