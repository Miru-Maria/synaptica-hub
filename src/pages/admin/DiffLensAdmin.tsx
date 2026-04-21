import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, GitCompare, Upload, Trash2, ChevronUp, ChevronDown, PenLine,
  Sun, Moon, Type, Code2,
} from "lucide-react";

function useAuthed() {
  const [, setLocation] = useLocation();
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("admin_token")) { setLocation("/admin/login"); return; }
    setAuthed(true);
  }, [setLocation]);
  return authed;
}

interface WordSeg { text: string; changed: boolean }
interface DiffRow {
  leftLine: string | null;
  rightLine: string | null;
  leftType: "unchanged" | "removed" | "empty";
  rightType: "unchanged" | "added" | "empty";
  leftNum: number | null;
  rightNum: number | null;
  leftWords: WordSeg[] | null;
  rightWords: WordSeg[] | null;
  isChange: boolean;
}

interface Theme {
  outer: string;
  leftPanelBg: string;
  rightPanelBg: string;
  removedLineBg: string;
  addedLineBg: string;
  emptyRowBg: string;
  unchangedText: string;
  removedText: string;
  addedText: string;
  modifiedWordBg: string;
  modifiedWordText: string;
  lineNumText: string;
  markerRemovedColor: string;
  markerAddedColor: string;
  markerTransparent: string;
  divider: string;
  labelStripLeft: string;
  labelStripRight: string;
  labelStripBorder: string;
  activeRing: string;
}

const DARK_THEME: Theme = {
  outer: "bg-neutral-950",
  leftPanelBg: "",
  rightPanelBg: "",
  removedLineBg: "bg-red-500/10",
  addedLineBg: "bg-emerald-500/10",
  emptyRowBg: "bg-neutral-900/40",
  unchangedText: "text-neutral-200",
  removedText: "text-red-200",
  addedText: "text-emerald-200",
  modifiedWordBg: "bg-blue-500/35",
  modifiedWordText: "text-blue-200",
  lineNumText: "text-neutral-600",
  markerRemovedColor: "text-red-500/60",
  markerAddedColor: "text-emerald-500/60",
  markerTransparent: "text-transparent",
  divider: "border-neutral-800",
  labelStripLeft: "bg-red-500/5",
  labelStripRight: "bg-emerald-500/5",
  labelStripBorder: "border-neutral-800",
  activeRing: "ring-neutral-500/40",
};

const LIGHT_THEME: Theme = {
  outer: "bg-gray-100",
  leftPanelBg: "bg-white",
  rightPanelBg: "bg-white",
  removedLineBg: "bg-red-50",
  addedLineBg: "bg-green-50",
  emptyRowBg: "bg-gray-50",
  unchangedText: "text-gray-800",
  removedText: "text-red-700",
  addedText: "text-green-700",
  modifiedWordBg: "bg-blue-100",
  modifiedWordText: "text-blue-700",
  lineNumText: "text-gray-400",
  markerRemovedColor: "text-red-400",
  markerAddedColor: "text-green-500",
  markerTransparent: "text-transparent",
  divider: "border-gray-200",
  labelStripLeft: "bg-red-50",
  labelStripRight: "bg-green-50",
  labelStripBorder: "border-gray-200",
  activeRing: "ring-gray-400/50",
};

