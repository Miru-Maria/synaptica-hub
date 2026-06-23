import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  GraduationCap,
  FileSearch,
  Network,
  Wand2,
  Database,
  Play,
  Target,
  Lightbulb,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  TrendingUp,
  ScanSearch,
  FileOutput,
  GitCompare,
  BookOpen,
} from "lucide-react";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token") || sessionStorage.getItem("demo_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

interface Scenario {
  title: string;
  context: string;
  narration: string;
  inputs: { label: string; value: string }[];
  expectedOutput: string;
  wowMoment: string;
  launchPath: string;
  questions?: string[];
  questionLabel?: string;
}

const DOCAUDIT_SCENARIOS: Scenario[] = [
  {
    title: "Sparse AI Startup KB",
    context:
      "A seed-stage AI startup that built a prototype but has barely any documentation. Realistic first client: technical founder who thinks they're 'pretty well documented.'",
    narration:
      "\"This is a typical early-stage AI startup — they have a few paragraphs about their product and team. Let me show you what the audit finds.\" (Pause after the radar chart appears.)",
    inputs: [
      { label: "Method", value: "Paste Text — click the 'Paste Text' tab" },
      { label: "Text", value: "Pre-loaded by 'Launch & Load'" },
      { label: "KB Name", value: "AI Startup Knowledge Base — Practice Audit" },
      { label: "Taxonomy", value: "AI Readiness Checklist (10 topics)" },
    ],
    expectedOutput:
      "Overall score around 15–25%. Expect Critical severity on: AI Ethics & Governance, Model Development & MLOps, Data Infrastructure & Quality, Monitoring & Maintenance, Security & Privacy, Change Management, ROI & Business Impact. Strategy & Vision may score slightly higher since the text mentions it briefly.",
    wowMoment:
      "The radar chart shows a near-empty polygon — almost every spoke is at or near zero. This makes the business case for a proper knowledge architecture immediately visual. The severity count (7–8 Critical items) is the closing line.",
    launchPath: "/docaudit?practice=1",
  },
  {
    title: "Feature Launch Package",
    context:
      "A SaaS product team that just shipped a feature. Their developer docs look solid to them. This is the 'we already have documentation' objection scenario.",
    narration:
      "\"This client just shipped a new search feature. Their PRD and API docs are solid — but let's audit the full launch package and see what's actually missing before it goes to users.\"",
    inputs: [
      { label: "Method", value: "Paste Text — click the 'Paste Text' tab" },
      { label: "Text", value: "Pre-loaded by 'Launch & Load'" },
      { label: "KB Name", value: "Advanced Search v2.1 — Launch Package" },
      { label: "Taxonomy", value: "Feature Launch Docs (10 topics)" },
    ],
    expectedOutput:
      "Mixed scores. High/Low severity on Product Requirements, API Documentation, User Guide & Tutorials. Critical on: Release Notes, Testing & QA Procedures, Deployment Runbook, Rollback Procedures, Performance Benchmarks, Support & Troubleshooting. Overall score around 30–40%.",
    wowMoment:
      "The tool distinguishes between 'documented' and 'launch-ready.' The client can see exactly which launch-critical pieces are missing while the product-facing content looks fine. This is the 'surgical precision' moment.",
    launchPath: "/docaudit?practice=2",
  },
  {
    title: "Consulting Firm KB Audit",
    context:
      "A well-written consulting firm knowledge base — clear prose, good structure. This scenario demonstrates that even quality writing has systematic gaps.",
    narration:
      "\"This is a real knowledge base for a consulting firm — well-written, well-organized. Let's run the General Technical Docs audit and see what gaps exist even in good documentation.\"",
    inputs: [
      { label: "Method", value: "Paste Text — click the 'Paste Text' tab" },
      { label: "Text", value: "Pre-loaded by 'Launch & Load'" },
      { label: "KB Name", value: "Consulting Knowledge Base — General Audit" },
      { label: "Taxonomy", value: "General Technical Docs (10 topics)" },
    ],
    expectedOutput:
      "Higher overall score (~40–55%) than the first two scenarios. Low/Medium on Getting Started & Setup, FAQ & Troubleshooting, Architecture Overview. Critical on: API Reference, Security Best Practices, Error Handling & Debugging, Performance Optimization, Contributing Guidelines, Changelog & Versioning.",
    wowMoment:
      "The nuanced result — some good, some bad — is more convincing than an all-red chart. It shows the tool finds real gaps rather than flagging everything. The specific recommendations per topic are where GPT-4o earns its keep.",
    launchPath: "/docaudit?practice=3",
  },
];

