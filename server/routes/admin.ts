import { Router, Request, Response } from "express";
import { signToken, requireAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { getPackages, savePackages, getTools, saveTools } from "../data/store.js";
import type { ServicePackage, ClientTool } from "../data/store.js";

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
