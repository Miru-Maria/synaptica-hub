import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  adminUser?: string;
  demoSession?: { tools: string[]; label: string };
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is required");
  process.exit(1);
}

export function signToken(username: string): string {
  return jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: "8h" });
}

export function verifyToken(token: string): { sub: string } | null {
  try {
    const p = jwt.verify(token, JWT_SECRET) as { sub?: string; role?: string };
    if (p.role === "demo") return null;
    return p as { sub: string };
  } catch {
    return null;
  }
}

export function signDemoToken(tools: string[], label: string): string {
  return jwt.sign({ role: "demo", tools, label }, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyDemoToken(token: string): { tools: string[]; label: string } | null {
  try {
    const p = jwt.verify(token, JWT_SECRET) as { role?: string; tools?: string[]; label?: string };
    if (p.role !== "demo" || !p.tools || !p.label) return null;
    return { tools: p.tools, label: p.label };
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const payload = verifyToken(token);
  if (!payload) { res.status(401).json({ error: "Invalid or expired session" }); return; }
  req.adminUser = payload.sub;
  next();
}

export function requireAdminOrAnyDemo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  const admin = verifyToken(token);
  if (admin) { req.adminUser = admin.sub; next(); return; }
  const demo = verifyDemoToken(token);
  if (demo) { req.demoSession = demo; next(); return; }
  res.status(401).json({ error: "Invalid or expired session" });
}

export function requireAdminOrDemo(toolKey: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;
    if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
    const admin = verifyToken(token);
    if (admin) { req.adminUser = admin.sub; next(); return; }
    const demo = verifyDemoToken(token);
    if (demo && demo.tools.includes(toolKey)) { req.demoSession = demo; next(); return; }
    res.status(401).json({ error: "Not authenticated" });
  };
}
