import pg from "pg";
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_packages (
      id VARCHAR(100) PRIMARY KEY,
      name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      price_low INTEGER NOT NULL DEFAULT 0,
      price_high INTEGER NOT NULL DEFAULT 0,
      price_label TEXT,
      duration TEXT NOT NULL,
      type TEXT NOT NULL,
      features JSONB NOT NULL DEFAULT '[]',
      ideal TEXT NOT NULL,
      highlighted BOOLEAN NOT NULL DEFAULT false,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS client_tools (
      slug VARCHAR(100) PRIMARY KEY,
      name TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT true,
      onboarding_copy TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS retainer_clients (
      id VARCHAR(100) PRIMARY KEY,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      monthly_rate NUMERIC NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      health_checks JSONB NOT NULL DEFAULT '[]',
      support_sessions JSONB NOT NULL DEFAULT '[]',
      priority_requests JSONB NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS discovery_inquiries (
      id VARCHAR(100) PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      challenge TEXT NOT NULL,
      timeline TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id VARCHAR(100) PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      company TEXT NOT NULL,
      quote TEXT NOT NULL,
      photo TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS case_studies (
      id VARCHAR(100) PRIMARY KEY,
      title TEXT NOT NULL,
      industry TEXT NOT NULL,
      challenge TEXT NOT NULL,
      outcome TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS outcome_stats (
      id VARCHAR(100) PRIMARY KEY,
      label TEXT NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blog_articles (
      id VARCHAR(100) PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      featured_image TEXT,
      publish_date TEXT NOT NULL,
      published BOOLEAN NOT NULL DEFAULT false,
      reading_time INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR(100) PRIMARY KEY,
      client_name TEXT NOT NULL,
      contact_id TEXT,
      description TEXT NOT NULL,
      amount NUMERIC NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      invoice_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Draft',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(100) PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      link TEXT,
      read BOOLEAN NOT NULL DEFAULT false,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      email_notifications_enabled BOOLEAN NOT NULL DEFAULT false,
      admin_email TEXT NOT NULL DEFAULT '',
      calendly_url TEXT
    );

    CREATE TABLE IF NOT EXISTS email_leads (
      id VARCHAR(100) PRIMARY KEY,
      email TEXT NOT NULL,
      first_name TEXT NOT NULL,
      tool_source TEXT NOT NULL,
      document_type TEXT,
      captured_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tool_runs (
      id VARCHAR(100) PRIMARY KEY,
      tool_name TEXT NOT NULL,
      tool_slug TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      input_type TEXT,
      email_captured BOOLEAN NOT NULL DEFAULT false,
      document_size_category TEXT,
      gap_categories JSONB
    );

    CREATE TABLE IF NOT EXISTS pipeline_contacts (
      id VARCHAR(100) PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'manual',
      service_interest TEXT NOT NULL DEFAULT '',
      stage TEXT NOT NULL DEFAULT 'New Lead',
      last_touch_date TEXT NOT NULL,
      next_action TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      estimated_value NUMERIC NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await seedDefaults();
}

async function seedDefaults(): Promise<void> {
  await seedPackages();
  await seedTools();
  await seedArticles();
  await seedAdminSettings();
}

async function seedPackages(): Promise<void> {
  const { rows } = await pool.query("SELECT COUNT(*) FROM service_packages");
  if (parseInt(rows[0].count) > 0) return;

  const defaults = [
    { id: "audit", name: "Documentation Audit", tagline: "We don't know what our knowledge base is missing.", priceLow: 1500, priceHigh: 2000, priceLabel: null, duration: "1 week", type: "Fixed price", features: ["Gap analysis across existing documentation", "Semantic search audit of coverage holes", "Prioritized gap report with action recommendations"], ideal: "Teams preparing for an AI initiative or post-merger knowledge consolidation.", highlighted: false },
    { id: "sprint", name: "Knowledge Architecture Sprint", tagline: "Our AI can't find anything useful in our docs.", priceLow: 2500, priceHigh: 4000, priceLabel: null, duration: "1–2 weeks", type: "Fixed price", features: ["Taxonomy and knowledge structure design", "Retrieval logic mapping and metadata schema", "Content hierarchy design", "Structured knowledge architecture document"], ideal: "SaaS companies preparing for a RAG build, or teams rebuilding a knowledge base from scratch.", highlighted: false },
    { id: "workshop", name: "Prompt Engineering Workshop", tagline: "Our team wastes hours writing the same kinds of content.", priceLow: 2000, priceHigh: 3000, priceLabel: null, duration: "1–2 weeks", type: "Fixed price", features: ["Prompt library design, testing, and documentation", "Variable-template system for consistent team output", "Style-guide enforcement prompts", "Full team handover with usage documentation"], ideal: "Marketing, support, and content teams with repetitive writing workflows.", highlighted: false },
    { id: "rag", name: "RAG Pipeline Design & Build", tagline: "We need a chatbot trained on our internal documentation.", priceLow: 0, priceHigh: 0, priceLabel: "Custom — quoted on scope", duration: "4–8 weeks", type: "Project-based", features: ["End-to-end retrieval-augmented generation pipeline", "Document ingestion and chunking strategy", "Embedding and vector store setup", "Conversational interface grounded in your documentation"], ideal: "For companies with existing documentation ready for AI-powered retrieval.", highlighted: false },
    { id: "retainer", name: "Monthly Retainer", tagline: "We need ongoing knowledge architecture support as we scale.", priceLow: 800, priceHigh: 1200, priceLabel: null, duration: "Monthly", type: "Ongoing", features: ["Dedicated async support and review cycles", "Monthly knowledge health check and recommendations", "Priority access for new requests and scope expansions", "Continuity across documentation, prompts, and architecture"], ideal: "Minimum 3-month commitment. Ideal for teams in active knowledge build-out.", highlighted: true },
  ];

  for (let i = 0; i < defaults.length; i++) {
    const p = defaults[i];
    await pool.query(
      `INSERT INTO service_packages (id, name, tagline, price_low, price_high, price_label, duration, type, features, ideal, highlighted, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [p.id, p.name, p.tagline, p.priceLow, p.priceHigh, p.priceLabel, p.duration, p.type, JSON.stringify(p.features), p.ideal, p.highlighted, i]
    );
  }
}

async function seedTools(): Promise<void> {
  const { rows } = await pool.query("SELECT COUNT(*) FROM client_tools");
  if (parseInt(rows[0].count) > 0) return;

  const defaults = [
    { name: "DocAudit", slug: "docaudit", enabled: true, onboardingCopy: "Find out what's missing from your documentation before your users do. Upload or paste your content and get a clear, prioritized report showing exactly which topics need attention — perfect for teams preparing to improve their knowledge base or launch an AI assistant." },
    { name: "Synaptica Knowledge Architecture", slug: "synaptica-ka", enabled: true, onboardingCopy: "See how AI-powered search actually works on real documentation. Type a question in plain English and explore how semantic search finds relevant answers across a knowledge base — a hands-on preview of what structured knowledge architecture can do for your team." },
    { name: "DiffLens", slug: "difflens", enabled: true, onboardingCopy: "Quickly spot every change between two versions of a document. Upload your files — PDFs, Word docs, code, or plain text — and get a clear side-by-side comparison with every addition, deletion, and edit highlighted for you." },
    { name: "DocForge PDF", slug: "docforge", enabled: true, onboardingCopy: "Turn rough documents into polished, professional PDFs in seconds. Upload a Word doc, text file, or Markdown, and the AI automatically detects your document's structure and applies clean formatting, headers, and branding." },
    { name: "DocScope Intel Engine", slug: "docscope", enabled: true, onboardingCopy: "Paste any content — emails, Slack threads, meeting notes, or documents — and get an instant AI analysis of what's covered, what's missing, and where the inconsistencies are. Great for auditing work-in-progress content before it ships." },
  ];

  for (let i = 0; i < defaults.length; i++) {
    const t = defaults[i];
    await pool.query(
      `INSERT INTO client_tools (slug, name, enabled, onboarding_copy, sort_order) VALUES ($1,$2,$3,$4,$5)`,
      [t.slug, t.name, t.enabled, t.onboardingCopy, i]
    );
  }
}

async function seedArticles(): Promise<void> {
  const { rows } = await pool.query("SELECT COUNT(*) FROM blog_articles");
  if (parseInt(rows[0].count) > 0) return;

  const articles = [
    {
      id: "art-1",
      title: "How to Structure Your Documents Before Building a RAG Pipeline",
      slug: "structure-documents-before-rag-pipeline",
      excerpt: "Most RAG failures start long before the first embedding is generated. Learn the document structure principles that make retrieval-augmented generation actually work.",
      body: `# How to Structure Your Documents Before Building a RAG Pipeline\n\nBuilding a RAG (Retrieval-Augmented Generation) pipeline is exciting — but most teams rush straight into embeddings and vector stores without thinking about the most critical factor: **document structure**.\n\n## Why Structure Matters More Than Models\n\nThe quality of a RAG system is bounded by the quality of its source documents. No amount of prompt engineering or model fine-tuning can compensate for poorly structured content. When your documents are messy, your chunks are messy, and your retrieval is unreliable.\n\n## The Three Pillars of RAG-Ready Documents\n\n### 1. Clear Heading Hierarchy\n\nEvery document should have a logical heading hierarchy (H1 → H2 → H3). This isn't just for human readability — it's how chunking strategies determine context boundaries.\n\n\`\`\`markdown\n# Product Overview          ← H1: Top-level topic\n## Key Features             ← H2: Sub-topic\n### Authentication          ← H3: Specific feature\n\`\`\`\n\n### 2. Self-Contained Sections\n\nEach section should make sense on its own. When a chunk is retrieved, the user won't see the surrounding context. If your section starts with "As mentioned above..." — it's not RAG-ready.\n\n### 3. Consistent Metadata\n\nAdd frontmatter or structured metadata to every document:\n- **Title** and **description**\n- **Last updated** date\n- **Category** or **domain** tags\n- **Audience** or **access level**\n\n## Common Anti-Patterns\n\n| Anti-Pattern | Why It Fails |\n|---|---|\n| Giant monolithic documents | Chunks cross topic boundaries |\n| Heavy cross-referencing | Retrieved chunks lack context |\n| Embedded tables without context | Table data loses meaning when chunked |\n| Acronyms without definitions | Retrieved chunks are ambiguous |\n\n## A Practical Checklist\n\nBefore feeding any document into a RAG pipeline, verify:\n\n1. Every section has a descriptive heading\n2. No section exceeds 500 words\n3. Acronyms are defined on first use in each section\n4. Tables have descriptive captions\n5. Code blocks include language identifiers\n6. Links use descriptive text, not "click here"\n\n## What Comes Next\n\nOnce your documents are structured, the chunking strategy becomes straightforward. Heading-based chunking with overlap windows works for most use cases. But that's a topic for another post.\n\nThe takeaway: **invest in document structure before you invest in infrastructure**. Your future RAG pipeline will thank you.`,
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
      body: `# Why Most RAG Systems Fail (And It's Not the Model)\n\nWhen a RAG system gives bad answers, the first instinct is to swap the model. GPT-4 not working? Try Claude. Claude hallucinating? Fine-tune something. But in nearly every engagement we've run, **the model wasn't the problem**.\n\n## The Real Failure Points\n\n### 1. The Documents Were Never Designed for Retrieval\n\nMost enterprise documentation was written for humans reading linearly — not for machines retrieving fragments. The assumption that "we'll just point the AI at our docs" ignores a fundamental mismatch between how documents are written and how RAG systems consume them.\n\n### 2. Chunking Strategy Is an Afterthought\n\nDefault chunk sizes (512 tokens, 1000 characters) are arbitrary. The right chunking strategy depends on:\n\n- **Document type**: API docs chunk differently than policy manuals\n- **Query patterns**: What questions will users actually ask?\n- **Content density**: Dense technical content needs smaller chunks\n\n\`\`\`\nBad:  "Split everything into 500-token chunks"\nGood: "Split API docs by endpoint, policy docs by section heading,\n       FAQs by question-answer pair"\n\`\`\`\n\n### 3. No Metadata Layer\n\nWithout metadata, retrieval is purely semantic — and semantic similarity alone isn't enough. A chunk about "Python authentication" and a chunk about "Python snake care" might have similar embeddings for the query "Python security."\n\nEffective metadata includes:\n- **Source document** and section\n- **Content type** (tutorial, reference, FAQ, policy)\n- **Domain tags** (engineering, HR, legal)\n- **Freshness** (last updated date)\n\n### 4. No Retrieval Testing Framework\n\nTeams deploy RAG systems without a way to measure retrieval quality. You need:\n\n- A set of test queries with known correct source documents\n- Retrieval precision and recall metrics\n- Regular regression testing as documents change\n\n## The 80/20 Fix\n\nIf your RAG system is underperforming, don't touch the model. Instead:\n\n1. **Audit your documents** for RAG readiness\n2. **Redesign your chunking** around content types and query patterns\n3. **Add a metadata layer** for hybrid search\n4. **Build a retrieval test suite** before optimizing anything else\n\n## The Bottom Line\n\nRAG is a **systems problem**, not a model problem. The teams that succeed treat their knowledge base as a product — with its own architecture, quality standards, and maintenance processes.\n\nThat's exactly what knowledge architecture is for.`,
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
      body: `# The Knowledge Architecture Checklist for AI-Ready Organizations\n\nBefore your organization can effectively deploy AI tools — chatbots, copilots, search, or automation — you need a solid knowledge architecture. This checklist covers the foundational elements.\n\n## Taxonomy & Classification\n\n- [ ] Content is organized into a clear, consistent taxonomy\n- [ ] Categories are mutually exclusive and collectively exhaustive\n- [ ] Taxonomy depth doesn't exceed 3–4 levels\n- [ ] Category names are intuitive to the target audience\n- [ ] There's a documented process for adding new categories\n\n## Metadata Standards\n\n- [ ] Every document has a title, description, and owner\n- [ ] Documents are tagged with content type (guide, reference, policy, FAQ)\n- [ ] Last-updated dates are accurate and maintained\n- [ ] Audience or access level is specified\n- [ ] Domain or department tags are applied consistently\n\n## Content Quality\n\n- [ ] Documents follow a consistent style guide\n- [ ] Sections are self-contained and don't rely on surrounding context\n- [ ] Acronyms and jargon are defined\n- [ ] Outdated content is archived, not just abandoned\n- [ ] There's a review cycle for high-traffic documents\n\n## Retrieval Readiness\n\n- [ ] Documents have clear heading hierarchies\n- [ ] Long documents are broken into logical, retrievable sections\n- [ ] Tables and images have descriptive context\n- [ ] Code examples include language identifiers and comments\n- [ ] Cross-references use descriptive anchor text\n\n## Governance\n\n- [ ] There's a designated knowledge owner or team\n- [ ] Content creation follows a defined workflow\n- [ ] There's a deprecation process for outdated content\n- [ ] Analytics track which content is accessed and which is stale\n- [ ] There's a feedback mechanism for content quality issues\n\n## How to Use This Checklist\n\nScore each item as **Met**, **Partially Met**, or **Not Met**. Any organization scoring below 70% across these categories should prioritize knowledge architecture work before investing in AI tooling.\n\nThe most common gap we see? **Metadata standards.** Organizations have content, but it's untagged, uncategorized, and impossible to retrieve reliably.\n\n## What Comes Next\n\nIf your checklist reveals gaps, a Knowledge Architecture Sprint can address them in 1–2 weeks. The output is a structured architecture document covering taxonomy, metadata schemas, retrieval logic, and a governance framework — ready for implementation.`,
      category: "Knowledge Architecture",
      publishDate: "2026-03-03",
      published: false,
      readingTime: 3,
      createdAt: "2026-03-03T09:00:00.000Z",
      updatedAt: "2026-03-03T09:00:00.000Z",
    },
  ];

  for (const a of articles) {
    await pool.query(
      `INSERT INTO blog_articles (id, title, slug, excerpt, body, category, featured_image, publish_date, published, reading_time, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [a.id, a.title, a.slug, a.excerpt, a.body, a.category, null, a.publishDate, a.published, a.readingTime, a.createdAt, a.updatedAt]
    );
  }
}

async function seedAdminSettings(): Promise<void> {
  const { rows } = await pool.query("SELECT COUNT(*) FROM admin_settings");
  if (parseInt(rows[0].count) > 0) return;

  let existingCalendlyUrl: string | null = null;
  try {
    const { readFileSync, existsSync } = await import("fs");
    const { join, dirname } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const settingsFile = join(__dirname, "persist", "admin-settings.json");
    if (existsSync(settingsFile)) {
      const data = JSON.parse(readFileSync(settingsFile, "utf-8"));
      existingCalendlyUrl = data.calendlyUrl || null;
    }
  } catch {
    // ignore
  }

  await pool.query(
    `INSERT INTO admin_settings (id, email_notifications_enabled, admin_email, calendly_url) VALUES (1, false, '', $1)`,
    [existingCalendlyUrl]
  );
}
