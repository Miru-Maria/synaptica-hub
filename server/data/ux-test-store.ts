import { pool } from "./db.js";

export interface UXTestRun {
  id: string;
  triggeredAt: string;
  status: "running" | "completed" | "failed";
  personaIds: string[];
  totalScenarios: number;
  completedScenarios: number;
  summary?: string;
  testChatSessionIds: string[];
  cleanedUp: boolean;
}

export type FindingSeverity = "good" | "needs_attention" | "issue";
export type FindingArea = "chat" | "lab_tools" | "navigation" | "lead_capture";

export interface UXTestFinding {
  id: string;
  runId: string;
  persona: string;
  area: FindingArea;
  scenario: string;
  severity: FindingSeverity;
  summary: string;
  rawInput: string;
  rawOutput: string;
  evaluatedAt: string;
}

export interface CleanupResult {
  deletedChatSessions: number;
  deletedContacts: number;
  deletedLeads: number;
  deletedNotifications: number;
}

export async function initUXTestTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ux_test_runs (
      id VARCHAR(100) PRIMARY KEY,
      triggered_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      persona_ids JSONB NOT NULL DEFAULT '[]',
      total_scenarios INTEGER NOT NULL DEFAULT 0,
      completed_scenarios INTEGER NOT NULL DEFAULT 0,
      summary TEXT
    );

    CREATE TABLE IF NOT EXISTS ux_test_findings (
      id VARCHAR(100) PRIMARY KEY,
      run_id VARCHAR(100) NOT NULL REFERENCES ux_test_runs(id) ON DELETE CASCADE,
      persona TEXT NOT NULL,
      area TEXT NOT NULL,
      scenario TEXT NOT NULL,
      severity TEXT NOT NULL,
      summary TEXT NOT NULL,
      raw_input TEXT NOT NULL,
      raw_output TEXT NOT NULL,
      evaluated_at TEXT NOT NULL
    );
  `);

  await pool.query(`
    ALTER TABLE ux_test_runs ADD COLUMN IF NOT EXISTS test_chat_session_ids JSONB NOT NULL DEFAULT '[]';
    ALTER TABLE ux_test_runs ADD COLUMN IF NOT EXISTS cleaned_up BOOLEAN NOT NULL DEFAULT FALSE;
  `);
}

export async function createUXTestRun(run: UXTestRun): Promise<UXTestRun> {
  await pool.query(
    `INSERT INTO ux_test_runs (id, triggered_at, status, persona_ids, total_scenarios, completed_scenarios, summary, test_chat_session_ids, cleaned_up)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      run.id,
      run.triggeredAt,
      run.status,
      JSON.stringify(run.personaIds),
      run.totalScenarios,
      run.completedScenarios,
      run.summary || null,
      JSON.stringify(run.testChatSessionIds),
      run.cleanedUp,
    ]
  );
  return run;
}

export async function updateUXTestRun(id: string, updates: Partial<UXTestRun>): Promise<UXTestRun | null> {
  const run = await getUXTestRunById(id);
  if (!run) return null;

  const merged = { ...run, ...updates };
  await pool.query(
    `UPDATE ux_test_runs
     SET status = $2, completed_scenarios = $3, summary = $4, test_chat_session_ids = $5, cleaned_up = $6
     WHERE id = $1`,
    [
      id,
      merged.status,
      merged.completedScenarios,
      merged.summary || null,
      JSON.stringify(merged.testChatSessionIds),
      merged.cleanedUp,
    ]
  );
  return merged;
}

export async function getUXTestRunById(id: string): Promise<UXTestRun | null> {
  const { rows } = await pool.query(`SELECT * FROM ux_test_runs WHERE id = $1`, [id]);
  if (rows.length === 0) return null;
  return mapRunRow(rows[0]);
}

export async function getUXTestRuns(): Promise<UXTestRun[]> {
  const { rows } = await pool.query(`SELECT * FROM ux_test_runs ORDER BY triggered_at DESC`);
  return rows.map(mapRunRow);
}

export async function addUXTestFinding(finding: UXTestFinding): Promise<UXTestFinding> {
  await pool.query(
    `INSERT INTO ux_test_findings (id, run_id, persona, area, scenario, severity, summary, raw_input, raw_output, evaluated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [finding.id, finding.runId, finding.persona, finding.area, finding.scenario, finding.severity, finding.summary, finding.rawInput, finding.rawOutput, finding.evaluatedAt]
  );
  return finding;
}

export async function getUXTestFindings(runId: string): Promise<UXTestFinding[]> {
  const { rows } = await pool.query(
    `SELECT * FROM ux_test_findings WHERE run_id = $1 ORDER BY evaluated_at ASC`,
    [runId]
  );
  return rows.map(mapFindingRow);
}

export async function cleanupUXTestData(runId: string): Promise<CleanupResult> {
  const run = await getUXTestRunById(runId);
  if (!run) throw new Error("Run not found");

  let deletedChatSessions = 0;
  let deletedContacts = 0;
  let deletedLeads = 0;
  let deletedNotifications = 0;

  const sessionIds = run.testChatSessionIds;
  if (sessionIds.length > 0) {
    const placeholders = sessionIds.map((_, i) => `$${i + 1}`).join(", ");
    const result = await pool.query(
      `DELETE FROM chat_sessions WHERE id IN (${placeholders})`,
      sessionIds
    );
    deletedChatSessions = result.rowCount || 0;
  }

  const contactResult = await pool.query(
    `DELETE FROM pipeline_contacts WHERE email ILIKE '%@synaptica-ux-test.example.com'`
  );
  deletedContacts = contactResult.rowCount || 0;

  const leadResult = await pool.query(
    `DELETE FROM email_leads WHERE email ILIKE '%@synaptica-ux-test.example.com' OR tool_source = 'ux-test'`
  );
  deletedLeads = leadResult.rowCount || 0;

  const notifResult = await pool.query(
    `DELETE FROM notifications WHERE message ILIKE '%@synaptica-ux-test.example.com%' OR message ILIKE '%ux-test%'`
  );
  deletedNotifications = notifResult.rowCount || 0;

  await pool.query(`UPDATE ux_test_runs SET cleaned_up = TRUE WHERE id = $1`, [runId]);

  return { deletedChatSessions, deletedContacts, deletedLeads, deletedNotifications };
}

function mapRunRow(row: Record<string, unknown>): UXTestRun {
  return {
    id: row.id as string,
    triggeredAt: row.triggered_at as string,
    status: row.status as UXTestRun["status"],
    personaIds: (typeof row.persona_ids === "string" ? JSON.parse(row.persona_ids) : row.persona_ids) as string[],
    totalScenarios: Number(row.total_scenarios),
    completedScenarios: Number(row.completed_scenarios),
    summary: (row.summary as string) || undefined,
    testChatSessionIds: (typeof row.test_chat_session_ids === "string"
      ? JSON.parse(row.test_chat_session_ids)
      : (row.test_chat_session_ids || [])) as string[],
    cleanedUp: Boolean(row.cleaned_up),
  };
}

function mapFindingRow(row: Record<string, unknown>): UXTestFinding {
  return {
    id: row.id as string,
    runId: row.run_id as string,
    persona: row.persona as string,
    area: row.area as FindingArea,
    scenario: row.scenario as string,
    severity: row.severity as FindingSeverity,
    summary: row.summary as string,
    rawInput: row.raw_input as string,
    rawOutput: row.raw_output as string,
    evaluatedAt: row.evaluated_at as string,
  };
}
