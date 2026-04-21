import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Loader2,
  Send,
  Database,
  MessageSquare,
  Upload,
  FileText,
  Trash2,
  X,
  BookOpen,
  AlertCircle,
  CheckCircle,
  File,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

function authHeadersMultipart(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: {
    sourceNum: number;
    chunkId: string;
    documentName: string;
    chunkIndex: number;
    score: number;
    scorePercent: number;
    preview: string;
  }[];
}

interface RagDocument {
  id: string;
  name: string;
  sourceType: "text" | "file";
  chunkSize: number;
  overlap: number;
  chunkCount: number;
  createdAt: string;
}

interface RagChunk {
  id: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
  createdAt: string;
}

function ScoreBadge({ percent }: { percent: number }) {
  const color =
    percent >= 80 ? "text-emerald-400 bg-emerald-400/10 border-emerald-500/30" :
    percent >= 60 ? "text-blue-400 bg-blue-400/10 border-blue-500/30" :
    percent >= 40 ? "text-amber-400 bg-amber-400/10 border-amber-500/30" :
    "text-neutral-400 bg-neutral-400/10 border-neutral-500/30";
  return (
    <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${color}`}>
      {percent}%
    </span>
  );
}

function ScoreBar({ percent }: { percent: number }) {
  const fill =
    percent >= 80 ? "bg-emerald-500" :
    percent >= 60 ? "bg-blue-500" :
    percent >= 40 ? "bg-amber-500" :
    "bg-neutral-500";
  return (
    <div className="h-1 bg-neutral-800 rounded-full overflow-hidden w-16">
      <div className={`h-full rounded-full transition-all ${fill}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function RAGPipeline() {
  const [, setLocation] = useLocation();
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<"ingest" | "index" | "chat">("ingest");

  const [docText, setDocText] = useState("");
  const [docName, setDocName] = useState("");
  const [chunkSize, setChunkSize] = useState(500);
  const [overlap, setOverlap] = useState(50);
  const [ingesting, setIngesting] = useState(false);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"paste" | "file">("file");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chunkCount, setChunkCount] = useState(0);
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [chunks, setChunks] = useState<RagChunk[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [expandedChunkDoc, setExpandedChunkDoc] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me", { headers: authHeaders() });
      if (!res.ok) { setLocation("/admin/login"); return; }
      setAuthed(true);
    } catch { setLocation("/admin/login"); }
  }, [setLocation]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/rag/status", { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setChunkCount(d.chunkCount); }
    } catch {}
  }, []);

  const fetchDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const [docsRes, chunksRes] = await Promise.all([
        fetch("/api/admin/rag/documents", { headers: authHeaders() }),
        fetch("/api/admin/rag/chunks", { headers: authHeaders() }),
      ]);
      if (docsRes.ok) { const d = await docsRes.json(); setDocuments(d.documents); }
      if (chunksRes.ok) { const d = await chunksRes.json(); setChunks(d.chunks); }
    } catch {} finally { setLoadingDocs(false); }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);
  useEffect(() => { if (authed) { fetchStatus(); fetchDocuments(); } }, [authed, fetchStatus, fetchDocuments]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (activeTab === "index") fetchDocuments(); }, [activeTab, fetchDocuments]);

  const handleFileSelect = (file: File) => {
    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".pdf") && !ext.endsWith(".docx") && !ext.endsWith(".txt") && !ext.endsWith(".md")) {
      setIngestError("Only PDF, DOCX, TXT, and MD files are supported.");
      return;
    }
    setSelectedFile(file);
    setIngestError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleIngest = async () => {
    setIngesting(true);
    setIngestError(null);
    setIngestSuccess(null);
    try {
      let res: Response;
      if (inputMode === "file" && selectedFile) {
        const form = new FormData();
        form.append("file", selectedFile);
        form.append("chunkSize", String(chunkSize));
        form.append("overlap", String(overlap));
        res = await fetch("/api/admin/rag/upload", {
          method: "POST",
          headers: authHeadersMultipart(),
          body: form,
        });
      } else {
        if (!docText.trim()) { setIngestError("Please paste some text."); setIngesting(false); return; }
        res = await fetch("/api/admin/rag/ingest", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ text: docText, chunkSize, overlap, name: docName || undefined }),
        });
      }
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to ingest");
      }
      const data = await res.json();
      setIngestSuccess(`Ingested ${data.ingested} chunk${data.ingested !== 1 ? "s" : ""}. Total indexed: ${data.totalChunks}`);
      setChunkCount(data.totalChunks);
      setDocText("");
      setDocName("");
      setSelectedFile(null);
      fetchDocuments();
    } catch (err) {
      setIngestError(err instanceof Error ? err.message : String(err));
    } finally {
      setIngesting(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/rag/documents/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        const d = await res.json();
        setChunkCount(d.totalChunks);
        fetchDocuments();
      }
    } catch {} finally { setDeletingId(null); }
  };

  const handleClearAll = async () => {
    if (!confirm("Delete all indexed documents and chunks? This cannot be undone.")) return;
    setClearing(true);
    try {
      await fetch("/api/admin/rag/clear", { method: "DELETE", headers: authHeaders() });
      setChunkCount(0);
      setDocuments([]);
      setChunks([]);
    } catch {} finally { setClearing(false); }
  };

  const handleChat = async () => {
    if (!question.trim() || chatLoading) return;
    const q = question.trim();
    setQuestion("");
    setChatError(null);
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/admin/rag/chat", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to get answer"); }
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer, sources: data.sources }]);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : String(err));
    } finally { setChatLoading(false); }
  };

  if (!authed) return <div className="min-h-screen bg-[#0a1628] flex items-center justify-center"><p className="text-neutral-400">Loading…</p></div>;

  const chunksByDoc = chunks.reduce<Record<string, RagChunk[]>>((acc, c) => {
    if (!acc[c.documentId]) acc[c.documentId] = [];
    acc[c.documentId].push(c);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0a1628] text-neutral-100">
      <header className="border-b border-[#1e2d4a] bg-[#0d1b30]/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/admin"
              onClick={(e) => { if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) { e.preventDefault(); setLocation("/admin"); } }}
              className="flex items-center gap-2 text-neutral-400 hover:text-neutral-100 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </a>
            <div className="w-px h-6 bg-[#1e2d4a]" />
            <h1 className="font-semibold text-lg"><span className="text-[#00c8a0]">RAG</span> Pipeline</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/rag-guide"
              onClick={(e) => { if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) { e.preventDefault(); setLocation("/admin/rag-guide"); } }}
              className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Guide
            </a>
            <div className="flex items-center gap-1.5 text-sm">
              <Database className="w-4 h-4 text-[#00c8a0]" />
              <span className="font-medium text-[#00c8a0]">{chunkCount}</span>
              <span className="text-neutral-400">chunk{chunkCount !== 1 ? "s" : ""} indexed</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-1 mb-6 bg-[#0d1b30] border border-[#1e2d4a] rounded-lg p-1 w-fit">
          {([
            { id: "ingest", label: "Ingest", icon: Upload, active: "bg-[#00c8a0]/15 text-[#00c8a0] border border-[#00c8a0]/30" },
            { id: "index", label: `Index${documents.length > 0 ? ` (${documents.length})` : ""}`, icon: Database, active: "bg-[#00c8a0]/15 text-[#00c8a0] border border-[#00c8a0]/30" },
            { id: "chat", label: "Chat", icon: MessageSquare, active: "bg-[#7c3aed]/15 text-[#7c3aed] border border-[#7c3aed]/30" },
          ] as const).map(({ id, label, icon: Icon, active }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === id ? active : "text-neutral-400 hover:text-neutral-200"}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* INGEST TAB */}
        {activeTab === "ingest" && (
          <div className="space-y-5 max-w-3xl">
            <div>
              <h2 className="text-xl font-semibold mb-1">Ingest Documents</h2>
              <p className="text-sm text-neutral-400">Upload a file or paste text. It will be chunked, embedded with OpenAI, and stored persistently for retrieval.</p>
            </div>

            {ingestError && (
              <div className="flex items-start gap-2 bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {ingestError}
              </div>
            )}
            {ingestSuccess && (
              <div className="flex items-start gap-2 bg-[#00c8a0]/10 border border-[#00c8a0]/30 rounded-lg px-4 py-3 text-sm text-[#00c8a0]">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {ingestSuccess}
              </div>
            )}

            {/* Input mode toggle */}
            <div className="flex gap-1 bg-[#0d1b30] border border-[#1e2d4a] rounded-lg p-1 w-fit">
              {(["file", "paste"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setInputMode(mode); setIngestError(null); setIngestSuccess(null); }}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${inputMode === mode ? "bg-[#00c8a0]/15 text-[#00c8a0]" : "text-neutral-500 hover:text-neutral-300"}`}
                >
                  {mode === "file" ? "Upload File" : "Paste Text"}
                </button>
              ))}
            </div>

            {/* File upload */}
            {inputMode === "file" && (
              <div>
                {selectedFile ? (
                  <div className="flex items-center gap-3 bg-[#0d1b30] border border-[#00c8a0]/30 rounded-lg px-4 py-3">
                    <File className="w-5 h-5 text-[#00c8a0] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-100 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-neutral-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => setSelectedFile(null)} className="text-neutral-500 hover:text-neutral-300 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                      dragOver ? "border-[#00c8a0] bg-[#00c8a0]/5" : "border-[#1e2d4a] hover:border-[#00c8a0]/50 hover:bg-[#0d1b30]"
                    }`}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-3 text-neutral-600" />
                    <p className="text-sm text-neutral-300 font-medium">Drop a file here or click to browse</p>
                    <p className="text-xs text-neutral-600 mt-1">PDF, DOCX, TXT, MD — up to 10 MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                />
              </div>
            )}

            {/* Paste text */}
            {inputMode === "paste" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Document name (optional)</label>
                  <input
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="e.g. Q4 Sales Policy, Product Manual v2"
                    className="w-full bg-[#0d1b30] border border-[#1e2d4a] rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-[#00c8a0]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Document text <span className="text-red-400">*</span></label>
                  <textarea
                    value={docText}
                    onChange={(e) => setDocText(e.target.value)}
                    placeholder="Paste your document content here…"
                    className="w-full h-52 bg-[#0d1b30] border border-[#1e2d4a] rounded-lg px-4 py-3 text-neutral-100 placeholder:text-neutral-600 resize-none focus:outline-none focus:border-[#00c8a0]/50 transition-colors font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* Chunk settings */}
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Chunk size (characters)</label>
                <div className="flex items-center gap-3">
                  <input type="range" min={100} max={2000} step={50} value={chunkSize} onChange={(e) => setChunkSize(Number(e.target.value))} className="flex-1 accent-[#00c8a0]" />
                  <span className="text-sm font-mono text-[#00c8a0] w-12 text-right">{chunkSize}</span>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Overlap (characters)</label>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={Math.min(500, chunkSize - 1)} step={10} value={overlap} onChange={(e) => setOverlap(Number(e.target.value))} className="flex-1 accent-[#00c8a0]" />
                  <span className="text-sm font-mono text-[#00c8a0] w-12 text-right">{overlap}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleIngest}
              disabled={ingesting || (inputMode === "file" ? !selectedFile : !docText.trim())}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#00c8a0] hover:bg-[#00ddb0] text-[#0a1628] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {ingesting ? <><Loader2 className="w-4 h-4 animate-spin" />Ingesting…</> : <><Upload className="w-4 h-4" />Ingest Document</>}
            </button>
          </div>
        )}

        {/* INDEX TAB */}
        {activeTab === "index" && (
          <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold mb-0.5">Indexed Documents</h2>
                <p className="text-sm text-neutral-400">{documents.length} document{documents.length !== 1 ? "s" : ""} · {chunkCount} chunk{chunkCount !== 1 ? "s" : ""} stored in database</p>
              </div>
              {documents.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={clearing}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800/50 rounded-lg transition-colors"
                >
                  {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Clear all
                </button>
              )}
            </div>

            {loadingDocs && (
              <div className="flex items-center gap-2 text-neutral-400 text-sm py-8">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            )}

            {!loadingDocs && documents.length === 0 && (
              <div className="text-center py-16 border border-dashed border-[#1e2d4a] rounded-lg">
                <Database className="w-10 h-10 mx-auto mb-3 text-neutral-700" />
                <p className="text-neutral-400 text-sm">No documents indexed yet.</p>
                <p className="text-neutral-600 text-xs mt-1">Go to the Ingest tab to add your first document.</p>
              </div>
            )}

            <div className="space-y-3">
              {documents.map((doc) => {
                const docChunks = chunksByDoc[doc.id] || [];
                const isExpanded = expandedChunkDoc === doc.id;
                return (
                  <div key={doc.id} className="bg-[#0d1b30] border border-[#1e2d4a] rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="shrink-0">
                        {doc.sourceType === "file" ? (
                          <FileText className="w-5 h-5 text-[#00c8a0]" />
                        ) : (
                          <File className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-100 truncate">{doc.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-neutral-500">{doc.chunkCount} chunk{doc.chunkCount !== 1 ? "s" : ""}</span>
                          <span className="text-xs text-neutral-700">·</span>
                          <span className="text-xs text-neutral-500">size {doc.chunkSize} / overlap {doc.overlap}</span>
                          <span className="text-xs text-neutral-700">·</span>
                          <span className="text-xs text-neutral-500">{new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setExpandedChunkDoc(isExpanded ? null : doc.id)}
                          className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors px-2 py-1 rounded hover:bg-neutral-800"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          Chunks
                        </button>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          disabled={deletingId === doc.id}
                          className="p-1.5 text-neutral-600 hover:text-red-400 transition-colors rounded hover:bg-red-900/20"
                        >
                          {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[#1e2d4a] divide-y divide-[#1e2d4a]/50">
                        {docChunks.length === 0 ? (
                          <p className="text-xs text-neutral-600 px-4 py-3">No chunk preview available yet.</p>
                        ) : (
                          docChunks.map((chunk) => (
                            <div key={chunk.id} className="px-4 py-2.5 bg-[#0a1628]/50">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-neutral-600">Chunk {chunk.chunkIndex + 1}</span>
                              </div>
                              <p className="text-xs text-neutral-400 font-mono leading-relaxed line-clamp-3">{chunk.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === "chat" && (
          <div className="flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-0.5">Chat with Your Documents</h2>
              <p className="text-sm text-neutral-400">Ask any question — the AI answers only from your indexed documents and cites its sources.</p>
            </div>

            {chunkCount === 0 && (
              <div className="flex items-center gap-2 bg-[#7c3aed]/10 border border-[#7c3aed]/30 rounded-lg px-4 py-3 text-sm text-[#7c3aed] mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                No documents indexed yet. Switch to the Ingest tab to add content first.
              </div>
            )}

            <div className="flex-1 overflow-y-auto bg-[#0d1b30] border border-[#1e2d4a] rounded-lg p-4 mb-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-neutral-600 text-sm">
                  <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                  <p>Ask a question about your indexed documents.</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-[#7c3aed] text-white rounded-br-sm"
                      : "bg-[#162240] border border-[#1e2d4a] text-neutral-200 rounded-bl-sm"
                  }`}>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#1e2d4a] space-y-2">
                        <p className="text-xs font-semibold text-[#00c8a0] uppercase tracking-wider">Sources used</p>
                        {msg.sources.map((src) => (
                          <div key={src.chunkId} className="bg-[#0a1628] rounded-lg px-3 py-2.5 text-xs">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-semibold text-[#00c8a0]">Source {src.sourceNum}</span>
                              <span className="text-neutral-600">·</span>
                              <span className="text-neutral-400 truncate max-w-[180px]">{src.documentName}</span>
                              <span className="text-neutral-600">·</span>
                              <span className="text-neutral-500">chunk {src.chunkIndex + 1}</span>
                              <div className="ml-auto flex items-center gap-2">
                                <ScoreBar percent={src.scorePercent} />
                                <ScoreBadge percent={src.scorePercent} />
                              </div>
                            </div>
                            <p className="text-neutral-500 leading-relaxed">{src.preview}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#162240] border border-[#1e2d4a] rounded-xl rounded-bl-sm px-4 py-3 text-sm text-neutral-400 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching documents and generating answer…
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {chatError && (
              <div className="flex items-center gap-2 bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3 text-sm text-red-400 mb-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {chatError}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                placeholder={chunkCount === 0 ? "Ingest documents first…" : "Ask a question about your documents…"}
                disabled={chunkCount === 0}
                className="flex-1 bg-[#0d1b30] border border-[#1e2d4a] rounded-lg px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-[#7c3aed]/50 transition-colors disabled:opacity-50 text-sm"
              />
              <button
                onClick={handleChat}
                disabled={chatLoading || !question.trim() || chunkCount === 0}
                className="flex items-center gap-2 px-5 py-3 bg-[#7c3aed] hover:bg-[#8b4ff5] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
