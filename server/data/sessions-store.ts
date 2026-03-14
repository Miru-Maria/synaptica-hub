import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "persist");
const KA_SESSIONS_FILE = path.join(DATA_DIR, "ka-sprint-sessions.json");
const PW_SESSIONS_FILE = path.join(DATA_DIR, "prompt-workshop-sessions.json");

export interface KASprintSession {
  id: string;
  clientName: string;
  sessionDate: string;
  step: string;
  domain: string;
  currentStructure: string;
  primaryUseCase: string;
  targetSystem: string;
  taxonomyContent: string;
  retrievalContent: string;
  documentContent: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptWorkshopSession {
  id: string;
  clientName: string;
  sessionName: string;
  version: string;
  tags: string[];
  prompts: Array<{
    id: string;
    title: string;
    category: string;
    description: string;
    body: string;
    tags: string[];
    variables: string[];
    useStyleGuide: boolean;
  }>;
  styleGuideContent: string;
  createdAt: string;
  updatedAt: string;
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
    }
  } catch {
  }
  return fallback;
}

function writeJson<T>(filePath: string, data: T) {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function getKASessions(): KASprintSession[] {
  return readJson(KA_SESSIONS_FILE, []);
}

export function getKASessionById(id: string): KASprintSession | undefined {
  return getKASessions().find((s) => s.id === id);
}

export function createKASession(session: Omit<KASprintSession, "id" | "createdAt" | "updatedAt">): KASprintSession {
  const sessions = getKASessions();
  const now = new Date().toISOString();
  const newSession: KASprintSession = {
    ...session,
    id: `ka-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
  };
  sessions.push(newSession);
  writeJson(KA_SESSIONS_FILE, sessions);
  return newSession;
}

export function updateKASession(id: string, session: Omit<KASprintSession, "id" | "createdAt" | "updatedAt">): KASprintSession | null {
  const sessions = getKASessions();
  const index = sessions.findIndex((s) => s.id === id);
  if (index === -1) return null;
  const now = new Date().toISOString();
  sessions[index] = { ...sessions[index], ...session, updatedAt: now };
  writeJson(KA_SESSIONS_FILE, sessions);
  return sessions[index];
}

export function deleteKASession(id: string): boolean {
  const sessions = getKASessions();
  const filtered = sessions.filter((s) => s.id !== id);
  if (filtered.length === sessions.length) return false;
  writeJson(KA_SESSIONS_FILE, filtered);
  return true;
}

export function getPWSessions(): PromptWorkshopSession[] {
  return readJson(PW_SESSIONS_FILE, []);
}

export function getPWSessionById(id: string): PromptWorkshopSession | undefined {
  return getPWSessions().find((s) => s.id === id);
}

export function createPWSession(session: Omit<PromptWorkshopSession, "id" | "createdAt" | "updatedAt">): PromptWorkshopSession {
  const sessions = getPWSessions();
  const now = new Date().toISOString();
  const newSession: PromptWorkshopSession = {
    ...session,
    id: `pw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
  };
  sessions.push(newSession);
  writeJson(PW_SESSIONS_FILE, sessions);
  return newSession;
}

export function updatePWSession(id: string, session: Omit<PromptWorkshopSession, "id" | "createdAt" | "updatedAt">): PromptWorkshopSession | null {
  const sessions = getPWSessions();
  const index = sessions.findIndex((s) => s.id === id);
  if (index === -1) return null;
  const now = new Date().toISOString();
  sessions[index] = { ...sessions[index], ...session, updatedAt: now };
  writeJson(PW_SESSIONS_FILE, sessions);
  return sessions[index];
}

export function deletePWSession(id: string): boolean {
  const sessions = getPWSessions();
  const filtered = sessions.filter((s) => s.id !== id);
  if (filtered.length === sessions.length) return false;
  writeJson(PW_SESSIONS_FILE, filtered);
  return true;
}
