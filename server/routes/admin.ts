import { Router, Request, Response } from "express";
import { signToken, requireAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { getPackages, savePackages, getTools, saveTools, getRetainerClients, saveRetainerClients, getDiscoveryInquiries, getTestimonials, saveTestimonials, getCaseStudies, saveCaseStudies, getOutcomeStats, saveOutcomeStats, getEmailLeads, getMetrics, getPipelineContacts, addPipelineContact, updatePipelineContact, deletePipelineContact, getInvoices, saveInvoices } from "../data/store.js";
import type { ServicePackage, ClientTool, RetainerClient, Testimonial, CaseStudy, OutcomeStat, PipelineContact, PipelineStage, ContactSource, Invoice, InvoiceStatus } from "../data/store.js";
import { getKASessions } from "../data/sessions-store.js";
import { getPWSessions } from "../data/sessions-store.js";

export const adminRouter = Router();

adminRouter.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body;

  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!adminUser || !adminPass) {
    res.status(500).json({ error: "Admin credentials not configured" });
    return;
  }

  if (username !== adminUser || password !== adminPass) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const token = signToken(username);
  res.json({ ok: true, token });
});

adminRouter.post("/logout", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

adminRouter.get("/me", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ username: req.adminUser });
});

adminRouter.get("/packages", requireAuth, (_req: Request, res: Response) => {
  res.json(getPackages());
});

function validatePackage(pkg: unknown): pkg is ServicePackage {
  if (typeof pkg !== "object" || pkg === null) return false;
  const p = pkg as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.tagline === "string" &&
    typeof p.priceLow === "number" &&
    typeof p.priceHigh === "number" &&
    typeof p.duration === "string" &&
    typeof p.type === "string" &&
    Array.isArray(p.features) &&
    p.features.every((f: unknown) => typeof f === "string") &&
    typeof p.ideal === "string" &&
    typeof p.highlighted === "boolean"
  );
}

function validateTool(tool: unknown): tool is ClientTool {
  if (typeof tool !== "object" || tool === null) return false;
  const t = tool as Record<string, unknown>;
  return (
    typeof t.name === "string" &&
    typeof t.slug === "string" &&
    typeof t.enabled === "boolean" &&
    (t.onboardingCopy === undefined || typeof t.onboardingCopy === "string")
  );
}

adminRouter.put("/packages", requireAuth, (req: Request, res: Response) => {
  const packages = req.body;
  if (!Array.isArray(packages)) {
    res.status(400).json({ error: "Expected an array of packages" });
    return;
  }
  if (!packages.every(validatePackage)) {
    res.status(400).json({ error: "Invalid package data: each package must have id, name, tagline, priceLow, priceHigh, duration, type, features, ideal, and highlighted" });
    return;
  }
  savePackages(packages);
  res.json({ ok: true });
});

adminRouter.get("/tools", requireAuth, (_req: Request, res: Response) => {
  res.json(getTools());
});

adminRouter.put("/tools", requireAuth, (req: Request, res: Response) => {
  const tools = req.body;
  if (!Array.isArray(tools)) {
    res.status(400).json({ error: "Expected an array of tools" });
    return;
  }
  if (!tools.every(validateTool)) {
    res.status(400).json({ error: "Invalid tool data: each tool must have name, slug, enabled, and optionally onboardingCopy" });
    return;
  }
  saveTools(tools);
  res.json({ ok: true });
});

adminRouter.get("/retainers", requireAuth, (_req: Request, res: Response) => {
  res.json(getRetainerClients());
});

adminRouter.post("/retainers", requireAuth, (req: Request, res: Response) => {
  const { name, startDate, monthlyRate, notes } = req.body;
  if (!name || !startDate || typeof monthlyRate !== "number") {
    res.status(400).json({ error: "name, startDate, and monthlyRate are required" });
    return;
  }
  const clients = getRetainerClients();
  const newClient: RetainerClient = {
    id: `ret-${Date.now()}`,
    name,
    startDate,
    monthlyRate,
    notes: notes || "",
    healthChecks: [],
    supportSessions: [],
    priorityRequests: [],
  };
  clients.push(newClient);
  saveRetainerClients(clients);
  res.json(newClient);
});

