import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Loader2, Copy, Check, Upload, Trash2, FileOutput,
  FileDown, FileText, File, ChevronDown, ChevronRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

function authToken(): string | null {
  return localStorage.getItem("admin_token") || sessionStorage.getItem("demo_token");
}

type OutputFormat = "report" | "brief" | "guide" | "audit" | "proposal";

const FORMATS: { value: OutputFormat; label: string; description: string }[] = [
  { value: "report", label: "Consulting Report", description: "Executive summary, findings, analysis, recommendations" },
  { value: "brief", label: "Executive Brief", description: "Concise overview, key points, next steps" },
  { value: "guide", label: "Structured Guide", description: "Intro, step-by-step sections, summary" },
  { value: "audit", label: "Audit Report", description: "Scope, current state, gap analysis, priorities" },
  { value: "proposal", label: "Proposal", description: "Background, approach, deliverables, timeline, investment" },
];

const PDF_FONTS: { value: string; label: string; category: string; sample: string }[] = [
  { value: "Georgia, 'Times New Roman', serif", label: "Georgia", category: "Serif", sample: "Georgia" },
  { value: "'Times New Roman', Times, serif", label: "Times New Roman", category: "Serif", sample: "Times New Roman" },
  { value: "Garamond, Georgia, serif", label: "Garamond", category: "Serif", sample: "Garamond" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial", category: "Sans-serif", sample: "Arial" },
  { value: "'Helvetica Neue', Helvetica, Arial, sans-serif", label: "Helvetica Neue", category: "Sans-serif", sample: "Helvetica Neue" },
  { value: "'Trebuchet MS', Verdana, sans-serif", label: "Trebuchet MS", category: "Sans-serif", sample: "Trebuchet MS" },
];

const PDF_THEMES: { id: string; label: string; heading: string; body: string; border: string; swatch: string }[] = [
  { id: "classic", label: "Classic", heading: "#111111", body: "#1a1a1a", border: "#333333", swatch: "#333333" },
  { id: "navy", label: "Navy", heading: "#1a3a6b", body: "#1c1c1e", border: "#1a3a6b", swatch: "#1a3a6b" },
  { id: "slate", label: "Slate", heading: "#334155", body: "#1e293b", border: "#475569", swatch: "#475569" },
  { id: "forest", label: "Forest", heading: "#14532d", body: "#1a1a1a", border: "#166534", swatch: "#166534" },
  { id: "burgundy", label: "Burgundy", heading: "#7f1d1d", body: "#1a1a1a", border: "#991b1b", swatch: "#991b1b" },
  { id: "midnight", label: "Midnight", heading: "#312e81", body: "#1a1a1a", border: "#3730a3", swatch: "#4338ca" },
];

const FONT_SIZES = [
  { value: "10pt", label: "10 pt" },
  { value: "11pt", label: "11 pt" },
  { value: "11.5pt", label: "11.5 pt" },
  { value: "12pt", label: "12 pt" },
];

interface PdfOptions {
  font: string;
  themeId: string;
  customHeadingColor: string;
  fontSize: string;
  footerLeft: string;
  footerCenter: string;
  showDate: boolean;
  showPageNumbers: boolean;
}

function buildPdfHtml(markdown: string, title: string, opts: PdfOptions): string {
  const theme = PDF_THEMES.find((t) => t.id === opts.themeId) ?? PDF_THEMES[0];
  const headingColor = opts.themeId === "custom" ? opts.customHeadingColor : theme.heading;
  const bodyColor = theme.body;
  const borderColor = opts.themeId === "custom" ? opts.customHeadingColor : theme.border;

  const html = markdown
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^[*-] (.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li class='ordered'>$1</li>")
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => "<ul>" + m + "</ul>")
    .split(/\n\n+/)
    .map((block) => {
      if (/^<(h[1-6]|ul|ol)/.test(block.trim())) return block.trim();
      return "<p>" + block.replace(/\n/g, " ").trim() + "</p>";
    })
    .join("\n");

  const footerLeftText = opts.footerLeft.trim();
  const footerCenterText = opts.footerCenter.trim();
  const footerDate = opts.showDate ? new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
  const hasFooter = footerLeftText || footerCenterText || opts.showDate || opts.showPageNumbers;

  const footerHtml = hasFooter ? `
<footer>
  <span class="footer-left">${footerLeftText}</span>
  <span class="footer-center">${footerCenterText}</span>
  <span class="footer-right">${footerDate}${opts.showDate && opts.showPageNumbers ? " &nbsp;·&nbsp; " : ""}${opts.showPageNumbers ? '<span class="page-num"></span>' : ""}</span>
</footer>` : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title || "Document"}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: ${opts.font};
    max-width: 720px;
    margin: 48px auto;
    padding: 0 32px ${hasFooter ? "60px" : "32px"};
    font-size: ${opts.fontSize};
    line-height: 1.65;
    color: ${bodyColor};
  }
  h1 {
    font-size: 2em;
    font-weight: bold;
    margin-bottom: 0.6em;
    padding-bottom: 0.35em;
    border-bottom: 2px solid ${borderColor};
    color: ${headingColor};
  }
  h2 {
    font-size: 1.4em;
    font-weight: bold;
    margin-top: 1.6em;
    margin-bottom: 0.5em;
    color: ${headingColor};
  }
  h3 {
    font-size: 1.15em;
    font-weight: bold;
    margin-top: 1.2em;
    margin-bottom: 0.4em;
    color: ${headingColor};
  }
  p { margin-bottom: 0.7em; }
  ul, ol { margin: 0.4em 0 0.8em 0; padding-left: 1.5em; }
  li { margin-bottom: 0.3em; }
  li.ordered { list-style-type: decimal; }
  strong { font-weight: bold; }
  em { font-style: italic; }
  footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    border-top: 1px solid #d1d5db;
    padding: 7px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8.5pt;
    color: #6b7280;
    background: white;
  }
  .footer-left { text-align: left; flex: 1; }
  .footer-center { text-align: center; flex: 1; }
  .footer-right { text-align: right; flex: 1; }
  @media print {
    body { margin: 0; max-width: 100%; }
    @page {
      margin: 2cm 2.5cm ${hasFooter ? "3cm" : "2cm"};
      ${opts.showPageNumbers ? "@bottom-right { content: 'Page ' counter(page) ' of ' counter(pages); font-size: 8pt; color: #6b7280; }" : ""}
    }
  }