const KASPRINT_SCENARIOS: Scenario[] = [
  {
    title: "B2B SaaS Onboarding Chatbot",
    context:
      "A SaaS company building their first AI support chatbot to reduce onboarding support tickets. Relatable scenario — most SaaS companies have exactly this problem.",
    narration:
      "\"This client has 200 Confluence pages and a Loom video library — but zero consistency. They want a chatbot that actually answers new customer questions. Watch the taxonomy the sprint generates.\"",
    inputs: [
      { label: "Domain", value: "Pre-loaded — customer onboarding knowledge for a B2B SaaS targeting marketing teams" },
      { label: "Structure", value: "Pre-loaded — Confluence + Loom + PDFs, inconsistent naming" },
      { label: "Use case", value: "Pre-loaded — AI chatbot for 30-day onboarding, reduce L1 tickets 40%" },
      { label: "Target system", value: "Pre-loaded — Pinecone + LangChain + Intercom" },
    ],
    expectedOutput:
      "Taxonomy with 6–8 primary categories (Product Features, Workflow Guides, Integrations, Onboarding Milestones, Troubleshooting, FAQs, Account Management). Rich tagging convention recommendations. Retrieval schema emphasizing user role and product area metadata fields. Chunking strategy recommending 300–500 char chunks for conversational retrieval.",
    wowMoment:
      "The metadata schema output — field names, types, required/optional, examples — looks like something an engineer handed you. That is the demo artifact you point to when you say 'this is what your team gets.'",
    launchPath: "/admin/ka-sprint?practice=1",
  },
  {
    title: "Fintech Compliance KB",
    context:
      "A Series B fintech with a Google Drive full of regulatory docs that the legal team is tired of explaining. High-stakes domain — retrieval must be precise.",
    narration:
      "\"This client is in financial services. Their legal team answers the same GDPR and PSD2 questions fifty times a month. Watch how the sprint designs a retrieval architecture that reflects regulatory structure rather than folder structure.\"",
    inputs: [
      { label: "Domain", value: "Pre-loaded — internal compliance docs, GDPR/PSD2/AML for an EU fintech startup" },
      { label: "Structure", value: "Pre-loaded — Google Drive by regulation, no version control, no tagging" },
      { label: "Use case", value: "Pre-loaded — employee self-service, 60% reduction in legal team interruptions" },
      { label: "Target system", value: "Pre-loaded — Slack bot, OpenAI GPT-4o, non-legal audience" },
    ],
    expectedOutput:
      "Taxonomy that mirrors regulatory framework (GDPR, PSD2, AML/KYC as top-level categories) rather than generic knowledge categories. Retrieval schema with jurisdiction, regulation, effective_date, and audience_role metadata fields. Strong emphasis on version control and effective-date filtering in retrieval patterns. Chunking strategy recommending shorter chunks (200–300 chars) for precision over recall.",
    wowMoment:
      "The taxonomy design rationale — where the AI explains *why* it chose regulation-first rather than topic-first — is the insight moment. That's not something the client gets from a framework template.",
    launchPath: "/admin/ka-sprint?practice=2",
  },
  {
    title: "DevOps Runbook KB",
    context:
      "An engineering team with docs spread across Notion, GitHub, and Confluence. Highest-pressure use case: engineers need the right runbook within 2 minutes of an alert firing.",
    narration:
      "\"This is a high-pressure scenario — finding the wrong runbook during an outage costs money. The retrieval architecture here is completely different from the other two scenarios. Notice the metadata design.\"",
    inputs: [
      { label: "Domain", value: "Pre-loaded — DevOps runbooks, incident response playbooks, Kubernetes on AWS" },
      { label: "Structure", value: "Pre-loaded — Notion + GitHub READMEs + legacy Confluence, disconnected" },
      { label: "Use case", value: "Pre-loaded — runbook retrieval under 2 min during incidents, onboarding" },
      { label: "Target system", value: "Pre-loaded — PagerDuty integration, Slack /runbook command, on-call engineers" },
    ],
    expectedOutput:
      "Taxonomy organized by service name and failure mode rather than document type. Retrieval schema with service_name, severity_level, failure_category, last_tested, and owner metadata fields. Retrieval patterns emphasizing exact-match service-name filtering before semantic similarity. Chunking strategy recommending 150–250 char chunks — short, step-by-step runbook steps should stay atomic.",
    wowMoment:
      "The retrieval pattern recommendations explain *why* hybrid search (keyword + semantic) matters here vs. pure semantic search in the SaaS scenario. That technical reasoning is what separates a KA Sprint from a generic consulting answer.",
    launchPath: "/admin/ka-sprint?practice=3",
  },
];

const PROMPT_WORKSHOP_TEMPLATES = [
  {
    title: "Gap Analysis Executive Summary",
    category: "Consulting Deliverables",
    variables: ["client_name", "industry", "num_topics", "coverage_score", "critical_gaps", "high_gaps", "tone"],
    description: "Turns raw DocAudit scores into a polished executive summary. Feed it the numbers and it writes the narrative.",
  },
  {
    title: "KA Sprint Recommendation Memo",
    category: "Consulting Deliverables",
    variables: ["client_name", "current_structure", "use_case", "target_system", "timeline"],
    description: "Converts a KA Sprint output into a structured internal recommendation memo with a phased implementation roadmap.",
  },
  {
    title: "Stakeholder Briefing Email",
    category: "Client Communications",
    variables: ["recipient_name", "recipient_role", "company_name", "engagement_type", "overall_assessment", "top_strength", "priority_gap", "next_step", "word_count"],
    description: "Drafts a briefing email for a non-technical stakeholder after an audit or sprint. No jargon. Written for decision-makers.",
  },
  {
    title: "RAG Chunk Quality Evaluator",
    category: "Technical Prompts",
    variables: ["chunk_text"],
    description: "Evaluates a single document chunk for RAG suitability across three dimensions. Use during content audits to flag chunks that need reworking.",
  },
];

