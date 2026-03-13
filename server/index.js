import express from "express";
import cors from "cors";
import pg from "pg";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || (isProduction ? "5000" : "3001"));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const app = express();
app.use(express.json());
app.use(cors());

app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "Required fields missing" });
  }

  try {
    await pool.query(
      `INSERT INTO contact_submissions (name, email, subject, message)
       VALUES ($1, $2, $3, $4)`,
      [name, email, subject || null, message]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("DB insert error:", err?.message || err);
    res.status(500).json({ success: false, message: "Could not save submission" });
  }
});

const ADMIN_KEY = process.env.ADMIN_KEY;

app.get("/api/admin/submissions", async (req, res) => {
  if (!ADMIN_KEY || req.headers["x-admin-key"] !== ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const result = await pool.query(
      `SELECT id, name, email, subject, message, created_at, read
       FROM contact_submissions ORDER BY created_at DESC`
    );
    res.json({ submissions: result.rows });
  } catch (err) {
    console.error("DB query error:", err?.message || err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

app.patch("/api/admin/submissions/:id/read", async (req, res) => {
  if (!ADMIN_KEY || req.headers["x-admin-key"] !== ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    await pool.query(`UPDATE contact_submissions SET read = TRUE WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update" });
  }
});

if (isProduction) {
  const distPath = join(__dirname, "..", "dist");
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("/*splat", (_req, res) => {
      res.sendFile(join(distPath, "index.html"));
    });
  }
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
