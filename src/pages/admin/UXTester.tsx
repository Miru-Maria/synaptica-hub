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
  Clock,
  Users,
  MessageSquare,
  Wrench,
  Navigation,
  Mail,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Trash2,
  ShieldCheck,
} from "lucide-react";

interface PersonaScenario {
  id: string;
  name: string;
  area: string;
  action: string;
}

interface PersonaInfo {
  id: string;
  name: string;
  background: string;
  intent: string;
  tone: string;
  scenarioCount: number;
  scenarios: PersonaScenario[];
}

interface Finding {
  id: string;
  runId: string;
  persona: string;
  area: string;
  scenario: string;
  severity: "good" | "needs_attention" | "issue";
  summary: string;
  rawInput: string;
  rawOutput: string;
  evaluatedAt: string;
}

interface TestRun {
  id: string;
  triggeredAt: string;
  status: "running" | "completed" | "failed";
  personaIds: string[];
  totalScenarios: number;
  completedScenarios: number;
  summary?: string;
  findings?: Finding[];
  cleanedUp: boolean;
  testChatSessionIds: string[];
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const AREA_LABELS: Record<string, string> = {
  chat: "Chat Assistant",
  lab_tools: "Lab Tools",
  navigation: "Navigation",
  lead_capture: "Lead Capture",
};

const AREA_ICONS: Record<string, React.ReactNode> = {
  chat: <MessageSquare className="w-4 h-4" />,
  lab_tools: <Wrench className="w-4 h-4" />,
  navigation: <Navigation className="w-4 h-4" />,
  lead_capture: <Mail className="w-4 h-4" />,
};

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    good: {
      label: "Good",
      className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    needs_attention: {
      label: "Needs Attention",
      className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    issue: {
      label: "Issue",
      className: "bg-red-500/15 text-red-400 border-red-500/30",
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
  };

  const c = config[severity] || config.needs_attention;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded border font-medium", c.className)}>
      {c.icon}
      {c.label}
    </span>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-800/30 transition-colors"
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-neutral-500 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-neutral-200">{finding.scenario}</span>
            <SeverityBadge severity={finding.severity} />
          </div>
          <p className="text-xs text-neutral-500 mt-0.5 truncate">{finding.persona}</p>
        </div>
        <span className="text-xs text-neutral-600 flex-shrink-0">
          {AREA_ICONS[finding.area]}
        </span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-neutral-800 space-y-3 pt-3">
          <div>
            <p className="text-xs font-medium text-neutral-400 mb-1">Evaluation</p>
            <p className="text-sm text-neutral-300">{finding.summary}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-400 mb-1">Input</p>
            <pre className="text-xs text-neutral-500 bg-neutral-900 rounded p-2 overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap">{finding.rawInput}</pre>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-400 mb-1">Output</p>
            <pre className="text-xs text-neutral-500 bg-neutral-900 rounded p-2 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">{finding.rawOutput.slice(0, 2000)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UXTester() {
  const [, setLocation] = useLocation();
  const [personas, setPersonas] = useState<PersonaInfo[]>([]);
  const [totalScenarios, setTotalScenarios] = useState(0);
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [activeRun, setActiveRun] = useState<TestRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me", { headers: authHeaders() });
      if (!res.ok) { setLocation("/admin/login"); return false; }
      return true;
    } catch { setLocation("/admin/login"); return false; }
  }, [setLocation]);

  const loadPersonas = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ux-agent/personas", { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPersonas(data.personas);
        setTotalScenarios(data.totalScenarios);
      }
    } catch (err) { console.error("Failed to load personas:", err); }
  }, []);

  const loadRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ux-agent/runs", { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRuns(data);
        const running = data.find((r: TestRun) => r.status === "running");
        if (running) {
          setActiveRun(running);
        } else {
          setActiveRun(null);
        }
      }
    } catch (err) { console.error("Failed to load runs:", err); }
  }, []);

  const loadRunDetail = useCallback(async (runId: string) => {
    try {
      const res = await fetch(`/api/admin/ux-agent/runs/${runId}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSelectedRun(data);
        if (data.status === "running") {
          setActiveRun(data);
        }
      }
    } catch (err) { console.error("Failed to load run detail:", err); }
  }, []);

  useEffect(() => {
    async function init() {
      const authed = await checkAuth();
      if (!authed) return;
      await Promise.all([loadPersonas(), loadRuns()]);
      setLoading(false);
    }
    init();
  }, [checkAuth, loadPersonas, loadRuns]);

  useEffect(() => {
    if (activeRun && activeRun.status === "running") {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/admin/ux-agent/runs/${activeRun.id}`, { headers: authHeaders() });
          if (res.ok) {
            const data = await res.json();
            setActiveRun(data.status === "running" ? data : null);
            if (selectedRunId === data.id) setSelectedRun(data);
            if (data.status !== "running") {
              loadRuns();
              if (pollRef.current) clearInterval(pollRef.current);
            }
          }
        } catch (err) { console.error("Poll error:", err); }
      }, 3000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [activeRun, selectedRunId, loadRuns]);

  const startRun = async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/admin/ux-agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedRunId(data.runId);
        setTimeout(async () => {
          await loadRuns();
          await loadRunDetail(data.runId);
        }, 1000);
      } else if (res.status === 409) {
        const data = await res.json();
        if (data.runId) {
          setSelectedRunId(data.runId);
          await loadRuns();
          await loadRunDetail(data.runId);
        }
      }
    } catch (err) {
      console.error("Failed to start run:", err);
    }
    setStarting(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadRuns();
      if (selectedRunId) await loadRunDetail(selectedRunId);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCleanup = async (runId: string) => {
    setCleaningUp(true);
    try {
      const res = await fetch(`/api/admin/ux-agent/runs/${runId}/cleanup`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (res.ok) {
        await loadRunDetail(runId);
        await loadRuns();
      }
    } catch (err) {
      console.error("Cleanup failed:", err);
    }
    setCleaningUp(false);
  };

  const exportReport = async (runId: string) => {
    try {
      const res = await fetch(`/api/admin/ux-agent/runs/${runId}/export`, { headers: authHeaders() });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `UX-Test-Report-${runId}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) { console.error("Export failed:", err); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  const displayRun = selectedRun || (selectedRunId ? null : activeRun);
  const findings = displayRun?.findings || [];
  const filteredFindings = areaFilter === "all" ? findings : findings.filter((f) => f.area === areaFilter);

  const goodCount = findings.filter((f) => f.severity === "good").length;
  const attentionCount = findings.filter((f) => f.severity === "needs_attention").length;
  const issueCount = findings.filter((f) => f.severity === "issue").length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/60 sticky top-0 z-20">
        <div className="h-14 px-4 sm:px-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/admin")} className="text-neutral-400 hover:text-neutral-100">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="font-semibold text-base tracking-tight">UX Testing Agent</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-100">Autonomous UX Test Suite</h2>
            <p className="text-sm text-neutral-400 mt-1">
              {personas.length} personas &middot; {totalScenarios} test scenarios
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-neutral-700 text-neutral-300"
            >
              <RefreshCw className={cn("w-4 h-4 mr-1", refreshing && "animate-spin")} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              size="sm"
              onClick={startRun}
              disabled={starting || !!activeRun}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {starting ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Starting...</>
              ) : activeRun ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Running...</>
              ) : (
                <><Play className="w-4 h-4 mr-1" /> Run Test Suite</>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {personas.map((p) => (
            <Card key={p.id} className="bg-neutral-900 border-neutral-800">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-200 leading-tight">{p.name.split("—")[0].trim()}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-tight">{p.name.split("—")[1]?.trim()}</p>
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{p.intent}</p>
                <p className="text-xs text-neutral-600 mt-1">{p.scenarioCount} scenarios</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {activeRun && activeRun.status === "running" && (
          <Card className="bg-neutral-900 border-teal-500/30">
            <CardContent className="py-4 px-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-teal-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-200">Test suite in progress...</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {activeRun.completedScenarios} / {activeRun.totalScenarios} scenarios completed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-teal-400">{Math.round((activeRun.completedScenarios / activeRun.totalScenarios) * 100)}%</p>
                </div>
              </div>
              <div className="mt-3 h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${(activeRun.completedScenarios / activeRun.totalScenarios) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-neutral-300">Run History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 max-h-[500px] overflow-y-auto">
                {runs.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-4 text-center">No test runs yet.</p>
                ) : (
                  runs.map((run) => (
                    <button
                      key={run.id}
                      onClick={() => { setSelectedRunId(run.id); loadRunDetail(run.id); }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors",
                        selectedRunId === run.id
                          ? "bg-neutral-800 text-neutral-100"
                          : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {run.status === "running" ? (
                          <Loader2 className="w-3 h-3 animate-spin text-teal-400" />
                        ) : run.status === "completed" ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-400" />
                        )}
                        <span className="truncate">{new Date(run.triggeredAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-neutral-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(run.triggeredAt).toLocaleTimeString()}</span>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            {displayRun ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-neutral-200">
                      Test Run — {new Date(displayRun.triggeredAt).toLocaleString()}
                    </h3>
                    {displayRun.summary && (
                      <p className="text-sm text-neutral-400 mt-1">{displayRun.summary}</p>
                    )}
                  </div>
                  {displayRun.status === "completed" && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {displayRun.cleanedUp ? (
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Test data cleaned up
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCleanup(displayRun.id)}
                          disabled={cleaningUp}
                          className="border-amber-700/50 text-amber-400 hover:text-amber-300 hover:border-amber-600"
                        >
                          {cleaningUp ? (
                            <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Cleaning up...</>
                          ) : (
                            <><Trash2 className="w-3.5 h-3.5 mr-1" /> Clean Up Test Data</>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportReport(displayRun.id)}
                        className="border-neutral-700 text-neutral-300"
                      >
                        <Download className="w-4 h-4 mr-1" /> Export Markdown
                      </Button>
                    </div>
                  )}
                </div>

                {findings.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="bg-neutral-900 border-emerald-500/20">
                      <CardContent className="py-3 px-4 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <div>
                          <p className="text-xl font-bold text-emerald-400">{goodCount}</p>
                          <p className="text-xs text-neutral-500">Good</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-neutral-900 border-amber-500/20">
                      <CardContent className="py-3 px-4 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <div>
                          <p className="text-xl font-bold text-amber-400">{attentionCount}</p>
                          <p className="text-xs text-neutral-500">Needs Attention</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-neutral-900 border-red-500/20">
                      <CardContent className="py-3 px-4 flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-red-400" />
                        <div>
                          <p className="text-xl font-bold text-red-400">{issueCount}</p>
                          <p className="text-xs text-neutral-500">Issues</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {findings.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {["all", "chat", "lab_tools", "navigation", "lead_capture"].map((area) => (
                      <button
                        key={area}
                        onClick={() => setAreaFilter(area)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                          areaFilter === area
                            ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                            : "bg-neutral-800 text-neutral-400 border border-neutral-700 hover:text-neutral-300"
                        )}
                      >
                        {area === "all" ? "All" : AREA_LABELS[area]}
                        {area !== "all" && (
                          <span className="ml-1 text-neutral-500">
                            ({findings.filter((f) => f.area === area).length})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  {filteredFindings.length === 0 && displayRun.status === "running" ? (
                    <div className="text-center py-12 text-neutral-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Waiting for results...</p>
                    </div>
                  ) : filteredFindings.length === 0 ? (
                    <p className="text-center py-8 text-neutral-500 text-sm">No findings in this category.</p>
                  ) : (
                    filteredFindings.map((finding) => (
                      <FindingCard key={finding.id} finding={finding} />
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-neutral-500">
                <Users className="w-10 h-10 mx-auto mb-3 text-neutral-600" />
                <p className="text-sm">Select a run from the history or start a new test suite.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