const RAG_SCENARIOS: Scenario[] = [
  {
    title: "KA Sprint Methodology Document",
    context:
      "A clean methodology document with clear phases, pricing, and requirements. Ideal first demo — you know exactly what questions have precise answers buried in the text.",
    narration:
      "\"I'll paste in Synaptica's own methodology document and then ask questions a client would ask during a discovery call. Watch how the source citations show exactly which chunk answered the question.\"",
    inputs: [
      { label: "Mode", value: "Paste Text" },
      { label: "Document", value: "Pre-loaded — KA Sprint Methodology v2.0" },
      { label: "Chunk size", value: "300 characters" },
      { label: "Overlap", value: "50 characters" },
    ],
    expectedOutput:
      "After ingestion: 8–12 chunks from the methodology text. Embeddings stored successfully. Switch to Chat tab. Each answer cites the specific chunk (Phase 1, Phase 2, Pricing, etc.) with a score ≥70%.",
    wowMoment:
      "Ask 'What does the client need to provide before the engagement starts?' — the answer cites the Engagement Requirements section with a high match score. Then ask something the document doesn't cover (e.g. 'What is the refund policy?') and the system declines to answer. That's retrieval honesty.",
    launchPath: "/admin/rag-pipeline?practice=1",
    questions: [
      "What happens during Phase 2 of the KA Sprint?",
      "How much does the Extended KA Sprint cost?",
      "What does the client need to provide before the engagement starts?",
    ],
  },
  {
    title: "SaaS Feature Specification",
    context:
      "A multi-section engineering spec with roles, criteria, rollback plans, and timelines. Tests cross-section retrieval — the spec contains answers that span multiple logical topics.",
    narration:
      "\"This is a feature spec for an authentication overhaul. I'll ask questions that test whether the system retrieves from the right section — acceptance criteria, rollback, user roles. Each answer should cite its source.\"",
    inputs: [
      { label: "Mode", value: "Paste Text" },
      { label: "Document", value: "Pre-loaded — Auth System Overhaul v3.0 Spec" },
      { label: "Chunk size", value: "400 characters" },
      { label: "Overlap", value: "80 characters" },
    ],
    expectedOutput:
      "12–18 chunks. The rollback question retrieves from the Rollback Plan section with high confidence (80%+). User roles question retrieves from the 'User Roles Affected' section. Testing question retrieves from Testing Requirements.",
    wowMoment:
      "Ask 'What is the rollback plan if authentication fails?' — the answer is specific and cites the correct chunk. Then ask 'When does beta start?' — the system extracts the exact timeline detail. Precision retrieval from a dense technical document.",
    launchPath: "/admin/rag-pipeline?practice=2",
    questions: [
      "What is the rollback plan if authentication fails after deployment?",
      "Which user roles are affected by the SSO feature?",
      "What testing is required before the feature can be deployed?",
    ],
  },
  {
    title: "Employee Onboarding Handbook",
    context:
      "A realistic HR handbook with policies across benefits, equipment, remote work, and reviews. Tests multi-topic retrieval — questions about specific policies from different sections.",
    narration:
      "\"This is an employee handbook — a classic dense knowledge base. I'll ask the kinds of questions a new hire would actually ask on day one. Notice how each answer is grounded in the specific policy text.\"",
    inputs: [
      { label: "Mode", value: "Paste Text" },
      { label: "Document", value: "Pre-loaded — Northstar Technologies Onboarding Handbook" },
      { label: "Chunk size", value: "500 characters" },
      { label: "Overlap", value: "100 characters" },
    ],
    expectedOutput:
      "10–15 chunks. PTO question retrieves from Benefits section with specific accrual rate and no-waiting-period detail. Equipment question retrieves IT portal name and 3-business-day timeline. IT support question retrieves specific response time SLAs.",
    wowMoment:
      "Ask 'How quickly does IT support respond to urgent issues?' — the system retrieves the 1-hour SLA for system-down issues specifically, not the 4-hour standard SLA. That specificity — the right number from the right policy — is the RAG value proposition in one answer.",
    launchPath: "/admin/rag-pipeline?practice=3",
    questions: [
      "How much PTO do I get and when can I start using it?",
      "How do I request a laptop and how long does setup take?",
      "How quickly does IT support respond to urgent issues?",
    ],
  },
];

const SEOSCOPE_SCENARIOS: Scenario[] = [
  {
    title: "SaaS Product Homepage — Full SEO Audit",
    context: "A knowledge management SaaS homepage with decent content but untested SEO. Classic scenario: well-written copy that isn't optimised for search.",
    narration: "\"This is a SaaS product page — it's well-written but nobody has ever run an SEO audit on it. Watch what the Full Audit finds in terms of keyword placement, E-E-A-T signals, and meta element gaps.\"",
    inputs: [
      { label: "Mode", value: "Full SEO Audit (pre-selected)" },
      { label: "Content", value: "Pre-loaded — knowledge management SaaS product page" },
      { label: "Keywords", value: "Pre-loaded — knowledge management software, team documentation platform" },
    ],
    expectedOutput: "Score breakdown across keyword density, content quality, E-E-A-T signals, and technical elements. Likely gaps: thin title/meta descriptions, missing schema markup, suboptimal heading hierarchy, keyword clusters not fully exploited.",
    wowMoment: "The keyword gap analysis shows which semantic clusters are missing entirely — e.g. the page talks about 'knowledge' but never clusters around 'internal wiki', 'employee onboarding', or 'SOP management'. That's the insight the client's marketing team couldn't see without the tool.",
    launchPath: "/admin/seoscope?practice=1",
  },
  {
    title: "Technical Blog Post — Keyword Analysis",
    context: "A well-structured RAG tutorial. The author knows the topic deeply but doesn't think about SEO. This shows how expert content can fail on search despite quality.",
    narration: "\"This is a technical tutorial — genuinely good content, well structured. Let's run just the Keyword Analysis to show where search opportunity is being left on the table.\"",
    inputs: [
      { label: "Mode", value: "Keyword Analysis (pre-selected)" },
      { label: "Content", value: "Pre-loaded — RAG pipeline tutorial blog post" },
      { label: "Keywords", value: "Pre-loaded — RAG pipeline tutorial, retrieval augmented generation guide" },
    ],
    expectedOutput: "Primary keyword appears in intro but not H2 subheadings. Semantic variations underused. Long-tail opportunities (step-by-step, beginner guide, with examples) unaddressed. TF-IDF shows high keyword density in one section, near-zero in others.",
    wowMoment: "The tool shows where the target keyword appears zero times across sections that are clearly about that topic — the author just used different words. The rewrite recommendations are specific and immediately actionable.",
    launchPath: "/admin/seoscope?practice=2",
  },
  {
    title: "Consulting Landing Page — Content Quality",
    context: "A professional services landing page with solid positioning but E-E-A-T signals that could be stronger. Common for B2B service businesses.",
    narration: "\"This is our own positioning page — let's see how the Content Quality audit scores it. A great demo for marketing-minded clients who care about Google's E-E-A-T framework.\"",
    inputs: [
      { label: "Mode", value: "Content Quality (pre-selected)" },
      { label: "Content", value: "Pre-loaded — Synaptica knowledge architecture consulting page" },
      { label: "Keywords", value: "Pre-loaded — knowledge architecture consulting, RAG consulting" },
    ],
    expectedOutput: "Strong on expertise signals (specific methodology, pricing, deliverables listed). Weaker on authority (no case studies, no named clients) and trust (no testimonials). Recommendations focus on proof elements.",
    wowMoment: "'Add 2–3 client results with specific metrics' scores higher than 'add an author bio' in the recommendations — that's a defensible, prioritised action the client's marketing team can act on immediately.",
    launchPath: "/admin/seoscope?practice=3",
  },
];

