import { Router, Request, Response } from "express";
import crypto from "crypto";
import { pool } from "../data/db.js";
import { addNotification } from "../data/store.js";

export const webhookRouter = Router();

function verifyPaddleSignature(rawBody: Buffer, signature: string, secret: string): boolean {
  const parts = signature.split(";");
  const tsPart = parts.find((p) => p.startsWith("ts="));
  const h1Part = parts.find((p) => p.startsWith("h1="));
  if (!tsPart || !h1Part) return false;
  const ts = tsPart.slice(3);
  const h1 = h1Part.slice(3);
  const signed = `${ts}:${rawBody.toString("utf-8")}`;
  const expected = crypto.createHmac("sha256", secret).update(signed, "utf-8").digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(h1, "hex"));
  } catch {
    return false;
  }
}

function safeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

webhookRouter.post("/paddle", async (req: Request, res: Response) => {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook/paddle] PADDLE_WEBHOOK_SECRET is not configured");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  const signature = req.headers["paddle-signature"] as string | undefined;
  if (!signature) {
    res.status(400).json({ error: "Missing Paddle-Signature header" });
    return;
  }

  const rawBody = req.body as Buffer;
  if (!verifyPaddleSignature(rawBody, signature, secret)) {
    console.warn("[webhook/paddle] Signature verification failed");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  let event: { event_id?: string; event_type?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody.toString("utf-8"));
  } catch {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  const { event_id, event_type, data } = event;
  if (!event_type) {
    res.status(400).json({ error: "Missing event_type" });
    return;
  }

  const subData = (data || {}) as Record<string, unknown>;
  const customerEmail = safeString(subData.customer_email || (subData.customer as Record<string, unknown>)?.email);
  const subscriptionId = safeString(subData.id || subData.subscription_id);
  const customerId = safeString((subData.customer as Record<string, unknown>)?.id || subData.customer_id);
  const status = safeString(subData.status);

  const rowId = `paddle-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  try {
    await pool.query(
      `INSERT INTO paddle_subscription_events
         (id, event_id, event_type, subscription_id, customer_id, customer_email, status, raw_event, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (event_id) DO NOTHING`,
      [rowId, event_id || null, event_type, subscriptionId || null, customerId || null, customerEmail || null, status || null, JSON.stringify(event), new Date().toISOString()]
    );
  } catch (err) {
    console.error("[webhook/paddle] Failed to store event:", err);
  }

  try {
    const label = customerEmail || subscriptionId || "unknown";
    switch (event_type) {
      case "subscription.activated":
      case "subscription.created":
        await addNotification(
          "new_subscriber",
          "New Learning OS Subscriber",
          `Subscription activated for ${label}.`,
          "/admin?tab=subscribers"
        );
        break;
      case "subscription.canceled":
        await addNotification(
          "cancellation",
          "Learning OS Subscription Canceled",
          `Subscription canceled for ${label}.`,
          "/admin?tab=subscribers"
        );
        break;
      case "subscription.past_due":
      case "transaction.payment_failed":
        await addNotification(
          "cancellation",
          "Payment Failed",
          `Payment failed for ${label}. Follow-up may be needed.`,
          "/admin?tab=subscribers"
        );
        break;
      case "subscription.updated":
        await addNotification(
          "new_subscriber",
          "Subscription Updated",
          `Subscription updated for ${label} — new status: ${status}.`,
          "/admin?tab=subscribers"
        );
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("[webhook/paddle] Notification error:", err);
  }

  res.json({ ok: true });
});
