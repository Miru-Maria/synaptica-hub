import { pool } from "./db.js";

export type ToolTestRunStatus = "running" | "completed" | "failed";
export type ToolTestSeverity = "pass" | "warning" | "fail";

export interface ToolTestRun {
  id: string;
  triggeredAt: string;
  status: ToolTestRunStatus;
  totalScenarios: number;
  completedScenarios: number;
  summary: string | null;
  reportMarkdown: string | null;
  cleanedUp: boolean;
  testChatSessionIds: string[];
  expiresAt: string;
}

export interface ToolTestFinding {
  id: string;
  runId: string;
  tool: string;
  area: string;
  scenario: string;
  severity: ToolTestSeverity;
  hypothesis: string;
  result: string;
  summary: string;
  evaluatedAt: string;
}

export interface ToolTestCleanupResult {
  deletedChatSessions: number;
  deletedLeads: number;
  deletedNotifications: number;
}

export async function initToolTestTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tool_test_runs (
      id VARCHAR(100) PRIMARY KEY,
      triggered_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      total_scenarios INTEGER NOT NULL DEFAULT 0,
      completed_scenarios INTEGER NOT NULL DEFAULT 0,
      summary TEXT,
      report_markdown TEXT,
      cleaned_up BOOLEAN NOT NULL DEFAULT false,
      test_chat_session_ids JSONB NOT NULL DEFAULT '[]',
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tool_test_findings (
      id VARCHAR(100) PRIMARY KEY,
      run_id VARCHAR(100) NOT NULL REFERENCES tool_test_runs(id) ON DELETE CASCADE,
      tool TEXT NOT NULL,
      area TEXT NOT NULL,
      scenario TEXT NOT NULL,
      severity TEXT NOT NULL,
      hypothesis TEXT NOT NULL,
      result TEXT NOT NULL,
      summary TEXT NOT NULL,
      evaluated_at TEXT NOT NULL
    );
  `);
}

export async function enforceReportLimits(): Promise<void> {
  const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  await pool.query(`DELETE FROM tool_test_runs WHERE expires_at < $1`, [cutoff]);
  await pool.query(`
    DELETE FROM tool_test_runs
    WHERE id IN (
      SELECT id FROM tool_test_runs ORDER BY triggered_at ASC OFFSET 10
    )
  `);
}

export async function createToolTestRun(run: ToolTestRun): Promise<void> {
  await pool.query(
    `INSERT INTO tool_test_runs
       (id, triggered_at, status, total_scenarios, completed_scenarios, summary,
        report_markdown, cleaned_up, test_chat_session_ids, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      run.id, run.triggeredAt, run.status, run.totalScenarios,
      run.completedScenarios, run.summary, run.reportMarkdown,
      run.cleanedUp, JSON.stringify(run.testChatSessionIds), run.expiresAt,
    ]
  );
}

export async function updateToolTestRun(id: string, updates: Partial<ToolTestRun>): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (updates.status !== undefined)             { fields.push(`status = $${idx++}`);                   values.push(updates.status); }
  if (updates.completedScenarios !== undefined) { fields.push(`completed_scenarios = $${idx++}`);      values.push(updates.completedScenarios); }
  if (updates.summary !== undefined)            { fields.push(`summary = $${idx++}`);                  values.push(updates.summary); }
  if (updates.reportMarkdown !== undefined)     { fields.push(`report_markdown = $${idx++}`);          values.push(updates.reportMarkdown); }
  if (updates.cleanedUp !== undefined)          { fields.push(`cleaned_up = $${idx++}`);               values.push(updates.cleanedUp); }
  if (updates.testChatSessionIds !== undefined) { fields.push(`test_chat_session_ids = $${idx++}`);    values.push(JSON.stringify(updates.testChatSessionIds)); }

  if (fields.length === 0) return;
  values.push(id);
  await pool.query(`UPDATE tool_test_runs SET ${fields.join(", ")} WHERE id = $${idx}`, values);
}

export async function addToolTestFinding(finding: ToolTestFinding): Promise<void> {
  await pool.query(
    `INSERT INTO tool_test_findings
       (id, run_id, tool, area, scenario, severity, hypothesis, result, summary, evaluated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      finding.id, finding.runId, finding.tool, finding.area, finding.scenario,
      finding.severity, finding.hypothesis, finding.result, finding.summary, finding.evaluatedAt,
    ]
  );
}

export async function getToolTestRuns(): Promise<ToolTestRun[]> {
  const { rows } = await pool.query(`SELECT * FROM tool_test_runs ORDER BY triggered_at DESC`);
  return rows.map(mapRunRow);
}

export async function getToolTestRunById(id: string): Promise<ToolTestRun | null> {
  const { rows } = await pool.query(`SELECT * FROM tool_test_runs WHERE id = $1`, [id]);
  if (!rows.length) return null;
  return mapRunRow(rows[0]);
}

export async function getToolTestFindings(runId: string): Promise<ToolTestFinding[]> {
  const { rows } = await pool.query(
    `SELECT * FROM tool_test_findings WHERE run_id = $1 ORDER BY evaluated_at ASC`,
    [runId]
  );
  return rows.map(mapFindingRow);
}

export async function cleanupToolTestData(runId: string): Promise<ToolTestCleanupResult> {
  const run = await getToolTestRunById(runId);
  if (!run) throw new Error("Run not found");

  let deletedChatSessions = 0;
  let deletedLeads = 0;
  let deletedNotifications = 0;

  if (run.testChatSessionIds.length > 0) {
    const placeholders = run.testChatSessionIds.map((_, i) => `$${i + 1}`).join(", ");
    const res = await pool.query(
      `DELETE FROM chat_sessions WHERE id IN (${placeholders})`,
      run.testChatSessionIds
    );
    deletedChatSessions = res.rowCount || 0;
  }

  const leadRes = await pool.query(
    `DELETE FROM email_leads WHERE tool_source = 'tool-test'`
  );
  deletedLeads = leadRes.rowCount || 0;

  const notifRes = await pool.query(
    `DELETE FROM notifications WHERE message ILIKE '%tool-test%'`
  );
  deletedNotifications = notifRes.rowCount || 0;

  await pool.query(`UPDATE tool_test_runs SET cleaned_up = TRUE WHERE id = $1`, [runId]);

  return { deletedChatSessions, deletedLeads, deletedNotifications };
}

function mapRunRow(row: Record<string, unknown>): ToolTestRun {
  return {
    id: row.id as string,
    triggeredAt: row.triggered_at as string,
    status: row.status as ToolTestRunStatus,
    totalScenarios: Number(row.total_scenarios),
    completedScenarios: Number(row.completed_scenarios),
    summary: (row.summary as string) || null,
    reportMarkdown: (row.report_markdown as string) || null,
    cleanedUp: Boolean(row.cleaned_up),
    testChatSessionIds: (
      typeof row.test_chat_session_ids === "string"
        ? JSON.parse(row.test_chat_session_ids)
        : (row.test_chat_session_ids || [])
    ) as string[],
    expiresAt: row.expires_at as string,
  };
}

function mapFindingRow(row: Record<string, unknown>): ToolTestFinding {
  return {
    id: row.id as string,
    runId: row.run_id as string,
    tool: row.tool as string,
    area: row.area as string,
    scenario: row.scenario as string,
    severity: row.severity as ToolTestSeverity,
    hypothesis: row.hypothesis as string,
    result: row.result as string,
    summary: row.summary as string,
    evaluatedAt: row.evaluated_at as string,
  };
}