const DOCSCOPE_SCENARIOS: Scenario[] = [
  {
    title: "Customer Success Runbook — Full Scan",
    context: "A real-looking CS escalation runbook. Appears complete but the Full Intelligence Scan surfaces what's implied versus what's actually documented.",
    narration: "\"This is an enterprise account escalation runbook — it looks well-structured. Let's run the Full Intelligence Scan and see what the tool finds beyond what a human reviewer would catch.\"",
    inputs: [
      { label: "Mode", value: "Full Intelligence Scan (pre-selected)" },
      { label: "Content", value: "Pre-loaded — enterprise account escalation runbook" },
    ],
    expectedOutput: "Gaps: no SLA for recovery plan creation, no definition of 'measurable milestones', no escalation path if the Director also doesn't respond. Structure issues: some steps define outcomes without assigning owners. Quality: passive voice in several steps obscures who is responsible.",
    wowMoment: "The AI finds the accountability gap — 'assign an owner to each milestone' is mentioned but there's no guidance on who assigns it. That ambiguity causes teams to fail under pressure, and it's invisible in a manual review.",
    launchPath: "/admin/docscope?practice=1",
  },
  {
    title: "API Documentation — Inconsistency Scan",
    context: "A technical API reference with deliberate contradictions built in. The Inconsistencies scan is a sharp demo — the tool finds exactly what it's looking for and quotes both sides.",
    narration: "\"This API reference has some inconsistencies deliberately left in. Let's run the Inconsistencies scan and see if the tool catches all of them — and how specifically it quotes them.\"",
    inputs: [
      { label: "Mode", value: "Inconsistencies (pre-selected)" },
      { label: "Content", value: "Pre-loaded — Document Parsing Service API reference" },
    ],
    expectedOutput: "Should catch: (1) maximum input size stated as 100,000 characters then contradicted as 80,000 in the same document; (2) expired keys described as returning 401 in the auth section but 403 on the /parse endpoint. Both contradictions quoted with the conflicting statements side by side.",
    wowMoment: "The tool quotes both conflicting statements verbatim. A developer relying on this docs could waste hours debugging a 403 they expected to be a 401 — the contradiction was hiding in plain sight.",
    launchPath: "/admin/docscope?practice=2",
  },
  {
    title: "Project Brief — Structure & Flow",
    context: "A project brief that looks complete but buries an undefined budget, unassigned success metric baselines, and an unnassigned owner. Structure mode is precise.",
    narration: "\"This project brief looks solid at a glance — scope, timeline, goals. Let's run Structure & Flow and see what the organisational analysis finds.\"",
    inputs: [
      { label: "Mode", value: "Structure & Flow (pre-selected)" },
      { label: "Content", value: "Pre-loaded — internal knowledge base migration brief" },
    ],
    expectedOutput: "Issues: Goals section is vague despite a detailed Background. Budget appears as 'not yet defined' for an approved project. Success metrics listed without baselines or targets. Owner field is unassigned. Timeline appears before scope, reversing the logical dependency.",
    wowMoment: "The tool flags 'Budget: not yet defined' for a project already in scope — that's a real risk the brief author almost certainly knows about but buried. Surfacing it structurally rather than editorially is what makes DocScope a tool rather than a proofreader.",
    launchPath: "/admin/docscope?practice=3",
  },
];

const DOCFORGE_SCENARIOS: Scenario[] = [
  {
    title: "Discovery Call Notes → Executive Brief",
    context: "Raw meeting notes from a discovery call — exactly what you'd have 10 minutes after hanging up. DocForge turns them into something the client can share internally.",
    narration: "\"I just got off a discovery call with a logistics company. These are my raw notes. Watch DocForge reformat them into an executive brief I can send to the CTO tonight — without writing a single sentence myself.\"",
    inputs: [
      { label: "Format", value: "Executive Brief (pre-selected)" },
      { label: "Title", value: "Pre-loaded — Vertex Logistics Discovery Call Summary" },
      { label: "Branding", value: "Pre-loaded — Synaptica, plain-English for a non-technical CTO" },
      { label: "Content", value: "Pre-loaded — raw discovery call notes" },
    ],
    expectedOutput: "A structured 1–2 page brief: problem summary in plain English, tech stack context, stated goals, agreed next steps with owners. No jargon. Reads like something prepared, not meeting notes reformatted.",
    wowMoment: "The client receives a document in their inbox that makes you look prepared and professional — 30 minutes after the call ended. That turnaround is impossible without the tool, and the quality is indistinguishable from something written fresh.",
    launchPath: "/admin/docforge?practice=1",
  },
  {
    title: "Audit Findings → Consulting Report",
    context: "Raw DocAudit score output — numbers, topic breakdowns, recommendations. DocForge transforms them into a polished consulting report ready to share with a VP.",
    narration: "\"Here are the raw DocAudit findings for a client: numbers, percentages, category names. Let's turn them into a structured consulting report in one click.\"",
    inputs: [
      { label: "Format", value: "Consulting Report (pre-selected)" },
      { label: "Title", value: "Pre-loaded — Northstar Technologies Gap Analysis Report" },
      { label: "Branding", value: "Pre-loaded — Synaptica, professional tone for a VP of Engineering" },
      { label: "Content", value: "Pre-loaded — DocAudit output for Northstar Tech KB" },
    ],
    expectedOutput: "Executive summary with overall score prominently featured. Findings organised by priority (Critical → High → Medium), not alphabetically. Each item has a 1-sentence recommendation. Closes with next steps that reference the engagement.",
    wowMoment: "The report structures recommendations as a prioritised roadmap, not a flat list. That's the consulting value-add — turning data into a decision-making document the client can take to their team without Synaptica in the room.",
    launchPath: "/admin/docforge?practice=2",
  },
  {
    title: "Project Notes → Proposal",
    context: "Raw scope notes for a healthcare client engagement. The proposal format is the most client-facing — clear scope, professional tone, explicit timeline and investment.",
    narration: "\"These are my internal notes for a healthcare engagement. Let me turn them into a proposal I can send to the Director of Digital Health before end of day.\"",
    inputs: [
      { label: "Format", value: "Proposal (pre-selected)" },
      { label: "Title", value: "Pre-loaded — KA Sprint Proposal for Meridian Health" },
      { label: "Branding", value: "Pre-loaded — Synaptica, formal tone for a healthcare organisation" },
      { label: "Content", value: "Pre-loaded — raw project scope notes" },
    ],
    expectedOutput: "Structured proposal: background and problem statement, proposed approach, deliverables list, timeline, investment breakdown with payment terms, assumptions. Formal enough for healthcare procurement. Clear enough that the client knows exactly what they're buying.",
    wowMoment: "The investment section formats payment terms correctly without prompting — '50% on project start, 50% on deliverable acceptance' becomes a clean table. The AI inferred standard professional services billing from context. That's domain knowledge making the output feel authored, not generated.",
    launchPath: "/admin/docforge?practice=3",
  },
];

