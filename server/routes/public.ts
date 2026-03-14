import { Router, Request, Response } from "express";
import { getPackages, getTools, saveDiscoveryInquiry } from "../data/store.js";
import type { DiscoveryInquiry } from "../data/store.js";

export const publicRouter = Router();

publicRouter.get("/packages", (_req: Request, res: Response) => {
  res.json(getPackages());
});

publicRouter.get("/tools", (_req: Request, res: Response) => {
  res.json(getTools());
});

publicRouter.post("/discovery", (req: Request, res: Response) => {
  const { name, company, challenge, timeline } = req.body;
  if (!name || !company || !challenge || !timeline) {
    res.status(400).json({ error: "name, company, challenge, and timeline are required" });
    return;
  }
  const inquiry: DiscoveryInquiry = {
    id: `inq-${Date.now()}`,
    name: String(name).slice(0, 200),
    company: String(company).slice(0, 200),
    challenge: String(challenge).slice(0, 2000),
    timeline: String(timeline).slice(0, 200),
    createdAt: new Date().toISOString(),
  };
  saveDiscoveryInquiry(inquiry);
  res.json({ ok: true, id: inquiry.id });
});
