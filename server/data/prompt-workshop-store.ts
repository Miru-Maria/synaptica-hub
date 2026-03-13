import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "persist");
const PROMPTS_FILE = path.join(DATA_DIR, "prompt-workshop-prompts.json");
const STYLE_GUIDE_FILE = path.join(DATA_DIR, "prompt-workshop-styleguide.json");

export interface PromptTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  body: string;
  tags: string[];
  variables: string[];
  useStyleGuide: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StyleGuide {
  content: string;
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
    // fall through
  }
  return fallback;
}

function writeJson<T>(filePath: string, data: T) {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function extractVariables(body: string): string[] {
  const matches = body.match(/\{\{([\w-]+)\}\}/g);
  if (!matches) return [];
  const unique = [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))];
  return unique;
}

export function getPrompts(): PromptTemplate[] {
  return readJson(PROMPTS_FILE, []);
}

export function getPromptById(id: string): PromptTemplate | undefined {
  return getPrompts().find((p) => p.id === id);
}

export function savePrompts(prompts: PromptTemplate[]) {
  writeJson(PROMPTS_FILE, prompts);
}

export function createPrompt(data: Omit<PromptTemplate, "id" | "variables" | "createdAt" | "updatedAt">): PromptTemplate {
  const prompts = getPrompts();
  const now = new Date().toISOString();
  const prompt: PromptTemplate = {
    ...data,
    id: `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    variables: extractVariables(data.body),
    createdAt: now,
    updatedAt: now,
  };
  prompts.push(prompt);
  savePrompts(prompts);
  return prompt;
}

export function updatePrompt(id: string, data: Partial<Omit<PromptTemplate, "id" | "variables" | "createdAt">>): PromptTemplate | null {
  const prompts = getPrompts();
  const index = prompts.findIndex((p) => p.id === id);
  if (index === -1) return null;
  const updated = {
    ...prompts[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  if (data.body !== undefined) {
    updated.variables = extractVariables(data.body);
  }
  prompts[index] = updated;
  savePrompts(prompts);
  return updated;
}

export function deletePrompt(id: string): boolean {
  const prompts = getPrompts();
  const filtered = prompts.filter((p) => p.id !== id);
  if (filtered.length === prompts.length) return false;
  savePrompts(filtered);
  return true;
}

export function getStyleGuide(): StyleGuide {
  return readJson(STYLE_GUIDE_FILE, { content: "", updatedAt: new Date().toISOString() });
}

export function saveStyleGuide(content: string): StyleGuide {
  const guide: StyleGuide = { content, updatedAt: new Date().toISOString() };
  writeJson(STYLE_GUIDE_FILE, guide);
  return guide;
}