const DIFFLENS_SCENARIOS: Scenario[] = [
  {
    title: "SLA Revision — 2024 → 2025",
    context: "Two versions of the same SLA separated by a year. The kind of revision that matters in renewal negotiations — exact SLA changes are often buried in dense documents.",
    narration: "\"This is a client's SLA from last year versus this year. Let me show you how DiffLens makes every change visible in seconds — no more hunting through two PDFs.\"",
    inputs: [
      { label: "Document A", value: "Pre-loaded — SLA Support Tiers, January 2024" },
      { label: "Document B", value: "Pre-loaded — SLA Support Tiers, January 2025" },
    ],
    expectedOutput: "Side-by-side diff: Standard tier P1/P2 response improved. Premium response tightened, account manager added conditionally. Enterprise response times halved, P2 coverage added 24/7, video bridge added, uptime SLA raised 99.5%→99.9%, credits clause added entirely.",
    wowMoment: "The uptime change — 99.5% to 99.9% — is easy to miss in a document scan but immediately obvious in the diff. That's 3.6 hours/month of additional downtime allowance eliminated. A procurement team reviewing this manually would likely miss it.",
    launchPath: "/admin/difflens?practice=1",
  },
  {
    title: "API Docs — v1 to v2 Migration",
    context: "v1 and v2 of the same API endpoint. Developers need to know exactly what changed — new parameters, changed response shapes, new error codes — without reading both documents end to end.",
    narration: "\"A client is migrating from v1 to v2 of an API. DiffLens shows every parameter addition, response shape change, and new error code at a glance — no migration guide required.\"",
    inputs: [
      { label: "Document A", value: "Pre-loaded — POST /api/v1/analyze reference" },
      { label: "Document B", value: "Pre-loaded — POST /api/v2/analyze reference" },
    ],
    expectedOutput: "Diffs: rate limit added; two new request parameters; response object gains chunk_count, recommendations array, processing_time_ms, model fields; new 429 error with Retry-After header; 400 now includes field-level validation detail.",
    wowMoment: "The recommendations field change — string in v1, array inside each gap object in v2 — is visible as a structural change, not just a wording change. A developer updating their integration can see exactly what broke without a migration guide.",
    launchPath: "/admin/difflens?practice=2",
  },
  {
    title: "Remote Work Policy — 2-Year Update",
    context: "A company's remote work policy from 2023 versus 2025. Policy documents are dense — this shows how DiffLens surfaces compliance changes and entirely new sections instantly.",
    narration: "\"HR updated the remote work policy. Let's compare the two versions — in a real company this is a compliance task, not a reading exercise.\"",
    inputs: [
      { label: "Document A", value: "Pre-loaded — Remote Work Policy, March 2023" },
      { label: "Document B", value: "Pre-loaded — Remote Work Policy, January 2025" },
    ],
    expectedOutput: "Eligibility expanded to part-time and contractors. Core hours extended. Video made optional for internal meetings. $500 home office stipend added. VPN requirement relaxed. New 'Mental Health & Boundaries' section appears as a solid green block. After-hours expectation explicitly removed.",
    wowMoment: "The new 'Mental Health & Boundaries' section shows as a solid green addition — an entirely new employee right the person would never notice re-reading a document they already know. DiffLens makes invisible additions visible.",
    launchPath: "/admin/difflens?practice=3",
  },
];

