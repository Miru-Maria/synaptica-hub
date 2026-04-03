import OpenAI from "openai";
import { signToken } from "../middleware/auth.js";
import {
  createToolTestRun,
  updateToolTestRun,
  addToolTestFinding,
  getToolTestFindings,
  enforceReportLimits,
  ToolTestFinding,
  ToolTestSeverity,
} from "../data/tool-test-store.js";

export const TOTAL_TOOL_TEST_SCENARIOS = 23;

function getBaseUrl(): string {
  return `http://0.0.0.0:${process.env.NODE_ENV === "production" ? (process.env.PORT || "5000") : "5000"}`;
}

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  return new OpenAI({ apiKey });
}

function getAdminToken(): string | null {
  try {
    return signToken(process.env.ADMIN_USERNAME || "admin");
  } catch {
    return null;
  }
}

async function runDocAuditScenario(chunks: string[], topics: string[], kbName: string): Promise<string> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/audit/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Internal-Tool-Tester": "1" },
    body: JSON.stringify({ chunks, topics, kbName }),
  });
  if (!res.ok) {
    const text = await res.text();
    return `HTTP ${res.status}: ${text}`;
  }
  const data = await res.json() as Record<string, unknown>;
  const topicCoverages = (data.topicCoverages as Array<{ topic: string; score: number; severity: string }> | null) ?? [];
  const topicLines = topicCoverages
    .map(t => `  - ${t.topic}: ${Math.round(t.score * 100)}% (${t.severity})`)
    .join("\n");
  const overallScore = Number(data.overallScore ?? 0);
  const critHighCount = topicCoverages.filter(t => t.severity === "critical" || t.severity === "high").length;
  return (
    `Overall Score: ${overallScore}%\n` +
    `Topics (${topicCoverages.length}):\n${topicLines || "  (none)"}\n` +
    `Critical/High gaps: ${critHighCount}\n` +
    `Summary: ${String(data.summary ?? "")}`
  );
}

async function runChatScenario(message: string, sessionId: string | null): Promise<{ result: string; sessionId: string | undefined }> {
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
    const timer = setTimeout(() => controller.abort(), 12000);
    const start = Date.now();
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    clearTimeout(timer);
    const elapsed = Date.now() - start;
    const body = await res.text();

    const titleMatch = body.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || "(no title found)";
    const hasAppRoot = body.includes('id="root"') || body.includes('id="app"') || body.includes("</script>");
    const hasMetaDesc = body.includes("<meta") && body.includes("description");
    const speedLabel = elapsed < 2000 ? "fast (<2s)" : elapsed < 5000 ? "moderate (2–5s)" : "slow (>5s)";

    return (
      `HTTP ${res.status} — ${elapsed}ms (${speedLabel})\n` +
      `Title: "${title}"\n` +
      `Content: ${body.length} bytes\n` +
      `App shell: ${hasAppRoot ? "present" : "not detected"}\n` +
      `Meta description: ${hasMetaDesc ? "present" : "missing"}`
    );
  } catch (err) {
    if ((err as Error).name === "AbortError") return `TIMEOUT — did not respond within 12 seconds`;
    return `Unreachable — ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function runKASprint(endpoint: string, body: Record<string, unknown>): Promise<string> {
  const token = getAdminToken();
  if (!token) return "ERROR: Could not generate admin token.";
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/admin/ka-sprint/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    return `HTTP ${res.status}: ${text}`;
  }
  const data = await res.json() as Record<string, unknown>;
  const preview = JSON.stringify(data, null, 2);
  return preview.slice(0, 6000) + (preview.length > 6000 ? "\n…[truncated beyond 6000 chars]" : "");
}

async function runRAG(endpoint: string, body: Record<string, unknown>): Promise<string> {
  const token = getAdminToken();
  if (!token) return "ERROR: Could not generate admin token.";
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/admin/rag/${endpoint}`, {
    method: endpoint === "status" ? "GET" : "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...(endpoint !== "status" ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    return `HTTP ${res.status}: ${JSON.stringify(data)}`;
  }
  return JSON.stringify(data, null, 2).slice(0, 2000);
}

