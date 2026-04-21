import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  FlaskConical,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Trash2,
  Globe,
  MessageSquare,
  FileText,
  BrainCircuit,
  Database,
  PenTool,
  ScanSearch,
  Hammer,
  BarChart2,
  GitCompare,
  Layers,
} from "lucide-react";

interface Finding {
  id: string;
  runId: string;
  tool: string;
  area: string;
  scenario: string;
  severity: "pass" | "warning" | "fail";
  hypothesis: string;
  result: string;
  summary: string;
  evaluatedAt: string;
}

interface TestRun {
  id: string;
  triggeredAt: string;
  status: "running" | "completed" | "failed";
  totalScenarios: number;
  completedScenarios: number;
  summary: string | null;
  reportMarkdown: string | null;
  cleanedUp: boolean;
  expiresAt: string;
  findings?: Finding[];
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const AREA_LABELS: Record<string, string> = {
  docaudit: "DocAudit",
  external_tools: "External Tools",
  chat: "Chat Assistant",
  ka_sprint: "KA Sprint",
  rag_pipeline: "RAG Pipeline",
  prompt_workshop: "Prompt Workshop",
  docscope: "DocScope",
  docforge: "DocForge",
  seoscope: "SEOScope",
  difflens: "DiffLens",
  ka_suite: "KA Suite",
};

const AREA_ORDER = ["docaudit", "external_tools", "chat", "ka_sprint", "rag_pipeline", "prompt_workshop", "docscope", "docforge", "seoscope", "difflens", "ka_suite"];

const AREA_ICONS: Record<string, React.ReactNode> = {
  docaudit: <FileText className="w-4 h-4" />,
  external_tools: <Globe className="w-4 h-4" />,
  chat: <MessageSquare className="w-4 h-4" />,
  ka_sprint: <BrainCircuit className="w-4 h-4" />,
  rag_pipeline: <Database className="w-4 h-4" />,
  prompt_workshop: <PenTool className="w-4 h-4" />,
  docscope: <ScanSearch className="w-4 h-4" />,
  docforge: <Hammer className="w-4 h-4" />,
  seoscope: <BarChart2 className="w-4 h-4" />,
  difflens: <GitCompare className="w-4 h-4" />,
  ka_suite: <Layers className="w-4 h-4" />,
};

function SeverityBadge({ severity }: { severity: Finding["severity"] }) {
  if (severity === "pass") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <CheckCircle2 className="w-3 h-3" /> Pass
    </span>
  );
  if (severity === "warning") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
      <AlertTriangle className="w-3 h-3" /> Warning
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
      <XCircle className="w-3 h-3" /> Fail
    </span>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={cn(
      "rounded-lg border p-4 transition-colors",
      finding.severity === "pass" && "border-emerald-800/40 bg-emerald-950/20",
      finding.severity === "warning" && "border-amber-800/40 bg-amber-950/20",
      finding.severity === "fail" && "border-red-800/40 bg-red-950/20",
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <SeverityBadge severity={finding.severity} />
            <span className="text-xs text-neutral-500">{finding.tool}</span>
          </div>
          <p className="text-sm font-medium text-neutral-200">{finding.scenario}</p>
          <p className="text-sm text-neutral-400 mt-1">{finding.summary}</p>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex-shrink-0 text-neutral-500 hover:text-neutral-300 transition-colors mt-0.5"
          aria-label="Toggle details"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
      {expanded && (
        <div className="mt-3 space-y-3 border-t border-neutral-800/50 pt-3">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Hypothesis</p>
            <p className="text-xs text-neutral-400">{finding.hypothesis}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Raw Result</p>
            <pre className="text-xs text-neutral-400 bg-neutral-900/60 rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
              {finding.result.slice(0, 2000)}{finding.result.length > 2000 ? "\n…[truncated]" : ""}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function RunDetail({ run, onClose, onCleanup }: {
  run: TestRun;
  onClose: () => void;
  onCleanup: () => void;
}) {
  const [cleaning, setCleaning] = useState(false);
  const [cleanMsg, setCleanMsg] = useState("");
  const [downloading, setDownloading] = useState(false);

  const areas = AREA_ORDER;
  const findings = run.findings || [];

  const handleCleanup = async () => {
    setCleaning(true);
    setCleanMsg("");
    try {
      const res = await fetch(`/api/admin/tool-tester/runs/${run.id}/cleanup`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json() as Record<string, number | boolean>;
      if (res.ok) {
        const parts = [];
        if (Number(data.deletedChatSessions) > 0) parts.push(`${data.deletedChatSessions} chat session(s)`);
        if (Number(data.deletedLeads) > 0) parts.push(`${data.deletedLeads} test lead(s)`);
        if (Number(data.deletedNotifications) > 0) parts.push(`${data.deletedNotifications} notification(s)`);
        setCleanMsg(parts.length > 0 ? `Removed: ${parts.join(", ")}` : "Nothing to remove — already clean");
        onCleanup();
      } else {
        setCleanMsg("Cleanup failed");
      }
    } catch {
      setCleanMsg("Network error");
    }
    setCleaning(false);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/admin/tool-tester/runs/${run.id}/download`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Synaptica-Tool-Test-Report-${run.id}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch { /* swallow */ }
    setDownloading(false);
  };

  const passCount = findings.filter(f => f.severity === "pass").length;
  const warnCount = findings.filter(f => f.severity === "warning").length;
  const failCount = findings.filter(f => f.severity === "fail").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-neutral-100">Run Detail</h2>
          <p className="text-xs text-neutral-500 font-mono">{run.id}</p>
        </div>
        <div className="flex gap-2">
          {run.status === "completed" && run.reportMarkdown && (
            <Button size="sm" variant="outline" className="border-neutral-700 text-neutral-300 gap-1.5" onClick={handleDownload} disabled={downloading}>
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Download Report
            </Button>
          )}
          {run.status !== "running" && !run.cleanedUp && (
            <Button size="sm" variant="outline" className="border-neutral-700 text-neutral-300 gap-1.5" onClick={handleCleanup} disabled={cleaning}>
              {cleaning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Clean Up
            </Button>
          )}
        </div>
      </div>

      {cleanMsg && (
        <p className="text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 rounded px-3 py-2">{cleanMsg}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-3">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Status</p>
            <p className={cn("text-sm font-semibold capitalize",
              run.status === "completed" && "text-emerald-400",
              run.status === "running" && "text-blue-400",
              run.status === "failed" && "text-red-400",
            )}>{run.status}</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-3">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Pass</p>
            <p className="text-sm font-semibold text-emerald-400">{passCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-3">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Warning</p>
            <p className="text-sm font-semibold text-amber-400">{warnCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-3">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Fail</p>
            <p className="text-sm font-semibold text-red-400">{failCount}</p>
          </CardContent>
        </Card>
      </div>

      {run.summary && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Summary</p>
          <p className="text-sm text-neutral-300">{run.summary}</p>
        </div>
      )}

      {run.status === "running" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Progress</span>
            <span>{run.completedScenarios} / {run.totalScenarios}</span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((run.completedScenarios / run.totalScenarios) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-neutral-500 text-center animate-pulse">Running scenarios…</p>
        </div>
      )}

      {areas.map(area => {
        const areaFindings = findings.filter(f => f.area === area);
        if (areaFindings.length === 0) return null;
        return (
          <div key={area} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">{AREA_ICONS[area]}</span>
              <h3 className="text-sm font-semibold text-neutral-300">{AREA_LABELS[area]}</h3>
              <div className="flex gap-1 ml-auto">
                {areaFindings.filter(f => f.severity === "pass").length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                    {areaFindings.filter(f => f.severity === "pass").length} pass
                  </span>
                )}
                {areaFindings.filter(f => f.severity === "warning").length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                    {areaFindings.filter(f => f.severity === "warning").length} warn
                  </span>
                )}
                {areaFindings.filter(f => f.severity === "fail").length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                    {areaFindings.filter(f => f.severity === "fail").length} fail
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {areaFindings.map(f => <FindingCard key={f.id} finding={f} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ToolTester() {
  const [, setLocation] = useLocation();
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [starting, setStarting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkAuth = useCallback(async () => {
    const res = await fetch("/api/admin/me", { headers: authHeaders() });
    if (!res.ok) { setLocation("/admin/login"); return false; }
    return true;
  }, [setLocation]);

  const loadRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tool-tester/runs", { headers: authHeaders() });
      if (res.ok) setRuns(await res.json());
    } catch { /* swallow */ }
  }, []);

  const loadRunDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/tool-tester/runs/${id}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json() as TestRun;
        setSelectedRun(data);
        setRuns(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
        return data;
      }
    } catch { /* swallow */ }
    return null;
  }, []);

  useEffect(() => {
    async function init() {
      const authed = await checkAuth();
      if (!authed) return;
      await loadRuns();
      setLoading(false);
    }
    init();
  }, [checkAuth, loadRuns]);

  useEffect(() => {
    const activeRun = runs.find(r => r.status === "running");
    if (activeRun) {
      if (pollRef.current) return;
      pollRef.current = setInterval(async () => {
        const updated = await loadRunDetail(activeRun.id);
        if (updated?.status !== "running") {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          await loadRuns();
        }
      }, 3000);
    } else {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [runs, loadRunDetail, loadRuns]);

  const handleStart = async () => {
    setStarting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/tool-tester/run", {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json() as { runId?: string; error?: string };
      if (res.ok && data.runId) {
        await loadRuns();
        const detail = await loadRunDetail(data.runId);
        if (detail) setSelectedRun(detail);
      } else {
        setError(data.error || "Failed to start");
      }
    } catch {
      setError("Network error");
    }
    setStarting(false);
  };

  const activeRun = runs.find(r => r.status === "running");

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-neutral-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 px-4 sm:px-6 py-4 flex items-center gap-4">
        <button onClick={() => setLocation("/admin")} className="text-neutral-400 hover:text-neutral-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-violet-400" />
            Tool Functionality Tester
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Autonomous AI evaluation of all tools and Learning OS through hypothetical use cases
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleStart}
          disabled={starting || !!activeRun}
          className="bg-violet-600 hover:bg-violet-500 text-white gap-1.5"
        >
          {starting || activeRun ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running…</>
          ) : (
            <><Play className="w-3.5 h-3.5" /> Run Tests</>
          )}
        </Button>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="mb-4 bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-2.5 text-sm text-red-300">
            {error}
          </div>
        )}

        {selectedRun ? (
          <RunDetail
            run={selectedRun}
            onClose={() => setSelectedRun(null)}
            onCleanup={() => loadRunDetail(selectedRun.id)}
          />
        ) : (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-violet-400" />
                What this tests
              </h2>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div className="bg-neutral-800/40 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-medium mb-1">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    DocAudit — 5 scenarios
                  </div>
                  <p className="text-xs text-neutral-500">Rich docs, sparse docs, API reference, edge cases, topic mismatch</p>
                </div>
                <div className="bg-neutral-800/40 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-medium mb-1">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    External Tools — 5 checks
                  </div>
                  <p className="text-xs text-neutral-500">Availability, response time, page title and app shell for DiffLens, DocForge, DocScope, KA Demo, Learning OS</p>
                </div>
                <div className="bg-neutral-800/40 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-medium mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    Chat Knowledge — 4 scenarios
                  </div>
                  <p className="text-xs text-neutral-500">Free tools, pricing, Learning OS, honest limitations</p>
                </div>
                <div className="bg-neutral-800/40 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-medium mb-1">
                    <BrainCircuit className="w-3.5 h-3.5 text-violet-400" />
                    KA Sprint — 3 scenarios
                  </div>
                  <p className="text-xs text-neutral-500">Taxonomy generation, retrieval schema, and edge case with minimal input</p>
                </div>
                <div className="bg-neutral-800/40 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-medium mb-1">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    RAG Pipeline — 3 scenarios
                  </div>
                  <p className="text-xs text-neutral-500">Status check, ingest + accurate retrieval, off-topic question handling</p>
                </div>
                <div className="bg-neutral-800/40 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-medium mb-1">
                    <PenTool className="w-3.5 h-3.5 text-rose-400" />
                    Prompt Workshop — 3 scenarios
                  </div>
                  <p className="text-xs text-neutral-500">Prompt list retrieval, style guide access, and live prompt execution test</p>
                </div>
                <div className="bg-neutral-800/40 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-medium mb-1">
                    <ScanSearch className="w-3.5 h-3.5 text-indigo-400" />
                    DocScope — 2 scenarios
                  </div>
                  <p className="text-xs text-neutral-500">Gap detection mode and full-analysis mode on mixed-quality content</p>
                </div>
                <div className="bg-neutral-800/40 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-medium mb-1">
                    <Hammer className="w-3.5 h-3.5 text-orange-400" />
                    DocForge — 2 scenarios
                  </div>
                  <p className="text-xs text-neutral-500">Consulting report format and executive brief format from raw notes</p>
                </div>
                <div className="bg-neutral-800/40 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-medium mb-1">
                    <BarChart2 className="w-3.5 h-3.5 text-green-400" />
                    SEOScope — 2 scenarios
                  </div>
                  <p className="text-xs text-neutral-500">Full SEO audit and keyword analysis on a knowledge architecture article</p>
                </div>
                <div className="bg-neutral-800/40 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-medium mb-1">
                    <GitCompare className="w-3.5 h-3.5 text-pink-400" />
                    DiffLens — 1 scenario
                  </div>
                  <p className="text-xs text-neutral-500">Admin page accessibility check (client-side tool, no API required)</p>
                </div>
                <div className="bg-neutral-800/40 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-medium mb-1">
                    <Layers className="w-3.5 h-3.5 text-teal-400" />
                    KA Suite — 7 scenarios
                  </div>
                  <p className="text-xs text-neutral-500">KB create/list, document ingest, semantic search, gap analysis, FAQ builder, RAG chat, prompt templates</p>
                </div>
              </div>
              <p className="text-xs text-neutral-500">
                37 scenarios total across 11 tool areas. Reports stored for up to 60 days, max 10 kept — oldest removed automatically when a new run completes.
              </p>
            </div>

            {activeRun && (
              <Card className="bg-blue-950/20 border-blue-800/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-300 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Test run in progress
                    </p>
                    <Button size="sm" variant="ghost" className="text-blue-400 h-7 px-2 gap-1" onClick={() => loadRunDetail(activeRun.id)}>
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-blue-400/70">
                      <span>{activeRun.completedScenarios} of {activeRun.totalScenarios} scenarios</span>
                      <span>{Math.round((activeRun.completedScenarios / activeRun.totalScenarios) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-blue-950/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((activeRun.completedScenarios / activeRun.totalScenarios) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <button
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                    onClick={() => loadRunDetail(activeRun.id).then(d => d && setSelectedRun(d))}
                  >
                    View live findings →
                  </button>
                </CardContent>
              </Card>
            )}

            {runs.length === 0 ? (
              <div className="text-center py-16 text-neutral-500">
                <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No test runs yet. Click <strong className="text-neutral-400">Run Tests</strong> to begin.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Past Runs</h2>
                {runs.map(run => {
                  const pass = 0;
                  const warn = 0;
                  const fail = 0;
                  const ts = new Date(run.triggeredAt);
                  const dateStr = ts.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                  const timeStr = ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <Card
                      key={run.id}
                      className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors"
                      onClick={() => loadRunDetail(run.id).then(d => d && setSelectedRun(d))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={cn("text-xs font-semibold capitalize",
                                run.status === "completed" && "text-emerald-400",
                                run.status === "running" && "text-blue-400",
                                run.status === "failed" && "text-red-400",
                              )}>{run.status}</span>
                              {run.cleanedUp && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500">cleaned up</span>
                              )}
                            </div>
                            <p className="text-sm text-neutral-300 truncate font-mono text-xs">{run.id}</p>
                            {run.summary && (
                              <p className="text-xs text-neutral-500 mt-1">{run.summary}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-neutral-400">{dateStr}</p>
                            <p className="text-xs text-neutral-600">{timeStr}</p>
                            {run.status === "running" && (
                              <p className="text-[10px] text-blue-400 mt-1">{run.completedScenarios}/{run.totalScenarios}</p>
                            )}
                            {run.reportMarkdown && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-violet-400 mt-1">
                                <Download className="w-3 h-3" /> report ready
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
