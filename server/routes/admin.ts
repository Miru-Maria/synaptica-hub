import { Router, Request, Response } from "express";
import { signToken, requireAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { getPackages, savePackages, getTools, saveTools, getRetainerClients, saveRetainerClients, getDiscoveryInquiries, getTestimonials, saveTestimonials, getCaseStudies, saveCaseStudies, getOutcomeStats, saveOutcomeStats, getEmailLeads, getMetrics, getPipelineContacts, addPipelineContact, updatePipelineContact, deletePipelineContact, getInvoices, saveInvoices, getNotifications, markNotificationRead, markAllNotificationsRead, getAdminSettings, saveAdminSettings, getToolRuns, getChatSessions, getChatSessionWithMessages, deleteChatSession, getProjects, getProject, createProject, updateProject, deleteProject, getProjectTasks, createProjectTask, updateProjectTask, deleteProjectTask, getProcessingCertificates, getProcessingCertificate } from "../data/store.js";
import type { ServicePackage, ClientTool, RetainerClient, Testimonial, CaseStudy, OutcomeStat, PipelineContact, PipelineStage, ContactSource, Invoice, InvoiceStatus, AdminSettings, ProjectStatus, ProjectTaskStatus, ProjectTaskPriority } from "../data/store.js";
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

adminRouter.get("/packages", requireAuth, async (_req: Request, res: Response) => {
  try {
    res.json(await getPackages());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load packages" });
  }
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

adminRouter.put("/packages", requireAuth, async (req: Request, res: Response) => {
  const packages = req.body;
  if (!Array.isArray(packages)) {
    res.status(400).json({ error: "Expected an array of packages" });
    return;
  }
  if (!packages.every(validatePackage)) {
    res.status(400).json({ error: "Invalid package data: each package must have id, name, tagline, priceLow, priceHigh, duration, type, features, ideal, and highlighted" });
    return;
  }
  try {
    await savePackages(packages);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save packages" });
  }
});

adminRouter.get("/tools", requireAuth, async (_req: Request, res: Response) => {
  try {
    res.json(await getTools());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load tools" });
  }
});

adminRouter.put("/tools", requireAuth, async (req: Request, res: Response) => {
  const tools = req.body;
  if (!Array.isArray(tools)) {
    res.status(400).json({ error: "Expected an array of tools" });
    return;
  }
  if (!tools.every(validateTool)) {
    res.status(400).json({ error: "Invalid tool data: each tool must have name, slug, enabled, and optionally onboardingCopy" });
    return;
  }
  try {
    await saveTools(tools);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save tools" });
  }
});

adminRouter.get("/retainers", requireAuth, async (_req: Request, res: Response) => {
  try {
    res.json(await getRetainerClients());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load retainers" });
  }
});

adminRouter.post("/retainers", requireAuth, async (req: Request, res: Response) => {
  const { name, startDate, monthlyRate, notes } = req.body;
  if (!name || !startDate || typeof monthlyRate !== "number") {
    res.status(400).json({ error: "name, startDate, and monthlyRate are required" });
    return;
  }
  try {
    const clients = await getRetainerClients();
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
    await saveRetainerClients(clients);
    res.json(newClient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create retainer" });
  }
});

adminRouter.put("/retainers/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const clients = await getRetainerClients();
    const idx = clients.findIndex((c) => c.id === req.params.id);
    if (idx === -1) { res.status(404).json({ error: "Client not found" }); return; }
    const { name, startDate, monthlyRate, notes } = req.body;
    if (name !== undefined) clients[idx].name = name;
    if (startDate !== undefined) clients[idx].startDate = startDate;
    if (monthlyRate !== undefined) clients[idx].monthlyRate = monthlyRate;
    if (notes !== undefined) clients[idx].notes = notes;
    await saveRetainerClients(clients);
    res.json(clients[idx]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update retainer" });
  }
});

adminRouter.delete("/retainers/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const clients = await getRetainerClients();
    const idx = clients.findIndex((c) => c.id === req.params.id);
    if (idx === -1) { res.status(404).json({ error: "Client not found" }); return; }
    clients.splice(idx, 1);
    await saveRetainerClients(clients);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete retainer" });
  }
});

adminRouter.post("/retainers/:id/health-checks", requireAuth, async (req: Request, res: Response) => {
  try {
    const clients = await getRetainerClients();
    const client = clients.find((c) => c.id === req.params.id);
    if (!client) { res.status(404).json({ error: "Client not found" }); return; }
    const { date, notes, recommendations } = req.body;
    if (!date || !notes) { res.status(400).json({ error: "date and notes are required" }); return; }
    const entry = { id: `hc-${Date.now()}`, date, notes, recommendations: recommendations || "" };
    client.healthChecks.push(entry);
    await saveRetainerClients(clients);
    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add health check" });
  }
});

adminRouter.post("/retainers/:id/support-sessions", requireAuth, async (req: Request, res: Response) => {
  try {
    const clients = await getRetainerClients();
    const client = clients.find((c) => c.id === req.params.id);
    if (!client) { res.status(404).json({ error: "Client not found" }); return; }
    const { date, description } = req.body;
    if (!date || !description) { res.status(400).json({ error: "date and description are required" }); return; }
    const entry = { id: `ss-${Date.now()}`, date, description };
    client.supportSessions.push(entry);
    await saveRetainerClients(clients);
    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add support session" });
  }
});

adminRouter.post("/retainers/:id/priority-requests", requireAuth, async (req: Request, res: Response) => {
  try {
    const clients = await getRetainerClients();
    const client = clients.find((c) => c.id === req.params.id);
    if (!client) { res.status(404).json({ error: "Client not found" }); return; }
    const { title, description } = req.body;
    if (!title) { res.status(400).json({ error: "title is required" }); return; }
    const entry = { id: `pr-${Date.now()}`, title, description: description || "", createdAt: new Date().toISOString(), completed: false };
    client.priorityRequests.push(entry);
    await saveRetainerClients(clients);
    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add priority request" });
  }
});

adminRouter.put("/retainers/:id/priority-requests/:requestId", requireAuth, async (req: Request, res: Response) => {
  try {
    const clients = await getRetainerClients();
    const client = clients.find((c) => c.id === req.params.id);
    if (!client) { res.status(404).json({ error: "Client not found" }); return; }
    const request = client.priorityRequests.find((r) => r.id === req.params.requestId);
    if (!request) { res.status(404).json({ error: "Request not found" }); return; }
    if (req.body.completed !== undefined) request.completed = req.body.completed;
    if (req.body.title !== undefined) request.title = req.body.title;
    if (req.body.description !== undefined) request.description = req.body.description;
    await saveRetainerClients(clients);
    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update priority request" });
  }
});

adminRouter.get("/discovery-inquiries", requireAuth, async (_req: Request, res: Response) => {
  try {
    res.json(await getDiscoveryInquiries());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load inquiries" });
  }
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

adminRouter.get("/testimonials", requireAuth, async (_req: Request, res: Response) => {
  try {
    res.json(await getTestimonials());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load testimonials" });
  }
});

adminRouter.put("/testimonials", requireAuth, async (req: Request, res: Response) => {
  const items = req.body;
  if (!Array.isArray(items)) { res.status(400).json({ error: "Expected an array of testimonials" }); return; }
  for (const item of items) {
    if (typeof item.id !== "string" || typeof item.name !== "string" || typeof item.role !== "string" || typeof item.company !== "string" || typeof item.quote !== "string") {
      res.status(400).json({ error: "Each testimonial must have id, name, role, company, and quote" });
      return;
    }
  }
  try {
    await saveTestimonials(items);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save testimonials" });
  }
});

adminRouter.get("/case-studies", requireAuth, async (_req: Request, res: Response) => {
  try {
    res.json(await getCaseStudies());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load case studies" });
  }
});

adminRouter.put("/case-studies", requireAuth, async (req: Request, res: Response) => {
  const items = req.body;
  if (!Array.isArray(items)) { res.status(400).json({ error: "Expected an array of case studies" }); return; }
  for (const item of items) {
    if (typeof item.id !== "string" || typeof item.title !== "string" || typeof item.industry !== "string" || typeof item.challenge !== "string" || typeof item.outcome !== "string") {
      res.status(400).json({ error: "Each case study must have id, title, industry, challenge, and outcome" });
      return;
    }
  }
  try {
    await saveCaseStudies(items);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save case studies" });
  }
});

adminRouter.get("/outcome-stats", requireAuth, async (_req: Request, res: Response) => {
  try {
    res.json(await getOutcomeStats());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load outcome stats" });
  }
});

adminRouter.put("/outcome-stats", requireAuth, async (req: Request, res: Response) => {
  const items = req.body;
  if (!Array.isArray(items)) { res.status(400).json({ error: "Expected an array of stats" }); return; }
  for (const item of items) {
    if (typeof item.id !== "string" || typeof item.label !== "string" || typeof item.value !== "string") {
      res.status(400).json({ error: "Each stat must have id, label, and value" });
      return;
    }
  }
  try {
    await saveOutcomeStats(items);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save outcome stats" });
  }
});

adminRouter.get("/leads", requireAuth, async (_req: Request, res: Response) => {
  try {
    res.json(await getEmailLeads());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load leads" });
  }
});

adminRouter.get("/leads/export", requireAuth, async (_req: Request, res: Response) => {
  try {
    const leads = await getEmailLeads();
    const header = "ID,Email,First Name,Tool Source,Document Type,Captured At";
    const rows = leads.map((l) => {
      const escape = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
      return [escape(l.id), escape(l.email), escape(l.firstName), escape(l.toolSource), escape(l.documentType || ""), escape(l.capturedAt)].join(",");
    });
    const csv = [header, ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=email-leads.csv");
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export leads" });
  }
});

adminRouter.get("/metrics", requireAuth, async (_req: Request, res: Response) => {
  try {
    res.json(await getMetrics());
  } catch (error: unknown) {
    console.error("Metrics error:", error);
    res.status(500).json({ error: "Failed to load metrics" });
  }
});

const VALID_STAGES: PipelineStage[] = ["New Lead", "Contacted", "Proposal Sent", "Active Client", "Closed"];
const VALID_SOURCES: ContactSource[] = ["discovery_call", "tool_email_capture", "manual", "ai_chat"];

adminRouter.get("/pipeline", requireAuth, async (_req: Request, res: Response) => {
  try {
    res.json(await getPipelineContacts());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load pipeline" });
  }
});

adminRouter.post("/pipeline", requireAuth, async (req: Request, res: Response) => {
  const { name, email, company, source, serviceInterest, stage, nextAction, notes, estimatedValue } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const contact: PipelineContact = {
    id: `contact-${Date.now()}`,
    name: String(name).slice(0, 200),
    email: String(email || "").slice(0, 200),
    company: String(company || "").slice(0, 200),
    source: VALID_SOURCES.includes(source) ? source : "manual",
    serviceInterest: String(serviceInterest || "").slice(0, 200),
    stage: VALID_STAGES.includes(stage) ? stage : "New Lead",
    lastTouchDate: new Date().toISOString(),
    nextAction: String(nextAction || "").slice(0, 500),
    notes: String(notes || "").slice(0, 2000),
    estimatedValue: typeof estimatedValue === "number" && Number.isFinite(estimatedValue) ? estimatedValue : 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  try {
    await addPipelineContact(contact);
    res.json(contact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create contact" });
  }
});

adminRouter.put("/pipeline/:id", requireAuth, async (req: Request, res: Response) => {
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
  try {
    const updated = await updatePipelineContact(req.params.id, updates);
    if (!updated) { res.status(404).json({ error: "Contact not found" }); return; }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update contact" });
  }
});

adminRouter.delete("/pipeline/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!await deletePipelineContact(req.params.id)) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

const VALID_INVOICE_STATUSES: InvoiceStatus[] = ["Draft", "Sent", "Paid", "Overdue"];

adminRouter.get("/invoices", requireAuth, async (_req: Request, res: Response) => {
  try {
    res.json(await getInvoices());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load invoices" });
  }
});

adminRouter.get("/invoices/contacts", requireAuth, async (_req: Request, res: Response) => {
  try {
    const [inquiries, retainers, leads, pipeline] = await Promise.all([
      getDiscoveryInquiries(),
      getRetainerClients(),
      getEmailLeads(),
      getPipelineContacts(),
    ]);

    const contactMap = new Map<string, { id: string; name: string; source: string }>();
    for (const inq of inquiries) {
      const key = inq.name.toLowerCase().trim();
      if (!contactMap.has(key)) contactMap.set(key, { id: inq.id, name: inq.name, source: "inquiry" });
    }
    for (const ret of retainers) {
      const key = ret.name.toLowerCase().trim();
      if (!contactMap.has(key)) contactMap.set(key, { id: ret.id, name: ret.name, source: "retainer" });
    }
    for (const lead of leads) {
      const name = lead.firstName || lead.email;
      const key = name.toLowerCase().trim();
      if (!contactMap.has(key)) contactMap.set(key, { id: lead.id, name, source: "lead" });
    }
    for (const contact of pipeline) {
      const key = contact.name.toLowerCase().trim();
      if (!contactMap.has(key)) contactMap.set(key, { id: contact.id, name: contact.name, source: "pipeline" });
    }
    res.json(Array.from(contactMap.values()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load contacts" });
  }
});

adminRouter.post("/invoices", requireAuth, async (req: Request, res: Response) => {
  const { clientName, contactId, description, amount, currency, invoiceDate, dueDate, status } = req.body;
  if (!clientName || !description || typeof amount !== "number" || !invoiceDate || !dueDate) {
    res.status(400).json({ error: "clientName, description, amount, invoiceDate, and dueDate are required" });
    return;
  }
  try {
    const invoices = await getInvoices();
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      clientName,
      contactId: contactId || undefined,
      description,
      amount,
      currency: currency || "USD",
      invoiceDate,
      dueDate,
      status: VALID_INVOICE_STATUSES.includes(status) ? status : "Draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    invoices.unshift(newInvoice);
    await saveInvoices(invoices);
    res.json(newInvoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

adminRouter.put("/invoices/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const invoices = await getInvoices();
    const idx = invoices.findIndex((inv) => inv.id === req.params.id);
    if (idx === -1) { res.status(404).json({ error: "Invoice not found" }); return; }
    const { clientName, contactId, description, amount, currency, invoiceDate, dueDate, status } = req.body;
    if (clientName !== undefined) invoices[idx].clientName = clientName;
    if (contactId !== undefined) invoices[idx].contactId = contactId || undefined;
    if (description !== undefined) invoices[idx].description = description;
    if (amount !== undefined) invoices[idx].amount = amount;
    if (currency !== undefined) invoices[idx].currency = currency;
    if (invoiceDate !== undefined) invoices[idx].invoiceDate = invoiceDate;
    if (dueDate !== undefined) invoices[idx].dueDate = dueDate;
    if (status !== undefined && VALID_INVOICE_STATUSES.includes(status)) invoices[idx].status = status;
    invoices[idx].updatedAt = new Date().toISOString();
    await saveInvoices(invoices);
    res.json(invoices[idx]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

adminRouter.delete("/invoices/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const invoices = await getInvoices();
    const idx = invoices.findIndex((inv) => inv.id === req.params.id);
    if (idx === -1) { res.status(404).json({ error: "Invoice not found" }); return; }
    invoices.splice(idx, 1);
    await saveInvoices(invoices);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

adminRouter.patch("/invoices/:id/status", requireAuth, async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!VALID_INVOICE_STATUSES.includes(status)) {
    res.status(400).json({ error: "Invalid status. Must be one of: Draft, Sent, Paid, Overdue" });
    return;
  }
  try {
    const invoices = await getInvoices();
    const idx = invoices.findIndex((inv) => inv.id === req.params.id);
    if (idx === -1) { res.status(404).json({ error: "Invoice not found" }); return; }
    invoices[idx].status = status;
    invoices[idx].updatedAt = new Date().toISOString();
    await saveInvoices(invoices);
    res.json(invoices[idx]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update invoice status" });
  }
});

adminRouter.get("/notifications", requireAuth, async (_req: Request, res: Response) => {
  try {
    res.json(await getNotifications());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

adminRouter.post("/notifications/read-all", requireAuth, async (_req: Request, res: Response) => {
  try {
    await markAllNotificationsRead();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark notifications read" });
  }
});

adminRouter.post("/notifications/:id/read", requireAuth, async (req: Request, res: Response) => {
  try {
    const success = await markNotificationRead(req.params.id);
    if (!success) { res.status(404).json({ error: "Notification not found" }); return; }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark notification read" });
  }
});

adminRouter.get("/settings", requireAuth, async (_req: Request, res: Response) => {
  try {
    res.json(await getAdminSettings());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load settings" });
  }
});

adminRouter.put("/settings", requireAuth, async (req: Request, res: Response) => {
  const { emailNotificationsEnabled, adminEmail, calendlyUrl, chatWidgetEnabled, chatSystemPrompt } = req.body;
  if (typeof emailNotificationsEnabled !== "boolean") {
    res.status(400).json({ error: "emailNotificationsEnabled must be a boolean" });
    return;
  }
  if (typeof adminEmail !== "string") {
    res.status(400).json({ error: "adminEmail must be a string" });
    return;
  }
  const currentSettings = await getAdminSettings();
  const settings: AdminSettings = {
    emailNotificationsEnabled,
    adminEmail,
    calendlyUrl: typeof calendlyUrl === "string" ? calendlyUrl.trim() : undefined,
    chatWidgetEnabled: typeof chatWidgetEnabled === "boolean" ? chatWidgetEnabled : currentSettings.chatWidgetEnabled,
    chatSystemPrompt: typeof chatSystemPrompt === "string" ? chatSystemPrompt : currentSettings.chatSystemPrompt,
  };
  try {
    await saveAdminSettings(settings);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

adminRouter.get("/chat-sessions", requireAuth, async (_req: Request, res: Response) => {
  try {
    const sessions = await getChatSessions();
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load chat sessions" });
  }
});

adminRouter.get("/chat-sessions/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const session = await getChatSessionWithMessages(req.params.id);
    if (!session) {
      res.status(404).json({ error: "Chat session not found" });
      return;
    }
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load chat session" });
  }
});

adminRouter.delete("/chat-sessions/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const deleted = await deleteChatSession(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Chat session not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete chat session" });
  }
});

const VALID_PROJECT_STATUSES: ProjectStatus[] = ["active", "on-hold", "complete"];
const VALID_TASK_STATUSES: ProjectTaskStatus[] = ["todo", "in-progress", "done"];
const VALID_TASK_PRIORITIES: ProjectTaskPriority[] = ["low", "medium", "high"];

adminRouter.get("/projects", requireAuth, async (_req: Request, res: Response) => {
  try {
    res.json(await getProjects());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load projects" });
  }
});

adminRouter.get("/projects/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const project = await getProject(req.params.id);
    if (!project) { res.status(404).json({ error: "Project not found" }); return; }
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load project" });
  }
});

adminRouter.post("/projects", requireAuth, async (req: Request, res: Response) => {
  const { name, description, status, startDate, dueDate } = req.body;
  if (!name || typeof name !== "string") { res.status(400).json({ error: "name is required" }); return; }
  try {
    const project = await createProject({
      name: String(name).slice(0, 200),
      description: String(description || "").slice(0, 2000),
      status: VALID_PROJECT_STATUSES.includes(status) ? status : "active",
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
    });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

adminRouter.put("/projects/:id", requireAuth, async (req: Request, res: Response) => {
  const updates: Record<string, unknown> = {};
  const { name, description, status, startDate, dueDate, archived } = req.body;
  if (name !== undefined) updates.name = String(name).slice(0, 200);
  if (description !== undefined) updates.description = String(description).slice(0, 2000);
  if (status !== undefined && VALID_PROJECT_STATUSES.includes(status)) updates.status = status;
  if (startDate !== undefined) updates.startDate = startDate || undefined;
  if (dueDate !== undefined) updates.dueDate = dueDate || undefined;
  if (archived !== undefined) updates.archived = Boolean(archived);
  try {
    const updated = await updateProject(req.params.id, updates);
    if (!updated) { res.status(404).json({ error: "Project not found" }); return; }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update project" });
  }
});

adminRouter.delete("/projects/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!await deleteProject(req.params.id)) {
      res.status(404).json({ error: "Project not found" }); return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

adminRouter.get("/projects/:id/tasks", requireAuth, async (req: Request, res: Response) => {
  try {
    res.json(await getProjectTasks(req.params.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load tasks" });
  }
});

adminRouter.post("/projects/:id/tasks", requireAuth, async (req: Request, res: Response) => {
  const { title, description, status, owner, priority, dueDate } = req.body;
  if (!title || typeof title !== "string") { res.status(400).json({ error: "title is required" }); return; }
  try {
    const project = await getProject(req.params.id);
    if (!project) { res.status(404).json({ error: "Project not found" }); return; }
    const task = await createProjectTask({
      projectId: req.params.id,
      title: String(title).slice(0, 500),
      description: String(description || "").slice(0, 2000),
      status: VALID_TASK_STATUSES.includes(status) ? status : "todo",
      owner: String(owner || "").slice(0, 200),
      priority: VALID_TASK_PRIORITIES.includes(priority) ? priority : "medium",
      dueDate: dueDate || undefined,
    });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

adminRouter.put("/projects/:projectId/tasks/:taskId", requireAuth, async (req: Request, res: Response) => {
  const updates: Record<string, unknown> = {};
  const { title, description, status, owner, priority, dueDate } = req.body;
  if (title !== undefined) updates.title = String(title).slice(0, 500);
  if (description !== undefined) updates.description = String(description).slice(0, 2000);
  if (status !== undefined && VALID_TASK_STATUSES.includes(status)) updates.status = status;
  if (owner !== undefined) updates.owner = String(owner).slice(0, 200);
  if (priority !== undefined && VALID_TASK_PRIORITIES.includes(priority)) updates.priority = priority;
  if (dueDate !== undefined) updates.dueDate = dueDate || undefined;
  try {
    const updated = await updateProjectTask(req.params.projectId, req.params.taskId, updates);
    if (!updated) { res.status(404).json({ error: "Task not found" }); return; }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

adminRouter.delete("/projects/:projectId/tasks/:taskId", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!await deleteProjectTask(req.params.projectId, req.params.taskId)) {
      res.status(404).json({ error: "Task not found" }); return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

adminRouter.get("/analytics/overview", requireAuth, async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [metrics, toolRuns, pipeline, retainers, leads, inquiries] = await Promise.all([
      getMetrics(),
      getToolRuns(),
      getPipelineContacts(),
      getRetainerClients(),
      getEmailLeads(),
      getDiscoveryInquiries(),
    ]);

    const openStages: string[] = ["New Lead", "Contacted", "Proposal Sent"];
    const openDeals = pipeline.filter((c) => openStages.includes(c.stage));
    const totalPipelineValue = openDeals.reduce((sum, c) => sum + c.estimatedValue, 0);

    const stageDistribution: Record<string, { count: number; value: number }> = {};
    for (const contact of pipeline) {
      if (!stageDistribution[contact.stage]) stageDistribution[contact.stage] = { count: 0, value: 0 };
      stageDistribution[contact.stage].count++;
      stageDistribution[contact.stage].value += contact.estimatedValue;
    }

    const recentLeads = leads.filter((l) => new Date(l.capturedAt) >= thirtyDaysAgo);
    const recentInquiries = inquiries.filter((i) => new Date(i.createdAt) >= thirtyDaysAgo);

    const toolRunsLast30 = toolRuns.filter((r) => new Date(r.timestamp) >= thirtyDaysAgo);
    const toolRunsLast90 = toolRuns.filter((r) => new Date(r.timestamp) >= ninetyDaysAgo);

    const dailyToolRuns: Record<string, number> = {};
    for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
      dailyToolRuns[d.toISOString().slice(0, 10)] = 0;
    }
    for (const run of toolRunsLast30) {
      const day = run.timestamp.slice(0, 10);
      if (dailyToolRuns[day] !== undefined) dailyToolRuns[day]++;
    }

    const toolUsageTrend = Object.entries(dailyToolRuns)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    function getWeekStart(d: Date): string {
      const copy = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      copy.setUTCDate(copy.getUTCDate() - copy.getUTCDay());
      return copy.toISOString().slice(0, 10);
    }

    const weeklyLeads: Record<string, number> = {};
    for (let d = new Date(ninetyDaysAgo); d <= now; d.setDate(d.getDate() + 7)) {
      weeklyLeads[getWeekStart(d)] = 0;
    }
    for (const lead of leads) {
      const leadDate = new Date(lead.capturedAt);
      if (leadDate >= ninetyDaysAgo) {
        const key = getWeekStart(leadDate);
        if (weeklyLeads[key] !== undefined) weeklyLeads[key]++;
        else weeklyLeads[key] = 1;
      }
    }

    const leadTrend = Object.entries(weeklyLeads)
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week));

    res.json({
      toolUsage: {
        totalRuns: metrics.totalRuns,
        last30Days: toolRunsLast30.length,
        last90Days: toolRunsLast90.length,
        totalEmailCaptures: metrics.totalEmails,
        trend: toolUsageTrend,
        breakdown: metrics.tools.map((t) => ({
          name: t.toolName,
          slug: t.toolSlug,
          totalRuns: t.totalRuns,
          last30Days: t.last30DaysRuns,
          emailCaptures: t.emailCaptures,
        })),
      },
      pipeline: {
        totalContacts: pipeline.length,
        totalPipelineValue,
        stageDistribution,
        activeClients: pipeline.filter((c) => c.stage === "Active Client").length,
      },
      retainers: {
        activeCount: retainers.length,
        mrr: retainers.reduce((sum, r) => sum + r.monthlyRate, 0),
      },
      leads: {
        totalLeads: leads.length,
        last30Days: recentLeads.length,
        trend: leadTrend,
      },
      inquiries: {
        total: inquiries.length,
        last30Days: recentInquiries.length,
      },
    });
  } catch (error: unknown) {
    console.error("Analytics overview error:", error);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});

adminRouter.get("/processing-certificates", requireAuth, async (_req: Request, res: Response) => {
  try {
    const certs = await getProcessingCertificates(200);
    res.json(certs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load processing certificates" });
  }
});

adminRouter.get("/processing-certificates/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const cert = await getProcessingCertificate(req.params.id);
    if (!cert) { res.status(404).json({ error: "Certificate not found" }); return; }
    res.json(cert);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load certificate" });
  }
});

adminRouter.get("/paddle-events", requireAuth, async (_req: Request, res: Response) => {
  try {
    const { pool } = await import("../data/db.js");
    const { rows } = await pool.query(
      "SELECT id, event_id, event_type, subscription_id, customer_email, status, created_at FROM paddle_subscription_events ORDER BY created_at DESC LIMIT 100"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load Paddle events" });
  }
});
