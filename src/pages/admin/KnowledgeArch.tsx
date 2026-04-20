import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Database, Search, GitFork, MessageSquare, BookOpen, Zap,
  Plus, Trash2, Upload, Loader2, Check, Copy, ChevronDown, Send,
  RefreshCw, Play, Edit3, X, Tag,
} from "lucide-react";

const BASE = "/api/admin/ka";

function authHeaders(json = false): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  const h: Record<string, string> = {};
  if (token) h["Authorization"] = `Bearer ${token}`;
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { ...authHeaders(true), ...(opts?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

interface KnowledgeBase { id: string; name: string; description: string; chunk_count: number; created_at: string; }
interface OnboardingSession { id: string; kb_id: string | null; role: string; title: string; messages: { role: "user" | "assistant"; content: string; timestamp: string }[]; updated_at: string; }
interface PromptTemplate { id: string; title: string; category: string; description: string; prompt: string; variables: string[]; tags: string[]; is_builtin: boolean; }

type Tab = "search" | "gaps" | "faq" | "onboarding" | "prompts";

const TABS: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "search", label: "Semantic Search", icon: Search, desc: "Vector-powered search across your knowledge base" },
  { id: "gaps", label: "Gap Analyzer", icon: GitFork, desc: "Find what your docs are missing" },
  { id: "faq", label: "FAQ Builder", icon: BookOpen, desc: "Generate audience-tailored FAQs" },
  { id: "onboarding", label: "Onboarding Assistant", icon: MessageSquare, desc: "RAG-powered chat agent for onboarding" },
  { id: "prompts", label: "Prompt Toolkit", icon: Zap, desc: "Reusable prompt library with live sandbox" },
];

function useSSE(onText: (t: string) => void, onError: (e: string) => void, onDone: () => void) {
  return useCallback(async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      onError(err.error || "Request failed");
      onDone();
      return;
    }
    const reader = res.body?.getReader();
    if (!reader) { onError("Streaming not supported"); onDone(); return; }
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
        if (data === "[DONE]") { onDone(); return; }
        try {
          const p = JSON.parse(data);
          if (p.text) onText(p.text);
          if (p.error) { onError(p.error); onDone(); return; }
        } catch { }
      }
    }
    onDone();
  }, [onText, onError, onDone]);
}