adminRouter.put("/retainers/:id", requireAuth, (req: Request, res: Response) => {
  const clients = getRetainerClients();
  const idx = clients.findIndex((c) => c.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  const { name, startDate, monthlyRate, notes } = req.body;
  if (name !== undefined) clients[idx].name = name;
  if (startDate !== undefined) clients[idx].startDate = startDate;
  if (monthlyRate !== undefined) clients[idx].monthlyRate = monthlyRate;
  if (notes !== undefined) clients[idx].notes = notes;
  saveRetainerClients(clients);
  res.json(clients[idx]);
});

adminRouter.delete("/retainers/:id", requireAuth, (req: Request, res: Response) => {
  const clients = getRetainerClients();
  const idx = clients.findIndex((c) => c.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  clients.splice(idx, 1);
  saveRetainerClients(clients);
  res.json({ ok: true });
});

adminRouter.post("/retainers/:id/health-checks", requireAuth, (req: Request, res: Response) => {
  const clients = getRetainerClients();
  const client = clients.find((c) => c.id === req.params.id);
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  const { date, notes, recommendations } = req.body;
  if (!date || !notes) {
    res.status(400).json({ error: "date and notes are required" });
    return;
  }
  const entry = { id: `hc-${Date.now()}`, date, notes, recommendations: recommendations || "" };
  client.healthChecks.push(entry);
  saveRetainerClients(clients);
  res.json(entry);
});

adminRouter.post("/retainers/:id/support-sessions", requireAuth, (req: Request, res: Response) => {
  const clients = getRetainerClients();
  const client = clients.find((c) => c.id === req.params.id);
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  const { date, description } = req.body;
  if (!date || !description) {
    res.status(400).json({ error: "date and description are required" });
    return;
  }
  const entry = { id: `ss-${Date.now()}`, date, description };
  client.supportSessions.push(entry);
  saveRetainerClients(clients);
  res.json(entry);
});

adminRouter.post("/retainers/:id/priority-requests", requireAuth, (req: Request, res: Response) => {
  const clients = getRetainerClients();
  const client = clients.find((c) => c.id === req.params.id);
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  const { title, description } = req.body;
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const entry = { id: `pr-${Date.now()}`, title, description: description || "", createdAt: new Date().toISOString(), completed: false };
  client.priorityRequests.push(entry);
  saveRetainerClients(clients);
  res.json(entry);
});

adminRouter.put("/retainers/:id/priority-requests/:requestId", requireAuth, (req: Request, res: Response) => {
  const clients = getRetainerClients();
  const client = clients.find((c) => c.id === req.params.id);
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  const request = client.priorityRequests.find((r) => r.id === req.params.requestId);
  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  if (req.body.completed !== undefined) request.completed = req.body.completed;
  if (req.body.title !== undefined) request.title = req.body.title;
  if (req.body.description !== undefined) request.description = req.body.description;
  saveRetainerClients(clients);
  res.json(request);
});

adminRouter.get("/discovery-inquiries", requireAuth, (_req: Request, res: Response) => {
  res.json(getDiscoveryInquiries());
});

adminRouter.get("/sessions", requireAuth, (_req: Request, res: Response) => {
  try {
    const kaSessions = getKASessions().map((s) => ({
      id: s.id,
      tool: "KA Sprint" as const,
      clientName: s.clientName,
      name: s.domain ? s.domain.substring(0, 80) : "Untitled",
      step: s.step,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
    const pwSessions = getPWSessions().map((s) => ({
      id: s.id,
      tool: "Prompt Workshop" as const,
      clientName: s.clientName,
      name: s.sessionName,
      version: s.version,
      promptCount: s.prompts.length,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
    const all = [...kaSessions, ...pwSessions].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    res.json(all);
  } catch (error: unknown) {
    console.error("Admin sessions list error:", error);
    res.status(500).json({ error: "Failed to load sessions" });
  }
});

adminRouter.get("/testimonials", requireAuth, (_req: Request, res: Response) => {
  res.json(getTestimonials());
});

adminRouter.put("/testimonials", requireAuth, (req: Request, res: Response) => {
  const items = req.body;
  if (!Array.isArray(items)) {
    res.status(400).json({ error: "Expected an array of testimonials" });
    return;
  }
  for (const item of items) {
    if (
      typeof item.id !== "string" ||
      typeof item.name !== "string" ||
      typeof item.role !== "string" ||
      typeof item.company !== "string" ||
      typeof item.quote !== "string"
    ) {
      res.status(400).json({ error: "Each testimonial must have id, name, role, company, and quote" });
      return;
    }
  }
  saveTestimonials(items);
  res.json({ ok: true });
});

adminRouter.get("/case-studies", requireAuth, (_req: Request, res: Response) => {
  res.json(getCaseStudies());
});

adminRouter.put("/case-studies", requireAuth, (req: Request, res: Response) => {
  const items = req.body;
  if (!Array.isArray(items)) {
    res.status(400).json({ error: "Expected an array of case studies" });
    return;
  }
  for (const item of items) {
    if (
      typeof item.id !== "string" ||
      typeof item.title !== "string" ||
      typeof item.industry !== "string" ||
      typeof item.challenge !== "string" ||
      typeof item.outcome !== "string"
    ) {
      res.status(400).json({ error: "Each case study must have id, title, industry, challenge, and outcome" });
      return;
    }
  }
  saveCaseStudies(items);
  res.json({ ok: true });
});

adminRouter.get("/outcome-stats", requireAuth, (_req: Request, res: Response) => {
  res.json(getOutcomeStats());
});

adminRouter.put("/outcome-stats", requireAuth, (req: Request, res: Response) => {
  const items = req.body;
  if (!Array.isArray(items)) {
    res.status(400).json({ error: "Expected an array of stats" });
    return;
  }
  for (const item of items) {
    if (
      typeof item.id !== "string" ||
      typeof item.label !== "string" ||
      typeof item.value !== "string"
    ) {
      res.status(400).json({ error: "Each stat must have id, label, and value" });
      return;
    }
  }
  saveOutcomeStats(items);
  res.json({ ok: true });
});

adminRouter.get("/leads", requireAuth, (_req: Request, res: Response) => {
  res.json(getEmailLeads());
});

adminRouter.get("/leads/export", requireAuth, (_req: Request, res: Response) => {
  const leads = getEmailLeads();
  const header = "ID,Email,First Name,Tool Source,Document Type,Captured At";
  const rows = leads.map((l) => {
    const escape = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
    return [escape(l.id), escape(l.email), escape(l.firstName), escape(l.toolSource), escape(l.documentType || ""), escape(l.capturedAt)].join(",");
  });
  const csv = [header, ...rows].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=email-leads.csv");
  res.send(csv);
});

adminRouter.get("/metrics", requireAuth, (_req: Request, res: Response) => {
  try {
    res.json(getMetrics());
  } catch (error: unknown) {
    console.error("Metrics error:", error);
    res.status(500).json({ error: "Failed to load metrics" });
  }
});

const VALID_STAGES: PipelineStage[] = ["New Lead", "Contacted", "Proposal Sent", "Active Client", "Closed"];
const VALID_SOURCES: ContactSource[] = ["discovery_call", "tool_email_capture", "manual"];

adminRouter.get("/pipeline", requireAuth, (_req: Request, res: Response) => {
  res.json(getPipelineContacts());
});

adminRouter.post("/pipeline", requireAuth, (req: Request, res: Response) => {
  const { name, email, company, source, serviceInterest, stage, nextAction, notes, estimatedValue } = req.body;
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const contactSource: ContactSource = VALID_SOURCES.includes(source) ? source : "manual";
  const contactStage: PipelineStage = VALID_STAGES.includes(stage) ? stage : "New Lead";
  const contact: PipelineContact = {
    id: `contact-${Date.now()}`,
    name: String(name).slice(0, 200),
    email: String(email).slice(0, 200),
    company: String(company || "").slice(0, 200),
    source: contactSource,
    serviceInterest: String(serviceInterest || "").slice(0, 200),
    stage: contactStage,
    lastTouchDate: new Date().toISOString(),
    nextAction: String(nextAction || "").slice(0, 500),
    notes: String(notes || "").slice(0, 2000),
    estimatedValue: typeof estimatedValue === "number" && Number.isFinite(estimatedValue) ? estimatedValue : 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  addPipelineContact(contact);
  res.json(contact);
});

adminRouter.put("/pipeline/:id", requireAuth, (req: Request, res: Response) => {
  const updates: Partial<PipelineContact> = {};
  const { name, email, company, source, serviceInterest, stage, lastTouchDate, nextAction, notes, estimatedValue } = req.body;
  if (name !== undefined) updates.name = String(name).slice(0, 200);
  if (email !== undefined) updates.email = String(email).slice(0, 200);
  if (company !== undefined) updates.company = String(company).slice(0, 200);
  if (source !== undefined && VALID_SOURCES.includes(source)) updates.source = source;
  if (serviceInterest !== undefined) updates.serviceInterest = String(serviceInterest).slice(0, 200);
  if (stage !== undefined && VALID_STAGES.includes(stage)) updates.stage = stage;
  if (lastTouchDate !== undefined) updates.lastTouchDate = lastTouchDate;
  if (nextAction !== undefined) updates.nextAction = String(nextAction).slice(0, 500);
  if (notes !== undefined) updates.notes = String(notes).slice(0, 2000);
  if (estimatedValue !== undefined) {
    const val = Number(estimatedValue);
    updates.estimatedValue = Number.isFinite(val) ? val : 0;
  }

  const updated = updatePipelineContact(req.params.id, updates);
  if (!updated) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }
  res.json(updated);
});

adminRouter.delete("/pipeline/:id", requireAuth, (req: Request, res: Response) => {
  if (!deletePipelineContact(req.params.id)) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }
  res.json({ ok: true });
});

const VALID_INVOICE_STATUSES: InvoiceStatus[] = ["Draft", "Sent", "Paid", "Overdue"];

adminRouter.get("/invoices", requireAuth, (_req: Request, res: Response) => {
  res.json(getInvoices());
});

adminRouter.get("/invoices/contacts", requireAuth, (_req: Request, res: Response) => {
  const inquiries = getDiscoveryInquiries();
  const retainers = getRetainerClients();
  const leads = getEmailLeads();
  const pipeline = getPipelineContacts();

  const contactMap = new Map<string, { id: string; name: string; source: string }>();

  for (const inq of inquiries) {
    const key = inq.name.toLowerCase().trim();
    if (!contactMap.has(key)) {
      contactMap.set(key, { id: inq.id, name: inq.name, source: "inquiry" });
    }
  }

  for (const ret of retainers) {
    const key = ret.name.toLowerCase().trim();
    if (!contactMap.has(key)) {
      contactMap.set(key, { id: ret.id, name: ret.name, source: "retainer" });
    }
  }

  for (const lead of leads) {
    const name = lead.firstName || lead.email;
    const key = name.toLowerCase().trim();
    if (!contactMap.has(key)) {
      contactMap.set(key, { id: lead.id, name, source: "lead" });
    }
  }

  for (const contact of pipeline) {
    const key = contact.name.toLowerCase().trim();
    if (!contactMap.has(key)) {
      contactMap.set(key, { id: contact.id, name: contact.name, source: "pipeline" });
    }
  }

  res.json(Array.from(contactMap.values()));
});

adminRouter.post("/invoices", requireAuth, (req: Request, res: Response) => {
  const { clientName, contactId, description, amount, currency, invoiceDate, dueDate, status } = req.body;
  if (!clientName || !description || typeof amount !== "number" || !invoiceDate || !dueDate) {
    res.status(400).json({ error: "clientName, description, amount, invoiceDate, and dueDate are required" });
    return;
  }
  const invoiceStatus: InvoiceStatus = VALID_INVOICE_STATUSES.includes(status) ? status : "Draft";
  const invoices = getInvoices();
  const newInvoice: Invoice = {
    id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    clientName,
    contactId: contactId || undefined,
    description,
    amount,
    currency: currency || "USD",
    invoiceDate,
    dueDate,
    status: invoiceStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  invoices.unshift(newInvoice);
  saveInvoices(invoices);
  res.json(newInvoice);
});

adminRouter.put("/invoices/:id", requireAuth, (req: Request, res: Response) => {
  const invoices = getInvoices();
  const idx = invoices.findIndex((inv) => inv.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  const { clientName, contactId, description, amount, currency, invoiceDate, dueDate, status } = req.body;
  if (clientName !== undefined) invoices[idx].clientName = clientName;
  if (contactId !== undefined) invoices[idx].contactId = contactId || undefined;
  if (description !== undefined) invoices[idx].description = description;
  if (amount !== undefined) invoices[idx].amount = amount;
  if (currency !== undefined) invoices[idx].currency = currency;
  if (invoiceDate !== undefined) invoices[idx].invoiceDate = invoiceDate;
  if (dueDate !== undefined) invoices[idx].dueDate = dueDate;
  if (status !== undefined && VALID_INVOICE_STATUSES.includes(status)) {
    invoices[idx].status = status;
  }
  invoices[idx].updatedAt = new Date().toISOString();
  saveInvoices(invoices);
  res.json(invoices[idx]);
});

adminRouter.delete("/invoices/:id", requireAuth, (req: Request, res: Response) => {
  const invoices = getInvoices();
  const idx = invoices.findIndex((inv) => inv.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  invoices.splice(idx, 1);
  saveInvoices(invoices);
  res.json({ ok: true });
});

adminRouter.patch("/invoices/:id/status", requireAuth, (req: Request, res: Response) => {
  const { status } = req.body;
  if (!VALID_INVOICE_STATUSES.includes(status)) {
    res.status(400).json({ error: "Invalid status. Must be one of: Draft, Sent, Paid, Overdue" });
    return;
  }
  const invoices = getInvoices();
  const idx = invoices.findIndex((inv) => inv.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  invoices[idx].status = status;
  invoices[idx].updatedAt = new Date().toISOString();
  saveInvoices(invoices);
  res.json(invoices[idx]);
});
