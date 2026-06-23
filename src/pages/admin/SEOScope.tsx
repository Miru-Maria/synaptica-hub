import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, Copy, Check, Trash2, Search, Download } from "lucide-react";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

type AnalysisType = "full" | "keywords" | "content" | "technical";

const TYPES: { value: AnalysisType; label: string; description: string }[] = [
  { value: "full", label: "Full SEO Audit", description: "Title, meta, headings, keywords, content, technical, and action list" },
  { value: "keywords", label: "Keyword Analysis", description: "Keyword usage, placement, opportunities, and semantic gaps" },
  { value: "content", label: "Content Quality", description: "Depth, E-E-A-T signals, readability, intent alignment" },
  { value: "technical", label: "Technical Elements", description: "Title tags, meta, headings, image alt text, schema markup" },
];

const SEOSCOPE_PRACTICE_SCENARIOS = [
  {
    content: `Knowledge Management Software for Growing Teams

Tired of losing track of critical information? Our platform helps teams organize, share, and retrieve knowledge at the speed of thought.

What We Do
We build intelligent documentation systems that connect your team's knowledge to the workflows they use every day. Whether you're onboarding new hires, documenting processes, or building a customer-facing knowledge base, our platform makes it searchable, maintainable, and actionable.

Key Features
Smart search powered by AI — find any piece of information in seconds, not minutes. Automatic content suggestions based on what your team is currently working on. Version history and change tracking for every document. Role-based access controls and audit logs. Integration with Slack, Notion, Confluence, and 30+ other tools.

Pricing
Starter: $29/month for up to 10 users. Growth: $79/month for up to 50 users. Enterprise: custom pricing for unlimited users and dedicated support.

Customers
Used by over 1,200 teams including engineering, product, legal, and customer success departments. Average onboarding time reduced by 47%. Support ticket volume decreased by 32% within 90 days.`,
    targetKeywords: "knowledge management software, team documentation platform, internal knowledge base",
    analysisType: "full" as AnalysisType,
    url: "",
  },
  {
    content: `How to Build a Retrieval-Augmented Generation (RAG) Pipeline: A Complete Guide

Introduction
Retrieval-Augmented Generation (RAG) combines the power of large language models with a searchable knowledge base to produce accurate, grounded answers. Unlike pure LLM generation, RAG grounds every response in specific retrieved documents, reducing hallucinations and improving accuracy.

Step 1: Prepare Your Documents
Before building your pipeline, prepare your source documents by chunking them into smaller pieces (typically 200–500 tokens), cleaning up formatting, and ensuring each chunk is self-contained enough to answer a question on its own.

Step 2: Generate Embeddings
Use an embedding model (OpenAI text-embedding-3-small for cost efficiency) to convert each chunk into a dense vector representation. Store vectors in a vector database like Pinecone, Weaviate, or pgvector.

Step 3: Build the Retrieval Layer
When a user asks a question, embed the query using the same model, then perform a cosine similarity search to retrieve the top-K most relevant chunks. K=3 to K=5 is a good starting point.

Step 4: Generate the Response
Combine retrieved chunks with the user question in a prompt template and send to your LLM. Include chunk citations for transparency.

Step 5: Evaluate and Iterate
Measure retrieval accuracy, response quality, and latency. Adjust chunk size, overlap, and K as needed.`,
    targetKeywords: "RAG pipeline tutorial, retrieval augmented generation guide, build RAG system",
    analysisType: "keywords" as AnalysisType,
    url: "",
  },
  {
    content: `Knowledge Architecture Consulting | Synaptica Knowledge Systems

We help AI-forward teams build knowledge bases that actually work at retrieval time.

The Problem
Most teams build their knowledge bases for humans to browse, not for AI to retrieve from. That's why your chatbot hallucinates, your search returns irrelevant results, and your support team still gets the same questions every day.

Our Solution
Synaptica runs a structured 2-week engagement — the KA Sprint — that produces a complete knowledge architecture blueprint: taxonomy design, retrieval schema, chunking strategy, and metadata framework. Everything your engineering team needs to build a knowledge base that performs at production scale.

What You Get
A hierarchical content taxonomy tailored to your domain. A retrieval metadata schema with field names, types, and query patterns. A chunking strategy with target sizes, overlap rules, and edge case handling. An executive summary for stakeholders explaining why the architecture works.

Who This Is For
Engineering teams building RAG applications who want to get the knowledge layer right the first time. Product teams launching AI assistants who need structured content before they can ship. Knowledge managers inheriting a legacy content library that doesn't scale to AI.

Pricing
KA Sprint Standard: $2,500 — 2-week engagement, one domain, two revision rounds. KA Sprint Extended: $4,000 — multi-domain or complex systems.`,
    targetKeywords: "knowledge architecture consulting, RAG consulting, AI knowledge base design",
    analysisType: "content" as AnalysisType,
    url: "",
  },
];

