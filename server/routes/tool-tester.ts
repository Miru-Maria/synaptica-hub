import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";
import {
  getToolTestRuns,
  getToolTestRunById,
  getToolTestFindings,
  cleanupToolTestData,
} from "../data/tool-test-store.js";
import { runToolTestSuite, TOTAL_TOOL_TEST_SCENARIOS } from "../services/tool-tester.js";

export const toolTesterRouter = Router();

toolTesterRouter.use(requireAuth);

let runLock = false;

toolTesterRouter.post("/run", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    if (runLock) {
      const existingRuns = await getToolTestRuns();
      const activeRun = existingRuns.find(r => r.status === "running");
      res.status(409).json({ error: "A test run is already in progress", runId: activeRun?.id });
      return;
    }

    const existingRuns = await getToolTestRuns();
    const activeRun = existingRuns.find(r => r.status === "running");
    if (activeRun) {
      res.status(409).json({ error: "A test run is already in progress", runId: activeRun.id });
      return;
    }

    runLock = true;
    const runId = `tt-run-${Date.now()}`;

    res.json({ runId, status: "started", totalScenarios: TOTAL_TOOL_TEST_SCENARIOS });

    runToolTestSuite(runId)
      .catch(err => console.error("Tool test suite failed:", err))
      .finally(() => { runLock = false; });
  } catch (err) {
    runLock = false;
    console.error("Tool tester run error:", err);
    res.status(500).json({ error: "Failed to start test run" });
  }
});

toolTesterRouter.get("/runs", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const runs = await getToolTestRuns();
    res.json(runs);
  } catch (err) {
    console.error("Tool tester runs list error:", err);
    res.status(500).json({ error: "Failed to load test runs" });
  }
});

toolTesterRouter.get("/runs/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const run = await getToolTestRunById(req.params.id);
    if (!run) { res.status(404).json({ error: "Run not found" }); return; }
    const findings = await getToolTestFindings(req.params.id);
    res.json({ ...run, findings });
  } catch (err) {
    console.error("Tool tester run detail error:", err);
    res.status(500).json({ error: "Failed to load run" });
  }
});

toolTesterRouter.get("/runs/:id/download", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const run = await getToolTestRunById(req.params.id);
    if (!run) { res.status(404).json({ error: "Run not found" }); return; }
    if (!run.reportMarkdown) {
      res.status(400).json({ error: "Report not yet generated for this run" });
      return;
    }
    const filename = `Synaptica-Tool-Test-Report-${run.id}.md`;
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(run.reportMarkdown);
  } catch (err) {
    console.error("Tool tester download error:", err);
    res.status(500).json({ error: "Failed to download report" });
  }
});

toolTesterRouter.post("/runs/:id/cleanup", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const run = await getToolTestRunById(req.params.id);
    if (!run) { res.status(404).json({ error: "Run not found" }); return; }
    if (run.status === "running") {
      res.status(409).json({ error: "Cannot clean up a run that is still in progress" });
      return;
    }
    const result = await cleanupToolTestData(req.params.id);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("Tool tester cleanup error:", err);
    res.status(500).json({ error: "Failed to clean up test data" });
  }
});
