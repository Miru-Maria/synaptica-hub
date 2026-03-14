import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, Mail, TrendingUp, FileText, Globe, ClipboardPaste, Database, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

interface ToolMetricsSummary {
  toolName: string;
  toolSlug: string;
  totalRuns: number;
  last30DaysRuns: number;
  emailCaptures: number;
  inputTypeBreakdown?: Record<string, number>;
  documentSizeBreakdown?: Record<string, number>;
  topGapCategories?: { category: string; count: number }[];
}

interface DailyCount {
  date: string;
  count: number;
}

interface MetricsData {
  tools: ToolMetricsSummary[];
  dailyCounts: DailyCount[];
  totalRuns: number;
  totalEmails: number;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const INPUT_TYPE_LABELS: Record<string, string> = {
  "file-upload": "File Upload",
  "paste": "Paste",
  "url": "URL Import",
  "notion": "Notion",
  "unknown": "Unknown",
};

const INPUT_TYPE_ICONS: Record<string, React.ReactNode> = {
  "file-upload": <FileText className="w-3.5 h-3.5" />,
  "paste": <ClipboardPaste className="w-3.5 h-3.5" />,
  "url": <Globe className="w-3.5 h-3.5" />,
  "notion": <Database className="w-3.5 h-3.5" />,
};

export default function MetricsPanel() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/admin/metrics", { headers: authHeaders() });
      if (res.ok) setMetrics(await res.json());
    } catch (err) {
      console.error("Failed to load metrics:", err);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12 text-neutral-500">
        <p>Failed to load metrics data.</p>
        <Button variant="outline" size="sm" onClick={() => loadMetrics()} className="mt-4 border-neutral-700 text-neutral-300">
          Try Again
        </Button>
      </div>
    );
  }

  const chartData = metrics.dailyCounts.map((d) => ({
    date: d.date.slice(5),
    count: d.count,
  }));

  const docaudit = metrics.tools.find((t) => t.toolSlug === "docaudit");

  const inputTypePieData = docaudit?.inputTypeBreakdown
    ? Object.entries(docaudit.inputTypeBreakdown).map(([key, value]) => ({
        name: INPUT_TYPE_LABELS[key] || key,
        value,
      }))
    : [];

  const sizePieData = docaudit?.documentSizeBreakdown
    ? Object.entries(docaudit.documentSizeBreakdown).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400">
          Tool usage analytics and engagement metrics.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadMetrics(true)}
          disabled={refreshing}
          className="border-neutral-700 text-neutral-300"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-100">{metrics.totalRuns}</p>
                <p className="text-xs text-neutral-500">Total Runs (All Time)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-100">
                  {metrics.dailyCounts.reduce((sum, d) => sum + d.count, 0)}
                </p>
                <p className="text-xs text-neutral-500">Last 30 Days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-100">{metrics.totalEmails}</p>
                <p className="text-xs text-neutral-500">Email Captures</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-100">{metrics.tools.length}</p>
                <p className="text-xs text-neutral-500">Active Tools</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-base text-neutral-100">Usage Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 && chartData.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#737373", fontSize: 11 }}
                  tickLine={false}
                  interval={Math.floor(chartData.length / 7)}
                />
                <YAxis tick={{ fill: "#737373", fontSize: 11 }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#171717", border: "1px solid #404040", borderRadius: "8px" }}
                  labelStyle={{ color: "#a3a3a3" }}
                  itemStyle={{ color: "#10b981" }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Runs" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-neutral-500 text-sm">
              No usage data yet. Metrics will appear here as tools are used.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-base text-neutral-100">Per-Tool Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.tools.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-sm">
              No tool usage recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.tools.map((tool) => (
                <div key={tool.toolSlug} className="flex items-center justify-between border border-neutral-800 rounded-lg p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-neutral-200">{tool.toolName}</p>
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span>{tool.totalRuns} total runs</span>
                      <span>{tool.last30DaysRuns} last 30d</span>
                      <span>{tool.emailCaptures} emails</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-emerald-400">{tool.last30DaysRuns}</p>
                    <p className="text-xs text-neutral-500">30d runs</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {docaudit && (
        <Card className="bg-neutral-900 border-neutral-800 border-emerald-500/20">
          <CardHeader>
            <CardTitle className="text-base text-neutral-100 flex items-center gap-2">
              <span className="text-emerald-400">DA</span> DocAudit Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inputTypePieData.length > 0 && (
                <div>
                  <p className="text-sm text-neutral-400 mb-3">Input Type Breakdown</p>
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width={140} height={140}>
                      <PieChart>
                        <Pie
                          data={inputTypePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={60}
                          dataKey="value"
                          stroke="none"
                        >
                          {inputTypePieData.map((_, idx) => (
                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#171717", border: "1px solid #404040", borderRadius: "8px" }}
                          itemStyle={{ color: "#e5e5e5" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {inputTypePieData.map((entry, idx) => (
                        <div key={entry.name} className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                          <span className="text-neutral-400 flex items-center gap-1">
                            {INPUT_TYPE_ICONS[Object.keys(docaudit.inputTypeBreakdown || {})[idx]] || null}
                            {entry.name}
                          </span>
                          <span className="text-neutral-300 font-medium">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {sizePieData.length > 0 && (
                <div>
                  <p className="text-sm text-neutral-400 mb-3">Document Size Distribution</p>
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width={140} height={140}>
                      <PieChart>
                        <Pie
                          data={sizePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={60}
                          dataKey="value"
                          stroke="none"
                        >
                          {sizePieData.map((_, idx) => (
                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#171717", border: "1px solid #404040", borderRadius: "8px" }}
                          itemStyle={{ color: "#e5e5e5" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {sizePieData.map((entry, idx) => (
                        <div key={entry.name} className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                          <span className="text-neutral-400">{entry.name}</span>
                          <span className="text-neutral-300 font-medium">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {docaudit.topGapCategories && docaudit.topGapCategories.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-sm text-neutral-400 mb-3">Most Common Gap Categories</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {docaudit.topGapCategories.map((gap) => (
                      <div key={gap.category} className="flex items-center justify-between border border-neutral-800 rounded-md px-3 py-2">
                        <span className="text-xs text-neutral-300 truncate">{gap.category}</span>
                        <span className="text-xs text-emerald-400 font-medium ml-2">{gap.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {inputTypePieData.length === 0 && sizePieData.length === 0 && (
                <div className="md:col-span-2 text-center py-6 text-neutral-500 text-sm">
                  DocAudit detail metrics will appear here after analyses are run.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
