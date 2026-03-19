import OpenAI from "openai";
import { PERSONAS, type Persona, type TestScenario } from "./ux-personas.js";
import {
  createUXTestRun,
  updateUXTestRun,
  addUXTestFinding,
  cleanupUXTestData,
  type UXTestRun,
  type UXTestFinding,
  type FindingSeverity,
} from "../data/ux-test-store.js";
import { signToken } from "../middleware/auth.js";

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is not set");
  return new OpenAI({ apiKey });
}

function getBaseUrl(): string {
  return `http://0.0.0.0:${process.env.NODE_ENV === "production" ? (process.env.PORT || "5000") : "3001"}`;
}

async function evaluateInteraction(
  persona: Persona,
  scenario: TestScenario,
  input: string,
  output: string
): Promise<{ severity: FindingSeverity; summary: string }> {
  const openai = getOpenAI();
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a UX quality evaluator. You are evaluating an AI platform interaction from the perspective of a specific user persona. Judge the interaction and return a JSON object with:
- "severity": one of "good", "needs_attention", or "issue"
  - "good" = the interaction met expectations, was helpful and appropriate
  - "needs_attention" = minor issues, could be improved but not broken
  - "issue" = significant problem, confusing, incorrect, or broken behavior
- "summary": a 1-3 sentence plain-English explanation of your evaluation

Be specific. Reference what was good or bad about the response.`,
        },
        {
          role: "user",
          content: `## Persona
Name: ${persona.name}
Background: ${persona.background}
Intent: ${persona.intent}
Tone: ${persona.tone}

## Scenario
${scenario.name}

## Evaluation Criteria
${scenario.evaluationCriteria}

## Input Sent
${input}

## Output Received
${output}

Evaluate this interaction from the persona's perspective.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    const severity = (["good", "needs_attention", "issue"].includes(parsed.severity)
      ? parsed.severity
      : "needs_attention") as FindingSeverity;
    return { severity, summary: parsed.summary || "Evaluation completed." };
  } catch (err) {
    console.error("Evaluation error:", err);
    return { severity: "needs_attention", summary: `Evaluation failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}

async function runChatScenario(
  persona: Persona,
  scenario: TestScenario,
  chatSessionId: string | null
): Promise<{ output: string; sessionId: string | null }> {
  const baseUrl = getBaseUrl();
  const message = typeof scenario.input === "string" ? scenario.input : JSON.stringify(scenario.input);

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId: chatSessionId }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    return { output: `HTTP ${res.status}: ${errorText}`, sessionId: chatSessionId };
  }

  const data = await res.json() as { reply: string; sessionId: string; leadCaptured: boolean };
  return {
    output: `Reply: ${data.reply}${data.leadCaptured ? "\n[Lead was captured]" : ""}`,
    sessionId: data.sessionId,
  };
}

async function runDocAuditScenario(scenario: TestScenario): Promise<string> {
  const baseUrl = getBaseUrl();
  const input = scenario.input as Record<string, unknown>;

  const res = await fetch(`${baseUrl}/api/audit/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chunks: input.chunks,
      topics: input.topics,
      kbName: "UX Test Audit",
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    return `HTTP ${res.status}: ${errorText}`;
  }

  const data = await res.json() as Record<string, unknown>;
  return JSON.stringify(data, null, 2);
}

async function runKASprintScenario(scenario: TestScenario): Promise<string> {
  const baseUrl = getBaseUrl();
  const input = scenario.input as Record<string, unknown>;

  const token = getAdminToken();
  if (!token) return "ERROR: Could not generate admin token for authenticated endpoint test.";

  const res = await fetch(`${baseUrl}/api/admin/ka-sprint/taxonomy`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorText = await res.text();
    return `HTTP ${res.status}: ${errorText}`;
  }

  const data = await res.json() as Record<string, unknown>;
  return JSON.stringify(data, null, 2);
}

