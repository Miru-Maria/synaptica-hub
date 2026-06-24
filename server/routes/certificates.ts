import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { pool } from "../data/db.js";
import { sendProcessingCertificate } from "../services/email.js";

export const certificatesRouter = Router();

const DEFAULT_SERVICES =
  "Documentation analysis and knowledge architecture consulting services, including: AI-assisted documentation gap analysis, knowledge base ingestion and semantic search, prompt engineering, retrieval-augmented generation (RAG) pipeline design, document intelligence and comparison, and related AI-powered content processing — conducted on behalf of the client using OpenAI API infrastructure.";

function generateRef(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `SKS-DPC-${year}${month}-${rand}`;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

async function initCertTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dpc_requests (
      id VARCHAR(100) PRIMARY KEY,
      cert_ref VARCHAR(100) UNIQUE NOT NULL,
      client_name TEXT NOT NULL,
      client_company TEXT NOT NULL DEFAULT '',
      client_email TEXT NOT NULL,
      services TEXT NOT NULL,
      issued_at TEXT NOT NULL,
      issued_by TEXT NOT NULL DEFAULT 'client',
      status TEXT NOT NULL DEFAULT 'sent'
    )
  `);
}

initCertTable().catch(console.error);

certificatesRouter.post("/public/request", async (req: Request, res: Response) => {
  const { clientName, clientCompany, clientEmail } = req.body;
  if (!clientName || !clientEmail) {
    res.status(400).json({ error: "Name and email are required." });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clientEmail)) {
    res.status(400).json({ error: "Invalid email address." });
    return;
  }

  const certRef = generateRef();
  const issuedAt = new Date().toISOString();
  const issuedDateFormatted = formatDate(issuedAt);

  try {
    await pool.query(
      `INSERT INTO dpc_requests (id, cert_ref, client_name, client_company, client_email, services, issued_at, issued_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'client','sent')`,
      [
        `dpc-${Date.now()}`,
        certRef,
        clientName.trim(),
        (clientCompany || "").trim(),
        clientEmail.trim().toLowerCase(),
        DEFAULT_SERVICES,
        issuedAt,
      ]
    );

    await sendProcessingCertificate({
      toEmail: clientEmail.trim(),
      clientName: clientName.trim(),
      clientCompany: (clientCompany || "").trim(),
      certRef,
      issuedDate: issuedDateFormatted,
      services: DEFAULT_SERVICES,
    });

    res.json({ ok: true, certRef });
  } catch (err) {
    console.error("Certificate send error:", err);
    res.status(500).json({ error: "Failed to issue certificate. Please try again." });
  }
});

certificatesRouter.post("/admin/issue", requireAuth, async (req: Request, res: Response) => {
  const { clientName, clientCompany, clientEmail, services } = req.body;
  if (!clientName || !clientEmail) {
    res.status(400).json({ error: "Name and email are required." });
    return;
  }

  const certRef = generateRef();
  const issuedAt = new Date().toISOString();
  const issuedDateFormatted = formatDate(issuedAt);
  const serviceText = (services || "").trim() || DEFAULT_SERVICES;

  try {
    await pool.query(
      `INSERT INTO dpc_requests (id, cert_ref, client_name, client_company, client_email, services, issued_at, issued_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'admin','sent')`,
      [
        `dpc-${Date.now()}`,
        certRef,
        clientName.trim(),
        (clientCompany || "").trim(),
        clientEmail.trim().toLowerCase(),
        serviceText,
        issuedAt,
      ]
    );

    await sendProcessingCertificate({
      toEmail: clientEmail.trim(),
      clientName: clientName.trim(),
      clientCompany: (clientCompany || "").trim(),
      certRef,
      issuedDate: issuedDateFormatted,
      services: serviceText,
    });

    res.json({ ok: true, certRef });
  } catch (err) {
    console.error("Admin certificate issue error:", err);
    res.status(500).json({ error: "Failed to issue certificate. Please try again." });
  }
});

certificatesRouter.get("/admin/list", requireAuth, async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM dpc_requests ORDER BY issued_at DESC LIMIT 200"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load certificates." });
  }
});