async function runPromptWorkshop(method: "GET" | "POST", endpoint: string, body?: Record<string, unknown>): Promise<string> {
  const token = getAdminToken();
  if (!token) return "ERROR: Could not generate admin token.";
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/admin/prompt-workshop/${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let preview: string;
  try {
    const data = JSON.parse(text) as unknown;
    preview = JSON.stringify(data, null, 2).slice(0, 2000);
  } catch {
    preview = text.slice(0, 2000);
  }
  return `HTTP ${res.status}\n${preview}`;
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
2. A prioritized list of 3–6 recommendations (numbered) for improvement.

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
    executiveSummary = `Completed ${findings.length} tests across DocAudit, external tools, internal admin tools, and the chat assistant. ${passCount} passed, ${warnCount} produced warnings, and ${failCount} failed.`;
    recommendations = "Review the failing and warning scenarios above for specific action items.";
  }

  const areaOrder = ["docaudit", "external_tools", "chat", "ka_sprint", "rag_pipeline", "prompt_workshop"];
  const areaLabels: Record<string, string> = {
    docaudit: "DocAudit — Functionality Tests",
    external_tools: "External Tools — Availability & Health",
    chat: "Chat Assistant — Tool Knowledge",
    ka_sprint: "Knowledge Architecture Sprint",
    rag_pipeline: "RAG Pipeline",
    prompt_workshop: "Prompt Engineering Workshop",
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

  for (const area of areaOrder) {
    const areaFindings = findings.filter(f => f.area === area);
    if (areaFindings.length === 0) continue;
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
    // ── DocAudit (5 scenarios) ──────────────────────────────────────────────
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
          "Team collaboration: real-time comments on tasks, @mentions, shared task views, role-based permissions (Admin, Member, Guest). Activity feeds track all changes. Notification centre shows updates across all projects.",
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
        chunks: ["Our product helps teams collaborate better. We have a web app and a mobile app. Contact us at hello@example.com for pricing information."],
        topics: ["Features", "Pricing", "Getting Started Guide", "API Reference", "Security Compliance", "Integrations", "Team Management", "Support"],
      },
      {
        scenario: "Technical API reference documentation",
        hypothesis: "Should handle code-heavy technical content correctly, identifying well-covered API topics and flagging genuinely absent areas like SDK docs and webhooks.",
        kbName: "API Reference Docs",
        chunks: [
          "Authentication: All API requests require a Bearer token in the Authorization header. Tokens expire after 24 hours. Refresh tokens via POST /auth/refresh. Token format: JWT signed with RS256.",
          "Rate Limiting: 100 requests/minute per API key on Free, 500/minute on Pro, 2000/minute on Enterprise. Exceeding limits returns HTTP 429 with Retry-After header.",
          "Error Codes: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable Entity, 500 Internal Server Error.",
          "Embeddings endpoint: POST /v1/embeddings accepts array of strings (max 100 per batch, 8192 tokens each). Returns 1536-dimension float vectors. Model: text-embedding-3-small.",
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
          "To make the perfect carbonara, cook guanciale in a pan until crispy. Whisk eggs and Pecorino Romano. Cook spaghetti al dente, reserve pasta water. Combine off heat.",
          "Sourdough bread requires a live starter culture. Feed it with equal parts flour and water for 5–7 days. Bulk ferment 4–6 hours, cold proof overnight. Bake in a Dutch oven at 230°C.",
        ],
        topics: ["Authentication", "API Reference", "Security Compliance", "Deployment Guide"],
      },
    ];

    for (const s of docAuditScenarios) {
      const result = await runDocAuditScenario(s.chunks, s.topics, s.kbName);
      await saveFinding("DocAudit", "docaudit", s.scenario, s.hypothesis, result);
    }

    // ── External Tools (5 scenarios) ───────────────────────────────────────
    const externalTools = [
      {
        name: "DiffLens",
        url: "https://diff-lens.replit.app/",
        hypothesis: "Should be publicly accessible with HTTP 200, respond in under 5 seconds, have a page title, and contain an app shell indicating a deployed web app.",
      },
      {
        name: "DocForge PDF",
        url: "https://docforge-pdf.replit.app/",
        hypothesis: "Should be publicly accessible with HTTP 200, respond in under 5 seconds, and return a well-formed HTML page with a title.",
      },
      {
        name: "DocScope (Intel Engine)",
        url: "https://intel-engine-scope.replit.app/",
        hypothesis: "Should be publicly accessible with HTTP 200, respond promptly, and return an HTML page indicating the intelligence scoping tool is deployed.",
      },
      {
        name: "Synaptica KA Demo",
        url: "https://synaptica-knowledge-architecture-mcp.replit.app/search",
        hypothesis: "Should be publicly accessible with HTTP 200, and return an HTML response indicating the knowledge architecture search demo is operational.",
      },
      {
        name: "Learning OS",
        url: "https://synaptica-knowledge-systems-learning-os.replit.app/",
        hypothesis: "Should be publicly accessible with HTTP 200, respond promptly, have a page title, and contain an app shell for the subscription learning platform.",
      },
    ];

    for (const tool of externalTools) {
      const result = await checkExternalTool(tool.name, tool.url);
      await saveFinding(tool.name, "external_tools", `${tool.name} — availability & health check`, tool.hypothesis, result);
    }

    // ── Chat Assistant tool knowledge (4 scenarios) ─────────────────────────
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

    // ── Knowledge Architecture Sprint (3 scenarios) ──────────────────────────
    const SAMPLE_TAXONOMY = `Categories:
1. Product Knowledge — core feature descriptions, release notes, product roadmap
   - Feature Documentation, Release Notes, Roadmap & Vision
2. Technical Reference — APIs, architecture, integration guides
   - API Reference, System Architecture, Integration Guides
3. Support & Troubleshooting — FAQs, known issues, escalation paths
   - FAQs, Known Issues, Escalation Procedures
4. Onboarding & Training — getting-started guides, tutorials, certification paths
   - Getting Started, Step-by-Step Tutorials, Certification Paths

Tagging Conventions:
- audience: [end-user | developer | admin | support-agent]
- product-area: [billing | auth | integrations | core-features]
- content-type: [reference | guide | tutorial | faq | troubleshooting]

Design Rationale: Structured to support fast retrieval by both support agents and developers, with clear separation between user-facing help content and technical implementation details.`;

    await saveFinding(
      "KA Sprint",
      "ka_sprint",
      "Taxonomy generation for customer support knowledge base",
      "Should return a valid JSON object with a 'categories' array (each with subcategories), 'taggingConventions' array, and a 'designRationale' string — all substantive and relevant to the domain.",
      await runKASprint("taxonomy", {
        domain: "Customer support knowledge base for a B2B SaaS project management tool",
        primaryUseCase: "RAG pipeline powering an internal support-agent assistant",
        targetSystem: "Internal knowledge assistant used by 50 support agents",
        currentStructure: "Flat folder structure in Confluence with no consistent tagging",
      })
    );

    await saveFinding(
      "KA Sprint",
      "ka_sprint",
      "Retrieval schema from a provided taxonomy",
      "Should return a valid JSON object with a 'retrievalPatterns' array (each with pattern, description, queryExample, taxonomyMapping) and a 'metadataSchema' object with 'fields' array and 'chunkingStrategy' — all actionable and consistent with the provided taxonomy.",
      await runKASprint("retrieval-schema", {
        domain: "Customer support knowledge base for a B2B SaaS project management tool",
        primaryUseCase: "RAG pipeline for support agents",
        targetSystem: "Internal knowledge assistant",
        taxonomy: SAMPLE_TAXONOMY,
      })
    );

    await saveFinding(
      "KA Sprint",
      "ka_sprint",
      "Taxonomy generation with minimal required input only",
      "Should produce a valid taxonomy with only the required 'domain' field — optional fields (currentStructure, primaryUseCase, targetSystem) omitted. Should not error and should still produce useful, relevant categories.",
      await runKASprint("taxonomy", {
        domain: "Legal document management for a mid-sized law firm",
      })
    );

    // ── RAG Pipeline (3 scenarios) ───────────────────────────────────────────
    const RAG_TEST_TEXT = `Synaptica Knowledge Systems helps organisations structure their documentation for AI readiness. The core methodology involves three phases: Discovery (auditing existing content for gaps), Architecture (designing taxonomy, metadata schema, and chunking strategy), and Implementation (building RAG pipelines and vector stores). The Documentation Audit service ($1,500–$2,000) produces a gap analysis report with coverage scores and prioritised recommendations. The Knowledge Architecture Sprint ($2,500–$4,000) delivers a taxonomy, retrieval schema, and architecture document. The RAG Pipeline Design & Build service (custom, typically $8,000–$25,000+) covers end-to-end implementation including embedding strategy and vector store setup.`;

    const ragStatusBefore = await runRAG("status", {});
    await saveFinding(
      "RAG Pipeline",
      "rag_pipeline",
      "Status endpoint returns valid chunk count",
      "Should return a JSON object with a 'chunkCount' field containing a non-negative integer. Should be accessible with a valid admin token and return HTTP 200.",
      ragStatusBefore
    );

    await saveFinding(
      "RAG Pipeline",
      "rag_pipeline",
      "Ingest text document then query it accurately",
      "After ingesting a Synaptica services overview, a specific query about 'Documentation Audit pricing' should return an accurate answer citing the correct chunk ID(s). Answer should reference the $1,500–$2,000 price range from the ingested text.",
      await (async () => {
        const ingestResult = await runRAG("ingest", { text: RAG_TEST_TEXT, chunkSize: 400, overlap: 50 });
        const queryResult = await runRAG("chat", { question: "What is the price range for the Documentation Audit service and what does it include?" });
        return `INGEST:\n${ingestResult}\n\nQUERY RESULT:\n${queryResult}`;
      })()
    );

    await saveFinding(
      "RAG Pipeline",
      "rag_pipeline",
      "Query with off-topic question returns honest 'not in context' response",
      "After ingesting Synaptica services content, a question about 'Italian pasta recipes' should not hallucinate an answer. The assistant should state that the context does not contain enough information to answer the question.",
      await runRAG("chat", { question: "Can you give me a traditional Italian carbonara recipe with step-by-step instructions?" })
    );

    // ── Prompt Engineering Workshop (3 scenarios) ────────────────────────────
    await saveFinding(
      "Prompt Workshop",
      "prompt_workshop",
      "Prompts list endpoint returns valid array",
      "Should return HTTP 200 with a JSON array. Array may be empty or contain seeded prompts — the key requirement is that the endpoint is accessible and the response is a valid array.",
      await runPromptWorkshop("GET", "prompts")
    );

    await saveFinding(
      "Prompt Workshop",
      "prompt_workshop",
      "Style guide endpoint returns accessible content",
      "Should return HTTP 200 with a valid JSON object containing a 'content' field (string, may be empty) and a timestamp or metadata field. The endpoint should be accessible and not error.",
      await runPromptWorkshop("GET", "style-guide")
    );

    await saveFinding(
      "Prompt Workshop",
      "prompt_workshop",
      "Test endpoint runs a rendered prompt and returns output",
      "Should accept a well-formed prompt string via POST /test and return HTTP 200 with a JSON object containing a non-empty 'output' string. The output should be a coherent, relevant response to the prompt content.",
      await runPromptWorkshop("POST", "test", {
        renderedPrompt: "You are a documentation quality reviewer. Analyse the following documentation snippet and identify the top 3 gaps that would prevent an AI system from retrieving accurate answers:\n\n---\nOur product is a project management tool. It has tasks and users. You can assign tasks to users. Tasks have due dates.\n---\n\nList the 3 gaps in order of severity, with one sentence explanation each.",
      })
    );

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
