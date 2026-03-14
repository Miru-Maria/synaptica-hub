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
  onboardingCopy?: string;
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
  {
    name: "DocAudit",
    slug: "docaudit",
    enabled: true,
    onboardingCopy: "Find out what's missing from your documentation before your users do. Upload or paste your content and get a clear, prioritized report showing exactly which topics need attention — perfect for teams preparing to improve their knowledge base or launch an AI assistant.",
  },
  {
    name: "Synaptica Knowledge Architecture",
    slug: "synaptica-ka",
    enabled: true,
    onboardingCopy: "See how AI-powered search actually works on real documentation. Type a question in plain English and explore how semantic search finds relevant answers across a knowledge base — a hands-on preview of what structured knowledge architecture can do for your team.",
  },
  {
    name: "DiffLens",
    slug: "difflens",
    enabled: true,
    onboardingCopy: "Quickly spot every change between two versions of a document. Upload your files — PDFs, Word docs, code, or plain text — and get a clear side-by-side comparison with every addition, deletion, and edit highlighted for you.",
  },
  {
    name: "DocForge PDF",
    slug: "docforge",
    enabled: true,
    onboardingCopy: "Turn rough documents into polished, professional PDFs in seconds. Upload a Word doc, text file, or Markdown, and the AI automatically detects your document's structure and applies clean formatting, headers, and branding.",
  },
  {
    name: "DocScope Intel Engine",
    slug: "docscope",
    enabled: true,
    onboardingCopy: "Paste any content — emails, Slack threads, meeting notes, or documents — and get an instant AI analysis of what's covered, what's missing, and where the inconsistencies are. Great for auditing work-in-progress content before it ships.",
  },
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

export interface HealthCheckEntry {
  id: string;
  date: string;
  notes: string;
  recommendations: string;
}

export interface SupportSessionEntry {
  id: string;
  date: string;
  description: string;
}

export interface PriorityRequest {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  completed: boolean;
}

export interface RetainerClient {
  id: string;
  name: string;
  startDate: string;
  monthlyRate: number;
  notes: string;
  healthChecks: HealthCheckEntry[];
  supportSessions: SupportSessionEntry[];
  priorityRequests: PriorityRequest[];
}

const RETAINERS_FILE = path.join(DATA_DIR, "retainers.json");

export function getRetainerClients(): RetainerClient[] {
  return readJson(RETAINERS_FILE, []);
}

export function saveRetainerClients(clients: RetainerClient[]) {
  writeJson(RETAINERS_FILE, clients);
}

export interface DiscoveryInquiry {
  id: string;
  name: string;
  company: string;
  challenge: string;
  timeline: string;
  createdAt: string;
}

const INQUIRIES_FILE = path.join(DATA_DIR, "discovery-inquiries.json");

export function getDiscoveryInquiries(): DiscoveryInquiry[] {
  return readJson(INQUIRIES_FILE, []);
}

export function saveDiscoveryInquiry(inquiry: DiscoveryInquiry) {
  const inquiries = getDiscoveryInquiries();
  inquiries.unshift(inquiry);
  writeJson(INQUIRIES_FILE, inquiries);
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  photo: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  industry: string;
  challenge: string;
  outcome: string;
}

export interface OutcomeStat {
  id: string;
  label: string;
  value: string;
}

const TESTIMONIALS_FILE = path.join(DATA_DIR, "testimonials.json");
const CASE_STUDIES_FILE = path.join(DATA_DIR, "case-studies.json");
const OUTCOME_STATS_FILE = path.join(DATA_DIR, "outcome-stats.json");

export function getTestimonials(): Testimonial[] {
  return readJson(TESTIMONIALS_FILE, []);
}

export function saveTestimonials(testimonials: Testimonial[]) {
  writeJson(TESTIMONIALS_FILE, testimonials);
}

export function getCaseStudies(): CaseStudy[] {
  return readJson(CASE_STUDIES_FILE, []);
}

export function saveCaseStudies(studies: CaseStudy[]) {
  writeJson(CASE_STUDIES_FILE, studies);
}

export function getOutcomeStats(): OutcomeStat[] {
  return readJson(OUTCOME_STATS_FILE, []);
}

export function saveOutcomeStats(stats: OutcomeStat[]) {
  writeJson(OUTCOME_STATS_FILE, stats);
}

export interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  featuredImage?: string;
  publishDate: string;
  published: boolean;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
}

