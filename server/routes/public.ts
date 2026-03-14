import { Router, Request, Response } from "express";
import { getPackages, getTools, saveDiscoveryInquiry, getTestimonials, getCaseStudies, getOutcomeStats, saveEmailLead, addPipelineContact } from "../data/store.js";
import type { DiscoveryInquiry, EmailLead, PipelineContact } from "../data/store.js";

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

  const pipelineContact: PipelineContact = {
    id: `contact-${Date.now()}`,
    name: inquiry.name,
    email: "",
    company: inquiry.company,
    source: "discovery_call",
    serviceInterest: "",
    stage: "New Lead",
    lastTouchDate: inquiry.createdAt,
    nextAction: "Review discovery inquiry",
    notes: `Discovery call inquiry:\nChallenge: ${inquiry.challenge}\nTimeline: ${inquiry.timeline}`,
    estimatedValue: 0,
    createdAt: inquiry.createdAt,
    updatedAt: inquiry.createdAt,
  };
  addPipelineContact(pipelineContact);

  res.json({ ok: true, id: inquiry.id });
});

publicRouter.get("/testimonials", (_req: Request, res: Response) => {
  res.json(getTestimonials());
});

publicRouter.get("/case-studies", (_req: Request, res: Response) => {
  res.json(getCaseStudies());
});

publicRouter.get("/outcome-stats", (_req: Request, res: Response) => {
  res.json(getOutcomeStats());
});

publicRouter.post("/capture-email", (req: Request, res: Response) => {
  const { email, firstName, toolSource, documentType } = req.body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }
  if (!firstName || typeof firstName !== "string") {
    res.status(400).json({ error: "First name is required" });
    return;
  }
  if (!toolSource || typeof toolSource !== "string") {
    res.status(400).json({ error: "Tool source is required" });
    return;
  }

  const lead: EmailLead = {
    id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: email.trim(),
    firstName: firstName.trim(),
    toolSource,
    documentType: documentType || undefined,
    capturedAt: new Date().toISOString(),
  };

  saveEmailLead(lead);
  res.json({ ok: true });
});
