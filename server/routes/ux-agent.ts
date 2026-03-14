import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { getUXTestRuns, getUXTestRunById, getUXTestFindings } from "../data/ux-test-store.js";
import { runUXTestSuite } from "../services/ux-agent.js";
import { PERSONAS, countAllScenarios } from "../services/ux-personas.js";

export const uxAgentRouter = Router();

uxAgentRouter.use(requireAuth);

let runLock = false;

uxAgentRouter.get("/personas", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const personas = PERSONAS.map((p) => ({
      id: p.id,
      name: p.name,
      background: p.background,
      intent: p.intent,
      tone: p.tone,
      scenarioCount: p.scenarios.length,
      scenarios: p.scenarios.map((s) => ({
        id: s.id,
        name: s.name,
        area: s.area,
        action: s.action,
      })),
    }));
    res.json({ personas, totalScenarios: countAllScenarios() });
  } catch (err) {
    console.error("UX Agent personas error:", err);
    res.status(500).json({ error: "Failed to load personas" });
  }
});

uxAgentRouter.post("/run", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    if (runLock) {
      const existingRuns = await getUXTestRuns();
      const activeRun = existingRuns.find((r) => r.status === "running");
      res.status(409).json({ error: "A test run is already in progress", runId: activeRun?.id });
      return;
    }

    const existingRuns = await getUXTestRuns();
    const activeRun = existingRuns.find((r) => r.status === "running");
    if (activeRun) {
      res.status(409).json({ error: "A test run is already in progress", runId: activeRun.id });
      return;
    }

    runLock = true;
    const runId = `ux-run-${Date.now()}`;

    res.json({ runId, status: "started", totalScenarios: countAllScenarios() });

    runUXTestSuite(runId)
      .catch((err) => {
        console.error("UX test suite failed:", err);
      })
      .finally(() => {
        runLock = false;
      });
  } catch (err) {
    runLock = false;
    console.error("UX Agent run error:", err);
    res.status(500).json({ error: "Failed to start test run" });
  }
});

uxAgentRouter.get("/runs", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const runs = await getUXTestRuns();
    res.json(runs);
  } catch (err) {
    console.error("UX Agent runs list error:", err);
    res.status(500).json({ error: "Failed to load test runs" });
  }
});

uxAgentRouter.get("/runs/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const run = await getUXTestRunById(req.params.id);
    if (!run) {
      res.status(404).json({ error: "Test run not found" });
      return;
    }

    const findings = await getUXTestFindings(req.params.id);

    res.json({ ...run, findings });
  } catch (err) {
    console.error("UX Agent run detail error:", err);
    res.status(500).json({ error: "Failed to load test run" });
  }
});

uxAgentRouter.get("/runs/:id/export", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const run = await getUXTestRunById(req.params.id);
    if (!run) {
      res.status(404).json({ error: "Test run not found" });
      return;
    }

    const findings = await getUXTestFindings(req.params.id);

    const lines: string[] = [];
    lines.push("# UX Test Report\n");
    lines.push(`**Run ID:** ${run.id}`);
    lines.push(`**Triggered:** ${new Date(run.triggeredAt).toLocaleString()}`);
    lines.push(`**Status:** ${run.status}`);
    lines.push(`**Total Scenarios:** ${run.totalScenarios}`);
    lines.push(`**Completed:** ${run.completedScenarios}\n`);

    if (run.summary) {
      lines.push(`## Summary\n${run.summary}\n`);
    }

    const goodCount = findings.filter((f) => f.severity === "good").length;
    const attentionCount = findings.filter((f) => f.severity === "needs_attention").length;
    const issueCount = findings.filter((f) => f.severity === "issue").length;

    lines.push("## Results Overview\n");
    lines.push(`| Severity | Count |`);
    lines.push(`|----------|-------|`);
    lines.push(`| Good | ${goodCount} |`);
    lines.push(`| Needs Attention | ${attentionCount} |`);
    lines.push(`| Issue | ${issueCount} |`);
    lines.push("");

    const areas = ["chat", "lab_tools", "navigation", "lead_capture"] as const;
    const areaLabels: Record<string, string> = {
      chat: "Chat Assistant",
      lab_tools: "Lab Tools",
      navigation: "Navigation",
      lead_capture: "Lead Capture",
    };

    for (const area of areas) {
      const areaFindings = findings.filter((f) => f.area === area);
      if (areaFindings.length === 0) continue;

      lines.push(`## ${areaLabels[area]}\n`);

      for (const finding of areaFindings) {
        const severityEmoji = finding.severity === "good" ? "+" : finding.severity === "issue" ? "!" : "~";
        lines.push(`### [${severityEmoji}] ${finding.scenario}\n`);
        lines.push(`**Persona:** ${finding.persona}`);
        lines.push(`**Severity:** ${finding.severity.replace("_", " ")}`);
        lines.push(`**Evaluation:** ${finding.summary}\n`);
        lines.push(`<details><summary>Raw Input</summary>\n\n\`\`\`\n${finding.rawInput}\n\`\`\`\n</details>\n`);
        lines.push(`<details><summary>Raw Output</summary>\n\n\`\`\`\n${finding.rawOutput.slice(0, 2000)}\n\`\`\`\n</details>\n`);
        lines.push("---\n");
      }
    }

    lines.push("\n*Report generated by Synaptica UX Testing Agent*\n");

    const markdown = lines.join("\n");
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="UX-Test-Report-${run.id}.md"`
    );
    res.send(markdown);
  } catch (err) {
    console.error("UX Agent export error:", err);
    res.status(500).json({ error: "Failed to export report" });
  }
});