async function runPromptWorkshopScenario(scenario: TestScenario): Promise<string> {
  const baseUrl = getBaseUrl();
  const input = scenario.input as Record<string, unknown>;

  const token = getAdminToken();
  if (!token) return "ERROR: Could not generate admin token for authenticated endpoint test.";

  const res = await fetch(`${baseUrl}/api/admin/prompt-workshop/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorText = await res.text();
    return `HTTP ${res.status}: ${errorText}`;
  }

  const data = await res.json() as Record<string, unknown>;
  return JSON.stringify(data, null, 2);
}

async function runRouteCheckScenario(scenario: TestScenario): Promise<string> {
  const baseUrl = getBaseUrl();
  const path = typeof scenario.input === "string" ? scenario.input : "/";

  try {
    const res = await fetch(`${baseUrl}${path}`, { redirect: "follow" });
    const contentType = res.headers.get("content-type") || "";
    const body = await res.text();
    const bodyPreview = body.slice(0, 500);

    return `HTTP ${res.status} (${contentType})\nContent length: ${body.length} chars\nPreview: ${bodyPreview}`;
  } catch (err) {
    return `Fetch error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function runEmailGateScenario(scenario: TestScenario): Promise<string> {
  const baseUrl = getBaseUrl();
  const input = scenario.input as Record<string, unknown>;

  const payload: Record<string, unknown> = {
    email: input.email || "",
    firstName: input.firstName || "",
  };
  if (input.toolSource !== undefined) payload.toolSource = input.toolSource;
  if (input.documentType !== undefined) payload.documentType = input.documentType;

  try {
    const res = await fetch(`${baseUrl}/api/public/capture-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const status = res.status;
    const body = await res.text();

    return `HTTP ${status}: ${body}`;
  } catch (err) {
    return `Fetch error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

function getAdminToken(): string | null {
  try {
    return signToken(process.env.ADMIN_USERNAME || "admin");
  } catch {
    return null;
  }
}

function sanitizeOutput(output: string): string {
  let sanitized = output;
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9\-._~+\/]+=*/g, "Bearer [REDACTED]");
  sanitized = sanitized.replace(/("?password"?\s*[:=]\s*)"[^"]*"/gi, '$1"[REDACTED]"');
  sanitized = sanitized.replace(/("?apiKey"?\s*[:=]\s*)"[^"]*"/gi, '$1"[REDACTED]"');
  sanitized = sanitized.replace(/("?secret"?\s*[:=]\s*)"[^"]*"/gi, '$1"[REDACTED]"');
  return sanitized.slice(0, 3000);
}

export async function runUXTestSuite(runId: string): Promise<void> {
  const totalScenarios = PERSONAS.reduce((sum, p) => sum + p.scenarios.length, 0);
  const personaIds = PERSONAS.map((p) => p.id);

  const run: UXTestRun = {
    id: runId,
    triggeredAt: new Date().toISOString(),
    status: "running",
    personaIds,
    totalScenarios,
    completedScenarios: 0,
    testChatSessionIds: [],
    cleanedUp: false,
  };

  await createUXTestRun(run);

  try {
    let completedCount = 0;
    const allFindings: UXTestFinding[] = [];
    const testChatSessionIds = new Set<string>();

    for (const persona of PERSONAS) {
      let chatSessionId: string | null = null;

      for (const scenario of persona.scenarios) {
        try {
          let output: string;
          const inputStr = typeof scenario.input === "string"
            ? scenario.input
            : JSON.stringify(scenario.input);

          switch (scenario.action) {
            case "chat": {
              const result = await runChatScenario(persona, scenario, chatSessionId);
              output = result.output;
              chatSessionId = result.sessionId;
              if (chatSessionId) testChatSessionIds.add(chatSessionId);
              break;
            }
            case "docaudit":
              output = await runDocAuditScenario(scenario);
              break;
            case "ka_sprint":
              output = await runKASprintScenario(scenario);
              break;
            case "prompt_workshop":
              output = await runPromptWorkshopScenario(scenario);
              break;
            case "route_check":
              output = await runRouteCheckScenario(scenario);
              break;
            case "email_gate":
              output = await runEmailGateScenario(scenario);
              break;
            default:
              output = `Unknown action: ${scenario.action}`;
          }

          const sanitizedOutput = sanitizeOutput(output);
          const evaluation = await evaluateInteraction(persona, scenario, inputStr, sanitizedOutput);

          const finding: UXTestFinding = {
            id: `finding-${runId}-${scenario.id}`,
            runId,
            persona: persona.name,
            area: scenario.area,
            scenario: scenario.name,
            severity: evaluation.severity,
            summary: evaluation.summary,
            rawInput: inputStr.slice(0, 5000),
            rawOutput: sanitizedOutput,
            evaluatedAt: new Date().toISOString(),
          };

          await addUXTestFinding(finding);
          allFindings.push(finding);
        } catch (err) {
          const inputStr = typeof scenario.input === "string"
            ? scenario.input
            : JSON.stringify(scenario.input);

          const errorMsg = err instanceof Error ? err.message : String(err);

          const finding: UXTestFinding = {
            id: `finding-${runId}-${scenario.id}`,
            runId,
            persona: persona.name,
            area: scenario.area,
            scenario: scenario.name,
            severity: "issue",
            summary: `Scenario failed with error: ${errorMsg}`,
            rawInput: inputStr.slice(0, 5000),
            rawOutput: `Error: ${errorMsg}`.slice(0, 3000),
            evaluatedAt: new Date().toISOString(),
          };

          await addUXTestFinding(finding);
          allFindings.push(finding);
        }

        completedCount++;
        await updateUXTestRun(runId, { completedScenarios: completedCount });
      }
    }

    const goodCount = allFindings.filter((f) => f.severity === "good").length;
    const attentionCount = allFindings.filter((f) => f.severity === "needs_attention").length;
    const issueCount = allFindings.filter((f) => f.severity === "issue").length;

    const summary = `Test suite completed: ${totalScenarios} scenarios across ${PERSONAS.length} personas. Results: ${goodCount} good, ${attentionCount} need attention, ${issueCount} issues found.`;

    await updateUXTestRun(runId, {
      status: "completed",
      completedScenarios: totalScenarios,
      summary,
      testChatSessionIds: Array.from(testChatSessionIds),
    });

    cleanupUXTestData(runId)
      .then((result) => {
        console.log(`[UX Test] Auto-cleanup for run ${runId}: removed ${result.deletedChatSessions} chat sessions, ${result.deletedContacts} contacts, ${result.deletedLeads} leads, ${result.deletedNotifications} notifications.`);
      })
      .catch((err) => {
        console.error(`[UX Test] Auto-cleanup failed for run ${runId}:`, err);
      });
  } catch (fatalErr) {
    console.error("UX test suite fatal error:", fatalErr);
    const errorMsg = fatalErr instanceof Error ? fatalErr.message : String(fatalErr);
    await updateUXTestRun(runId, {
      status: "failed",
      summary: `Test suite failed with fatal error: ${errorMsg}`,
    }).catch((e) => console.error("Failed to update run status:", e));
  }
}
