import { Router, Request, Response } from "express";
import { requireAuth, signDemoToken, verifyDemoToken } from "../middleware/auth.js";
import { pool } from "../data/db.js";
import crypto from "crypto";

export const demoRouter = Router();

demoRouter.get("/admin/demo/tokens", requireAuth, async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, token, label, tools, expires_at, created_at, used_count, last_used_at FROM demo_tokens ORDER BY created_at DESC"
    );
    res.json(rows.map((r) => ({
      id: r.id,
      token: r.token,
      label: r.label,
      tools: r.tools,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
      usedCount: r.used_count,
      lastUsedAt: r.last_used_at,
    })));
  } catch {
    res.status(500).json({ error: "Failed to fetch demo tokens" });
  }
});

demoRouter.post("/admin/demo/tokens", requireAuth, async (req: Request, res: Response) => {
  try {
    const { label, tools, expiryDays = 7 } = req.body as { label: string; tools: string[]; expiryDays?: number };
    if (!label?.trim() || !tools?.length) {
      res.status(400).json({ error: "label and at least one tool are required" });
      return;
    }
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + Math.min(expiryDays, 30) * 24 * 60 * 60 * 1000);
    const { rows } = await pool.query(
      `INSERT INTO demo_tokens (token, label, tools, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, token, label, tools, expires_at, created_at, used_count`,
      [token, label.trim(), tools, expiresAt]
    );
    const r = rows[0];
    res.json({
      id: r.id, token: r.token, label: r.label, tools: r.tools,
      expiresAt: r.expires_at, createdAt: r.created_at, usedCount: r.used_count,
    });
  } catch {
    res.status(500).json({ error: "Failed to create demo token" });
  }
});

demoRouter.delete("/admin/demo/tokens/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    await pool.query("DELETE FROM demo_tokens WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete demo token" });
  }
});

demoRouter.post("/demo/session", async (req: Request, res: Response) => {
  try {
    const { token } = req.body as { token: string };
    if (!token) { res.status(400).json({ error: "Token required" }); return; }
    const { rows } = await pool.query(
      "SELECT id, label, tools, expires_at FROM demo_tokens WHERE token = $1",
      [token]
    );
    if (!rows.length) { res.status(404).json({ error: "Invalid demo link" }); return; }
    const row = rows[0];
    if (new Date(row.expires_at) < new Date()) {
      res.status(410).json({ error: "This demo link has expired" });
      return;
    }
    await pool.query(
      "UPDATE demo_tokens SET used_count = used_count + 1, last_used_at = NOW() WHERE id = $1",
      [row.id]
    );
    const sessionJwt = signDemoToken(row.tools, row.label);
    res.json({ sessionJwt, tools: row.tools, label: row.label, expiresAt: row.expires_at });
  } catch {
    res.status(500).json({ error: "Failed to start demo session" });
  }
});

demoRouter.post("/demo/validate", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) { res.status(401).json({ error: "No token" }); return; }
  const payload = verifyDemoToken(token);
  if (!payload) { res.status(401).json({ error: "Invalid or expired demo session" }); return; }
  res.json({ ok: true, tools: payload.tools, label: payload.label });
});
