import OpenAI from "openai";
import {
  createToolTestRun,
  updateToolTestRun,
  addToolTestFinding,
  getToolTestFindings,
  enforceReportLimits,
  ToolTestFinding,
  ToolTestSeverity,
} from "../data/tool-test-store.js";

export const TOTAL_TOOL_TEST_SCENARIOS = 14;

function getBaseUrl(): string {
  return `http://0.0.0.0:${process.env.NODE_ENV === "production" ? (process.env.PORT || "5000") : "5000"}`;
}

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  return new OpenAI({ apiKey });
}

interface ScenarioResult {
  result: string;
  sessionId?: string;
}

async function runDocAuditScenario(chunks: string[], topics: string[], kbName: string): Promise<string> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/audit/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chunks, topics, kbName }),
  });
  if (!res.ok) {
    const text = await res.text();
    return `HTTP ${res.status}: ${text}`;
  }
  const data = await res.json() as Record<string, unknown>;
  const topicResults = (data.topicResults as Array<{ topic: string; coverageScore: number; status: string }> || [])
    .map(t => `  - ${t.topic}: ${Math.round(t.coverageScore * 100)}% (${t.status})`)
    .join("\n");
  return `Status: ${data.overallStatus}\nOverall Coverage: ${Math.round(Number(data.overallCoverageScore || 0) * 100)}%\nTopics:\n${topicResults}\nGaps found: ${(data.gaps as unknown[])?.length ?? 0}`;
}

async function runChatScenario(message: string, sessionId: string | null): Promise<ScenarioResult> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId }),
  });
  if (!res.ok) {
    const text = await res.text();
    return { result: `HTTP ${res.status}: ${text}`, sessionId: sessionId ?? undefined };
  }
  const data = await res.json() as { reply: string; sessionId: string };
  return { result: data.reply, sessionId: data.sessionId };
}

