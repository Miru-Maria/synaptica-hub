import { Router, Request, Response } from "express";
import { signToken, requireAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { getPackages, savePackages, getTools, saveTools, getRetainerClients, saveRetainerClients } from "../data/store.js";
import type { ServicePackage, ClientTool, RetainerClient } from "../data/store.js";

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
    typeof t.enabled === "boolean"
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
    res.status(400).json({ error: "Invalid tool data: each tool must have name, slug, and enabled" });
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