const ARTICLES_FILE = path.join(DATA_DIR, "articles.json");

function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

const defaultArticles: BlogArticle[] = [
  {
    id: "art-1",
    title: "How to Structure Your Documents Before Building a RAG Pipeline",
    slug: "structure-documents-before-rag-pipeline",
    excerpt: "Most RAG failures start long before the first embedding is generated. Learn the document structure principles that make retrieval-augmented generation actually work.",
    body: `# How to Structure Your Documents Before Building a RAG Pipeline

Building a RAG (Retrieval-Augmented Generation) pipeline is exciting — but most teams rush straight into embeddings and vector stores without thinking about the most critical factor: **document structure**.

## Why Structure Matters More Than Models

The quality of a RAG system is bounded by the quality of its source documents. No amount of prompt engineering or model fine-tuning can compensate for poorly structured content. When your documents are messy, your chunks are messy, and your retrieval is unreliable.

## The Three Pillars of RAG-Ready Documents

### 1. Clear Heading Hierarchy

Every document should have a logical heading hierarchy (H1 → H2 → H3). This isn't just for human readability — it's how chunking strategies determine context boundaries.

\`\`\`markdown
# Product Overview          ← H1: Top-level topic
## Key Features             ← H2: Sub-topic
### Authentication          ← H3: Specific feature
\`\`\`

### 2. Self-Contained Sections

Each section should make sense on its own. When a chunk is retrieved, the user won't see the surrounding context. If your section starts with "As mentioned above..." — it's not RAG-ready.

### 3. Consistent Metadata

Add frontmatter or structured metadata to every document:
- **Title** and **description**
- **Last updated** date
- **Category** or **domain** tags
- **Audience** or **access level**

## Common Anti-Patterns

| Anti-Pattern | Why It Fails |
|---|---|
| Giant monolithic documents | Chunks cross topic boundaries |
| Heavy cross-referencing | Retrieved chunks lack context |
| Embedded tables without context | Table data loses meaning when chunked |
| Acronyms without definitions | Retrieved chunks are ambiguous |

## A Practical Checklist

Before feeding any document into a RAG pipeline, verify:

1. Every section has a descriptive heading
2. No section exceeds 500 words
3. Acronyms are defined on first use in each section
4. Tables have descriptive captions
5. Code blocks include language identifiers
6. Links use descriptive text, not "click here"

## What Comes Next

Once your documents are structured, the chunking strategy becomes straightforward. Heading-based chunking with overlap windows works for most use cases. But that's a topic for another post.

The takeaway: **invest in document structure before you invest in infrastructure**. Your future RAG pipeline will thank you.`,
    category: "RAG & Retrieval",
    publishDate: "2026-03-10",
    published: true,
    readingTime: 4,
    createdAt: "2026-03-10T09:00:00.000Z",
    updatedAt: "2026-03-10T09:00:00.000Z",
  },
  {
    id: "art-2",
    title: "Why Most RAG Systems Fail (And It's Not the Model)",
    slug: "why-most-rag-systems-fail",
    excerpt: "Everyone blames the LLM when RAG quality is poor. But the real culprits are upstream: bad chunking, missing metadata, and documents that were never designed for retrieval.",
    body: `# Why Most RAG Systems Fail (And It's Not the Model)

When a RAG system gives bad answers, the first instinct is to swap the model. GPT-4 not working? Try Claude. Claude hallucinating? Fine-tune something. But in nearly every engagement we've run, **the model wasn't the problem**.

## The Real Failure Points

### 1. The Documents Were Never Designed for Retrieval

Most enterprise documentation was written for humans reading linearly — not for machines retrieving fragments. The assumption that "we'll just point the AI at our docs" ignores a fundamental mismatch between how documents are written and how RAG systems consume them.

### 2. Chunking Strategy Is an Afterthought

Default chunk sizes (512 tokens, 1000 characters) are arbitrary. The right chunking strategy depends on:

- **Document type**: API docs chunk differently than policy manuals
- **Query patterns**: What questions will users actually ask?
- **Content density**: Dense technical content needs smaller chunks

\`\`\`
Bad:  "Split everything into 500-token chunks"
Good: "Split API docs by endpoint, policy docs by section heading,
       FAQs by question-answer pair"
\`\`\`

### 3. No Metadata Layer

Without metadata, retrieval is purely semantic — and semantic similarity alone isn't enough. A chunk about "Python authentication" and a chunk about "Python snake care" might have similar embeddings for the query "Python security."

Effective metadata includes:
- **Source document** and section
- **Content type** (tutorial, reference, FAQ, policy)
- **Domain tags** (engineering, HR, legal)
- **Freshness** (last updated date)

### 4. No Retrieval Testing Framework

Teams deploy RAG systems without a way to measure retrieval quality. You need:

- A set of test queries with known correct source documents
- Retrieval precision and recall metrics
- Regular regression testing as documents change

## The 80/20 Fix

If your RAG system is underperforming, don't touch the model. Instead:

1. **Audit your documents** for RAG readiness
2. **Redesign your chunking** around content types and query patterns
3. **Add a metadata layer** for hybrid search
4. **Build a retrieval test suite** before optimizing anything else

## The Bottom Line

RAG is a **systems problem**, not a model problem. The teams that succeed treat their knowledge base as a product — with its own architecture, quality standards, and maintenance processes.

That's exactly what knowledge architecture is for.`,
    category: "RAG & Retrieval",
    publishDate: "2026-03-07",
    published: true,
    readingTime: 4,
    createdAt: "2026-03-07T09:00:00.000Z",
    updatedAt: "2026-03-07T09:00:00.000Z",
  },
  {
    id: "art-3",
    title: "The Knowledge Architecture Checklist for AI-Ready Organizations",
    slug: "knowledge-architecture-checklist-ai-ready",
    excerpt: "A practical checklist for evaluating whether your organization's knowledge base is ready to power AI applications — from taxonomy to metadata to governance.",
    body: `# The Knowledge Architecture Checklist for AI-Ready Organizations

Before your organization can effectively deploy AI tools — chatbots, copilots, search, or automation — you need a solid knowledge architecture. This checklist covers the foundational elements.

## Taxonomy & Classification

- [ ] Content is organized into a clear, consistent taxonomy
- [ ] Categories are mutually exclusive and collectively exhaustive
- [ ] Taxonomy depth doesn't exceed 3–4 levels
- [ ] Category names are intuitive to the target audience
- [ ] There's a documented process for adding new categories

## Metadata Standards

- [ ] Every document has a title, description, and owner
- [ ] Documents are tagged with content type (guide, reference, policy, FAQ)
- [ ] Last-updated dates are accurate and maintained
- [ ] Audience or access level is specified
- [ domain or department tags are applied consistently

## Content Quality

- [ ] Documents follow a consistent style guide
- [ ] Sections are self-contained and don't rely on surrounding context
- [ ] Acronyms and jargon are defined
- [ ] Outdated content is archived, not just abandoned
- [ ] There's a review cycle for high-traffic documents

## Retrieval Readiness

- [ ] Documents have clear heading hierarchies
- [ ] Long documents are broken into logical, retrievable sections
- [ ] Tables and images have descriptive context
- [ ] Code examples include language identifiers and comments
- [ ] Cross-references use descriptive anchor text

## Governance

- [ ] There's a designated knowledge owner or team
- [ ] Content creation follows a defined workflow
- [ ] There's a deprecation process for outdated content
- [ ] Analytics track which content is accessed and which is stale
- [ ] There's a feedback mechanism for content quality issues

## How to Use This Checklist

Score each item as **Met**, **Partially Met**, or **Not Met**. Any organization scoring below 70% across these categories should prioritize knowledge architecture work before investing in AI tooling.

The most common gap we see? **Metadata standards.** Organizations have content, but it's untagged, uncategorized, and impossible to retrieve reliably.

## What Comes Next

If your checklist reveals gaps, a Knowledge Architecture Sprint can address them in 1–2 weeks. The output is a structured architecture document covering taxonomy, metadata schemas, retrieval logic, and a governance framework — ready for implementation.`,
    category: "Knowledge Architecture",
    publishDate: "2026-03-03",
    published: false,
    readingTime: 3,
    createdAt: "2026-03-03T09:00:00.000Z",
    updatedAt: "2026-03-03T09:00:00.000Z",
  },
];