function KBSelector({ kbs, value, onChange, onRefresh }: {
  kbs: KnowledgeBase[]; value: string; onChange: (id: string) => void; onRefresh: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg pl-9 pr-8 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          <option value="">— Select a knowledge base —</option>
          {kbs.map((kb) => (
            <option key={kb.id} value={kb.id}>{kb.name} ({kb.chunk_count} chunks)</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
      </div>
      <button onClick={onRefresh} className="p-2.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors">
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );
}

function ResultBox({ content, loading, placeholder, minH = "300px" }: { content: string; loading: boolean; placeholder: string; minH?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-400">Output</label>
        {content && (
          <button onClick={copy} className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
            {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        )}
      </div>
      <div className={`bg-neutral-900 border border-neutral-700 rounded-xl p-5 text-sm text-neutral-200 leading-relaxed overflow-auto whitespace-pre-wrap`} style={{ minHeight: minH }}>
        {loading && !content && <div className="flex items-center gap-2 text-neutral-500"><Loader2 className="w-4 h-4 animate-spin" /><span>Processing...</span></div>}
        {!loading && !content && <p className="text-neutral-600">{placeholder}</p>}
        {content}
      </div>
    </div>
  );
}

// ─── KB MANAGEMENT PANEL ─────────────────────────────────────────────────────

function KBManager({ kbs, loading, onRefresh }: { kbs: KnowledgeBase[]; loading: boolean; onRefresh: () => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [ingestKb, setIngestKb] = useState("");
  const [ingestFile, setIngestFile] = useState<File | null>(null);
  const [ingestText, setIngestText] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [ingestMsg, setIngestMsg] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const createKB = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError("");
    try {
      await apiFetch("/kb", { method: "POST", body: JSON.stringify({ name, description: desc }) });
      setName(""); setDesc("");
      onRefresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setCreating(false); }
  };

  const deleteKB = async (id: string, kbName: string) => {
    if (!confirm(`Delete "${kbName}" and all its content? This cannot be undone.`)) return;
    try { await apiFetch(`/kb/${id}`, { method: "DELETE" }); onRefresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Delete failed"); }
  };

  const ingest = async () => {
    if (!ingestKb) { setError("Select a knowledge base first"); return; }
    if (!ingestFile && !ingestText.trim()) { setError("Add a file or paste text to ingest"); return; }
    setIngesting(true); setIngestMsg(""); setError("");
    try {
      const fd = new FormData();
      if (ingestFile) fd.append("file", ingestFile);
      if (ingestText.trim()) fd.append("rawText", ingestText);
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${BASE}/kb/${ingestKb}/ingest`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ingest failed");
      setIngestMsg(`Ingested ${data.chunks} chunks successfully.`);
      setIngestFile(null); setIngestText("");
      onRefresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Ingest failed"); }
    finally { setIngesting(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Create Knowledge Base</h3>
        <div className="space-y-3 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Knowledge base name" className="w-full bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-neutral-600" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" className="w-full bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-neutral-600" />
          <button onClick={createKB} disabled={creating || !name.trim()} className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-semibold rounded-lg transition-colors text-sm">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
          </button>
        </div>

        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Knowledge Bases</h3>
        <div className="space-y-2">
          {loading && <div className="flex items-center gap-2 text-neutral-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>}
          {!loading && kbs.length === 0 && <p className="text-sm text-neutral-600">No knowledge bases yet.</p>}
          {kbs.map((kb) => (
            <div key={kb.id} className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-medium text-neutral-200">{kb.name}</p>
                <p className="text-xs text-neutral-500">{kb.chunk_count} chunks{kb.description ? ` · ${kb.description}` : ""}</p>
              </div>
              <button onClick={() => deleteKB(kb.id, kb.name)} className="p-1.5 text-neutral-600 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Ingest Documents</h3>
        <div className="space-y-3 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <KBSelector kbs={kbs} value={ingestKb} onChange={setIngestKb} onRefresh={onRefresh} />
          <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-neutral-700 hover:border-neutral-600 rounded-lg p-5 text-center cursor-pointer transition-colors">
            <Upload className="w-5 h-5 text-neutral-500 mx-auto mb-1.5" />
            {ingestFile ? (
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm text-emerald-400">{ingestFile.name}</p>
                <button onClick={(e) => { e.stopPropagation(); setIngestFile(null); }} className="text-neutral-500 hover:text-neutral-300"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">Drop or click to upload (.txt, .md, .docx)</p>
            )}
            <input ref={fileRef} type="file" accept=".txt,.md,.docx" className="hidden" onChange={(e) => e.target.files?.[0] && setIngestFile(e.target.files[0])} />
          </div>
          <textarea value={ingestText} onChange={(e) => setIngestText(e.target.value)} placeholder="Or paste raw text here..." rows={5} className="w-full bg-neutral-950 border border-neutral-700 text-neutral-200 rounded-lg px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-neutral-600" />
          {ingestMsg && <p className="text-sm text-emerald-400 flex items-center gap-2"><Check className="w-4 h-4" />{ingestMsg}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button onClick={ingest} disabled={ingesting || !ingestKb} className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-semibold rounded-lg transition-colors text-sm">
            {ingesting ? <><Loader2 className="w-4 h-4 animate-spin" /> Ingesting & Embedding...</> : <><Upload className="w-4 h-4" /> Ingest & Embed</>}
          </button>
          <p className="text-xs text-neutral-600">Documents are split into chunks and embedded using OpenAI text-embedding-3-small. Re-ingesting a knowledge base replaces all existing content.</p>
        </div>
      </div>
    </div>
  );
}

// ─── SEARCH TAB ──────────────────────────────────────────────────────────────

function SearchTab({ kbs, onRefreshKbs }: { kbs: KnowledgeBase[]; onRefreshKbs: () => void }) {
  const [kbId, setKbId] = useState("");
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [results, setResults] = useState<{ content: string; similarity: number; chunk_index: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async () => {
    if (!kbId || !query.trim()) { setError("Select a knowledge base and enter a query."); return; }
    setError(""); setResults([]); setLoading(true);
    try {
      const data = await apiFetch("/search", { method: "POST", body: JSON.stringify({ kb_id: kbId, query, topK }) });
      setResults(data.results);
    } catch (e) { setError(e instanceof Error ? e.message : "Search failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-400">Uses OpenAI text-embedding-3-small + pgvector cosine similarity to find the most relevant passages in your knowledge base.</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <KBSelector kbs={kbs} value={kbId} onChange={setKbId} onRefresh={onRefreshKbs} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-400 whitespace-nowrap">Top K</label>
          <select value={topK} onChange={(e) => setTopK(Number(e.target.value))} className="flex-1 bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
            {[3, 5, 7, 10].map((n) => <option key={n} value={n}>{n} results</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Enter your search query..." className="flex-1 bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-neutral-600" />
        <button onClick={search} disabled={loading || !kbId || !query.trim()} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-semibold rounded-lg transition-colors text-sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
        </button>
      </div>
      {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>}
      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-500">{results.length} results found</p>
          {results.map((r, i) => (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Chunk #{r.chunk_index + 1}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.similarity > 0.8 ? "bg-emerald-500/20 text-emerald-400" : r.similarity > 0.6 ? "bg-yellow-500/20 text-yellow-400" : "bg-neutral-700 text-neutral-400"}`}>
                  {(r.similarity * 100).toFixed(1)}% match
                </span>
              </div>
              <p className="text-sm text-neutral-200 leading-relaxed">{r.content}</p>
            </div>
          ))}
        </div>
      )}
      {!loading && results.length === 0 && query && <p className="text-sm text-neutral-600">No results — try a different query or check that the knowledge base has been ingested.</p>}
    </div>
  );
}

