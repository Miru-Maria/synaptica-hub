import { Router, Request, Response } from "express";
import { getPackages, getTools, saveDiscoveryInquiry, getTestimonials, getCaseStudies, getOutcomeStats, saveEmailLead, addPipelineContact, addNotification, getAdminSettings } from "../data/store.js";
import type { DiscoveryInquiry, EmailLead, PipelineContact } from "../data/store.js";
import { sendInquiryNotification } from "../services/email.js";

export const publicRouter = Router();

publicRouter.get("/packages", async (_req: Request, res: Response) => {
  try {
    res.json(await getPackages());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load packages" });
  }
});

publicRouter.get("/tools", async (_req: Request, res: Response) => {
  try {
    res.json(await getTools());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load tools" });
  }
});

publicRouter.post("/discovery", async (req: Request, res: Response) => {
  const { name, company, challenge, timeline } = req.body;
  if (!name || !company || !challenge || !timeline) {
    res.status(400).json({ error: "name, company, challenge, and timeline are required" });
    return;
  }
  const inquiry: DiscoveryInquiry = {
    id: `inq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: String(name).slice(0, 200),
    company: String(company).slice(0, 200),
    challenge: String(challenge).slice(0, 5000),
    timeline: String(timeline).slice(0, 200),
    createdAt: new Date().toISOString(),
  };
  try {
    await saveDiscoveryInquiry(inquiry);
    const contact: PipelineContact = {
      id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: inquiry.name,
      email: "",
      company: inquiry.company,
      source: "discovery_call",
      serviceInterest: inquiry.challenge.slice(0, 200),
      stage: "New Lead",
      lastTouchDate: inquiry.createdAt,
      nextAction: "Follow up within 48 hours",
      notes: `Timeline: ${inquiry.timeline}\n\nChallenge: ${inquiry.challenge}`,
      estimatedValue: 0,
      createdAt: inquiry.createdAt,
      updatedAt: inquiry.createdAt,
    };
    await addPipelineContact(contact);
    await addNotification(
      "discovery_call",
      "New Discovery Inquiry",
      `${inquiry.name} from ${inquiry.company} submitted a discovery inquiry.`,
      "/admin?tab=inquiries"
    );
    const settings = await getAdminSettings();
    if (settings.emailNotificationsEnabled && settings.adminEmail) {
      sendInquiryNotification({
        toEmail: settings.adminEmail,
        name: inquiry.name,
        company: inquiry.company,
        challenge: inquiry.challenge,
        timeline: inquiry.timeline,
      }).catch((err) => console.error("[email] Notification failed (non-blocking):", err));
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit inquiry" });
  }
});

publicRouter.get("/testimonials", async (_req: Request, res: Response) => {
  try {
    res.json(await getTestimonials());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load testimonials" });
  }
});

publicRouter.get("/case-studies", async (_req: Request, res: Response) => {
  try {
    res.json(await getCaseStudies());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load case studies" });
  }
});

publicRouter.get("/outcome-stats", async (_req: Request, res: Response) => {
  try {
    res.json(await getOutcomeStats());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load outcome stats" });
  }
});

publicRouter.post("/capture-email", async (req: Request, res: Response) => {
  const { email, firstName, toolSource, documentType } = req.body;
  const emailStr = typeof email === "string" ? email.trim() : "";
  const firstNameStr = typeof firstName === "string" ? firstName.trim() : "";
  const toolSourceStr = typeof toolSource === "string" ? toolSource.trim() : "";
  if (!emailStr || !firstNameStr || !toolSourceStr) {
    res.status(400).json({ error: "email, firstName, and toolSource are required" });
    return;
  }
  const lead: EmailLead = {
    id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    email: emailStr.slice(0, 200),
    firstName: firstNameStr.slice(0, 200),
    toolSource: toolSourceStr.slice(0, 100),
    documentType: documentType ? String(documentType).trim().slice(0, 100) : undefined,
    capturedAt: new Date().toISOString(),
  };
  try {
    await saveEmailLead(lead);
    await addNotification(
      "email_capture",
      "New Email Capture",
      `${lead.firstName} (${lead.email}) captured from ${lead.toolSource}.`,
      "/admin?tab=leads"
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to capture email" });
  }
});

publicRouter.get("/booking-url", async (_req: Request, res: Response) => {
  try {
    const settings = await getAdminSettings();
    res.json({ calendlyUrl: settings.calendlyUrl || null });
  } catch (err) {
    console.error(err);
    res.json({ calendlyUrl: null });
  }
});