export function getArticles(): BlogArticle[] {
  return readJson(ARTICLES_FILE, defaultArticles);
}

export function saveArticles(articles: BlogArticle[]) {
  writeJson(ARTICLES_FILE, articles);
}

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return getArticles().find((a) => a.slug === slug);
}

export function getPublishedArticles(): BlogArticle[] {
  return getArticles()
    .filter((a) => a.published)
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
}

export { estimateReadingTime };

export interface EmailLead {
  id: string;
  email: string;
  firstName: string;
  toolSource: string;
  documentType?: string;
  capturedAt: string;
}

const LEADS_FILE = path.join(DATA_DIR, "email-leads.json");

export function getEmailLeads(): EmailLead[] {
  return readJson(LEADS_FILE, []);
}

export function saveEmailLead(lead: EmailLead) {
  const leads = getEmailLeads();
  leads.push(lead);
  writeJson(LEADS_FILE, leads);
}

export function saveEmailLeads(leads: EmailLead[]) {
  writeJson(LEADS_FILE, leads);
}

export interface ToolRunEvent {
  id: string;
  toolName: string;
  toolSlug: string;
  timestamp: string;
  inputType?: string;
  emailCaptured: boolean;
  documentSizeCategory?: string;
  gapCategories?: string[];
}

const TOOL_RUNS_FILE = path.join(DATA_DIR, "tool-runs.json");

