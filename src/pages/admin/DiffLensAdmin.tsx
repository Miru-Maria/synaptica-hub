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

const DIFFLENS_PRACTICE_SCENARIOS = [
  {
    name: "SLA Document — Annual Revision",
    leftText: `Service Level Agreement — Support Tiers
Effective: January 1, 2024

Standard Support
Response time: 8 business hours for all priority levels.
Coverage: Monday to Friday, 9am–5pm customer local time.
Contact: Email only.
Resolution target: 5 business days.

Premium Support
Response time: 4 business hours for P1/P2 issues.
Coverage: Monday to Friday, 8am–6pm EST.
Contact: Email and phone.
Resolution target: 2 business days for P1, 3 business days for P2.
Dedicated account manager: Not included.

Enterprise Support
Response time: 1 hour for P1, 2 hours for P2, 4 hours for P3.
Coverage: 24/7 for P1 incidents.
Contact: Email, phone, and dedicated Slack channel.
Resolution target: 4 hours for P1, 24 hours for P2.
Dedicated account manager: Included.
Uptime guarantee: 99.5% monthly.`,
    rightText: `Service Level Agreement — Support Tiers
Effective: January 1, 2025

Standard Support
Response time: 8 business hours for P3/P4, 4 business hours for P1/P2.
Coverage: Monday to Friday, 9am–5pm customer local time.
Contact: Email and support portal.
Resolution target: 5 business days for P3/P4, 3 business days for P1/P2.

Premium Support
Response time: 2 business hours for P1, 4 business hours for P2.
Coverage: Monday to Friday, 8am–8pm EST.
Contact: Email, phone, and support portal.
Resolution target: 1 business day for P1, 2 business days for P2.
Dedicated account manager: Included for accounts over $50k ARR.

Enterprise Support
Response time: 30 minutes for P1, 1 hour for P2, 4 hours for P3.
Coverage: 24/7 for P1 and P2 incidents.
Contact: Email, phone, dedicated Slack channel, and video bridge for P1.
Resolution target: 2 hours for P1, 8 hours for P2.
Dedicated account manager: Included.
Uptime guarantee: 99.9% monthly.
Credits: Prorated service credits for SLA misses above threshold.`,
  },
  {
    name: "API Endpoint Docs — v1 to v2 Upgrade",
    leftText: `POST /api/v1/analyze

Analyzes a document and returns gap analysis results.

Authentication: Bearer token required.

Request Body (application/json):
{
  "content": string,       // Document text to analyze
  "topics": string[],      // Topic names to check coverage for
  "kb_name": string        // Label for the knowledge base
}

Response:
{
  "gaps": [
    {
      "topic": string,
      "coverage_score": number,   // 0-100
      "severity": string          // "low" | "medium" | "high" | "critical"
    }
  ],
  "summary": string,
  "overall_score": number
}

Errors:
400: Invalid request body
401: Missing or expired token
500: Analysis failed`,
    rightText: `POST /api/v2/analyze

Analyzes a document and returns a comprehensive gap analysis with recommendations.

Authentication: Bearer token required. Rate limit: 10 requests/minute per token.

Request Body (application/json):
{
  "content": string,               // Document text to analyze (required)
  "topics": string[],              // Topic names to check coverage (required, max 20)
  "kb_name": string,               // Knowledge base label (required)
  "include_recommendations": boolean,  // Default: true
  "language": string               // ISO 639-1 code, default: "en"
}

Response:
{
  "gaps": [
    {
      "topic": string,
      "coverage_score": number,       // 0-100
      "severity": "low" | "medium" | "high" | "critical",
      "chunk_count": number,          // Chunks covering this topic
      "recommendations": string[]     // Actionable next steps (if requested)
    }
  ],
  "summary": string,
  "overall_score": number,
  "processing_time_ms": number,
  "model": string
}

Errors:
400: Invalid request body (includes field-level validation errors)
401: Missing, expired, or revoked token
429: Rate limit exceeded (Retry-After header included)
500: Internal analysis error`,
  },
  {
    name: "Remote Work Policy — 2023 to 2025 Update",
    leftText: `Remote Work Policy
Last updated: March 2023

Eligibility
All full-time employees who have completed their 90-day probation period are eligible for remote work. Part-time employees and contractors are not eligible.

Expectations
Remote employees must be available during core hours: 10am–3pm in their team's primary timezone. Video must be on during all team meetings.

Equipment
The company provides a laptop. Employees are responsible for their own internet connection and home office setup. No stipend provided.

Security
Remote employees must use the company VPN at all times when accessing internal systems. Personal devices may not be used for company work.

Communication
Respond to Slack messages within 2 hours during core hours. Daily standup attendance is required. All work must be documented in the relevant project management tool.`,
    rightText: `Remote Work Policy
Last updated: January 2025

Eligibility
All employees — full-time, part-time, and contractors on engagements longer than 3 months — are eligible for remote work after completing onboarding. No probation period required.

Expectations
Remote employees must be available during core hours: 10am–4pm in their team's primary timezone. Video is encouraged but not required for internal meetings. Client-facing meetings require video.

Equipment
The company provides a laptop and a one-time home office stipend of $500. Employees are responsible for their internet connection. IT support is available remotely for all equipment issues.

Security
Remote employees must use the company VPN when accessing internal systems on networks other than their home network. Personal devices require explicit IT approval and MDM enrollment.

Communication
Respond to Slack messages within 2 hours during core hours. Async-first communication is encouraged — document decisions in Notion. Employees are not expected to respond outside their stated working hours.

Mental Health & Boundaries
All employees are encouraged to set clear working hours in Slack and block focus time in their calendars. No expectation of after-hours availability.`,
  },
];

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

  useEffect(() => {
    if (!authed) return;
    const params = new URLSearchParams(window.location.search);
    const p = params.get("practice");
    if (!p) return;
    const scenario = DIFFLENS_PRACTICE_SCENARIOS[parseInt(p, 10) - 1];
    if (!scenario) return;
    setLeftText(scenario.leftText);
    setRightText(scenario.rightText);
  }, [authed]);
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
      const arrayBuffer = await f.arrayBuffer();
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
      return html
        .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, (_: string, t: string) => t.replace(/<[^>]+>/g, "") + "\n\n")
        .replace(/<p[^>]*>(.*?)<\/p>/gi, (_: string, t: string) => t.replace(/<[^>]+>/g, "") + "\n\n")
        .replace(/<li[^>]*>(.*?)<\/li>/gi, (_: string, t: string) => "• " + t.replace(/<[^>]+>/g, "") + "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
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
      if (!f) return;
      side === "left" ? setLeftFile(f) : setRightFile(f);
      if (f.name.toLowerCase().endsWith(".docx") || f.name.toLowerCase().endsWith(".txt") || f.name.toLowerCase().endsWith(".md")) {
        setProse(true);
        setLightBg(true);
      }
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
