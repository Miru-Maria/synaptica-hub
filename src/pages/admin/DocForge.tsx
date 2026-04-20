import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, Copy, Check, Upload, Trash2, FileOutput, Download } from "lucide-react";
import { useEffect } from "react";

function authToken(): string | null {
  return localStorage.getItem("admin_token");
}

type OutputFormat = "report" | "brief" | "guide" | "audit" | "proposal";

const FORMATS: { value: OutputFormat; label: string; description: string }[] = [
  { value: "report", label: "Consulting Report", description: "Executive summary, findings, analysis, recommendations" },
  { value: "brief", label: "Executive Brief", description: "Concise overview, key points, next steps" },
  { value: "guide", label: "Structured Guide", description: "Intro, step-by-step sections, summary" },
  { value: "audit", label: "Audit Report", description: "Scope, current state, gap analysis, priorities" },
  { value: "proposal", label: "Proposal", description: "Background, approach, deliverables, timeline, investment" },
];

export default function DocForge() {
  const [, setLocation] = useLocation();
  const [authed, setAuthed] = useState(false);
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("report");
  const [documentTitle, setDocumentTitle] = useState("");
  const [brandingNotes, setBrandingNotes] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = authToken();
    if (!token) { setLocation("/admin/login"); return; }
    setAuthed(true);
  }, [setLocation]);

  const handleFile = (f: File) => {
    const allowed = [".docx", ".txt", ".md"];
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!allowed.includes(ext)) { setError("Unsupported file type. Use .docx, .txt, or .md"); return; }
    setFile(f);
    setError(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const generate = async () => {
    if (!rawText.trim() && !file) { setError("Upload a file or paste raw content."); return; }
    setError(null);
    setResult("");
    setLoading(true);

    const formData = new FormData();
    if (file) formData.append("file", file);
    if (rawText.trim()) formData.append("rawText", rawText);
    formData.append("outputFormat", outputFormat);
    if (documentTitle.trim()) formData.append("documentTitle", documentTitle);
    if (brandingNotes.trim()) formData.append("brandingNotes", brandingNotes);

    const token = authToken();
    try {
      const res = await fetch("/api/admin/docforge/generate", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
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
            if (parsed.text) setResult((prev) => prev + parsed.text);
            if (parsed.error) setError(parsed.error);
          } catch { }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMd = () => {
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentTitle || "document"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button onClick={() => setLocation("/admin")} className="p-2 rounded-lg hover:bg-neutral-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <FileOutput className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-semibold">DocForge PDF</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <p className="text-neutral-400 text-sm">Transform raw notes, drafts, or documents into polished, professionally formatted output. Upload a file or paste content, choose a format, and Claude will structure and refine it for you.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Output Format</label>
              <div className="grid grid-cols-1 gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setOutputFormat(f.value)}
                    className={`text-left p-3 rounded-lg border transition-all ${outputFormat === f.value ? "border-emerald-500 bg-emerald-500/10" : "border-neutral-700 hover:border-neutral-600 bg-neutral-900"}`}
                  >
                    <p className="text-sm font-medium text-neutral-100">{f.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{f.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Document Title <span className="text-neutral-600 font-normal">(optional)</span></label>
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="e.g. Meridian HR — Documentation Audit Q2 2025"
                className="w-full bg-neutral-900 border border-neutral-700 text-neutral-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder:text-neutral-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Branding / Tone Notes <span className="text-neutral-600 font-normal">(optional)</span></label>
              <input
                type="text"
                value={brandingNotes}
                onChange={(e) => setBrandingNotes(e.target.value)}
                placeholder="e.g. Formal, B2B consulting tone. Client: Meridian HR."
                className="w-full bg-neutral-900 border border-neutral-700 text-neutral-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder:text-neutral-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Upload File <span className="text-neutral-600 font-normal">(.docx, .txt, .md)</span></label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragging ? "border-emerald-500 bg-emerald-500/5" : "border-neutral-700 hover:border-neutral-600"}`}
              >
                <Upload className="w-6 h-6 text-neutral-500 mx-auto mb-2" />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-sm text-emerald-400">{file.name}</p>
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-neutral-500 hover:text-neutral-300">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">Drop file here or click to browse</p>
                )}
                <input ref={fileInputRef} type="file" accept=".docx,.txt,.md" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-300">Or Paste Raw Content</label>
                {rawText && <button onClick={() => setRawText("")} className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Clear</button>}
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste notes, bullet points, rough drafts, or any unstructured content..."
                rows={6}
                className="w-full bg-neutral-900 border border-neutral-700 text-neutral-100 rounded-lg px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder:text-neutral-600"
              />
            </div>

            {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>}

            <button
              onClick={generate}
              disabled={loading || (!rawText.trim() && !file)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 font-semibold rounded-lg transition-colors"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><FileOutput className="w-4 h-4" /> Generate Document</>}
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300">Formatted Output</label>
              {result && (
                <div className="flex items-center gap-2">
                  <button onClick={downloadMd} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors">
                    <Download className="w-3.5 h-3.5" /> Download .md
                  </button>
                  <button onClick={copy} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors">
                    {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </button>
                </div>
              )}
            </div>
            <div className="min-h-[600px] bg-neutral-900 border border-neutral-700 rounded-lg p-5 text-sm text-neutral-200 leading-relaxed overflow-auto whitespace-pre-wrap">
              {loading && !result && (
                <div className="flex items-center gap-2 text-neutral-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Formatting document...</span>
                </div>
              )}
              {!loading && !result && <p className="text-neutral-600">Your formatted document will appear here.</p>}
              {result}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