export function getToolRuns(): ToolRunEvent[] {
  return readJson(TOOL_RUNS_FILE, []);
}

export function logToolRun(event: Omit<ToolRunEvent, "id" | "timestamp">): ToolRunEvent {
  const runs = getToolRuns();
  const entry: ToolRunEvent = {
    id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...event,
  };
  runs.push(entry);
  writeJson(TOOL_RUNS_FILE, runs);
  return entry;
}

export interface ToolMetricsSummary {
  toolName: string;
  toolSlug: string;
  totalRuns: number;
  last30DaysRuns: number;
  emailCaptures: number;
  inputTypeBreakdown?: Record<string, number>;
  documentSizeBreakdown?: Record<string, number>;
  topGapCategories?: { category: string; count: number }[];
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface MetricsResponse {
  tools: ToolMetricsSummary[];
  dailyCounts: DailyCount[];
  totalRuns: number;
  totalEmails: number;
}

export function getMetrics(): MetricsResponse {
  const runs = getToolRuns();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const toolMap = new Map<string, ToolRunEvent[]>();
  for (const run of runs) {
    const key = run.toolSlug;
    if (!toolMap.has(key)) toolMap.set(key, []);
    toolMap.get(key)!.push(run);
  }

  const tools: ToolMetricsSummary[] = [];
  for (const [slug, toolRuns] of toolMap) {
    const recentRuns = toolRuns.filter((r) => new Date(r.timestamp) >= thirtyDaysAgo);
    const summary: ToolMetricsSummary = {
      toolName: toolRuns[0].toolName,
      toolSlug: slug,
      totalRuns: toolRuns.length,
      last30DaysRuns: recentRuns.length,
      emailCaptures: toolRuns.filter((r) => r.emailCaptured).length,
    };

    if (slug === "docaudit") {
      const inputBreakdown: Record<string, number> = {};
      const sizeBreakdown: Record<string, number> = {};
      const gapCounts: Record<string, number> = {};

      for (const run of toolRuns) {
        if (run.inputType) {
          inputBreakdown[run.inputType] = (inputBreakdown[run.inputType] || 0) + 1;
        }
        if (run.documentSizeCategory) {
          sizeBreakdown[run.documentSizeCategory] = (sizeBreakdown[run.documentSizeCategory] || 0) + 1;
        }
        if (run.gapCategories) {
          for (const cat of run.gapCategories) {
            gapCounts[cat] = (gapCounts[cat] || 0) + 1;
          }
        }
      }

      summary.inputTypeBreakdown = inputBreakdown;
      summary.documentSizeBreakdown = sizeBreakdown;
      summary.topGapCategories = Object.entries(gapCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }

    tools.push(summary);
  }

  const dailyMap = new Map<string, number>();
  const last30Runs = runs.filter((r) => new Date(r.timestamp) >= thirtyDaysAgo);
  for (const run of last30Runs) {
    const day = run.timestamp.slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
  }

  for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    if (!dailyMap.has(key)) dailyMap.set(key, 0);
  }

  const dailyCounts: DailyCount[] = [...dailyMap.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    tools,
    dailyCounts,
    totalRuns: runs.length,
    totalEmails: runs.filter((r) => r.emailCaptured).length,
  };
}