const KA_TOOL_SCENARIOS: Scenario[] = [
  {
    title: "Gap Analyzer — Support Ticket Triage",
    context: "Open the Gap Analyzer tab with sample support tickets — the AI identifies which knowledge topics are missing based on what users are actually asking. Create and ingest a KB first.",
    narration: "\"I have five support tickets from this client's users — real questions they couldn't answer from existing docs. The Gap Analyzer shows which knowledge areas those tickets expose.\"",
    inputs: [
      { label: "Setup", value: "Click 'Knowledge Bases' in header → create a KB → ingest any content" },
      { label: "Tab", value: "Gap Analyzer (auto-opened by Launch & Load)" },
      { label: "Tickets", value: "Copy from the 'Sample tickets' section below and paste into the Tickets field" },
    ],
    expectedOutput: "Gap analysis by ticket theme: account data handling (cancellation/export), access management (ownership transfer), plan change impacts. Each gap maps to the specific ticket that surfaces it. Recommendations list the exact documentation topics missing.",
    wowMoment: "The tool connects each knowledge gap to a real user question. The client sees exactly which missing documentation is causing support load — not 'you're missing X topics' but 'these 5 tickets exist because X is undocumented'.",
    launchPath: "/admin/knowledge-arch?practice=1",
    questions: [
      "Ticket #1041: Can't find what happens to my data if I cancel. Sales said 30-day retention, website says immediately deleted.",
      "Ticket #1089: How do I export all my data before leaving? Is there a bulk export option?",
      "Ticket #1102: What's the difference between deactivating and deleting? I want to pause, not delete.",
      "Ticket #1134: If I downgrade from Enterprise to Standard, what happens to my custom fields and integrations?",
      "Ticket #1156: Need to transfer admin ownership to a colleague. Settings > Team shows no ownership transfer option.",
    ],
    questionLabel: "Sample tickets to paste",
  },
  {
    title: "FAQ Builder — Developer Onboarding",
    context: "Build a developer-specific FAQ from a KB. Shows how the same knowledge base produces completely different FAQs for different audiences — same data, different document.",
    narration: "\"I'll show how the FAQ Builder generates a developer-specific FAQ from the same KB — different questions, different tone. This is the 'one KB, many audiences' value proposition.\"",
    inputs: [
      { label: "Setup", value: "Select your KB from the dropdown in the FAQ Builder" },
      { label: "Tab", value: "FAQ Builder (auto-opened by Launch & Load)" },
      { label: "Audience", value: "Type: mid-level software engineers, new to the codebase, familiar with REST APIs" },
      { label: "Context", value: "Type: first week — local dev setup, understanding architecture, running existing tests" },
    ],
    expectedOutput: "10–15 developer-specific FAQ items covering environment setup, codebase orientation, testing workflow, and common first-week friction points. Questions phrased as a developer would ask them, not as a marketing page would write them.",
    wowMoment: "Compare the developer FAQ to one generated for 'customer success managers, new to the product' from the same KB. Completely different tone, vocabulary, and question types — same knowledge base, two different documents. That's the value in one comparison.",
    launchPath: "/admin/knowledge-arch?practice=2",
  },
  {
    title: "Semantic Search — Intent-Based Queries",
    context: "Search the KB using natural language rather than keywords to demonstrate that semantic search retrieves meaning, not just matching words.",
    narration: "\"I'll search using natural language the way a user would actually phrase it — not keyword searches. Semantic retrieval finds intent, and I'll show the difference by phrasing the same question three different ways.\"",
    inputs: [
      { label: "Setup", value: "Select your KB from the dropdown in Semantic Search" },
      { label: "Tab", value: "Semantic Search (auto-opened by Launch & Load)" },
      { label: "Queries", value: "Try the sample queries below — phrased as a user, not as a search engine" },
    ],
    expectedOutput: "Each query returns ranked results with similarity scores. The same underlying content should be retrieved whether the user asks 'cancel my account', 'stop using the service', or 'how do I leave' — demonstrating semantic rather than keyword matching.",
    wowMoment: "Run 'steps to give someone else control of my account' — it should retrieve the same ownership content as 'transfer admin rights'. The user didn't use any words from the documentation, and the system still found the right answer. That's the semantic search demo moment.",
    launchPath: "/admin/knowledge-arch?practice=3",
    questions: [
      "what do I do when a customer asks for their data back",
      "steps to give someone else control of my account",
      "difference between stopping and removing my account",
    ],
    questionLabel: "Sample queries to try",
  },
];