// ─── GAP ANALYZER TAB ───────────────────────────────────────────────────────

function GapTab({ kbs, onRefreshKbs }: { kbs: KnowledgeBase[]; onRefreshKbs: () => void }) {
  const [kbId, setKbId] = useState("");
  const [tickets, setTickets] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const streamFn = useSSE(
    useCallback((t) => setOutput((p) => p + t), []),
    useCallback((e) => setError(e), []),
    useCallback(() => setLoading(false), [])
  );

  const run = async () => {
    if (!kbId || !tickets.trim()) { setError("Select a knowledge base and paste support tickets."); return; }
    setError(""); setOutput(""); setLoading(true);
    await streamFn(`${BASE}/gaps`, { kb_id: kbId, tickets });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-400">Cross-references your documentation against support tickets or user questions to identify coverage gaps and prioritize what to write next.</p>
      <KBSelector kbs={kbs} value={kbId} onChange={setKbId} onRefresh={onRefreshKbs} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-300">Support Tickets / User Questions</label>
        <textarea value={tickets} onChange={(e) => setTickets(e.target.value)} placeholder="Paste support tickets, Zendesk exports, Slack questions, customer emails..." rows={8} className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-neutral-600" />
      </div>
      {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>}
      <button onClick={run} disabled={loading || !kbId || !tickets.trim()} className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-semibold rounded-lg transition-colors">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing gaps...</> : <><GitFork className="w-4 h-4" /> Run Gap Analysis</>}
      </button>
      <ResultBox content={output} loading={loading} placeholder="Gap analysis results will appear here." minH="350px" />
    </div>
  );
}

// ─── FAQ BUILDER TAB ─────────────────────────────────────────────────────────

