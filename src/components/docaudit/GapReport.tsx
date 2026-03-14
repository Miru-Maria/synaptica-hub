import { motion } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Download, AlertTriangle, AlertCircle, Info, CheckCircle, RotateCcw, Lock } from "lucide-react";
import { jsPDF } from "jspdf";

interface TopicCoverage {
  topic: string;
  score: number;
  severity: "critical" | "high" | "medium" | "low";
  recommendation: string;
}

interface AuditResult {
  overallScore: number;
  topicCoverages: TopicCoverage[];
  summary: string;
}

interface GapReportProps {
  result: AuditResult;
  kbName: string;
  onReset: () => void;
  gateUnlocked?: boolean;
}

const severityConfig = {
  critical: { color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30", icon: AlertTriangle, label: "Critical" },
  high: { color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30", icon: AlertCircle, label: "High" },
  medium: { color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", icon: Info, label: "Medium" },
  low: { color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/30", icon: CheckCircle, label: "Low" },
};

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

function getScoreRing(score: number): string {
  if (score >= 70) return "border-green-400/40";
  if (score >= 40) return "border-yellow-400/40";
  return "border-red-400/40";
}

export function GapReport({ result, kbName, onReset, gateUnlocked = false }: GapReportProps) {
  const radarData = result.topicCoverages.map((tc) => ({
    topic: tc.topic.length > 20 ? tc.topic.slice(0, 18) + "..." : tc.topic,
    fullTopic: tc.topic,
    coverage: Math.round(tc.score * 100),
  }));

  const gaps = result.topicCoverages.filter((tc) => tc.severity !== "low");

  const exportPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    let logoDataUrl: string | null = null;
    try {
      const resp = await fetch("/phoenix-logo.png");
      const blob = await resp.blob();
      logoDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      // continue without logo
    }

    const brandTeal: [number, number, number] = [0, 200, 160];
    const darkBg: [number, number, number] = [15, 15, 20];
    const white: [number, number, number] = [255, 255, 255];
    const lightGray: [number, number, number] = [180, 180, 185];
    const mutedGray: [number, number, number] = [120, 120, 130];

    const addFooter = (pageNum: number, totalPages: number) => {
      doc.setDrawColor(...brandTeal);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      doc.setFontSize(7);
      doc.setTextColor(...mutedGray);
      doc.text("Synaptica Knowledge Systems", margin, pageHeight - 10);
      doc.text("docaudit.synaptica.dev", pageWidth / 2, pageHeight - 10, { align: "center" });
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    };

    const checkPageBreak = (needed: number, currentY: number): number => {
      if (currentY + needed > pageHeight - 25) {
        doc.addPage();
        return margin + 5;
      }
      return currentY;
    };

    // --- Cover / Header ---
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, pageWidth, 70, "F");
    doc.setFillColor(...brandTeal);
    doc.rect(0, 70, pageWidth, 1.5, "F");

    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, "PNG", margin, 12, 20, 20);
      } catch {
        // skip logo on error
      }
    }

    const titleX = logoDataUrl ? margin + 26 : margin;
    doc.setFontSize(10);
    doc.setTextColor(...brandTeal);
    doc.text("SYNAPTICA", titleX, 22);
    doc.setFontSize(7);
    doc.setTextColor(...lightGray);
    doc.text("Knowledge Systems", titleX, 27);

    doc.setFontSize(24);
    doc.setTextColor(...white);
    doc.text("DocAudit Gap Report", margin, 48);

    doc.setFontSize(10);
    doc.setTextColor(...lightGray);
    doc.text(`Knowledge Base: ${kbName}`, margin, 58);
    const reportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    doc.text(`Report Date: ${reportDate}`, pageWidth - margin, 58, { align: "right" });

    let y = 82;

    // --- Overall Score Section ---
    doc.setFillColor(25, 25, 35);
    doc.roundedRect(margin, y, contentWidth, 30, 3, 3, "F");
    doc.setDrawColor(...brandTeal);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 30, 3, 3, "S");

    doc.setFontSize(11);
    doc.setTextColor(...lightGray);
    doc.text("OVERALL COVERAGE SCORE", margin + 8, y + 12);

    const scoreColor: [number, number, number] = result.overallScore >= 70 ? [74, 222, 128] : result.overallScore >= 40 ? [250, 204, 21] : [239, 68, 68];
    doc.setFontSize(28);
    doc.setTextColor(...scoreColor);
    doc.text(`${result.overallScore}%`, margin + 8, y + 25);

    const severityCounts = {
      critical: result.topicCoverages.filter((t) => t.severity === "critical").length,
      high: result.topicCoverages.filter((t) => t.severity === "high").length,
      medium: result.topicCoverages.filter((t) => t.severity === "medium").length,
      low: result.topicCoverages.filter((t) => t.severity === "low").length,
    };

    const sevStartX = margin + 90;
    const sevLabels = [
      { label: "Critical", count: severityCounts.critical, color: [239, 68, 68] as [number, number, number] },
      { label: "High", count: severityCounts.high, color: [251, 146, 60] as [number, number, number] },
      { label: "Medium", count: severityCounts.medium, color: [250, 204, 21] as [number, number, number] },
      { label: "Low", count: severityCounts.low, color: [74, 222, 128] as [number, number, number] },
    ];
    sevLabels.forEach((s, i) => {
      const sx = sevStartX + i * 22;
      doc.setFontSize(14);
      doc.setTextColor(...s.color);
      doc.text(String(s.count), sx + 6, y + 14, { align: "center" });
      doc.setFontSize(6);
      doc.setTextColor(...mutedGray);
      doc.text(s.label, sx + 6, y + 19, { align: "center" });
    });

    y += 38;

    // --- Executive Summary ---
    doc.setFontSize(13);
    doc.setTextColor(...brandTeal);
    doc.text("Executive Summary", margin, y);
    y += 7;
    doc.setFontSize(9.5);
    doc.setTextColor(...lightGray);
    const summaryLines = doc.splitTextToSize(result.summary, contentWidth);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 4.5 + 10;

    // --- Section Divider ---
    doc.setDrawColor(50, 50, 60);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // --- Topic Coverage Details ---
    doc.setFontSize(13);
    doc.setTextColor(...brandTeal);
    doc.text("Section-by-Section Findings", margin, y);
    y += 10;

    for (const tc of result.topicCoverages) {
      const recLines = doc.splitTextToSize(tc.recommendation, contentWidth - 12);
      const blockHeight = 18 + recLines.length * 4;
      y = checkPageBreak(blockHeight, y);

      doc.setFillColor(22, 22, 30);
      doc.roundedRect(margin, y - 4, contentWidth, blockHeight, 2, 2, "F");

      const sevColor: [number, number, number] =
        tc.severity === "critical" ? [239, 68, 68] :
        tc.severity === "high" ? [251, 146, 60] :
        tc.severity === "medium" ? [250, 204, 21] :
        [74, 222, 128];

      doc.setFillColor(...sevColor);
      doc.roundedRect(margin, y - 4, 2, blockHeight, 1, 1, "F");

      doc.setFontSize(10);
      doc.setTextColor(...white);
      doc.text(tc.topic, margin + 8, y + 3);

      const scoreStr = `${Math.round(tc.score * 100)}%`;
      doc.setFontSize(10);
      doc.setTextColor(...sevColor);
      doc.text(scoreStr, pageWidth - margin - 8, y + 3, { align: "right" });

      doc.setFontSize(7);
      doc.setTextColor(...sevColor);
      doc.text(tc.severity.toUpperCase(), margin + 8, y + 9);

      doc.setFontSize(8.5);
      doc.setTextColor(...lightGray);
      doc.text(recLines, margin + 8, y + 14);

      y += blockHeight + 4;
    }

    // --- Recommendations Summary ---
    y = checkPageBreak(30, y);
    y += 5;
    doc.setDrawColor(50, 50, 60);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(13);
    doc.setTextColor(...brandTeal);
    doc.text("Priority Recommendations", margin, y);
    y += 8;

    const prioritized = result.topicCoverages
      .filter((tc) => tc.severity === "critical" || tc.severity === "high")
      .sort((a, b) => a.score - b.score);

    if (prioritized.length === 0) {
      doc.setFontSize(9.5);
      doc.setTextColor(...lightGray);
      doc.text("No critical or high-severity gaps detected. Documentation coverage is strong.", margin, y);
      y += 8;
    } else {
      for (let i = 0; i < prioritized.length; i++) {
        const tc = prioritized[i];
        y = checkPageBreak(12, y);
        doc.setFontSize(9);
        doc.setTextColor(...white);
        doc.text(`${i + 1}.`, margin, y);
        doc.text(tc.topic, margin + 8, y);
        doc.setFontSize(8);
        doc.setTextColor(...mutedGray);
        const shortRec = doc.splitTextToSize(tc.recommendation, contentWidth - 12);
        doc.text(shortRec, margin + 8, y + 5);
        y += 5 + shortRec.length * 3.8 + 3;
      }
    }

    // --- Add footers to all pages ---
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(i, totalPages);
    }

    doc.save(`docaudit-report-${kbName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  interface TooltipPayloadEntry {
    value: number;
    payload: { fullTopic: string; coverage: number };
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
  }

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg px-3 py-2 text-sm">
          <p className="text-foreground font-medium">{payload[0].payload.fullTopic}</p>
          <p className="text-primary">{payload[0].value}% coverage</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gap Analysis Report</h2>
          <p className="text-muted-foreground">{kbName}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onReset} className="btn-secondary flex items-center gap-2 text-sm min-h-[44px] !py-2 !px-4">
            <RotateCcw className="w-4 h-4" />
            New Audit
          </button>
          {gateUnlocked && (
            <button onClick={() => { exportPDF().catch(console.error); }} className="btn-primary flex items-center gap-2 text-sm min-h-[44px] !py-2 !px-4">
              <Download className="w-4 h-4" />
              Download Report
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <div className={`w-24 h-24 rounded-full border-4 ${getScoreRing(result.overallScore)} flex items-center justify-center mb-3`}>
            <span className={`text-3xl font-bold ${getScoreColor(result.overallScore)}`}>
              {result.overallScore}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Overall Coverage Score</p>
        </div>

        <div className="glass rounded-2xl p-4 flex flex-col items-center justify-center">
          <div className="grid grid-cols-2 gap-3 w-full">
            {(["critical", "high", "medium", "low"] as const).map((sev) => {
              const count = result.topicCoverages.filter((t) => t.severity === sev).length;
              const config = severityConfig[sev];
              return (
                <div key={sev} className={`${config.bg} border ${config.border} rounded-xl px-3 py-2 text-center`}>
                  <p className={`text-lg font-bold ${config.color}`}>{count}</p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass rounded-2xl p-4 flex items-center justify-center">
          <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
        </div>
      </div>

      {gateUnlocked ? (
        <>
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Coverage Map</h3>
            <div className="overflow-x-auto -mx-2 px-2">
              {radarData.length <= 12 ? (
                <ResponsiveContainer width="100%" height={300} minWidth={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="topic" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Radar
                      name="Coverage"
                      dataKey="coverage"
                      stroke="hsl(165, 100%, 39%)"
                      fill="hsl(165, 100%, 39%)"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(300, radarData.length * 36)} minWidth={300}>
                  <BarChart data={radarData} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                    <YAxis type="category" dataKey="topic" width={120} tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="coverage" radius={[0, 4, 4, 0]}>
                      {radarData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.coverage >= 70 ? "rgb(74, 222, 128)" :
                            entry.coverage >= 40 ? "rgb(250, 204, 21)" :
                            "rgb(239, 68, 68)"
                          }
                          fillOpacity={0.7}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {gaps.length > 0 ? `Prioritized Gaps (${gaps.length})` : "All Topics Covered"}
            </h3>

            {result.topicCoverages.map((tc, idx) => {
              const config = severityConfig[tc.severity];
              const Icon = config.icon;

              return (
                <motion.div
                  key={tc.topic}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass rounded-xl p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-lg ${config.bg} border ${config.border} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{tc.topic}</h4>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border}`}>
                          {config.label}
                        </span>
                        <span className="text-sm text-muted-foreground ml-auto">
                          {Math.round(tc.score * 100)}%
                        </span>
                      </div>

                      <div className="w-full bg-white/5 rounded-full h-1.5 mb-3">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.round(tc.score * 100)}%`,
                            backgroundColor:
                              tc.severity === "critical" ? "rgb(239, 68, 68)" :
                              tc.severity === "high" ? "rgb(251, 146, 60)" :
                              tc.severity === "medium" ? "rgb(250, 204, 21)" :
                              "rgb(74, 222, 128)",
                          }}
                        />
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">{tc.recommendation}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="relative">
          <div className="glass rounded-2xl p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Full Report Locked</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              The summary above shows your overall score and severity breakdown.
              To access the full coverage map, detailed topic analysis, prioritized gaps, and PDF export,
              provide your email when prompted.
            </p>
            <button
              onClick={onReset}
              className="btn-secondary text-sm !py-2 !px-4 mt-2"
            >
              Run Another Audit
            </button>
          </div>
        </div>
      )
    </motion.div>
  );
}
