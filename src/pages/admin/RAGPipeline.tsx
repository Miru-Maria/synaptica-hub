import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, Send, Database, MessageSquare, Upload, Info } from "lucide-react";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: { chunkId: number; score: number; preview: string }[];
}

export default function RAGPipeline() {
  const [, setLocation] = useLocation();
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<"ingest" | "chat">("ingest");

  const [docText, setDocText] = useState("");
  const [chunkSize, setChunkSize] = useState(500);
  const [overlap, setOverlap] = useState(50);
  const [ingesting, setIngesting] = useState(false);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);

  const [chunkCount, setChunkCount] = useState(0);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

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

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/rag/status", { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setChunkCount(data.chunkCount);
      }
    } catch {}
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authed) fetchStatus();
  }, [authed, fetchStatus]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleIngest = async () => {
    setIngesting(true);
    setIngestError(null);
    setIngestSuccess(null);
    try {
      const res = await fetch("/api/admin/rag/ingest", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ text: docText, chunkSize, overlap }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to ingest");
      }
      const data = await res.json();
      setIngestSuccess(`Ingested ${data.ingested} chunks. Total indexed: ${data.totalChunks}`);
      setChunkCount(data.totalChunks);
      setDocText("");
    } catch (err: unknown) {
      setIngestError(err instanceof Error ? err.message : String(err));
    } finally {
      setIngesting(false);
    }
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
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to get answer");
      }
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (err: unknown) {
      setChatError(err instanceof Error ? err.message : String(err));
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <p className="text-neutral-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] text-neutral-100">
      <header className="border-b border-[#1e2d4a] bg-[#0d1b30]/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/admin")}
              className="flex items-center gap-2 text-neutral-400 hover:text-neutral-100 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
            <div className="w-px h-6 bg-[#1e2d4a]" />
            <h1 className="font-semibold text-lg">
              <span className="text-[#00c8a0]">RAG</span> Pipeline
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#00c8a0]" />
            <span className="text-sm font-medium">
              <span className="text-[#00c8a0]">{chunkCount}</span>{" "}
              <span className="text-neutral-400">chunk{chunkCount !== 1 ? "s" : ""} indexed</span>
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-1 mb-6 bg-[#0d1b30] border border-[#1e2d4a] rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("ingest")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "ingest"
                ? "bg-[#00c8a0]/15 text-[#00c8a0] border border-[#00c8a0]/30"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Upload className="w-4 h-4" />
            Ingest Documents
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "chat"
                ? "bg-[#7c3aed]/15 text-[#7c3aed] border border-[#7c3aed]/30"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
        </div>

        {activeTab === "ingest" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Ingest Documents</h2>
              <p className="text-sm text-neutral-400">
                Paste or type document text below. The text will be chunked, embedded, and stored for retrieval.
              </p>
            </div>

            {ingestError && (
              <div className="bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3 text-sm text-red-400">
                {ingestError}
              </div>
            )}

            {ingestSuccess && (
              <div className="bg-[#00c8a0]/10 border border-[#00c8a0]/30 rounded-lg px-4 py-3 text-sm text-[#00c8a0]">
                {ingestSuccess}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Document Text <span className="text-red-400">*</span>
              </label>
              <textarea
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                placeholder="Paste your document content here..."
                className="w-full h-64 bg-[#0d1b30] border border-[#1e2d4a] rounded-lg px-4 py-3 text-neutral-100 placeholder:text-neutral-600 resize-none focus:outline-none focus:border-[#00c8a0]/50 transition-colors font-mono text-sm"
              />
            </div>

            <div className="flex gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Chunk Size (characters)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={100}
                    max={2000}
                    step={50}
                    value={chunkSize}
                    onChange={(e) => setChunkSize(Number(e.target.value))}
                    className="flex-1 accent-[#00c8a0]"
                  />
                  <span className="text-sm font-mono text-[#00c8a0] w-14 text-right">{chunkSize}</span>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Overlap (characters)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={Math.min(500, chunkSize - 1)}
                    step={10}
                    value={overlap}
                    onChange={(e) => setOverlap(Number(e.target.value))}
                    className="flex-1 accent-[#00c8a0]"
                  />
                  <span className="text-sm font-mono text-[#00c8a0] w-14 text-right">{overlap}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-500 bg-[#0d1b30] border border-[#1e2d4a] rounded-lg px-3 py-2">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>
                With a chunk size of {chunkSize} and overlap of {overlap}, a 10,000 character document would produce approximately{" "}
                {Math.ceil(10000 / (chunkSize - overlap))} chunks.
              </span>
            </div>

            <button
              onClick={handleIngest}
              disabled={ingesting || !docText.trim()}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-[#00c8a0] hover:bg-[#00ddb0] text-[#0a1628] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ingesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ingesting…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Ingest Document
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="flex flex-col" style={{ height: "calc(100vh - 180px)" }}>
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-1">Chat with Your Documents</h2>
              <p className="text-sm text-neutral-400">
                Ask questions and get answers grounded in your ingested documents.
              </p>
            </div>

            {chunkCount === 0 && (
              <div className="bg-[#7c3aed]/10 border border-[#7c3aed]/30 rounded-lg px-4 py-3 text-sm text-[#7c3aed] mb-4">
                No documents ingested yet. Switch to the Ingest tab to add documents first.
              </div>
            )}

            <div className="flex-1 overflow-y-auto bg-[#0d1b30] border border-[#1e2d4a] rounded-lg p-4 mb-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-neutral-500 text-sm">
                  <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                  <p>No messages yet. Ask a question about your documents.</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "bg-[#7c3aed] text-white"
                        : "bg-[#162240] border border-[#1e2d4a] text-neutral-200"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#1e2d4a] space-y-2">
                        <p className="text-xs font-medium text-[#00c8a0]">Sources:</p>
                        {msg.sources.map((src) => (
                          <div
                            key={src.chunkId}
                            className="bg-[#0a1628] rounded px-3 py-2 text-xs"
                          >
                            <span className="font-medium text-[#00c8a0]">Chunk {src.chunkId}</span>
                            <span className="text-neutral-500 ml-2">(similarity: {src.score})</span>
                            <p className="text-neutral-400 mt-1">{src.preview}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#162240] border border-[#1e2d4a] rounded-lg px-4 py-3 text-sm text-neutral-400">
                    <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                    Thinking…
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {chatError && (
              <div className="bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3 text-sm text-red-400 mb-4">
                {chatError}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your documents..."
                disabled={chunkCount === 0}
                className="flex-1 bg-[#0d1b30] border border-[#1e2d4a] rounded-lg px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-[#7c3aed]/50 transition-colors disabled:opacity-50"
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
