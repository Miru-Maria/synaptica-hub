import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "persist");
const PACKAGES_FILE = path.join(DATA_DIR, "packages.json");
const TOOLS_FILE = path.join(DATA_DIR, "tools.json");

export interface ServicePackage {
  id: string;
  name: string;
  tagline: string;
  priceLow: number;
  priceHigh: number;
  priceLabel?: string;
  duration: string;
  type: string;
  features: string[];
  ideal: string;
  highlighted: boolean;
}

export interface ClientTool {
  name: string;
  slug: string;
  enabled: boolean;
}

const defaultPackages: ServicePackage[] = [
  {
    id: "audit",
    name: "Documentation Audit",
    tagline: "We don't know what our knowledge base is missing.",
    priceLow: 1500,
    priceHigh: 2000,
    duration: "1 week",
    type: "Fixed price",
    features: [
      "Gap analysis across existing documentation",
      "Semantic search audit of coverage holes",
      "Prioritized gap report with action recommendations",
    ],
    ideal: "Teams preparing for an AI initiative or post-merger knowledge consolidation.",
    highlighted: false,
  },
  {
    id: "sprint",
    name: "Knowledge Architecture Sprint",
    tagline: "Our AI can't find anything useful in our docs.",
    priceLow: 2500,
    priceHigh: 4000,
    duration: "1–2 weeks",
    type: "Fixed price",
    features: [
      "Taxonomy and knowledge structure design",
      "Retrieval logic mapping and metadata schema",
      "Content hierarchy design",
      "Structured knowledge architecture document",
    ],
    ideal: "SaaS companies preparing for a RAG build, or teams rebuilding a knowledge base from scratch.",
    highlighted: false,
  },
  {
    id: "workshop",
    name: "Prompt Engineering Workshop",
    tagline: "Our team wastes hours writing the same kinds of content.",
    priceLow: 2000,
    priceHigh: 3000,
    duration: "1–2 weeks",
    type: "Fixed price",
    features: [
      "Prompt library design, testing, and documentation",
      "Variable-template system for consistent team output",
      "Style-guide enforcement prompts",
      "Full team handover with usage documentation",
    ],
    ideal: "Marketing, support, and content teams with repetitive writing workflows.",
    highlighted: false,
  },
  {
    id: "rag",
    name: "RAG Pipeline Design & Build",
    tagline: "We need a chatbot trained on our internal documentation.",
    priceLow: 0,
    priceHigh: 0,
    priceLabel: "Custom — quoted on scope",
    duration: "4–8 weeks",
    type: "Project-based",
    features: [
      "End-to-end retrieval-augmented generation pipeline",
      "Document ingestion and chunking strategy",
      "Embedding and vector store setup",
      "Conversational interface grounded in your documentation",
    ],
    ideal: "For companies with existing documentation ready for AI-powered retrieval.",
    highlighted: false,
  },
  {
    id: "retainer",
    name: "Monthly Retainer",
    tagline: "We need ongoing knowledge architecture support as we scale.",
    priceLow: 800,
    priceHigh: 1200,
    duration: "Monthly",
    type: "Ongoing",
    features: [
      "Dedicated async support and review cycles",
      "Monthly knowledge health check and recommendations",
      "Priority access for new requests and scope expansions",
      "Continuity across documentation, prompts, and architecture",
    ],
    ideal: "Minimum 3-month commitment. Ideal for teams in active knowledge build-out.",
    highlighted: true,
  },
];

const defaultTools: ClientTool[] = [
  { name: "DocAudit", slug: "docaudit", enabled: true },
  { name: "Synaptica Knowledge Architecture", slug: "synaptica-ka", enabled: true },
  { name: "DiffLens", slug: "difflens", enabled: true },
  { name: "DocForge PDF", slug: "docforge", enabled: true },
  { name: "DocScope Intel Engine", slug: "docscope", enabled: true },
];

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

export function getPackages(): ServicePackage[] {
  return readJson(PACKAGES_FILE, defaultPackages);
}

export function savePackages(packages: ServicePackage[]) {
  writeJson(PACKAGES_FILE, packages);
}

export function getTools(): ClientTool[] {
  return readJson(TOOLS_FILE, defaultTools);
}

export function saveTools(tools: ClientTool[]) {
  writeJson(TOOLS_FILE, tools);
}
