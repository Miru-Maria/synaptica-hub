import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Activity,
  Mail,
  TrendingUp,
  Users,
  DollarSign,
  Inbox,
  Briefcase,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface ToolBreakdown {
  name: string;
  slug: string;
  totalRuns: number;
  last30Days: number;
  emailCaptures: number;
}

interface StageInfo {
  count: number;
  value: number;
}

interface AnalyticsData {
  toolUsage: {
    totalRuns: number;
    last30Days: number;
    last90Days: number;
    totalEmailCaptures: number;
    trend: { date: string; count: number }[];
    breakdown: ToolBreakdown[];
  };
  pipeline: {
    totalContacts: number;
    totalPipelineValue: number;
    stageDistribution: Record<string, StageInfo>;
    activeClients: number;
  };
  retainers: {
    activeCount: number;
    mrr: number;
  };
  leads: {
    totalLeads: number;
    last30Days: number;
    trend: { week: string; count: number }[];
  };
  inquiries: {
    total: number;
    last30Days: number;
  };
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const STAGE_ORDER = ["New Lead", "Contacted", "Proposal Sent", "Active Client", "Closed"];
const STAGE_COLORS: Record<string, string> = {
  "New Lead": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Contacted": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Proposal Sent": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "Active Client": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Closed": "bg-neutral-500/15 text-neutral-400 border-neutral-500/30",
};

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  colorClass: string;
  onClick?: () => void;
}

function MetricCard({ icon, label, value, sub, colorClass, onClick }: MetricCardProps) {
  return (
    <Card
      className={`bg-neutral-900 border-neutral-800 ${onClick ? "cursor-pointer hover:border-neutral-700 transition-colors" : ""}`}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-neutral-100 truncate">{value}</p>
            <p className="text-xs text-neutral-500">{label}</p>
            {sub && <p className="text-xs text-neutral-600 mt-0.5">{sub}</p>}
          </div>
        </div>
        {onClick && (
          <div className="mt-3 flex items-center text-xs text-teal-400 gap-1">
            <span>View details</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AnalyticsOverviewProps {
  onNavigate?: (tab: string) => void;
}

export default function AnalyticsOverview({ onNavigate }: AnalyticsOverviewProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics/overview", { headers: authHeaders() });
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error("Failed to load analytics:", err);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-neutral-500">
        <p>Failed to load analytics data.</p>
        <Button variant="outline" size="sm" onClick={() => loadData()} className="mt-4 border-neutral-700 text-neutral-300">
          Try Again
        </Button>
      </div>
    );
  }

  const chartData = data.toolUsage.trend.map((d) => ({
    date: d.date.slice(5),
    count: d.count,
  }));

  const nav = (tab: string) => () => onNavigate?.(tab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-100">Business Overview</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Real-time snapshot of your business health and activity.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="border-neutral-700 text-neutral-300"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Activity className="w-5 h-5 text-emerald-400" />}
          label="Tool Runs (30d)"
          value={data.toolUsage.last30Days}
          sub={`${data.toolUsage.totalRuns} all time`}
          colorClass="bg-emerald-500/10 border border-emerald-500/20"
          onClick={nav("metrics")}
        />
        <MetricCard
          icon={<Mail className="w-5 h-5 text-amber-400" />}
          label="Email Captures"
          value={data.toolUsage.totalEmailCaptures}
          sub={`${data.leads.last30Days} new leads (30d)`}
          colorClass="bg-amber-500/10 border border-amber-500/20"
          onClick={nav("leads")}
        />
        <MetricCard
          icon={<DollarSign className="w-5 h-5 text-teal-400" />}
          label="Pipeline Value"
          value={formatCurrency(data.pipeline.totalPipelineValue)}
          sub={`${data.pipeline.totalContacts} contacts`}
          colorClass="bg-teal-500/10 border border-teal-500/20"
          onClick={nav("pipeline")}
        />
        <MetricCard
          icon={<Briefcase className="w-5 h-5 text-blue-400" />}
          label="Retainer MRR"
          value={formatCurrency(data.retainers.mrr)}
          sub={`${data.retainers.activeCount} active client${data.retainers.activeCount !== 1 ? "s" : ""}`}
          colorClass="bg-blue-500/10 border border-blue-500/20"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          icon={<Inbox className="w-5 h-5 text-rose-400" />}
          label="Discovery Inquiries"
          value={data.inquiries.total}
          sub={`${data.inquiries.last30Days} in last 30 days`}
          colorClass="bg-rose-500/10 border border-rose-500/20"
          onClick={nav("inquiries")}
        />
        <MetricCard
          icon={<Users className="w-5 h-5 text-purple-400" />}
          label="Active Clients"
          value={data.pipeline.activeClients}
          colorClass="bg-purple-500/10 border border-purple-500/20"
          onClick={nav("pipeline")}
        />
        <MetricCard
          icon={<TrendingUp className="w-5 h-5 text-cyan-400" />}
          label="Total Leads"
          value={data.leads.totalLeads}
          sub={`${data.leads.last30Days} this month`}
          colorClass="bg-cyan-500/10 border border-cyan-500/20"
          onClick={nav("leads")}
        />
      </div>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-base text-neutral-100">Tool Usage Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 && chartData.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
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
                  itemStyle={{ color: "#14b8a6" }}
                />
                <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Runs" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-neutral-500 text-sm">
              No tool usage data yet. Activity will appear here as tools are used.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base text-neutral-100">Pipeline Stages</CardTitle>
            <Button variant="ghost" size="sm" onClick={nav("pipeline")} className="text-teal-400 hover:text-teal-300 text-xs gap-1 h-7 px-2">
              View CRM <ArrowRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {Object.keys(data.pipeline.stageDistribution).length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-sm">
                No pipeline contacts yet.
              </div>
            ) : (
              <div className="space-y-2">
                {STAGE_ORDER.filter((s) => data.pipeline.stageDistribution[s]).map((stage) => {
                  const info = data.pipeline.stageDistribution[stage];
                  return (
                    <div key={stage} className="flex items-center justify-between rounded-lg border border-neutral-800 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded border ${STAGE_COLORS[stage] || ""}`}>
                          {stage}
                        </span>
                        <span className="text-sm text-neutral-300">{info.count} contact{info.count !== 1 ? "s" : ""}</span>
                      </div>
                      <span className="text-sm font-medium text-neutral-200">{formatCurrency(info.value)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base text-neutral-100">Tool Performance</CardTitle>
            <Button variant="ghost" size="sm" onClick={nav("metrics")} className="text-teal-400 hover:text-teal-300 text-xs gap-1 h-7 px-2">
              Full Metrics <ArrowRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {data.toolUsage.breakdown.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-sm">
                No tool data yet.
              </div>
            ) : (
              <div className="space-y-2">
                {[...data.toolUsage.breakdown]
                  .sort((a, b) => b.last30Days - a.last30Days)
                  .map((tool) => (
                    <div key={tool.slug} className="flex items-center justify-between rounded-lg border border-neutral-800 px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-neutral-200">{tool.name}</p>
                        <p className="text-xs text-neutral-500">{tool.totalRuns} total &middot; {tool.emailCaptures} emails</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-teal-400">{tool.last30Days}</p>
                        <p className="text-xs text-neutral-500">30d</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
