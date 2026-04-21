import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Loader2, Copy, Check, Upload, Trash2, FileOutput,
  FileDown, FileText, File,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

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

function markdownToHtmlString(md: string): string {
  return md
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^[*-] (.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => "<ul>" + m + "</ul>")
    .split(/\n\n+/)
    .map((block) => {
      if (/^<(h[1-6]|ul|ol)/.test(block.trim())) return block.trim();
      return "<p>" + block.replace(/\n/g, " ").trim() + "</p>";
    })
    .join("\n");
}

async function generateDocx(markdown: string, title: string): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");

  const children: InstanceType<typeof Paragraph>[] = [];

  const lines = markdown.split("\n");
  let i = 0;

  const parseInline = (text: string): InstanceType<typeof TextRun>[] => {
    const parts: InstanceType<typeof TextRun>[] = [];
    const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
    let last = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > last) parts.push(new TextRun(text.slice(last, match.index)));
      if (match[1]) parts.push(new TextRun({ text: match[1], bold: true }));
      else if (match[2]) parts.push(new TextRun({ text: match[2], italics: true }));
      last = match.index + match[0].length;
    }
    if (last < text.length) parts.push(new TextRun(text.slice(last)));
    return parts;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      children.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 }));
    } else if (line.startsWith("## ")) {
      children.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 }));
    } else if (line.startsWith("### ")) {
      children.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 }));
    } else if (/^[*-] /.test(line)) {
      children.push(new Paragraph({ children: parseInline(line.slice(2)), bullet: { level: 0 } }));
    } else if (/^\d+\. /.test(line)) {
      children.push(new Paragraph({ children: parseInline(line), bullet: { level: 1 } }));
    } else if (line.trim() === "") {
      children.push(new Paragraph({ text: "" }));
    } else {
      children.push(new Paragraph({ children: parseInline(line), alignment: AlignmentType.JUSTIFIED }));
    }
    i++;
  }

  const doc = new Document({
    title,
    sections: [{ properties: {}, children }],
  });

  return Packer.toBlob(doc);
}

function downloadPdf(markdown: string, title: string) {
  const html = markdownToHtmlString(markdown);
  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to download PDF"); return; }
  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title || "Document"}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 720px; margin: 48px auto; padding: 0 32px; font-size: 11.5pt; line-height: 1.65; color: #1a1a1a; }
  h1 { font-size: 22pt; font-weight: bold; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #333; color: #111; }
  h2 { font-size: 15pt; font-weight: bold; margin-top: 28px; margin-bottom: 10px; color: #222; }
  h3 { font-size: 12.5pt; font-weight: bold; margin-top: 20px; margin-bottom: 8px; color: #333; }
  p { margin-top: 0; margin-bottom: 10px; }
  ul, ol { margin: 8px 0 12px 0; padding-left: 24px; }
  li { margin-bottom: 5px; }
  strong { font-weight: bold; }
  em { font-style: italic; }
  @media print { body { margin: 0; max-width: 100%; } @page { margin: 2cm 2.5cm; } }
</style>
</head>
<body>${html}</body>
</html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

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
  const [viewRaw, setViewRaw] = useState(false);
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
    setViewRaw(false);

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
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
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

  const downloadDocx = async () => {
    try {
      const blob = await generateDocx(result, documentTitle || "Document");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${documentTitle || "document"}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("DOCX export failed: " + (e instanceof Error ? e.message : String(e)));
    }
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
            <h1 className="text-lg font-semibold">DocForge</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <p className="text-neutral-400 text-sm">
          Transform raw notes, drafts, or documents into polished output. Upload a file or paste content, choose a template, and Claude will structure and refine it — then export as PDF, DOCX, or Markdown.
        </p>

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
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <button
                    onClick={() => setViewRaw((v) => !v)}
                    className="text-xs px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    {viewRaw ? "Formatted" : "Raw MD"}
                  </button>
                  <button
                    onClick={() => downloadPdf(result, documentTitle || "Document")}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-400 hover:text-red-300 transition-colors"
                    title="Export as PDF (opens print dialog)"
                  >
                    <File className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button
                    onClick={downloadDocx}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-400 hover:text-blue-300 transition-colors"
                    title="Export as Word document"
                  >
                    <FileDown className="w-3.5 h-3.5" /> DOCX
                  </button>
                  <button
                    onClick={downloadMd}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-400 hover:text-emerald-300 transition-colors"
                    title="Export as Markdown"
                  >
                    <FileText className="w-3.5 h-3.5" /> MD
                  </button>
                  <button
                    onClick={copy}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </button>
                </div>
              )}
            </div>

            <div className="min-h-[600px] bg-neutral-900 border border-neutral-700 rounded-lg p-6 overflow-auto">
              {loading && !result && (
                <div className="flex items-center gap-2 text-neutral-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Formatting document...</span>
                </div>
              )}
              {!loading && !result && (
                <p className="text-neutral-600 text-sm">Your formatted document will appear here.</p>
              )}
              {result && (
                viewRaw ? (
                  <pre className="text-xs text-neutral-300 font-mono whitespace-pre-wrap leading-relaxed">{result}</pre>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none
                    prose-headings:text-neutral-100 prose-headings:font-semibold
                    prose-h1:text-xl prose-h1:border-b prose-h1:border-neutral-700 prose-h1:pb-3 prose-h1:mb-4
                    prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3
                    prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
                    prose-p:text-neutral-300 prose-p:leading-relaxed prose-p:mb-3
                    prose-strong:text-neutral-100
                    prose-em:text-neutral-300
                    prose-ul:text-neutral-300 prose-ol:text-neutral-300
                    prose-li:mb-1 prose-li:leading-relaxed
                    prose-hr:border-neutral-700
                  ">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                )
              )}
              {loading && result && (
                <div className="mt-4">
                  {viewRaw ? (
                    <pre className="text-xs text-neutral-300 font-mono whitespace-pre-wrap leading-relaxed">{result}</pre>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none
                      prose-headings:text-neutral-100 prose-headings:font-semibold
                      prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                      prose-p:text-neutral-300 prose-p:leading-relaxed
                      prose-strong:text-neutral-100 prose-ul:text-neutral-300 prose-li:mb-1
                    ">
                      <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