interface SectionProps {
  icon: React.ReactNode;
  color: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

function ToolSection({ icon, color, title, subtitle, children }: SectionProps) {
  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${color}`}>
        <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-neutral-900">
          {icon}
        </div>
        <div>
          <h2 className="font-semibold text-neutral-100">{title}</h2>
          <p className="text-sm text-neutral-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

interface ScenarioCardProps {
  scenario: Scenario;
  index: number;
  onLaunch: (path: string) => void;
}

function ScenarioCard({ scenario, index, onLaunch }: ScenarioCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-neutral-800/40 transition-colors"
      >
        <span className="text-xs font-mono font-bold text-neutral-500 bg-neutral-800 px-2 py-1 rounded mt-0.5 flex-shrink-0">
          #{index}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-neutral-100">{scenario.title}</p>
          <p className="text-sm text-neutral-400 mt-0.5 leading-relaxed">{scenario.context}</p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-1" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-neutral-800 pt-4">
          <div className="bg-amber-950/30 border border-amber-900/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">What to say</span>
            </div>
            <p className="text-sm text-neutral-300 italic leading-relaxed">{scenario.narration}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Inputs</p>
            <div className="space-y-1.5">
              {scenario.inputs.map((inp) => (
                <div key={inp.label} className="flex items-start gap-3">
                  <span className="text-xs font-medium text-neutral-500 w-20 flex-shrink-0 pt-0.5">{inp.label}</span>
                  <span className="text-sm text-neutral-300 leading-relaxed">{inp.value}</span>
                </div>
              ))}
            </div>
          </div>

          {scenario.questions && scenario.questions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">{scenario.questionLabel ?? "Suggested questions to ask"}</p>
              <div className="space-y-1.5">
                {scenario.questions.map((q) => (
                  <div key={q} className="flex items-start gap-2">
                    <span className="text-neutral-600 mt-1">›</span>
                    <span className="text-sm text-neutral-300 italic">"{q}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">What to expect</p>
            <p className="text-sm text-neutral-400 leading-relaxed">{scenario.expectedOutput}</p>
          </div>

          <div className="flex items-start gap-2.5 bg-emerald-950/30 border border-emerald-900/30 rounded-lg p-3">
            <Target className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-1">The wow moment</p>
              <p className="text-sm text-neutral-300 leading-relaxed">{scenario.wowMoment}</p>
            </div>
          </div>

          <button
            onClick={() => onLaunch(scenario.launchPath)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            Launch & Load Scenario
          </button>
        </div>
      )}
    </div>
  );
}

export default function PracticeKit() {
  const [, setLocation] = useLocation();
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ added: string[]; skipped: number; message: string } | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  const handleLaunch = (path: string) => {
    setLocation(path);
  };

  const seedPrompts = async () => {
    setSeeding(true);
    setSeedError(null);
    setSeedResult(null);
    try {
      const res = await fetch("/api/admin/practice/seed-prompts", {
        method: "POST",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to seed templates");
      const data = await res.json();
      setSeedResult(data);
    } catch {
      setSeedError("Failed to seed templates. Make sure you are logged in.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <div>
          <button
            onClick={() => setLocation("/admin")}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-neutral-100">Practice Kit</h1>
              <p className="text-sm text-neutral-400">Curated scenarios for each tool — practice until the flow is fluent</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-neutral-400 leading-relaxed">
            Each scenario below has a click-through narration guide, exact inputs, and a description of what a good result looks like.
            Click <strong className="text-neutral-300">Launch & Load</strong> to open the tool with that scenario pre-filled —
            no copy-pasting needed. Run it, narrate it, note where you feel uncertain, and repeat until it's automatic.
          </div>
        </div>

        <ToolSection
          icon={<FileSearch className="w-5 h-5 text-rose-400" />}
          color="border-rose-900/40 bg-rose-950/10"
          title="DocAudit — Documentation Gap Analysis"
          subtitle="Practice showing clients what's missing from their knowledge base and why it matters"
        >
          <div className="space-y-3">
            {DOCAUDIT_SCENARIOS.map((s, i) => (
              <ScenarioCard key={s.title} scenario={s} index={i + 1} onLaunch={handleLaunch} />
            ))}
          </div>
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-500 leading-relaxed">
            <strong className="text-neutral-400">After running all three:</strong> notice how the radar chart shape changes between scenarios — sparse vs. balanced vs. surgical gaps. Being able to explain why different inputs produce different shapes is a key presentation skill.
          </div>
        </ToolSection>

        <ToolSection
          icon={<Network className="w-5 h-5 text-blue-400" />}
          color="border-blue-900/40 bg-blue-950/10"
          title="KA Sprint — Knowledge Architecture Sprint"
          subtitle="Practice narrating the 4-stage process and explaining why each output looks the way it does"
        >
          <div className="space-y-3">
            {KASPRINT_SCENARIOS.map((s, i) => (
              <ScenarioCard key={s.title} scenario={s} index={i + 1} onLaunch={handleLaunch} />
            ))}
          </div>
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-500 leading-relaxed">
            <strong className="text-neutral-400">Advanced practice:</strong> run all three scenarios back to back and compare the taxonomy outputs. Being able to explain *why* the SaaS taxonomy is product-category-first, the compliance taxonomy is regulation-first, and the runbook taxonomy is service-name-first is the core intellectual value you sell.
          </div>
        </ToolSection>

        <ToolSection
          icon={<Wand2 className="w-5 h-5 text-purple-400" />}
          color="border-purple-900/40 bg-purple-950/10"
          title="Prompt Engineering Workshop"
          subtitle="Seed your library with 4 consulting-grade templates and a Synaptica style guide, then practice live substitution"
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-5">
            <div>
              <p className="text-sm text-neutral-400 leading-relaxed mb-4">
                Unlike the other tools, the workshop's practice mode seeds your prompt library rather than pre-filling a form.
                Click below to add the four templates and load the Synaptica style guide. Each template is tagged, categorized, and ready to test.
              </p>

              {seedResult ? (
                <div className="flex items-start gap-2.5 bg-emerald-950/30 border border-emerald-900/40 rounded-lg p-3 mb-4">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-emerald-300 font-medium">{seedResult.message}</p>
                    {seedResult.added.length > 0 && (
                      <p className="text-xs text-emerald-400/70 mt-1">Added: {seedResult.added.join(", ")}</p>
                    )}
                    {seedResult.skipped > 0 && (
                      <p className="text-xs text-neutral-500 mt-0.5">{seedResult.skipped} template(s) already existed — not duplicated.</p>
                    )}
                  </div>
                </div>
              ) : seedError ? (
                <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/30 rounded-lg p-3 mb-4">{seedError}</div>
              ) : null}

              <button
                onClick={seedPrompts}
                disabled={seeding}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {seeding ? "Seeding…" : "Seed Practice Templates + Style Guide"}
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">What gets added</p>
              {PROMPT_WORKSHOP_TEMPLATES.map((tpl) => (
                <div key={tpl.title} className="border border-neutral-800 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <p className="text-sm font-medium text-neutral-200">{tpl.title}</p>
                    <span className="text-xs text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded flex-shrink-0">{tpl.category}</span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-2 leading-relaxed">{tpl.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tpl.variables.map((v) => (
                      <span key={v} className="text-xs font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Practice sequence</p>
              <ol className="space-y-1.5 text-sm text-neutral-400">
                <li className="flex items-start gap-2"><span className="text-neutral-600 font-mono text-xs mt-0.5">1.</span>Open Prompt Workshop → Library tab</li>
                <li className="flex items-start gap-2"><span className="text-neutral-600 font-mono text-xs mt-0.5">2.</span>Select "Gap Analysis Executive Summary" → click Test</li>
                <li className="flex items-start gap-2"><span className="text-neutral-600 font-mono text-xs mt-0.5">3.</span>Fill in the variables with realistic values (use DocAudit scenario 1 results)</li>
                <li className="flex items-start gap-2"><span className="text-neutral-600 font-mono text-xs mt-0.5">4.</span>Run with style guide ON, then run without it — explain the difference to yourself</li>
                <li className="flex items-start gap-2"><span className="text-neutral-600 font-mono text-xs mt-0.5">5.</span>Try the RAG Chunk Quality Evaluator with a chunk from the RAG Pipeline scenarios</li>
              </ol>
            </div>

            <div className="flex items-start gap-2.5 bg-emerald-950/30 border border-emerald-900/30 rounded-lg p-3">
              <Target className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-1">The wow moment</p>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Run the Gap Analysis Executive Summary with "direct" tone vs. "diplomatic" tone using the same audit numbers. Show the client two completely different documents from the same data. That's the variable substitution value prop in 30 seconds.
                </p>
              </div>
            </div>

            <button
              onClick={() => setLocation("/admin/prompt-workshop")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-700/40 text-purple-300 rounded-lg text-sm font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              Open Prompt Workshop
            </button>
          </div>
        </ToolSection>

        <ToolSection
          icon={<Database className="w-5 h-5 text-teal-400" />}
          color="border-teal-900/40 bg-teal-950/10"
          title="RAG Pipeline — Retrieval-Augmented Generation"
          subtitle="Practice the ingest-then-query flow and narrating what source citations mean"
        >
          <div className="space-y-3">
            {RAG_SCENARIOS.map((s, i) => (
              <ScenarioCard key={s.title} scenario={s} index={i + 1} onLaunch={handleLaunch} />
            ))}
          </div>
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-500 leading-relaxed">
            <strong className="text-neutral-400">Practice note:</strong> the score badges (emerald = 80%+, blue = 60%+, amber = 40%+) are worth explaining during a demo.
            A prospect who understands what "87% similarity" means in a citation understands why you charge what you charge for an architecture that produces those numbers.
          </div>
        </ToolSection>

        <ToolSection
          icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
          color="border-amber-900/40 bg-amber-950/10"
          title="SEOScope — Content & SEO Analysis"
          subtitle="Practice running keyword, content quality, and full SEO audits on real-sounding pages"
        >
          <div className="space-y-3">
            {SEOSCOPE_SCENARIOS.map((s, i) => (
              <ScenarioCard key={s.title} scenario={s} index={i + 1} onLaunch={handleLaunch} />
            ))}
          </div>
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-500 leading-relaxed">
            <strong className="text-neutral-400">Practice note:</strong> each scenario pre-loads a different analysis mode (Full, Keyword, Content Quality). Run all three back to back to see how the output structure changes — the mode selection is the first thing to explain to a client.
          </div>
        </ToolSection>

        <ToolSection
          icon={<ScanSearch className="w-5 h-5 text-cyan-400" />}
          color="border-cyan-900/40 bg-cyan-950/10"
          title="DocScope — Intel Engine"
          subtitle="Practice structured document intelligence: gaps, inconsistencies, and structure analysis"
        >
          <div className="space-y-3">
            {DOCSCOPE_SCENARIOS.map((s, i) => (
              <ScenarioCard key={s.title} scenario={s} index={i + 1} onLaunch={handleLaunch} />
            ))}
          </div>
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-500 leading-relaxed">
            <strong className="text-neutral-400">Advanced practice:</strong> scenario 2 has deliberate contradictions baked into the document. Before running it, tell yourself which inconsistencies you spotted manually — then see how many the tool finds and how specifically it quotes them.
          </div>
        </ToolSection>

        <ToolSection
          icon={<FileOutput className="w-5 h-5 text-violet-400" />}
          color="border-violet-900/40 bg-violet-950/10"
          title="DocForge — Document Generation"
          subtitle="Practice turning raw notes and audit data into polished client-ready documents"
        >
          <div className="space-y-3">
            {DOCFORGE_SCENARIOS.map((s, i) => (
              <ScenarioCard key={s.title} scenario={s} index={i + 1} onLaunch={handleLaunch} />
            ))}
          </div>
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-500 leading-relaxed">
            <strong className="text-neutral-400">Practice note:</strong> after DocForge generates a document, try exporting it as PDF and DOCX. Being able to hand over a branded PDF at the end of a demo call is a concrete close — the client walks away with something tangible.
          </div>
        </ToolSection>

        <ToolSection
          icon={<GitCompare className="w-5 h-5 text-orange-400" />}
          color="border-orange-900/40 bg-orange-950/10"
          title="DiffLens — Document Comparison"
          subtitle="Practice showing clients exactly what changed between two document versions in seconds"
        >
          <div className="space-y-3">
            {DIFFLENS_SCENARIOS.map((s, i) => (
              <ScenarioCard key={s.title} scenario={s} index={i + 1} onLaunch={handleLaunch} />
            ))}
          </div>
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-500 leading-relaxed">
            <strong className="text-neutral-400">Practice note:</strong> after the diff loads, use the change navigation arrows (↑↓) to jump between changes. Being fluent with the navigation — not hunting for changes by scrolling — is what makes the demo feel effortless.
          </div>
        </ToolSection>

        <ToolSection
          icon={<BookOpen className="w-5 h-5 text-lime-400" />}
          color="border-lime-900/40 bg-lime-950/10"
          title="Knowledge Architecture — 5-Tool Suite"
          subtitle="Practice the Gap Analyzer, FAQ Builder, and Semantic Search flows using sample inputs"
        >
          <div className="space-y-3">
            {KA_TOOL_SCENARIOS.map((s, i) => (
              <ScenarioCard key={s.title} scenario={s} index={i + 1} onLaunch={handleLaunch} />
            ))}
          </div>
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-500 leading-relaxed">
            <strong className="text-neutral-400">Setup note:</strong> all three scenarios require at least one Knowledge Base to exist. Click 'Knowledge Bases' in the KA header → create a KB → ingest any of the RAG Pipeline practice documents. Then return here and launch the scenario.
          </div>
        </ToolSection>

      </div>
    </div>
  );
}