function splitLines(text: string): string[] {
  const lines = text.split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

async function buildDiff(
  left: string,
  right: string
): Promise<{ rows: DiffRow[]; added: number; removed: number; unchanged: number }> {
  const { diffLines, diffWords } = await import("diff");
  const changes = diffLines(left, right);
  const rows: DiffRow[] = [];
  let lNum = 1, rNum = 1, added = 0, removed = 0, unchanged = 0;
  let i = 0;

  while (i < changes.length) {
    const seg = changes[i];

    if (!seg.added && !seg.removed) {
      for (const line of splitLines(seg.value)) {
        rows.push({ leftLine: line, rightLine: line, leftType: "unchanged", rightType: "unchanged", leftNum: lNum++, rightNum: rNum++, leftWords: null, rightWords: null, isChange: false });
        unchanged++;
      }
      i++;
    } else if (seg.removed) {
      const removedLines = splitLines(seg.value);
      let addedLines: string[] = [];
      if (i + 1 < changes.length && changes[i + 1].added) {
        addedLines = splitLines(changes[i + 1].value);
        i += 2;
      } else {
        i++;
      }
      const maxLen = Math.max(removedLines.length, addedLines.length);
      for (let j = 0; j < maxLen; j++) {
        const lLine = j < removedLines.length ? removedLines[j] : null;
        const rLine = j < addedLines.length ? addedLines[j] : null;
        let leftWords: WordSeg[] | null = null;
        let rightWords: WordSeg[] | null = null;
        if (lLine !== null && rLine !== null) {
          const wd = diffWords(lLine, rLine);
          leftWords = wd.filter((s) => !s.added).map((s) => ({ text: s.value, changed: !!s.removed }));
          rightWords = wd.filter((s) => !s.removed).map((s) => ({ text: s.value, changed: !!s.added }));
        }
        rows.push({ leftLine: lLine, rightLine: rLine, leftType: lLine !== null ? "removed" : "empty", rightType: rLine !== null ? "added" : "empty", leftNum: lLine !== null ? lNum++ : null, rightNum: rLine !== null ? rNum++ : null, leftWords, rightWords, isChange: true });
        if (lLine !== null) removed++;
        if (rLine !== null) added++;
      }
    } else if (seg.added) {
      for (const line of splitLines(seg.value)) {
        rows.push({ leftLine: null, rightLine: line, leftType: "empty", rightType: "added", leftNum: null, rightNum: rNum++, leftWords: null, rightWords: null, isChange: true });
        added++;
      }
      i++;
    }
  }

  return { rows, added, removed, unchanged };
}

function LineContent({
  line, type, words, theme, prose,
}: {
  line: string | null;
  type: string;
  words: WordSeg[] | null;
  theme: Theme;
  prose: boolean;
}) {
  const baseTextClass = prose
    ? "text-[14px] leading-relaxed break-words"
    : "font-mono text-[13px] leading-5 break-all";

  const defaultColor =
    type === "removed" ? theme.removedText :
    type === "added" ? theme.addedText :
    theme.unchangedText;

  if (words) {
    return (
      <span className={`${baseTextClass} ${defaultColor}`}>
        {words.map((w, i) => (
          <span
            key={i}
            className={w.changed ? `${theme.modifiedWordBg} ${theme.modifiedWordText} rounded-[2px] px-[1px]` : ""}
          >
            {w.text}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span className={`${baseTextClass} ${defaultColor}`}>
      {line ?? "\u00a0"}
    </span>
  );
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

  const [rows, setRows] = useState<DiffRow[]>([]);
  const [stats, setStats] = useState<{ added: number; removed: number; unchanged: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"input" | "compare">("input");
  const [currentChange, setCurrentChange] = useState(0);
  const [lightBg, setLightBg] = useState(false);
  const [prose, setProse] = useState(false);

  const theme = lightBg ? LIGHT_THEME : DARK_THEME;

  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);
  const changeRowsRef = useRef<number[]>([]);

  const handleLeftScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncing.current) return;
    if (!rightPanelRef.current) return;
    isSyncing.current = true;
    rightPanelRef.current.scrollTop = e.currentTarget.scrollTop;
    requestAnimationFrame(() => { isSyncing.current = false; });
  }, []);

  const handleRightScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncing.current) return;
    if (!leftPanelRef.current) return;
    isSyncing.current = true;
    leftPanelRef.current.scrollTop = e.currentTarget.scrollTop;
    requestAnimationFrame(() => { isSyncing.current = false; });
  }, []);

  const readFile = async (f: File): Promise<string> => {
    const name = f.name.toLowerCase();
    if (name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const buf = Buffer.from(await f.arrayBuffer());
      return (await mammoth.extractRawText({ buffer: buf })).value;
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || "");
      reader.onerror = reject;
      reader.readAsText(f);
    });
  };

  const runCompare = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      let left = leftText;
      let right = rightText;
      if (leftMode === "file" && leftFile) left = await readFile(leftFile);
      if (rightMode === "file" && rightFile) right = await readFile(rightFile);
      if (!left.trim() && !right.trim()) { setError("Add content to both sides to compare."); setLoading(false); return; }

      const result = await buildDiff(left, right);
      setRows(result.rows);
      setStats({ added: result.added, removed: result.removed, unchanged: result.unchanged });
      changeRowsRef.current = result.rows.map((r, i) => r.isChange ? i : -1).filter((i) => i !== -1);
      setCurrentChange(0);
      setView("compare");
      setTimeout(() => {
        if (changeRowsRef.current.length > 0 && leftPanelRef.current) {
          const firstChange = leftPanelRef.current.querySelector(`[data-ridx="${changeRowsRef.current[0]}"]`);
          firstChange?.scrollIntoView({ block: "center" });
        }
      }, 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Diff failed");
    } finally {
      setLoading(false);
    }
  }, [leftText, rightText, leftMode, rightMode, leftFile, rightFile]);

  const goToChange = useCallback((idx: number) => {
    const clipped = Math.max(0, Math.min(idx, changeRowsRef.current.length - 1));
    setCurrentChange(clipped);
    const rowIdx = changeRowsRef.current[clipped];
    if (rowIdx === undefined || !leftPanelRef.current) return;
    const el = leftPanelRef.current.querySelector(`[data-ridx="${rowIdx}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      isSyncing.current = true;
      if (rightPanelRef.current) {
        const rightEl = rightPanelRef.current.querySelector(`[data-ridx="${rowIdx}"]`);
        rightEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setTimeout(() => { isSyncing.current = false; }, 400);
    }
  }, []);

  const pickFile = (side: "left" | "right") => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".txt,.md,.docx,.json,.csv";
    inp.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) { side === "left" ? setLeftFile(f) : setRightFile(f); }
    };
    inp.click();
  };

  if (!authed) return null;

  const totalChanges = changeRowsRef.current.length;

  const iconBtnClass = (active?: boolean) =>
    `p-1.5 rounded-md transition-colors ${active ? "bg-neutral-700 text-neutral-100" : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"}`;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur sticky top-0 z-10 shrink-0">
        <div className="px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
          <button onClick={() => setLocation("/admin")} className="p-2 rounded-lg hover:bg-neutral-800 transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <GitCompare className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-semibold">DiffLens</h1>
          </div>

          {view === "compare" && stats && (
            <div className="flex items-center gap-2 ml-2 flex-wrap">
              <span className="text-xs px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full">−{stats.removed} removed</span>
              <span className="text-xs px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">+{stats.added} added</span>
              <span className="text-xs px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full">modified in blue</span>
              <span className="text-xs px-2.5 py-1 bg-neutral-800 border border-neutral-700 text-neutral-400 rounded-full">{stats.unchanged} unchanged</span>
              {totalChanges > 0 && (
                <div className="flex items-center gap-1 ml-1">
                  <span className="text-xs text-neutral-500">{currentChange + 1}/{totalChanges}</span>
                  <button onClick={() => goToChange(currentChange - 1)} disabled={currentChange === 0} className="p-1 rounded hover:bg-neutral-800 disabled:opacity-30 transition-colors" title="Previous change">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => goToChange(currentChange + 1)} disabled={currentChange >= totalChanges - 1} className="p-1 rounded hover:bg-neutral-800 disabled:opacity-30 transition-colors" title="Next change">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            {view === "compare" && (
              <>
                <div className="flex items-center gap-0.5 bg-neutral-800/60 rounded-lg p-0.5 mr-1">
                  <button
                    onClick={() => setProse(false)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${!prose ? "bg-neutral-700 text-neutral-100" : "text-neutral-500 hover:text-neutral-300"}`}
                    title="Code / monospace view"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    Code
                  </button>
                  <button
                    onClick={() => setProse(true)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${prose ? "bg-neutral-700 text-neutral-100" : "text-neutral-500 hover:text-neutral-300"}`}
                    title="Prose / document view"
                  >
                    <Type className="w-3.5 h-3.5" />
                    Prose
                  </button>
                </div>

                <button
                  onClick={() => setLightBg((v) => !v)}
                  className={iconBtnClass()}
                  title={lightBg ? "Switch to dark background" : "Switch to light grey background"}
                >
                  {lightBg ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setView("input")}
                  className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-200 transition-colors ml-1 px-2 py-1 rounded-md hover:bg-neutral-800"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {view === "input" ? (
        <main className="flex-1 px-4 sm:px-6 py-6 space-y-5 max-w-7xl mx-auto w-full">
          <p className="text-neutral-400 text-sm">
            Paste or upload two document versions to compare them side-by-side. Word-level changes will be highlighted in blue; deletions in red, additions in green.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {([["left", "Document A — Original", "text-red-400"], ["right", "Document B — Revised", "text-emerald-400"]] as const).map(([side, label, color]) => {
              const text = side === "left" ? leftText : rightText;
              const setText = side === "left" ? setLeftText : setRightText;
              const mode = side === "left" ? leftMode : rightMode;
              const setMode = side === "left" ? setLeftMode : setRightMode;
              const file = side === "left" ? leftFile : rightFile;
              const setFile = side === "left" ? setLeftFile : setRightFile;

              return (
                <div key={side} className="space-y-2">
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
                        rows={18}
                        className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-neutral-600 placeholder:text-neutral-600 font-mono"
                      />
                      {text && (
                        <button onClick={() => setText("")} className="absolute top-2 right-2 p-1 text-neutral-600 hover:text-neutral-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => pickFile(side)}
                      className="border-2 border-dashed border-neutral-700 hover:border-neutral-600 rounded-lg p-10 text-center cursor-pointer transition-colors"
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
                        <p className="text-sm text-neutral-500">Click to upload (.txt, .md, .docx, .json, .csv)</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>}

          <button
            onClick={runCompare}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-semibold rounded-lg transition-colors"
          >
            <GitCompare className="w-4 h-4" />
            {loading ? "Comparing…" : "Compare Documents"}
          </button>
        </main>
      ) : (
        <div className={`flex-1 flex flex-col overflow-hidden transition-colors ${theme.outer}`}>
          <div className={`flex shrink-0 border-b ${theme.labelStripBorder}`}>
            <div className={`flex-1 flex items-center px-4 py-2 border-r ${theme.labelStripBorder} ${theme.labelStripLeft}`}>
              <span className={`text-xs font-semibold uppercase tracking-wider ${lightBg ? "text-red-600" : "text-red-400"}`}>
                Document A — Original
              </span>
            </div>
            <div className={`flex-1 flex items-center px-4 py-2 ${theme.labelStripRight}`}>
              <span className={`text-xs font-semibold uppercase tracking-wider ${lightBg ? "text-green-700" : "text-emerald-400"}`}>
                Document B — Revised
              </span>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden" style={{ height: "calc(100vh - 105px)" }}>
            <div
              ref={leftPanelRef}
              onScroll={handleLeftScroll}
              className={`flex-1 overflow-y-auto overflow-x-auto border-r ${theme.divider} ${theme.leftPanelBg}`}
            >
              {rows.map((row, i) => {
                const bg =
                  row.leftType === "removed" ? theme.removedLineBg :
                  row.leftType === "empty" ? theme.emptyRowBg : "";
                const isActive = row.isChange && changeRowsRef.current[currentChange] === i;

                return (
                  <div
                    key={i}
                    data-ridx={i}
                    className={`flex items-stretch min-h-[22px] ${bg} ${isActive ? `ring-1 ring-inset ${theme.activeRing}` : ""}`}
                  >
                    <span className={`w-11 text-right text-[11px] ${theme.lineNumText} pr-2.5 pt-0.5 shrink-0 select-none font-mono leading-5`}>
                      {row.leftNum ?? ""}
                    </span>
                    <span className={`w-4 text-[11px] shrink-0 select-none font-mono leading-5 pt-0.5 ${row.leftType === "removed" ? theme.markerRemovedColor : theme.markerTransparent}`}>
                      {row.leftType === "removed" ? "−" : " "}
                    </span>
                    <span className="flex-1 px-1 py-0.5 min-w-0">
                      <LineContent line={row.leftLine} type={row.leftType} words={row.leftWords} theme={theme} prose={prose} />
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              ref={rightPanelRef}
              onScroll={handleRightScroll}
              className={`flex-1 overflow-y-auto overflow-x-auto ${theme.rightPanelBg}`}
            >
              {rows.map((row, i) => {
                const bg =
                  row.rightType === "added" ? theme.addedLineBg :
                  row.rightType === "empty" ? theme.emptyRowBg : "";
                const isActive = row.isChange && changeRowsRef.current[currentChange] === i;

                return (
                  <div
                    key={i}
                    data-ridx={i}
                    className={`flex items-stretch min-h-[22px] ${bg} ${isActive ? `ring-1 ring-inset ${theme.activeRing}` : ""}`}
                  >
                    <span className={`w-11 text-right text-[11px] ${theme.lineNumText} pr-2.5 pt-0.5 shrink-0 select-none font-mono leading-5`}>
                      {row.rightNum ?? ""}
                    </span>
                    <span className={`w-4 text-[11px] shrink-0 select-none font-mono leading-5 pt-0.5 ${row.rightType === "added" ? theme.markerAddedColor : theme.markerTransparent}`}>
                      {row.rightType === "added" ? "+" : " "}
                    </span>
                    <span className="flex-1 px-1 py-0.5 min-w-0">
                      <LineContent line={row.rightLine} type={row.rightType} words={row.rightWords} theme={theme} prose={prose} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
