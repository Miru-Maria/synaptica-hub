import { pool } from "./db.js";

export interface UXTestRun {
  id: string;
  triggeredAt: string;
  status: "running" | "completed" | "failed";
  personaIds: string[];
  totalScenarios: number;
  completedScenarios: number;
  summary?: string;
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
}

export async function createUXTestRun(run: UXTestRun): Promise<UXTestRun> {
  await pool.query(
    `INSERT INTO ux_test_runs (id, triggered_at, status, persona_ids, total_scenarios, completed_scenarios, summary)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [run.id, run.triggeredAt, run.status, JSON.stringify(run.personaIds), run.totalScenarios, run.completedScenarios, run.summary || null]
  );
  return run;
}

export async function updateUXTestRun(id: string, updates: Partial<UXTestRun>): Promise<UXTestRun | null> {
  const run = await getUXTestRunById(id);
  if (!run) return null;

  const merged = { ...run, ...updates };
  await pool.query(
    `UPDATE ux_test_runs SET status = $2, completed_scenarios = $3, summary = $4 WHERE id = $1`,
    [id, merged.status, merged.completedScenarios, merged.summary || null]
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

function mapRunRow(row: Record<string, unknown>): UXTestRun {
  return {
    id: row.id as string,
    triggeredAt: row.triggered_at as string,
    status: row.status as UXTestRun["status"],
    personaIds: (typeof row.persona_ids === "string" ? JSON.parse(row.persona_ids) : row.persona_ids) as string[],
    totalScenarios: Number(row.total_scenarios),
    completedScenarios: Number(row.completed_scenarios),
    summary: (row.summary as string) || undefined,
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