async function checkExternalTool(name: string, url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    clearTimeout(timeout);
    const body = await res.text();
    const hasContent = body.trim().length > 200;
    return `HTTP ${res.status} — ${hasContent ? "returned substantial HTML content" : "returned minimal or empty body"}`;
  } catch (err) {
    return `Unreachable — ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function evaluateFinding(
  scenario: string,
  hypothesis: string,
  result: string
): Promise<{ severity: ToolTestSeverity; summary: string }> {
  const openai = getOpenAI();
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a QA evaluator for a knowledge-management consultancy's web platform. Given a test scenario, its hypothesis, and the actual result, evaluate whether the tool behaved correctly.

Return a JSON object with:
- "severity": one of "pass", "warning", or "fail"
  - "pass" = result meets or exceeds the hypothesis expectations
  - "warning" = result partially meets expectations but has notable gaps or edge-case issues
  - "fail" = result clearly contradicts the hypothesis, returned an error, or broke in a significant way
- "summary": 1–3 sentences describing what worked, what didn't, and why you chose that severity. Be specific and actionable.`,
        },
        {
          role: "user",
          content: `## Scenario\n${scenario}\n\n## Hypothesis\n${hypothesis}\n\n## Actual Result\n${result}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    const severity = (["pass", "warning", "fail"].includes(parsed.severity)
      ? parsed.severity
      : "warning") as ToolTestSeverity;
    return { severity, summary: parsed.summary || "Evaluation completed." };
  } catch (err) {
    return { severity: "warning", summary: `Evaluation error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

async function generateFinalReport(
  runId: string,
  triggeredAt: string,
  findings: ToolTestFinding[]
): Promise<string> {
  const openai = getOpenAI();

  const passCount = findings.filter(f => f.severity === "pass").length;
  const warnCount = findings.filter(f => f.severity === "warning").length;
  const failCount = findings.filter(f => f.severity === "fail").length;

  const findingsSummary = findings.map(f =>
    `[${f.severity.toUpperCase()}] ${f.tool} — ${f.scenario}\n  ${f.summary}`
  ).join("\n\n");

  let executiveSummary = "";
  let recommendations = "";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are writing a QA report for Synaptica Knowledge Systems, a boutique AI consultancy. Based on the test findings, write:
1. An executive summary (3–5 sentences) describing the overall health of the platform's tools.
2. A prioritized list of 3–5 recommendations (numbered) for improvement.

Keep language professional but plain. Focus on real user impact, not technical minutiae.`,
        },
        {
          role: "user",
          content: `Test run: ${runId}\nTotal: ${findings.length} scenarios — ${passCount} pass, ${warnCount} warning, ${failCount} fail\n\nFindings:\n${findingsSummary}`,
        },
      ],
      temperature: 0.4,
    });
    const content = response.choices[0].message.content || "";
    const execMatch = content.match(/executive summary[:\s]*([\s\S]+?)(?=recommendations|$)/i);
    const recMatch = content.match(/recommendations[:\s]*([\s\S]+)$/i);
    executiveSummary = execMatch?.[1]?.trim() || content.slice(0, 600);
    recommendations = recMatch?.[1]?.trim() || "";
  } catch {
    executiveSummary = `Completed ${findings.length} tests across all platform tools. ${passCount} passed, ${warnCount} produced warnings, and ${failCount} failed.`;
    recommendations = "Review the failing and warning scenarios above for specific action items.";
  }

  const areaGroups: Record<string, ToolTestFinding[]> = {};
  for (const f of findings) {
    if (!areaGroups[f.area]) areaGroups[f.area] = [];
    areaGroups[f.area].push(f);
  }

  const areaLabels: Record<string, string> = {
    docaudit: "DocAudit — Functionality Tests",
    external_tools: "External Tools — Accessibility",
    chat: "Chat Assistant — Tool Knowledge",
  };

  const severityIcon = (s: ToolTestSeverity) =>
    s === "pass" ? "✅ PASS" : s === "warning" ? "⚠️ WARNING" : "❌ FAIL";

  const lines: string[] = [];
  lines.push(`# Synaptica Tool Functionality Test Report`);
  lines.push(`\n**Run ID:** ${runId}`);
  lines.push(`**Date:** ${new Date(triggeredAt).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}`);
  lines.push(`**Total Scenarios:** ${findings.length} (${passCount} pass · ${warnCount} warning · ${failCount} fail)\n`);

  lines.push(`## Executive Summary\n`);
  lines.push(executiveSummary);

  lines.push(`\n## Results at a Glance\n`);
  lines.push(`| Result | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| ✅ Pass | ${passCount} |`);
  lines.push(`| ⚠️ Warning | ${warnCount} |`);
  lines.push(`| ❌ Fail | ${failCount} |`);

  for (const [area, areaFindings] of Object.entries(areaGroups)) {
    lines.push(`\n---\n\n## ${areaLabels[area] || area}\n`);
    for (const f of areaFindings) {
      lines.push(`### ${severityIcon(f.severity)} — ${f.scenario}\n`);
      lines.push(`**Hypothesis:** ${f.hypothesis}\n`);
      lines.push(`**Evaluation:** ${f.summary}\n`);
      lines.push(`<details><summary>Raw result</summary>\n\n\`\`\`\n${f.result.slice(0, 3000)}\n\`\`\`\n\n</details>\n`);
    }
  }

  if (recommendations) {
    lines.push(`\n---\n\n## Recommendations\n`);
    lines.push(recommendations);
  }

  lines.push(`\n---\n\n*Generated by Synaptica Tool Tester · ${new Date().toISOString()}*\n`);

  return lines.join("\n");
}

export async function runToolTestSuite(runId: string): Promise<void> {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  await enforceReportLimits();

  await createToolTestRun({
    id: runId,
    triggeredAt: now,
    status: "running",
    totalScenarios: TOTAL_TOOL_TEST_SCENARIOS,
    completedScenarios: 0,
    summary: null,
    reportMarkdown: null,
    cleanedUp: false,
    testChatSessionIds: [],
    expiresAt,
  });

  const chatSessionIds: string[] = [];
  let completed = 0;

  const saveFinding = async (
    tool: string,
    area: string,
    scenario: string,
    hypothesis: string,
    result: string
  ) => {
    const { severity, summary } = await evaluateFinding(scenario, hypothesis, result);
    const finding: ToolTestFinding = {
      id: `ttf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      runId,
      tool,
      area,
      scenario,
      severity,
      hypothesis,
      result,
      summary,
      evaluatedAt: new Date().toISOString(),
    };
    await addToolTestFinding(finding);
    completed++;
    await updateToolTestRun(runId, { completedScenarios: completed });
  };

  try {
    const docAuditScenarios: Array<{
      scenario: string;
      hypothesis: string;
      chunks: string[];
      topics: string[];
      kbName: string;
    }> = [
      {
        scenario: "Well-documented SaaS product",
        hypothesis: "Should return valid audit results with 65%+ overall coverage, identifying both well-covered and gap areas across the provided topics.",
        kbName: "ProjectFlow SaaS Docs",
        chunks: [
          "ProjectFlow is a project management platform for software teams. Task management: create tasks, assign owners, set due dates, add subtasks and dependencies. Tasks support priorities (P0–P3), status labels, and custom fields.",
          "Team collaboration: real-time comments on tasks, @mentions, shared task views, role-based permissions (Admin, Member, Guest). Activity feeds track all changes. Notification center shows updates across all projects.",
          "Integrations: GitHub (auto-link commits to tasks), Slack (post updates to channels), Jira (bi-directional sync), Zapier (connect any tool). API available for custom integrations. Webhooks supported for task events.",
          "Pricing: Free tier (up to 5 users, 3 projects). Pro: $12/user/month (unlimited projects, integrations, API access). Enterprise: custom pricing with SSO, audit logs, and dedicated support.",
          "Security: SOC 2 Type II certified. Data encrypted in transit (TLS 1.3) and at rest (AES-256). GDPR compliant. Role-based access control. 30-day data retention on free tier, unlimited on paid.",
        ],
        topics: ["Task Management", "Team Collaboration", "Integrations", "Pricing & Plans", "Security & Compliance"],
      },
      {
        scenario: "Sparse startup docs with many topics",
        hypothesis: "Should detect significant documentation gaps across most topics given minimal content, returning low coverage scores and actionable gap recommendations.",
        kbName: "Sparse Startup Docs",
        chunks: [
          "Our product helps teams collaborate better. We have a web app and a mobile app. Contact us at hello@example.com for pricing information.",
        ],
        topics: ["Features", "Pricing", "Getting Started Guide", "API Reference", "Security Compliance", "Integrations", "Team Management", "Support"],
      },
      {
        scenario: "Technical API reference documentation",
        hypothesis: "Should handle code-heavy technical content correctly, identifying well-covered API topics and flagging genuinely absent areas like SDK docs and webhooks.",
        kbName: "API Reference Docs",
        chunks: [
          "Authentication: All API requests require a Bearer token in the Authorization header. Tokens expire after 24 hours. Refresh tokens via POST /auth/refresh. Token format: JWT signed with RS256.",
          "Rate Limiting: 100 requests/minute per API key on Free, 500/minute on Pro, 2000/minute on Enterprise. Exceeding limits returns HTTP 429 with Retry-After header. Bulk endpoints have separate limits.",
          "Error Codes: 400 Bad Request (invalid parameters), 401 Unauthorized (missing/expired token), 403 Forbidden (insufficient permissions), 404 Not Found, 422 Unprocessable Entity (validation failed), 500 Internal Server Error.",
          "Embeddings endpoint: POST /v1/embeddings accepts array of strings (max 100 per batch, 8192 tokens each). Returns 1536-dimension float vectors. Model: text-embedding-3-small. Latency: <200ms p95.",
        ],
        topics: ["Authentication Flow", "Rate Limiting", "Error Handling", "SDK Documentation", "Webhook Events", "Deployment Guide"],
      },
      {
        scenario: "Minimal single-sentence content edge case",
        hypothesis: "Should process extremely short input without errors, returning appropriate low-coverage scores rather than crashing or producing nonsensical output.",
        kbName: "Minimal Content Test",
        chunks: ["We make software."],
        topics: ["Product Features", "Pricing", "Support"],
      },
      {
        scenario: "Topic and content mismatch (food vs. software topics)",
        hypothesis: "Should honestly report near-zero coverage for all software-related topics when the content is entirely about an unrelated domain (cooking).",
        kbName: "Mismatch Test",
        chunks: [
          "To make the perfect carbonara, cook guanciale in a pan until crispy. Whisk eggs and Pecorino Romano. Cook spaghetti al dente, reserve pasta water. Combine off heat to avoid scrambling the eggs. Season with black pepper.",
          "Sourdough bread requires a live starter culture. Feed it with equal parts flour and water for 5–7 days before use. Bulk ferment at room temperature for 4–6 hours, then cold proof overnight. Bake in a Dutch oven at 230°C.",
        ],
        topics: ["Authentication", "API Reference", "Security Compliance", "Deployment Guide"],
      },
    ];

    for (const s of docAuditScenarios) {
      const result = await runDocAuditScenario(s.chunks, s.topics, s.kbName);
      await saveFinding("DocAudit", "docaudit", s.scenario, s.hypothesis, result);
    }

    const externalTools = [
      { name: "DiffLens", url: "https://diff-lens.replit.app/", hypothesis: "Should be publicly accessible and return HTTP 200 with a valid HTML response." },
      { name: "DocForge PDF", url: "https://docforge-pdf.replit.app/", hypothesis: "Should be publicly accessible and return HTTP 200 with a valid HTML response." },
      { name: "DocScope (Intel Engine)", url: "https://intel-engine-scope.replit.app/", hypothesis: "Should be publicly accessible and return HTTP 200 with a valid HTML response." },
      { name: "Synaptica KA Demo", url: "https://synaptica-knowledge-architecture-mcp.replit.app/search", hypothesis: "Should be publicly accessible and return HTTP 200 with a valid HTML response." },
      { name: "Learning OS", url: "https://synaptica-knowledge-systems-learning-os.replit.app/", hypothesis: "Should be publicly accessible and return HTTP 200 with a valid HTML response." },
    ];

    for (const tool of externalTools) {
      const result = await checkExternalTool(tool.name, tool.url);
      await saveFinding(tool.name, "external_tools", `${tool.name} accessibility check`, tool.hypothesis, result);
    }

    const chatScenarios: Array<{ message: string; scenario: string; hypothesis: string }> = [
      {
        scenario: "Free tools inquiry",
        message: "What free tools can I use right now without paying anything?",
        hypothesis: "Should correctly name the four free tools: DiffLens, DocForge PDF, DocScope (Intel Engine), and the Synaptica KA Demo. Should not list DocAudit as free.",
      },
      {
        scenario: "DocAudit pricing and scope",
        message: "How much does the DocAudit tool cost and what exactly do I get?",
        hypothesis: "Should clarify DocAudit is a paid consulting service ($1,500–$2,000) and explain the deliverables: gap analysis, semantic search audit, and prioritised report.",
      },
      {
        scenario: "Learning OS explanation and pricing",
        message: "What is Learning OS and how much does it cost? Is it part of the consulting services?",
        hypothesis: "Should explain Learning OS as a separate subscription learning platform (not consulting), describe who it's for, and provide information about its pricing tiers.",
      },
      {
        scenario: "Honest limitations of tools",
        message: "I want to be realistic — what can your tools NOT do? Where are the limitations I should know about before deciding?",
        hypothesis: "Should give an honest, grounded answer about limitations rather than deflecting. Should acknowledge scope boundaries without being dismissive or evasive.",
      },
    ];

    let chatSessionId: string | null = null;
    for (const s of chatScenarios) {
      const { result, sessionId } = await runChatScenario(s.message, chatSessionId);
      chatSessionId = sessionId ?? null;
      if (sessionId && !chatSessionIds.includes(sessionId)) chatSessionIds.push(sessionId);
      await saveFinding("Chat Assistant", "chat", s.scenario, s.hypothesis, result);
    }

    await updateToolTestRun(runId, { testChatSessionIds: chatSessionIds });

    const allFindings = await getToolTestFindings(runId);
    const passCount = allFindings.filter(f => f.severity === "pass").length;
    const warnCount = allFindings.filter(f => f.severity === "warning").length;
    const failCount = allFindings.filter(f => f.severity === "fail").length;
    const summary = `${allFindings.length} scenarios tested — ${passCount} pass · ${warnCount} warning · ${failCount} fail`;

    const reportMarkdown = await generateFinalReport(runId, now, allFindings);

    await updateToolTestRun(runId, {
      status: "completed",
      summary,
      reportMarkdown,
    });
  } catch (err) {
    console.error("Tool test suite failed:", err);
    await updateToolTestRun(runId, {
      status: "failed",
      summary: `Test suite failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}
