import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, Copy, Check, Trash2, ScanSearch } from "lucide-react";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token") || sessionStorage.getItem("demo_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

type AnalysisMode = "full" | "gaps" | "inconsistencies" | "structure";

const MODES: { value: AnalysisMode; label: string; description: string }[] = [
  { value: "full", label: "Full Intelligence Scan", description: "Comprehensive analysis — gaps, inconsistencies, structure, and quality" },
  { value: "gaps", label: "Knowledge Gaps", description: "What's missing or under-covered" },
  { value: "inconsistencies", label: "Inconsistencies", description: "Contradictions, conflicts, and unclear statements" },
  { value: "structure", label: "Structure & Flow", description: "Organizational and hierarchy issues" },
];

const DOCSCOPE_PRACTICE_SCENARIOS = [
  {
    content: `Customer Success Runbook — Enterprise Account Escalation

Purpose: This runbook guides Customer Success Managers through the escalation process for enterprise accounts showing churn risk signals.

Churn Risk Signals
Low product adoption (DAU/MAU ratio below 30%), no login in 14 days, missed QBR, multiple support tickets in 30 days, or a direct statement of dissatisfaction from a key contact.

Step 1: Initial Assessment
Review the account health dashboard to confirm churn risk signals. Log the assessment in Salesforce under Account Health. Send an alert to the account's assigned SE.

Step 2: Stakeholder Outreach
Send a personal email (not a template) from the CSM within 24 hours. Request a call within 3 business days. If no response in 48 hours, escalate to the CSM manager.

Step 3: Recovery Call
Join the call with the SE. Use the discovery framework to uncover root causes. Do not pitch new features. Focus on current value gaps. Document outcomes in Salesforce.

Step 4: Recovery Plan
If root cause is identified: create a 30-day recovery plan with three measurable milestones. Assign an owner to each milestone. Schedule a follow-up in 2 weeks. If root cause is unresolved: escalate to Director of Customer Success with a full account brief. Director response required within 24 hours.

Step 5: Outcome Logging
After 30 days: log outcome as Recovered, Churned, or Still At Risk. Update the customer health score. Close the escalation ticket.`,
    mode: "full" as AnalysisMode,
  },
  {
    content: `API Reference: Document Parsing Service v1.2

Updated: March 2024. This document describes the REST API for our document parsing and chunking service. All endpoints require Bearer token authentication.

POST /parse

Parses a document and returns structured chunks. Supports PDF, DOCX, TXT, and MD file formats. Maximum file size is 25MB. Files larger than 50MB will be rejected. The service processes documents synchronously. Responses may be delayed for large documents.

Request: multipart/form-data with fields: file (binary, required), chunk_size (integer, optional, default 400), overlap (integer, optional, default 80).
Response: { chunks: string[], count: integer, processing_time_ms: integer }

POST /parse/text

Parses raw text and returns structured chunks. Maximum input length is 100,000 characters. For inputs larger than 50,000 characters, processing time may exceed 30 seconds. Rate limit: 60 requests per minute per API key. Maximum input length for POST /parse/text is actually 80,000 characters in the current version.

Request: application/json with body: { text: string (required), chunk_size?: integer (default 400), overlap?: integer (default 80) }
Response: { chunks: string[], count: integer }

GET /status

Returns service health status and current queue depth.
Response: { status: "ok" | "degraded", queue_depth: integer, avg_latency_ms: integer }

Authentication: All endpoints require a valid API key passed as Bearer token. Keys rotate every 90 days. Expired keys return a 401 with "Token expired" or "Invalid token" depending on the error type. However, expired keys on the /parse endpoint return a 403 rather than a 401.`,
    mode: "inconsistencies" as AnalysisMode,
  },
  {
    content: `Project Brief: Internal Knowledge Base Migration

Background
Our current knowledge base (Confluence) has grown to 847 pages over 5 years. Search is unreliable, navigation is confusing, and new employees consistently report they cannot find answers without asking a colleague.

Goals
Migrate all active documentation to Notion. Improve document discoverability. Reduce time-to-answer for common internal questions. Enable future AI search integration.

Scope
In scope: all Engineering, Product, and Customer Success documentation. All documents tagged as Active or Review Required. Out of scope: archived documents (status: Deprecated), HR and Legal documentation (handled separately).

Timeline
Phase 1 (Weeks 1-2): Audit all 847 pages, tag by status, identify owners. Phase 2 (Weeks 3-6): Migrate active documentation. Engineering team migrates their own docs. Product and CS migration handled by PMO. Phase 3 (Week 7): Review and QA. Test search functionality. Phase 4 (Week 8): Go-live. Decommission Confluence.

Resources Required
Project Manager: 50% allocation for 8 weeks. Each team lead: 4 hours per week for 6 weeks. PMO: 100% allocation weeks 3-6. Budget: not yet defined. Owner: not assigned.

Success Metrics
Search queries answered without human escalation. New employee onboarding score improvement. Reduction in "where do I find X" Slack messages. (No baseline measurements or targets specified.)`,
    mode: "structure" as AnalysisMode,
  },
];