export default function SEOScope() {
  const [, setLocation] = useLocation();
  const [authed, setAuthed] = useState(false);
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [targetKeywords, setTargetKeywords] = useState("");
  const [analysisType, setAnalysisType] = useState<AnalysisType>("full");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) { setLocation("/admin/login"); return; }
    setAuthed(true);
  }, [setLocation]);

  useEffect(() => {
    if (!authed) return;
    const params = new URLSearchParams(window.location.search);
    const p = params.get("practice");
    if (!p) return;
    const scenario = SEOSCOPE_PRACTICE_SCENARIOS[parseInt(p, 10) - 1];
    if (!scenario) return;
    setContent(scenario.content);
    setTargetKeywords(scenario.targetKeywords);
    setAnalysisType(scenario.analysisType);
    if (scenario.url) setUrl(scenario.url);
  }, [authed]);

  const fetchPage = async () => {
    if (!url.trim()) return;
    setFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/seoscope/fetch-url", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to fetch page");
      } else {
        setContent(data.content);
      }
    } catch {
      setError("Network error while fetching page");
    } finally {
      setFetching(false);
    }
  };

  const analyze = async () => {
    if (!content.trim() && !url.trim()) { setError("Paste page content or enter a URL."); return; }
    setError(null);
    setResult("");
    setStatusMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/seoscope/analyze", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ content, url, targetKeywords, analysisType }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setError(err.error || "Request failed");
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setError("Streaming not supported"); setLoading(false); return; }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.status) setStatusMsg(parsed.status);
            if (parsed.text) { setStatusMsg(""); setResult((prev) => prev + parsed.text); }
            if (parsed.error) setError(parsed.error);
          } catch { }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setStatusMsg("");
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!authed) return null;

  const canAnalyze = !loading && (content.trim().length > 0 || url.trim().length > 0);
  const isValidUrl = (() => { try { new URL(url); return true; } catch { return false; } })();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button onClick={() => setLocation("/admin")} className="p-2 rounded-lg hover:bg-neutral-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-semibold">SEOScope</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <p className="text-neutral-400 text-sm">
          Analyze any page for SEO opportunities. Enter a URL to auto-fetch and extract content, or paste content directly. Add target keywords for a more focused report.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Analysis Type</label>
              <div className="grid grid-cols-1 gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setAnalysisType(t.value)}
                    className={`text-left p-3 rounded-lg border transition-all ${analysisType === t.value ? "border-emerald-500 bg-emerald-500/10" : "border-neutral-700 hover:border-neutral-600 bg-neutral-900"}`}
                  >
                    <p className="text-sm font-medium text-neutral-100">{t.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Page URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && isValidUrl) fetchPage(); }}
                  placeholder="https://example.com/page"
                  className="flex-1 bg-neutral-900 border border-neutral-700 text-neutral-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder:text-neutral-600"
                />
                <button
                  onClick={fetchPage}
                  disabled={fetching || !isValidUrl}
                  title="Fetch page content from URL"
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed border border-neutral-700 rounded-lg text-sm text-neutral-300 transition-colors whitespace-nowrap"
                >
                  {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {fetching ? "Fetching…" : "Fetch Page"}
                </button>
              </div>
              <p className="text-xs text-neutral-600">Enter a URL and click Fetch Page to auto-extract all SEO-relevant content, or paste content manually below.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Target Keywords <span className="text-neutral-600 font-normal">(optional)</span></label>
              <input
                type="text"
                value={targetKeywords}
                onChange={(e) => setTargetKeywords(e.target.value)}
                placeholder="e.g. knowledge architecture, RAG pipeline, enterprise AI"
                className="w-full bg-neutral-900 border border-neutral-700 text-neutral-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder:text-neutral-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-300">
                  Page Content
                  {content && <span className="ml-2 text-xs font-normal text-emerald-500">✓ ready</span>}
                </label>
                {content && (
                  <button onClick={() => setContent("")} className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Content will appear here after fetching, or paste it manually — title, headings, body text, meta description..."
                rows={10}
                className="w-full bg-neutral-900 border border-neutral-700 text-neutral-100 rounded-lg px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder:text-neutral-600 font-mono"
              />
              <p className="text-xs text-neutral-600">{content.length.toLocaleString()} characters</p>
            </div>

            {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>}

            <button
              onClick={analyze}
              disabled={!canAnalyze}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 font-semibold rounded-lg transition-colors"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</> : <><Search className="w-4 h-4" /> Run SEO Analysis</>}
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300">SEO Report</label>
              {result && (
                <button onClick={copy} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors">
                  {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              )}
            </div>
            <div className="min-h-[560px] bg-neutral-900 border border-neutral-700 rounded-lg p-5 text-sm text-neutral-200 leading-relaxed overflow-auto whitespace-pre-wrap">
              {loading && !result && (
                <div className="flex items-center gap-2 text-neutral-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{statusMsg || "Running SEO analysis…"}</span>
                </div>
              )}
              {loading && result && statusMsg && (
                <div className="flex items-center gap-2 text-neutral-500 mb-3 text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>{statusMsg}</span>
                </div>
              )}
              {!loading && !result && <p className="text-neutral-600">SEO analysis will appear here.</p>}
              {result}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
