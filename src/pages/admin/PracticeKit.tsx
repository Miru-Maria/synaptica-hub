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
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Suggested questions to ask</p>
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
            A prospect who understands what "87% similarity" means in a citation is a prospect who understands why you charge what you charge for an architecture that produces those numbers.
          </div>
        </ToolSection>

      </div>
    </div>
  );
}
