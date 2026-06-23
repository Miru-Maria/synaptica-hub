import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ExternalLink, CheckCircle2, AlertCircle, Clock, Loader2, Zap, Brain, FileSearch, FileOutput } from "lucide-react";

interface DemoSession {
  sessionJwt: string;
  tools: string[];
  label: string;
  expiresAt: string;
}

const TOOL_META: Record<string, { label: string; description: string; path: string; icon: React.ComponentType<{ className?: string }> }> = {
  "ka-sprint": {
    label: "Knowledge Architecture Sprint",
    description: "AI-powered taxonomy design, retrieval logic mapping, and knowledge architecture deliverables.",
    path: "/admin/ka-sprint",
    icon: Brain,
  },
  "prompt-workshop": {
    label: "Prompt Engineering Workshop",
    description: "Design, test, and document prompt templates with variable substitution and style guides.",
    path: "/admin/prompt-workshop",
    icon: Zap,
  },
  "rag": {
    label: "RAG Pipeline Demo",
    description: "Ingest documents, configure chunking and embeddings, then chat with your knowledge base.",
    path: "/admin/rag-pipeline",
    icon: FileSearch,
  },
  "docscope": {
    label: "DocScope",
    description: "Deep document analysis — surface gaps, inconsistencies, and structural issues instantly.",
    path: "/admin/docscope",
    icon: FileSearch,
  },
  "docforge": {
    label: "DocForge",
    description: "AI-assisted document generation with PDF, DOCX, and Markdown export.",
    path: "/admin/docforge",
    icon: FileOutput,
  },
};

export default function DemoPortal() {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setError("No demo token provided. Please use the link you were given.");
      setLoading(false);
      return;
    }

    const existing = sessionStorage.getItem("demo_session");
    if (existing) {
      try {
        const parsed = JSON.parse(existing) as DemoSession;
        if (new Date(parsed.expiresAt) > new Date()) {
          setSession(parsed);
          setLoading(false);
          return;
        }
      } catch {
        sessionStorage.removeItem("demo_session");
        sessionStorage.removeItem("demo_token");
      }
    }

    fetch("/api/demo/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data: DemoSession & { error?: string }) => {
        if (data.error) { setError(data.error); return; }
        sessionStorage.setItem("demo_token", data.sessionJwt);
        sessionStorage.setItem("demo_session", JSON.stringify(data));
        setSession(data);
      })
      .catch(() => setError("Could not start demo session. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const launchTool = (path: string) => {
    setLocation(path);
  };

  const expiresIn = session ? (() => {
    const ms = new Date(session.expiresAt).getTime() - Date.now();
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  })() : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Starting demo session…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-100 mb-1">Demo unavailable</h2>
            <p className="text-sm text-neutral-400">{error}</p>
          </div>
          <p className="text-xs text-neutral-600">If you believe this is an error, contact the person who shared this link with you.</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const availableTools = session.tools
    .map((key) => ({ key, ...(TOOL_META[key] ?? null) }))
    .filter((t) => t.label);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/60 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/phoenix-logo.png" alt="Synaptica" className="h-7 w-7 opacity-80" />
            <div>
              <span className="font-semibold text-sm text-neutral-100">Synaptica Knowledge Systems</span>
              <span className="text-neutral-500 text-sm mx-2">·</span>
              <span className="text-sm text-emerald-400">Demo</span>
            </div>
          </div>
          {expiresIn && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Expires in {expiresIn}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-full mb-4">
            <CheckCircle2 className="w-3 h-3" />
            Demo session active
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-100 mb-2">
            Welcome, <span className="text-emerald-400">{session.label}</span>
          </h1>
          <p className="text-neutral-400 text-sm max-w-xl">
            Your demo session gives you live access to the tools below. Use them with your own content — everything runs in real-time.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {availableTools.map(({ key, label, description, path, icon: Icon }) => (
            <div
              key={key}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-100 text-sm mb-1">{label}</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed mb-4">{description}</p>
                  <button
                    onClick={() => launchTool(path)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Launch tool
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-800 flex items-center justify-between">
          <p className="text-xs text-neutral-600">
            Powered by <span className="text-neutral-500">Synaptica Knowledge Systems</span>
          </p>
          <a
            href="/"
            className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            synapticaknowledge.com
          </a>
        </div>
      </main>
    </div>
  );
}