</style>
</head>
<body>
${html}
${footerHtml}
</body>
</html>`;
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
      children.push(new Paragraph({ children: parseInline(line.replace(/^\d+\. /, "")), bullet: { level: 1 } }));
    } else if (line.trim() === "") {
      children.push(new Paragraph({ text: "" }));
    } else {
      children.push(new Paragraph({ children: parseInline(line), alignment: AlignmentType.JUSTIFIED }));
    }
    i++;
  }

  const doc = new Document({ title, sections: [{ properties: {}, children }] });
  return Packer.toBlob(doc);
}

const DEFAULT_PDF_OPTIONS: PdfOptions = {
  font: "Georgia, 'Times New Roman', serif",
  themeId: "classic",
  customHeadingColor: "#1a3a6b",
  fontSize: "11.5pt",
  footerLeft: "",
  footerCenter: "",
  showDate: false,
  showPageNumbers: false,
};

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
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfOpts, setPdfOpts] = useState<PdfOptions>(DEFAULT_PDF_OPTIONS);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setPdf = (patch: Partial<PdfOptions>) => setPdfOpts((prev) => ({ ...prev, ...patch }));

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

  const downloadPdf = () => {
    const win = window.open("", "_blank");
    if (!win) { alert("Please allow popups to export as PDF"); return; }
    win.document.write(buildPdfHtml(result, documentTitle || "Document", pdfOpts));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  if (!authed) return null;

  const inputCls = "w-full bg-neutral-900 border border-neutral-700 text-neutral-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder:text-neutral-600";
  const currentTheme = PDF_THEMES.find((t) => t.id === pdfOpts.themeId);

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
                  <button key={f.value} onClick={() => setOutputFormat(f.value)}
                    className={`text-left p-3 rounded-lg border transition-all ${outputFormat === f.value ? "border-emerald-500 bg-emerald-500/10" : "border-neutral-700 hover:border-neutral-600 bg-neutral-900"}`}>
                    <p className="text-sm font-medium text-neutral-100">{f.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{f.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Document Title <span className="text-neutral-600 font-normal">(optional)</span></label>
              <input type="text" value={documentTitle} onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="e.g. Meridian HR — Documentation Audit Q2 2025" className={inputCls} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Branding / Tone Notes <span className="text-neutral-600 font-normal">(optional)</span></label>
              <input type="text" value={brandingNotes} onChange={(e) => setBrandingNotes(e.target.value)}
                placeholder="e.g. Formal, B2B consulting tone. Client: Meridian HR." className={inputCls} />
            </div>

            <div className="border border-neutral-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setPdfOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900 hover:bg-neutral-800/80 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <File className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-300">PDF Formatting</span>
                  {currentTheme && (
                    <span className="inline-flex items-center gap-1.5 ml-1">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ background: currentTheme.swatch }} />
                      <span className="text-xs text-neutral-500">{currentTheme.label} · {PDF_FONTS.find((f) => f.value === pdfOpts.font)?.label ?? "Georgia"} · {pdfOpts.fontSize}</span>
                    </span>
                  )}
                </div>
                {pdfOpen ? <ChevronDown className="w-4 h-4 text-neutral-500" /> : <ChevronRight className="w-4 h-4 text-neutral-500" />}
              </button>

              {pdfOpen && (
                <div className="px-4 pb-4 pt-3 space-y-5 border-t border-neutral-700 bg-neutral-900/50">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Font</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PDF_FONTS.map((f) => (
                        <button key={f.value} onClick={() => setPdf({ font: f.value })}
                          className={`text-left px-3 py-2 rounded-md border text-sm transition-all ${pdfOpts.font === f.value ? "border-emerald-500/60 bg-emerald-500/10 text-neutral-100" : "border-neutral-700 hover:border-neutral-600 text-neutral-400 hover:text-neutral-200 bg-neutral-900"}`}
                          style={{ fontFamily: f.sample }}>
                          <span className="block text-sm">{f.label}</span>
                          <span className="block text-[10px] text-neutral-600 mt-0.5 font-sans">{f.category}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Heading Colour</label>
                    <div className="flex flex-wrap gap-2">
                      {PDF_THEMES.map((t) => (
                        <button key={t.id} onClick={() => setPdf({ themeId: t.id })}
                          title={t.label}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-all ${pdfOpts.themeId === t.id ? "border-emerald-500/60 bg-emerald-500/10 text-neutral-100" : "border-neutral-700 hover:border-neutral-600 text-neutral-400 hover:text-neutral-200"}`}>
                          <span className="w-3.5 h-3.5 rounded-sm inline-block shrink-0" style={{ background: t.swatch }} />
                          {t.label}
                        </button>
                      ))}
                      <button onClick={() => setPdf({ themeId: "custom" })}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-all ${pdfOpts.themeId === "custom" ? "border-emerald-500/60 bg-emerald-500/10 text-neutral-100" : "border-neutral-700 hover:border-neutral-600 text-neutral-400 hover:text-neutral-200"}`}>
                        <span className="w-3.5 h-3.5 rounded-sm inline-block shrink-0 border border-neutral-600" style={{ background: pdfOpts.customHeadingColor }} />
                        Custom
                      </button>
                    </div>
                    {pdfOpts.themeId === "custom" && (
                      <div className="flex items-center gap-3 mt-2">
                        <input type="color" value={pdfOpts.customHeadingColor} onChange={(e) => setPdf({ customHeadingColor: e.target.value })}
                          className="w-10 h-8 rounded cursor-pointer border border-neutral-700 bg-transparent p-0.5" />
                        <input type="text" value={pdfOpts.customHeadingColor} onChange={(e) => setPdf({ customHeadingColor: e.target.value })}
                          placeholder="#1a3a6b" className="w-32 bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-md px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Body Font Size</label>
                    <div className="flex gap-1.5">
                      {FONT_SIZES.map((s) => (
                        <button key={s.value} onClick={() => setPdf({ fontSize: s.value })}
                          className={`px-3 py-1.5 rounded-md border text-xs transition-all ${pdfOpts.fontSize === s.value ? "border-emerald-500/60 bg-emerald-500/10 text-neutral-100" : "border-neutral-700 hover:border-neutral-600 text-neutral-400 hover:text-neutral-200"}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Footer</label>
                    <div className="space-y-2">
                      <input type="text" value={pdfOpts.footerLeft} onChange={(e) => setPdf({ footerLeft: e.target.value })}
                        placeholder="Footer left — e.g. Synaptica Knowledge Systems | Confidential"
                        className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 placeholder:text-neutral-600" />
                      <input type="text" value={pdfOpts.footerCenter} onChange={(e) => setPdf({ footerCenter: e.target.value })}
                        placeholder="Footer centre — e.g. Internal Use Only"
                        className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 placeholder:text-neutral-600" />
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={pdfOpts.showDate} onChange={(e) => setPdf({ showDate: e.target.checked })}
                          className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 accent-emerald-500 cursor-pointer" />
                        <span className="text-sm text-neutral-300">Include date</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={pdfOpts.showPageNumbers} onChange={(e) => setPdf({ showPageNumbers: e.target.checked })}
                          className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 accent-emerald-500 cursor-pointer" />
                        <span className="text-sm text-neutral-300">Page numbers</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
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
                <input ref={fileInputRef} type="file" accept=".docx,.txt,.md" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-300">Or Paste Raw Content</label>
                {rawText && <button onClick={() => setRawText("")} className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Clear</button>}
              </div>
              <textarea value={rawText} onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste notes, bullet points, rough drafts, or any unstructured content..."
                rows={6}
                className="w-full bg-neutral-900 border border-neutral-700 text-neutral-100 rounded-lg px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder:text-neutral-600" />
            </div>

            {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>}

            <button onClick={generate} disabled={loading || (!rawText.trim() && !file)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 font-semibold rounded-lg transition-colors">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><FileOutput className="w-4 h-4" /> Generate Document</>}
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300">Formatted Output</label>
              {result && (
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <button onClick={() => setViewRaw((v) => !v)}
                    className="text-xs px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors">
                    {viewRaw ? "Formatted" : "Raw MD"}
                  </button>
                  <button onClick={downloadPdf}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-400 hover:text-red-300 transition-colors" title="Export as PDF">
                    <File className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button onClick={downloadDocx}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-400 hover:text-blue-300 transition-colors" title="Export as Word document">
                    <FileDown className="w-3.5 h-3.5" /> DOCX
                  </button>
                  <button onClick={downloadMd}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-400 hover:text-emerald-300 transition-colors" title="Export as Markdown">
                    <FileText className="w-3.5 h-3.5" /> MD
                  </button>
                  <button onClick={copy}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors">
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
              {!loading && !result && <p className="text-neutral-600 text-sm">Your formatted document will appear here.</p>}
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
                    prose-strong:text-neutral-100 prose-em:text-neutral-300
                    prose-ul:text-neutral-300 prose-ol:text-neutral-300
                    prose-li:mb-1 prose-li:leading-relaxed prose-hr:border-neutral-700">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