function FAQTab({ kbs, onRefreshKbs }: { kbs: KnowledgeBase[]; onRefreshKbs: () => void }) {
  const [kbId, setKbId] = useState("");
  const [audience, setAudience] = useState("");
  const [context, setContext] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const streamFn = useSSE(
    useCallback((t) => setOutput((p) => p + t), []),
    useCallback((e) => setError(e), []),
    useCallback(() => setLoading(false), [])
  );

  const run = async () => {
    if (!kbId || !audience.trim()) { setError("Select a knowledge base and specify the target audience."); return; }
    setError(""); setOutput(""); setLoading(true);
    await streamFn(`${BASE}/faq`, { kb_id: kbId, audience, additionalContext: context });
  };

  const audiences = ["End users (non-technical)", "Developers / Engineers", "Product managers", "New employees", "Sales team", "Executive stakeholders"];

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-400">Generates a structured, intent-based FAQ tailored to how a specific audience thinks and asks questions — not just what the documentation says.</p>
      <KBSelector kbs={kbs} value={kbId} onChange={setKbId} onRefresh={onRefreshKbs} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-300">Target Audience</label>
          <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. New developers joining the API team" className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-neutral-600" />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {audiences.map((a) => (
              <button key={a} onClick={() => setAudience(a)} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${audience === a ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-neutral-700 text-neutral-500 hover:border-neutral-600"}`}>{a}</button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-300">Additional Context <span className="text-neutral-600 font-normal">(optional)</span></label>
          <textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="Any specific focus areas, tone notes, or constraints..." rows={4} className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-neutral-600" />
        </div>
      </div>
      {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>}
      <button onClick={run} disabled={loading || !kbId || !audience.trim()} className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-semibold rounded-lg transition-colors">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating FAQ...</> : <><BookOpen className="w-4 h-4" /> Build FAQ</>}
      </button>
      <ResultBox content={output} loading={loading} placeholder="Your FAQ will appear here." minH="400px" />
    </div>
  );
}

// ─── ONBOARDING ASSISTANT TAB ────────────────────────────────────────────────

function OnboardingTab({ kbs, onRefreshKbs }: { kbs: KnowledgeBase[]; onRefreshKbs: () => void }) {
  const [sessions, setSessions] = useState<OnboardingSession[]>([]);
  const [activeSession, setActiveSession] = useState<OnboardingSession | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatOutput, setChatOutput] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newKbId, setNewKbId] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadSessions = useCallback(async () => {
    try { setSessions(await apiFetch("/onboarding")); } catch { }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeSession?.messages, chatOutput]);

  const createSession = async () => {
    if (!newRole.trim()) { setError("Role is required"); return; }
    setCreating(true); setError("");
    try {
      const s = await apiFetch("/onboarding", { method: "POST", body: JSON.stringify({ kb_id: newKbId || null, role: newRole, title: newTitle || `${newRole} Onboarding` }) });
      setShowNew(false); setNewRole(""); setNewTitle(""); setNewKbId("");
      await loadSessions();
      setActiveSession(s);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setCreating(false); }
  };

  const selectSession = async (id: string) => {
    try {
      const s = await apiFetch(`/onboarding/${id}`);
      setActiveSession(s); setChatOutput("");
    } catch { }
  };

  const deleteSession = async (id: string) => {
    if (!confirm("Delete this session and its conversation history?")) return;
    await apiFetch(`/onboarding/${id}`, { method: "DELETE" });
    if (activeSession?.id === id) setActiveSession(null);
    await loadSessions();
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !activeSession) return;
    const msg = chatInput.trim();
    setChatInput(""); setChatOutput(""); setChatLoading(true);

    const userMsg = { role: "user" as const, content: msg, timestamp: new Date().toISOString() };
    setActiveSession((prev) => prev ? { ...prev, messages: [...prev.messages, userMsg] } : prev);

    const res = await fetch(`${BASE}/onboarding/${activeSession.id}/chat`, {
      method: "POST", headers: authHeaders(true), body: JSON.stringify({ message: msg }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed" }));
      setError(err.error || "Chat failed");
      setChatLoading(false); return;
    }

    const reader = res.body?.getReader();
    if (!reader) { setChatLoading(false); return; }
    const decoder = new TextDecoder();
    let buffer = ""; let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n"); buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") {
          const assistantMsg = { role: "assistant" as const, content: fullText, timestamp: new Date().toISOString() };
          setActiveSession((prev) => prev ? { ...prev, messages: [...prev.messages, assistantMsg] } : prev);
          setChatOutput(""); setChatLoading(false);
          await loadSessions();
          return;
        }
        try { const p = JSON.parse(data); if (p.text) { fullText += p.text; setChatOutput((prev) => prev + p.text); } } catch { }
      }
    }
    setChatLoading(false);
  };

  const allMessages = activeSession
    ? [...activeSession.messages, ...(chatOutput ? [{ role: "assistant" as const, content: chatOutput, timestamp: "" }] : [])]
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: "500px" }}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-300">Sessions</h3>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>
        {showNew && (
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 space-y-3">
            <KBSelector kbs={kbs} value={newKbId} onChange={setNewKbId} onRefresh={onRefreshKbs} />
            <input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Role (e.g. new engineer)" className="w-full bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-neutral-600" />
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Session title (optional)" className="w-full bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-neutral-600" />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button onClick={createSession} disabled={creating || !newRole.trim()} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-semibold rounded-lg text-sm transition-colors">
                {creating ? "Creating..." : "Create"}
              </button>
              <button onClick={() => setShowNew(false)} className="px-3 py-2 border border-neutral-700 hover:bg-neutral-800 text-neutral-400 rounded-lg text-sm transition-colors">Cancel</button>
            </div>
          </div>
        )}
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {sessions.length === 0 && <p className="text-sm text-neutral-600">No sessions yet.</p>}
          {sessions.map((s) => (
            <div key={s.id}
              onClick={() => selectSession(s.id)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${activeSession?.id === s.id ? "bg-emerald-500/10 border border-emerald-500/30" : "hover:bg-neutral-900 border border-transparent"}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-200 truncate">{s.title}</p>
                <p className="text-xs text-neutral-500">{s.messages.length} messages</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-neutral-600 hover:text-red-400 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden" style={{ minHeight: "500px" }}>
        {!activeSession ? (
          <div className="flex-1 flex items-center justify-center text-neutral-600 text-sm">Select or create a session to start chatting.</div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-200">{activeSession.title}</p>
                <p className="text-xs text-neutral-500">Role: {activeSession.role}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {allMessages.length === 0 && (
                <div className="text-center text-sm text-neutral-600 pt-8">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Start by asking a question about the onboarding material.</p>
                </div>
              )}
              {allMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-emerald-500/20 text-emerald-100" : "bg-neutral-800 text-neutral-200"} ${!m.timestamp && m.role === "assistant" ? "opacity-80" : ""}`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.timestamp && <p className="text-xs opacity-40 mt-1.5 text-right">{new Date(m.timestamp).toLocaleTimeString()}</p>}
                  </div>
                </div>
              ))}
              {chatLoading && !chatOutput && (
                <div className="flex justify-start">
                  <div className="bg-neutral-800 rounded-xl px-4 py-3 flex items-center gap-2 text-neutral-500 text-sm">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t border-neutral-800 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask a question..."
                disabled={chatLoading}
                className="flex-1 bg-neutral-950 border border-neutral-700 text-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-neutral-600 disabled:opacity-50"
              />
              <button onClick={sendMessage} disabled={chatLoading || !chatInput.trim()} className="p-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 rounded-lg transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── PROMPT TOOLKIT TAB ──────────────────────────────────────────────────────

function PromptsTab() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PromptTemplate | null>(null);
  const [filterCat, setFilterCat] = useState("All");
  const [testVars, setTestVars] = useState<Record<string, string>>({});
  const [testOutput, setTestOutput] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ title: "", category: "", description: "", prompt: "", variables: "", tags: "" });
  const [creating, setCreating] = useState(false);

  const loadPrompts = useCallback(async () => {
    setLoading(true);
    try { setPrompts(await apiFetch("/prompts")); } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPrompts(); }, [loadPrompts]);

  const categories = ["All", ...Array.from(new Set(prompts.map((p) => p.category))).sort()];
  const filtered = filterCat === "All" ? prompts : prompts.filter((p) => p.category === filterCat);

  const selectPrompt = (p: PromptTemplate) => {
    setSelected(p);
    setTestVars(Object.fromEntries(p.variables.map((v) => [v, ""])));
    setTestOutput(""); setError("");
  };

  const streamFn = useSSE(
    useCallback((t) => setTestOutput((p) => p + t), []),
    useCallback((e) => setError(e), []),
    useCallback(() => setTestLoading(false), [])
  );

  const runTest = async () => {
    if (!selected) return;
    setTestOutput(""); setError(""); setTestLoading(true);
    await streamFn(`${BASE}/prompts/${selected.id}/test`, { variables: testVars });
  };

  const deletePrompt = async (id: string) => {
    if (!confirm("Delete this prompt? Built-in prompts cannot be deleted.")) return;
    try { await apiFetch(`/prompts/${id}`, { method: "DELETE" }); await loadPrompts(); if (selected?.id === id) setSelected(null); }
    catch (e) { setError(e instanceof Error ? e.message : "Delete failed"); }
  };

  const createPrompt = async () => {
    if (!newPrompt.title.trim() || !newPrompt.prompt.trim()) { setError("Title and prompt are required"); return; }
    setCreating(true);
    try {
      await apiFetch("/prompts", {
        method: "POST",
        body: JSON.stringify({
          ...newPrompt,
          variables: newPrompt.variables.split(",").map((v) => v.trim()).filter(Boolean),
          tags: newPrompt.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      setShowCreate(false);
      setNewPrompt({ title: "", category: "", description: "", prompt: "", variables: "", tags: "" });
      await loadPrompts();
    } catch (e) { setError(e instanceof Error ? e.message : "Create failed"); }
    finally { setCreating(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-300">Prompt Library</h3>
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add prompt
          </button>
        </div>

        {showCreate && (
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input value={newPrompt.title} onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })} placeholder="Title" className="col-span-2 bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-neutral-600" />
              <input value={newPrompt.category} onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })} placeholder="Category" className="bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-neutral-600" />
              <input value={newPrompt.variables} onChange={(e) => setNewPrompt({ ...newPrompt, variables: e.target.value })} placeholder="Variables (comma-sep)" className="bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-neutral-600" />
              <input value={newPrompt.description} onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })} placeholder="Description" className="col-span-2 bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-neutral-600" />
              <input value={newPrompt.tags} onChange={(e) => setNewPrompt({ ...newPrompt, tags: e.target.value })} placeholder="Tags (comma-sep)" className="col-span-2 bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-neutral-600" />
            </div>
            <textarea value={newPrompt.prompt} onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })} placeholder="Prompt text — use {{variable}} for variables" rows={5} className="w-full bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-neutral-600 font-mono" />
            <div className="flex gap-2">
              <button onClick={createPrompt} disabled={creating} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-semibold rounded-lg text-sm transition-colors">{creating ? "Saving..." : "Save Prompt"}</button>
              <button onClick={() => setShowCreate(false)} className="px-3 py-2 border border-neutral-700 hover:bg-neutral-800 text-neutral-400 rounded-lg text-sm transition-colors">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex gap-1.5 flex-wrap">
          {categories.map((c) => (
            <button key={c} onClick={() => setFilterCat(c)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filterCat === c ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-neutral-700 text-neutral-500 hover:border-neutral-600"}`}>{c}</button>
          ))}
        </div>

        <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
          {loading && <div className="flex items-center gap-2 text-neutral-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>}
          {filtered.map((p) => (
            <div key={p.id} onClick={() => selectPrompt(p)} className={`group flex items-start justify-between px-3 py-3 rounded-lg cursor-pointer transition-colors ${selected?.id === p.id ? "bg-emerald-500/10 border border-emerald-500/30" : "hover:bg-neutral-900 border border-transparent"}`}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-neutral-200 truncate">{p.title}</p>
                  {p.is_builtin && <span className="text-xs text-neutral-600 shrink-0">built-in</span>}
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">{p.category}</p>
                {p.tags.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {p.tags.slice(0, 3).map((t) => <span key={t} className="text-xs text-neutral-600 bg-neutral-800 rounded px-1.5 py-0.5">{t}</span>)}
                  </div>
                )}
              </div>
              {!p.is_builtin && (
                <button onClick={(e) => { e.stopPropagation(); deletePrompt(p.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-neutral-600 hover:text-red-400 transition-all shrink-0 mt-0.5">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {!selected ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-neutral-600 text-sm">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Select a prompt from the library to load it into the sandbox.
          </div>
        ) : (
          <>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-neutral-200">{selected.title}</h3>
                  <span className="text-xs text-neutral-600 bg-neutral-800 rounded px-2 py-0.5">{selected.category}</span>
                </div>
                {selected.description && <p className="text-xs text-neutral-500">{selected.description}</p>}
              </div>
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-400 font-mono leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                {selected.prompt}
              </div>
              {selected.variables.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-neutral-400 flex items-center gap-1.5"><Tag className="w-3 h-3" /> Variables</p>
                  <div className="grid grid-cols-1 gap-2">
                    {selected.variables.map((v) => (
                      <div key={v} className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 font-mono shrink-0 w-24 truncate">{`{{${v}}}`}</span>
                        <input
                          value={testVars[v] || ""}
                          onChange={(e) => setTestVars({ ...testVars, [v]: e.target.value })}
                          placeholder={`Value for ${v}`}
                          className="flex-1 bg-neutral-950 border border-neutral-700 text-neutral-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/50 placeholder:text-neutral-700"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button onClick={runTest} disabled={testLoading} className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-semibold rounded-lg text-sm transition-colors">
                {testLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Running...</> : <><Play className="w-4 h-4" /> Test Prompt</>}
              </button>
            </div>
            <ResultBox content={testOutput} loading={testLoading} placeholder="Test output will appear here." minH="200px" />
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function KnowledgeArch() {
  const [, setLocation] = useLocation();
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("search");
  const [showKBManager, setShowKBManager] = useState(false);
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [kbsLoading, setKbsLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) { setLocation("/admin/login"); return; }
    setAuthed(true);
  }, [setLocation]);

  const loadKbs = useCallback(async () => {
    setKbsLoading(true);
    try { setKbs(await apiFetch("/kb")); } catch { }
    finally { setKbsLoading(false); }
  }, []);

  useEffect(() => { if (authed) loadKbs(); }, [authed, loadKbs]);

  if (!authed) return null;

  const ActiveTab = activeTab === "search" ? SearchTab
    : activeTab === "gaps" ? GapTab
    : activeTab === "faq" ? FAQTab
    : activeTab === "onboarding" ? OnboardingTab
    : PromptsTab;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation("/admin")} className="p-2 rounded-lg hover:bg-neutral-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-semibold">Knowledge Architecture</h1>
              <p className="text-xs text-neutral-500 hidden sm:block">Documentation engineering suite — 5 tools, one pipeline</p>
            </div>
          </div>
          <button
            onClick={() => setShowKBManager(!showKBManager)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${showKBManager ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-neutral-700 hover:bg-neutral-800 text-neutral-300"}`}
          >
            <Database className="w-4 h-4" />
            Knowledge Bases
            {kbs.length > 0 && <span className="text-xs bg-neutral-700 text-neutral-300 rounded-full px-1.5 py-0.5">{kbs.length}</span>}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {showKBManager && (
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-100">Knowledge Base Manager</h2>
              <button onClick={() => setShowKBManager(false)} className="p-1.5 text-neutral-500 hover:text-neutral-300 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <KBManager kbs={kbs} loading={kbsLoading} onRefresh={loadKbs} />
          </div>
        )}

        <div className="border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="flex overflow-x-auto bg-neutral-900/60 border-b border-neutral-800">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id ? "border-emerald-500 text-emerald-400 bg-emerald-500/5" : "border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50"}`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {activeTab === "search" && <SearchTab kbs={kbs} onRefreshKbs={loadKbs} />}
            {activeTab === "gaps" && <GapTab kbs={kbs} onRefreshKbs={loadKbs} />}
            {activeTab === "faq" && <FAQTab kbs={kbs} onRefreshKbs={loadKbs} />}
            {activeTab === "onboarding" && <OnboardingTab kbs={kbs} onRefreshKbs={loadKbs} />}
            {activeTab === "prompts" && <PromptsTab />}
          </div>
        </div>
      </main>
    </div>
  );
}