export default function DocScope() {
  const [, setLocation] = useLocation();
  const [authed, setAuthed] = useState(false);
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<AnalysisMode>("full");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) { setLocation("/admin/login"); return; }
    setAuthed(true);
  }, [setLocation]);

  useEffect(() => {
    if (!authed) return;
    const params = new URLSearchParams(window.location.search);
    const p = params.get("practice");
    if (!p) return;
    const scenario = DOCSCOPE_PRACTICE_SCENARIOS[parseInt(p, 10) - 1];
    if (!scenario) return;
    setContent(scenario.content);
    setMode(scenario.mode);
  }, [authed]);

  const analyze = async () => {
    if (!content.trim()) { setError("Paste or type some content to analyze."); return; }
    setError(null);
    setResult("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/docscope/analyze", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ content, mode }),
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
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
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

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button onClick={() => setLocation("/admin")} className="p-2 rounded-lg hover:bg-neutral-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <ScanSearch className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-semibold">DocScope Intel Engine</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <p className="text-neutral-400 text-sm">Paste any content — emails, Slack threads, meeting notes, documents, or work-in-progress drafts — and get a structured AI analysis of gaps, inconsistencies, and coverage issues.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Analysis Mode</label>
              <div className="grid grid-cols-1 gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={`text-left p-3 rounded-lg border transition-all ${mode === m.value ? "border-emerald-500 bg-emerald-500/10" : "border-neutral-700 hover:border-neutral-600 bg-neutral-900"}`}
                  >
                    <p className="text-sm font-medium text-neutral-100">{m.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{m.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-300">Content</label>
                {content && (
                  <button onClick={() => setContent("")} className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your content here — emails, Slack threads, documents, work-in-progress text, meeting notes..."
                rows={14}
                className="w-full bg-neutral-900 border border-neutral-700 text-neutral-100 rounded-lg px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder:text-neutral-600"
              />
              <p className="text-xs text-neutral-600">{content.length.toLocaleString()} characters</p>
            </div>

            {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>}

            <button
              onClick={analyze}
              disabled={loading || !content.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 font-semibold rounded-lg transition-colors"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><ScanSearch className="w-4 h-4" /> Run Analysis</>}
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300">Analysis Output</label>
              {result && (
                <button onClick={copy} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors">
                  {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              )}
            </div>
            <div
              ref={resultRef}
              className="min-h-[520px] bg-neutral-900 border border-neutral-700 rounded-lg p-5 text-sm text-neutral-200 leading-relaxed overflow-auto whitespace-pre-wrap"
            >
              {loading && !result && (
                <div className="flex items-center gap-2 text-neutral-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing content...</span>
                </div>
              )}
              {!loading && !result && <p className="text-neutral-600">Analysis output will appear here.</p>}
              {result}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
