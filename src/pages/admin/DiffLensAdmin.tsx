import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, GitCompare, Upload, Trash2, Copy, Check } from "lucide-react";

function useAuthed() {
  const [, setLocation] = useLocation();
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("admin_token")) { setLocation("/admin/login"); return; }
    setAuthed(true);
  }, [setLocation]);
  return authed;
}

interface DiffSegment {
  value: string;
  added?: boolean;
  removed?: boolean;
}

async function diffTexts(left: string, right: string): Promise<DiffSegment[]> {
  const { diffWords } = await import("diff");
  return diffWords(left, right);
}

type InputMode = "text" | "file";

export default function DiffLensAdmin() {
  const [, setLocation] = useLocation();
  const authed = useAuthed();
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [leftMode, setLeftMode] = useState<InputMode>("text");
  const [rightMode, setRightMode] = useState<InputMode>("text");
  const [leftFile, setLeftFile] = useState<File | null>(null);
  const [rightFile, setRightFile] = useState<File | null>(null);
  const [segments, setSegments] = useState<DiffSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{ added: number; removed: number; unchanged: number } | null>(null);

  const readFile = async (f: File): Promise<string> => {
    const name = f.name.toLowerCase();
    if (name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const ab = await f.arrayBuffer();
      const buf = Buffer.from(ab);
      const result = await mammoth.extractRawText({ buffer: buf });
      return result.value;
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || "");
      reader.onerror = reject;
      reader.readAsText(f);
    });
  };

  const runDiff = useCallback(async () => {
    setError(null);
    setSegments([]);
    setStats(null);
    setLoading(true);

    try {
      let left = leftText;
      let right = rightText;

      if (leftMode === "file" && leftFile) left = await readFile(leftFile);
      if (rightMode === "file" && rightFile) right = await readFile(rightFile);

      if (!left.trim() && !right.trim()) { setError("Add content to both sides to compare."); setLoading(false); return; }

      const result = await diffTexts(left, right);
      setSegments(result);

      let added = 0, removed = 0, unchanged = 0;
      for (const seg of result) {
        const words = seg.value.trim().split(/\s+/).filter(Boolean).length;
        if (seg.added) added += words;
        else if (seg.removed) removed += words;
        else unchanged += words;
      }
      setStats({ added, removed, unchanged });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Diff failed");
    } finally {
      setLoading(false);
    }
  }, [leftText, rightText, leftMode, rightMode, leftFile, rightFile]);

  const copyResult = () => {
    const text = segments.map((s) => {
      if (s.added) return `[+] ${s.value}`;
      if (s.removed) return `[-] ${s.value}`;
      return s.value;
    }).join("");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!authed) return null;

  const InputPanel = ({
    side, text, setText, mode, setMode, file, setFile,
  }: {
    side: "left" | "right";
    text: string; setText: (v: string) => void;
    mode: InputMode; setMode: (v: InputMode) => void;
    file: File | null; setFile: (f: File | null) => void;
  }) => {
    const label = side === "left" ? "Document A (Original)" : "Document B (Revised)";
    const color = side === "left" ? "text-red-400" : "text-emerald-400";
    return (
      <div className="flex-1 space-y-3 min-w-0">
        <div className="flex items-center justify-between">
          <label className={`text-sm font-semibold ${color}`}>{label}</label>
          <div className="flex gap-1">
            {(["text", "file"] as InputMode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`text-xs px-3 py-1 rounded-md transition-colors ${mode === m ? "bg-neutral-700 text-neutral-100" : "text-neutral-500 hover:text-neutral-300"}`}>
                {m === "text" ? "Paste" : "File"}
              </button>
            ))}
          </div>
        </div>
        {mode === "text" ? (
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Paste ${side === "left" ? "original" : "revised"} version here...`}
              rows={14}
              className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-neutral-600 placeholder:text-neutral-600 font-mono"
            />
            {text && (
              <button onClick={() => setText("")} className="absolute top-2 right-2 p-1 text-neutral-600 hover:text-neutral-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div
            onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".txt,.md,.docx,.json,.csv"; inp.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) setFile(f); }; inp.click(); }}
            className="border-2 border-dashed border-neutral-700 hover:border-neutral-600 rounded-lg p-8 text-center cursor-pointer transition-colors"
          >
            <Upload className="w-6 h-6 text-neutral-500 mx-auto mb-2" />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm text-emerald-400">{file.name}</p>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-neutral-500 hover:text-neutral-300"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">Click to upload (.txt, .md, .docx, .json, .csv)</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button onClick={() => setLocation("/admin")} className="p-2 rounded-lg hover:bg-neutral-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-semibold">DiffLens</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <p className="text-neutral-400 text-sm">Compare two versions of a document side-by-side with word-level diff highlighting. Paste text directly or upload files (.txt, .md, .docx, .json, .csv).</p>

        <div className="flex gap-4 flex-col lg:flex-row">
          <InputPanel side="left" text={leftText} setText={setLeftText} mode={leftMode} setMode={setLeftMode} file={leftFile} setFile={setLeftFile} />
          <InputPanel side="right" text={rightText} setText={setRightText} mode={rightMode} setMode={setRightMode} file={rightFile} setFile={setRightFile} />
        </div>

        {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>}

        <button
          onClick={runDiff}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-semibold rounded-lg transition-colors"
        >
          <GitCompare className="w-4 h-4" />
          {loading ? "Comparing..." : "Compare Documents"}
        </button>

        {stats && (
          <div className="flex gap-4 text-sm">
            <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">+{stats.added} words added</span>
            <span className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">−{stats.removed} words removed</span>
            <span className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 text-neutral-400 rounded-lg">{stats.unchanged} unchanged</span>
            <button onClick={copyResult} className="ml-auto flex items-center gap-1.5 text-neutral-400 hover:text-neutral-200 transition-colors">
              {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy diff</>}
            </button>
          </div>
        )}

        {segments.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words max-h-[600px] overflow-auto">
            {segments.map((seg, i) => (
              <span
                key={i}
                className={
                  seg.added ? "bg-emerald-500/20 text-emerald-300 rounded px-0.5" :
                  seg.removed ? "bg-red-500/20 text-red-300 line-through rounded px-0.5" :
                  "text-neutral-300"
                }
              >
                {seg.value}
              </span>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
