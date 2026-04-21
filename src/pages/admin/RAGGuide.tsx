import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  Cpu,
  Database,
  GitBranch,
  Layers,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Users,
  Zap,
  Search,
  FileText,
  Box,
} from "lucide-react";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const SECTIONS = [
  { id: "what-is-rag", label: "What is RAG?", icon: BookOpen },
  { id: "architecture", label: "The Architecture", icon: Layers },
  { id: "chunking", label: "Chunking Strategy", icon: FileText },
  { id: "embeddings", label: "Embeddings", icon: Cpu },
  { id: "vector-databases", label: "Vector Databases", icon: Database },
  { id: "retrieval", label: "Retrieval Strategy", icon: Search },
  { id: "generation", label: "Generation & Prompting", icon: MessageSquare },
  { id: "best-practices", label: "Best Practices", icon: CheckCircle },
  { id: "failure-modes", label: "Failure Modes", icon: AlertTriangle },
  { id: "client-guide", label: "Client Conversation Guide", icon: Users },
];

function Callout({ type, children }: { type: "info" | "tip" | "warn" | "key"; children: React.ReactNode }) {
  const styles = {
    info: "border-blue-500/40 bg-blue-950/30 text-blue-200",
    tip: "border-emerald-500/40 bg-emerald-950/30 text-emerald-200",
    warn: "border-amber-500/40 bg-amber-950/30 text-amber-200",
    key: "border-purple-500/40 bg-purple-950/30 text-purple-200",
  };
  const labels = { info: "Note", tip: "Tip", warn: "Watch out", key: "Key concept" };
  return (
    <div className={`border-l-2 rounded-r-lg px-4 py-3 mb-4 text-sm ${styles[type]}`}>
      <span className="font-semibold uppercase tracking-wider text-xs opacity-70 block mb-1">{labels[type]}</span>
      {children}
    </div>
  );
}

function SectionTitle({ id, icon: Icon, children }: { id: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-3 text-xl font-bold text-white mb-5 mt-12 scroll-mt-24 border-b border-neutral-800 pb-3">
      <span className="p-1.5 rounded-lg bg-neutral-800">
        <Icon className="w-5 h-5 text-emerald-400" />
      </span>
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-white mt-6 mb-2">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-neutral-300 text-sm leading-relaxed mb-3">{children}</p>;
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="font-mono text-xs bg-neutral-800 text-emerald-300 px-1.5 py-0.5 rounded">{children}</code>;
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-xs font-mono text-emerald-300 overflow-x-auto mb-4 leading-relaxed whitespace-pre">
      {children}
    </pre>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-neutral-700">
            {headers.map((h) => (
              <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-neutral-800 hover:bg-neutral-800/40 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 px-3 text-neutral-300 text-xs">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FlowDiagram() {
  const steps = [
    { label: "Raw Documents", sub: "PDFs, Word, Notion, web pages", icon: FileText, color: "bg-neutral-800 border-neutral-700" },
    { label: "Clean & Chunk", sub: "Split into overlapping segments", icon: GitBranch, color: "bg-neutral-800 border-neutral-700" },
    { label: "Embed", sub: "Convert text → vector numbers", icon: Cpu, color: "bg-neutral-800 border-neutral-700" },
    { label: "Store", sub: "Save in a vector database", icon: Database, color: "bg-neutral-800 border-neutral-700" },
    { label: "Query", sub: "User asks a question", icon: MessageSquare, color: "bg-emerald-950 border-emerald-800" },
    { label: "Retrieve", sub: "Find the most similar chunks", icon: Search, color: "bg-emerald-950 border-emerald-800" },
    { label: "Generate", sub: "LLM answers using those chunks", icon: Zap, color: "bg-emerald-950 border-emerald-800" },
  ];
  return (
    <div className="mb-6 mt-4">
      <div className="flex flex-col gap-0">
        <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3 font-semibold">Ingestion Pipeline</p>
        <div className="flex flex-wrap gap-2 items-center mb-2">
          {steps.slice(0, 4).map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`border rounded-lg px-3 py-2 flex items-center gap-2 ${step.color}`}>
                <step.icon className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white">{step.label}</p>
                  <p className="text-xs text-neutral-500">{step.sub}</p>
                </div>
              </div>
              {i < 3 && <ChevronRight className="w-4 h-4 text-neutral-600 shrink-0" />}
            </div>
          ))}
        </div>
        <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3 mt-4 font-semibold">Retrieval + Generation Pipeline (at query time)</p>
        <div className="flex flex-wrap gap-2 items-center">
          {steps.slice(4).map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`border rounded-lg px-3 py-2 flex items-center gap-2 ${step.color}`}>
                <step.icon className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white">{step.label}</p>
                  <p className="text-xs text-neutral-500">{step.sub}</p>
                </div>
              </div>
              {i < 2 && <ChevronRight className="w-4 h-4 text-neutral-600 shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RAGGuide() {
  const [, setLocation] = useLocation();
  const [authed, setAuthed] = useState(false);
  const [activeSection, setActiveSection] = useState("what-is-rag");
  const contentRef = useRef<HTMLDivElement>(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me", { headers: authHeaders() });
      if (!res.ok) { setLocation("/admin/login"); return; }
      setAuthed(true);
    } catch {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [authed]);

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <a
            href="/admin"
            onClick={(e) => { if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) { e.preventDefault(); setLocation("/admin"); } }}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Admin
          </a>
          <span className="text-neutral-700">/</span>
          <span className="text-sm font-medium text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            RAG Pipeline Guide
          </span>
          <div className="ml-auto">
            <a
              href="/admin/rag-pipeline"
              onClick={(e) => { if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) { e.preventDefault(); setLocation("/admin/rag-pipeline"); } }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium"
            >
              <Box className="w-3.5 h-3.5" />
              Open Live Demo
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Contents</p>
            <nav className="space-y-0.5">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    activeSection === id
                      ? "bg-emerald-900/40 text-emerald-300"
                      : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <main ref={contentRef} className="flex-1 min-w-0 max-w-3xl">

          {/* Intro */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-3">RAG Pipeline — Complete Guide</h1>
            <p className="text-neutral-400 leading-relaxed">
              From core concepts through to client-ready implementation. This guide is structured so you can read it top to bottom as a learning journey, then use individual sections as a reference when scoping real engagements.
            </p>
          </div>

          {/* SECTION 1 */}
          <SectionTitle id="what-is-rag" icon={BookOpen}>What is RAG?</SectionTitle>

          <P>
            RAG stands for <strong className="text-white">Retrieval-Augmented Generation</strong>. It is a technique for making a large language model (LLM) answer questions using a specific, private body of knowledge — rather than relying purely on what it learned during training.
          </P>

          <Callout type="key">
            Think of it as the difference between a closed-book exam and an open-book exam. A standard LLM sits the closed-book version — it can only answer from memory. RAG hands it the relevant pages of the textbook before it answers.
          </Callout>

          <H3>The problem RAG solves</H3>
          <P>LLMs have three fundamental limitations when used for enterprise or client-specific tasks:</P>
          <ul className="space-y-2 mb-4">
            {[
              ["Knowledge cutoff", "The model only knows what it was trained on. Anything more recent, or any internal documentation, is invisible to it."],
              ["No access to private data", "Your client's policies, product manuals, and internal wikis don't exist for the model."],
              ["Hallucination", "When the model doesn't know something, it often invents a plausible-sounding answer instead of admitting ignorance."],
            ].map(([title, desc]) => (
              <li key={title as string} className="flex gap-3 text-sm">
                <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-red-900/50 border border-red-700/50 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                </span>
                <span className="text-neutral-300"><strong className="text-white">{title}:</strong> {desc}</span>
              </li>
            ))}
          </ul>
          <P>RAG addresses all three: documents are always current (you control when to re-ingest), answers come from your own data, and the model is instructed to only use what it was given.</P>

          <H3>When is RAG the right choice?</H3>
          <Table
            headers={["Scenario", "Good fit for RAG?"]}
            rows={[
              ["Client wants AI to answer questions from their internal documentation", "Yes — classic use case"],
              ["Client wants a general-purpose chatbot with no specific knowledge base", "No — a standard LLM is fine"],
              ["Client wants AI to summarise or draft from their content", "Partially — fine-tuning or prompting may be simpler"],
              ["Compliance requires answers to be traceable to source documents", "Yes — RAG cites exact sources"],
              ["Data changes frequently (daily product updates, live policies)", "Yes — re-ingestion keeps it current"],
              ["Knowledge base is very small (under ~20 pages)", "Probably not — just put it in the prompt"],
            ]}
          />

          {/* SECTION 2 */}
          <SectionTitle id="architecture" icon={Layers}>The Architecture</SectionTitle>

          <P>A RAG system has two distinct pipelines. The ingestion pipeline runs once (and again whenever content changes). The retrieval + generation pipeline runs every time a user asks a question.</P>

          <FlowDiagram />

          <H3>Ingestion pipeline in detail</H3>
          <ul className="space-y-3 mb-4">
            {[
              ["1. Load", "Pull documents from wherever they live — file system, SharePoint, Notion, Google Drive, a database, a web crawler. This is often where most of the engineering effort goes in a real client project."],
              ["2. Clean", "Strip boilerplate (headers, footers, page numbers, navigation menus), normalise whitespace, handle encoding issues, remove duplicate content."],
              ["3. Chunk", "Split each document into smaller segments. This is the most consequential design decision — covered in depth in the next section."],
              ["4. Embed", "Send each chunk to an embedding model which converts the text into a vector (an array of numbers). Semantically similar text produces similar vectors."],
              ["5. Store", "Write each chunk and its vector into a vector database, along with metadata (source file, page number, section heading, date, etc.)."],
            ].map(([title, desc]) => (
              <li key={title as string} className="flex gap-3 text-sm">
                <span className="shrink-0 mt-0.5 text-xs font-bold text-emerald-400 font-mono w-5">{(title as string).split(".")[0]}.</span>
                <span className="text-neutral-300"><strong className="text-white">{(title as string).split(". ")[1]}:</strong> {desc}</span>
              </li>
            ))}
          </ul>

          <H3>Retrieval + generation pipeline in detail</H3>
          <ul className="space-y-3 mb-4">
            {[
              ["1. Embed the query", "The user's question is converted to a vector using the same embedding model used during ingestion. This is critical — mixing models breaks the search entirely."],
              ["2. Vector search", "Calculate the similarity (usually cosine similarity) between the query vector and every stored chunk vector. Return the top-k most similar chunks."],
              ["3. Rerank (optional)", "A second model checks whether the retrieved chunks are actually relevant, filtering out false positives before they reach the LLM."],
              ["4. Build the prompt", "Inject the retrieved chunks as context into the system prompt. Instruct the model to answer only from this context and to cite sources."],
              ["5. Generate", "The LLM produces an answer grounded in the provided context. With good prompting it will also refuse to answer if the context doesn't contain the answer."],
            ].map(([title, desc]) => (
              <li key={title as string} className="flex gap-3 text-sm">
                <span className="shrink-0 mt-0.5 text-xs font-bold text-emerald-400 font-mono w-5">{(title as string).split(".")[0]}.</span>
                <span className="text-neutral-300"><strong className="text-white">{(title as string).split(". ")[1]}:</strong> {desc}</span>
              </li>
            ))}
          </ul>

          {/* SECTION 3 */}
          <SectionTitle id="chunking" icon={FileText}>Chunking Strategy</SectionTitle>

          <P>Chunking is how you split a document into the pieces that will be stored and retrieved. The chunk size directly determines retrieval quality — it is the single most important tuning decision you will make.</P>

          <H3>The core trade-off</H3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <p className="text-xs font-semibold text-amber-400 mb-2">Chunks too small</p>
              <ul className="text-xs text-neutral-400 space-y-1">
                <li>• Individual sentences lack context</li>
                <li>• An idea spread over a paragraph gets split across chunks</li>
                <li>• Retrieval finds the sentence but not the explanation</li>
              </ul>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <p className="text-xs font-semibold text-amber-400 mb-2">Chunks too large</p>
              <ul className="text-xs text-neutral-400 space-y-1">
                <li>• Many unrelated topics in one chunk</li>
                <li>• Retrieval is noisy — wrong content gets sent to the LLM</li>
                <li>• You hit context window limits faster</li>
              </ul>
            </div>
          </div>

          <H3>Overlap</H3>
          <P>Overlap means the end of one chunk is repeated at the start of the next. This prevents ideas that straddle a boundary from being lost. A typical overlap is 10–20% of the chunk size.</P>
          <CodeBlock>{`Chunk size: 500 characters   Overlap: 50 characters

Chunk 1: characters   0 → 500
Chunk 2: characters 450 → 950   (50-char overlap with Chunk 1)
Chunk 3: characters 900 → 1400  (50-char overlap with Chunk 2)`}</CodeBlock>

          <H3>Common chunking strategies</H3>
          <Table
            headers={["Strategy", "How it works", "Best for"]}
            rows={[
              ["Fixed size", "Slice every N characters regardless of content", "Quick prototype, unstructured text"],
              ["Paragraph / sentence", "Split on natural boundaries (\\n\\n, full stops)", "Prose documents, emails, blog posts"],
              ["Recursive / hierarchical", "Try paragraphs first, fall back to sentences, then characters", "Mixed documents — best general-purpose choice"],
              ["Semantic", "Group sentences with similar embeddings before splitting", "High-quality retrieval; computationally expensive"],
              ["Document structure", "Split by heading levels (H1, H2, H3)", "Manuals, wikis, structured knowledge bases"],
            ]}
          />

          <Callout type="tip">
            For client projects, start with recursive paragraph splitting (this is what LangChain's <Code>RecursiveCharacterTextSplitter</Code> does). Only move to semantic chunking if you find retrieval quality is still poor after tuning.
          </Callout>

          <H3>Metadata — often overlooked, very important</H3>
          <P>Every chunk should carry metadata alongside its text: the source document name, the section heading, a page or paragraph number, a creation date, and any tags. This metadata enables:</P>
          <ul className="text-sm text-neutral-300 space-y-1 mb-4">
            <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> Filtering before retrieval ("only search chunks from this department's docs")</li>
            <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> Proper citations in the final answer</li>
            <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> Auditing and debugging when something goes wrong</li>
          </ul>

          {/* SECTION 4 */}
          <SectionTitle id="embeddings" icon={Cpu}>Embeddings</SectionTitle>

          <P>An embedding is a list of numbers (a vector) that represents the meaning of a piece of text. The key property: text with similar meaning produces vectors that are close together in the vector space, regardless of the exact words used.</P>
          <P>This is what makes semantic search possible — "how do I reset my password" and "password recovery steps" will return similar vectors, so the same chunks are retrieved for both.</P>

          <H3>Choosing an embedding model</H3>
          <Table
            headers={["Model", "Provider", "Dimensions", "Best for"]}
            rows={[
              ["text-embedding-3-small", "OpenAI", "1536", "Good quality, low cost — sensible default"],
              ["text-embedding-3-large", "OpenAI", "3072", "Higher accuracy, 5× more expensive — high-stakes retrieval"],
              ["embed-english-v3", "Cohere", "1024", "Strong for English, good multilingual variant"],
              ["nomic-embed-text", "Nomic / Ollama", "768", "Free, runs locally — useful for sensitive client data"],
              ["BGE-M3", "BAAI (HuggingFace)", "1024", "State-of-the-art open source, multilingual"],
            ]}
          />

          <Callout type="warn">
            You must use the <em>same embedding model</em> for both ingestion and retrieval. If you change models, you must re-embed and re-index every chunk from scratch — the vectors are not interchangeable.
          </Callout>

          <H3>Dimensions and storage cost</H3>
          <P>Higher-dimensional vectors are more expressive but cost more storage and compute. For a typical client knowledge base (a few thousand chunks) the difference is negligible. At millions of chunks it becomes a real cost consideration.</P>

          {/* SECTION 5 */}
          <SectionTitle id="vector-databases" icon={Database}>Vector Databases</SectionTitle>

          <P>A vector database is purpose-built to store embeddings and perform fast similarity searches across millions of vectors. Some are standalone services; others are extensions on top of databases you may already use.</P>

          <Table
            headers={["Database", "Type", "Strengths", "Typical use case"]}
            rows={[
              ["pgvector (PostgreSQL)", "Extension", "Already in your stack, transactional, free", "Most client projects — keep everything in one DB"],
              ["Pinecone", "Managed SaaS", "Zero infrastructure, scales instantly, simple API", "Fast prototyping, high-volume production"],
              ["Weaviate", "Open source / Cloud", "Rich filtering, multi-modal (text + images)", "Enterprise, compliance-sensitive clients"],
              ["Chroma", "Open source / local", "Dead simple to run locally, great for prototyping", "Development, demos, internal tools"],
              ["Qdrant", "Open source / Cloud", "Very fast, great filtering, Rust-based", "High-performance production deployments"],
              ["Redis (with RedisSearch)", "Extension", "Ultra-fast in-memory retrieval", "Real-time applications, low latency requirements"],
            ]}
          />

          <Callout type="tip">
            For most new client projects, start with <strong>pgvector</strong>. It runs inside the PostgreSQL database you are likely already using, there is nothing new to operate, and it handles millions of vectors comfortably. Only reach for a dedicated service like Pinecone if you need to scale beyond that.
          </Callout>

          <H3>What gets stored in the database</H3>
          <CodeBlock>{`Table: document_chunks

id           | uuid        — unique chunk identifier
document_id  | uuid        — links back to parent document
content      | text        — the raw chunk text
embedding    | vector(1536) — the embedding vector
metadata     | jsonb       — source, section, page, date, tags
created_at   | timestamp`}</CodeBlock>

          {/* SECTION 6 */}
          <SectionTitle id="retrieval" icon={Search}>Retrieval Strategy</SectionTitle>

          <P>Retrieval is the step where you find which chunks from your database are most relevant to the user's question. The quality of this step determines everything — if the wrong chunks are retrieved, the best LLM in the world will still give a bad answer.</P>

          <H3>Cosine similarity</H3>
          <P>The most common similarity measure. It calculates the angle between two vectors — the smaller the angle, the more similar the meaning. Returns a score from 0 (completely unrelated) to 1 (identical meaning).</P>
          <CodeBlock>{`similarity = (A · B) / (|A| × |B|)

Score 0.9+  → Very high relevance
Score 0.7-0.9 → Good match
Score 0.5-0.7 → Weak match — often noisy
Score < 0.5   → Probably unrelated`}</CodeBlock>

          <H3>Top-K retrieval</H3>
          <P>After scoring all chunks, you take the top K (usually 3–5) most similar ones. Too few and you may miss relevant context. Too many and you flood the LLM with noise, increase cost, and risk hitting context window limits.</P>

          <H3>Hybrid search</H3>
          <P>Vector search is great at semantic matching but can miss exact keyword matches (product codes, names, acronyms). Hybrid search combines vector search with BM25 keyword search and merges the results. This is especially useful for clients with technical documentation full of specific terminology.</P>

          <H3>Reranking</H3>
          <P>A second-pass model (like Cohere's Rerank or cross-encoders from HuggingFace) re-scores the retrieved chunks for true relevance to the query. This significantly improves precision at the cost of a small extra latency and cost. Worth adding for production systems.</P>

          <Table
            headers={["Strategy", "Quality", "Complexity", "Recommended for"]}
            rows={[
              ["Vector only (cosine)", "Good", "Low", "Demos and initial builds"],
              ["Hybrid (vector + BM25)", "Better", "Medium", "Technical documentation, product manuals"],
              ["Vector + Reranker", "Very good", "Medium", "Client-facing production systems"],
              ["Hybrid + Reranker", "Best", "High", "High-stakes or compliance-driven retrieval"],
            ]}
          />

          {/* SECTION 7 */}
          <SectionTitle id="generation" icon={MessageSquare}>Generation & Prompting</SectionTitle>

          <P>Once you have retrieved the relevant chunks, you inject them into the LLM's prompt. How you structure this prompt determines whether the model answers faithfully from the context or starts to drift.</P>

          <H3>A solid system prompt structure</H3>
          <CodeBlock>{`You are a precise assistant. Answer the user's question using ONLY
the context provided below. Do not use any external knowledge.

If the answer is not present in the context, say:
"I don't have enough information in the provided documents to
answer that question."

Always cite which source you are drawing from by referencing the
chunk ID or document name.

CONTEXT:
---
[Chunk 1 — source: Policy Manual v3, section 4.2]
...chunk text...

[Chunk 2 — source: Onboarding Guide, page 7]
...chunk text...
---

USER QUESTION: {user_question}`}</CodeBlock>

          <Callout type="key">
            The instruction "do not use any external knowledge" is essential. Without it, the model will blend retrieved context with its training data, making answers harder to trace and audit.
          </Callout>

          <H3>Choosing a generation model</H3>
          <Table
            headers={["Model", "Best for", "Context window", "Relative cost"]}
            rows={[
              ["GPT-4o", "Client-facing, highest quality", "128k tokens", "High"],
              ["GPT-4o mini", "Internal tools, cost-sensitive", "128k tokens", "Low"],
              ["Claude 3.5 Sonnet", "Long documents, nuanced answers", "200k tokens", "Medium"],
              ["Claude 3 Haiku", "Fast, cheap, high volume", "200k tokens", "Very low"],
              ["Gemini 1.5 Pro", "Very long context needs", "1M tokens", "Medium"],
            ]}
          />

          <H3>Streaming responses</H3>
          <P>For a good user experience, stream the response token by token rather than waiting for the full answer. This makes the system feel fast even if the LLM takes 5–10 seconds to produce a long answer. Most LLM APIs support streaming out of the box.</P>

          {/* SECTION 8 */}
          <SectionTitle id="best-practices" icon={CheckCircle}>Best Practices</SectionTitle>

          <div className="space-y-4 mb-4">
            {[
              {
                title: "Evaluate retrieval and generation separately",
                body: "A RAG system can fail at retrieval (wrong chunks found) or at generation (right chunks found but answer is bad). Measure both independently. Retrieval metrics: Recall@K, Precision@K, MRR. Generation metrics: faithfulness, answer relevance, groundedness.",
              },
              {
                title: "Build a golden test set before you tune",
                body: "Before changing chunk size, overlap, or model — create 20–30 question/answer pairs with known correct answers from the documents. Then tune against those. Otherwise you're flying blind and changes may regress the system.",
              },
              {
                title: "Version your index",
                body: "When you update documents or change chunking parameters, create a new index version rather than overwriting in place. This lets you roll back instantly if quality degrades.",
              },
              {
                title: "Handle stale data explicitly",
                body: "When a document is updated, you must delete all chunks from the old version and re-ingest the new one. A chunk that references outdated policy information is worse than no answer at all. Build a document registry that tracks what's been ingested and when.",
              },
              {
                title: "Contextual chunk enrichment",
                body: "Before embedding a chunk, prepend its section heading and document title. This gives the embedding more signal about the chunk's context, dramatically improving retrieval for short chunks.",
              },
              {
                title: "Log every retrieval and answer",
                body: "In a client system, log what was retrieved, the similarity scores, the prompt sent, and the answer returned. This is essential for debugging and for demonstrating compliance.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="flex gap-3 bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white mb-1">{title}</p>
                  <p className="text-xs text-neutral-400 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* SECTION 9 */}
          <SectionTitle id="failure-modes" icon={AlertTriangle}>Failure Modes</SectionTitle>

          <P>Understanding how RAG systems fail is as important as knowing how to build them. Most production issues come from one of these categories.</P>

          <div className="space-y-4 mb-4">
            {[
              {
                category: "Retrieval failures",
                color: "text-red-400",
                items: [
                  ["Wrong embedding model at query time", "Vectors are incompatible. System retrieves gibberish. Fix: always tie embedding model to index version."],
                  ["Chunk size too large", "Chunks contain many topics — similarity scores are mediocre for everything, great for nothing. Fix: reduce chunk size, add hierarchical retrieval."],
                  ["Query is too vague", "\"Tell me about compliance\" matches dozens of chunks equally. Fix: improve the UI to guide users toward specific questions, or add query expansion."],
                  ["Missing metadata filters", "User asks about the 2024 policy but gets chunks from the 2021 version. Fix: store dates and document versions as metadata, filter before vector search."],
                ],
              },
              {
                category: "Generation failures",
                color: "text-amber-400",
                items: [
                  ["Model ignores the context", "The LLM answers from training data instead of retrieved chunks. Fix: strengthen the system prompt, use a smaller/more instruction-following model."],
                  ["Model hallucinates citations", "The model fabricates chunk IDs or document names that don't exist. Fix: format chunk identifiers explicitly in the prompt and instruct the model to only cite what it sees."],
                  ["Context window overflow", "Too many chunks retrieved, prompt exceeds token limit. Fix: reduce K, summarise chunks before injecting, or use a model with a larger context window."],
                ],
              },
              {
                category: "Operational failures",
                color: "text-purple-400",
                items: [
                  ["Stale index", "Documents were updated but not re-ingested. Answers are based on outdated content. Fix: build automated re-ingestion triggered by document updates."],
                  ["In-memory store lost on restart", "The demo tool uses in-memory storage — restarting the server wipes all chunks. Fix for production: persist chunks to a real vector database."],
                  ["No monitoring", "The system degrades silently as document quality changes or retrieval patterns shift. Fix: log all queries, track average similarity scores, alert on anomalies."],
                ],
              },
            ].map(({ category, color, items }) => (
              <div key={category} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${color}`}>{category}</p>
                <div className="space-y-2.5">
                  {items.map(([title, fix]) => (
                    <div key={title} className="flex gap-3">
                      <AlertTriangle className="w-3.5 h-3.5 text-neutral-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-white">{title}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{fix}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* SECTION 10 */}
          <SectionTitle id="client-guide" icon={Users}>Client Conversation Guide</SectionTitle>

          <P>This section is about translating the technical knowledge above into confident client conversations — scoping, estimating, and managing expectations.</P>

          <H3>Discovery questions to ask every client</H3>
          <div className="space-y-2 mb-4">
            {[
              "Where does your knowledge currently live? (SharePoint, Confluence, Google Drive, PDFs, databases?)",
              "How often does that content change? Who is responsible for keeping it current?",
              "Who are the users who will ask questions? Internal employees, customers, or both?",
              "What does a 'wrong answer' cost you? (Low-stakes FAQ vs. compliance-critical policy questions are very different projects)",
              "Do you have existing questions and known-correct answers we can use to evaluate the system?",
              "Are there regulatory or data residency requirements that restrict which cloud services we can use?",
              "What systems does this need to integrate with — Slack, a web portal, an existing support tool?",
            ].map((q, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="shrink-0 text-emerald-500 font-mono text-xs mt-0.5">{String(i + 1).padStart(2, "0")}.</span>
                <span className="text-neutral-300">{q}</span>
              </div>
            ))}
          </div>

          <H3>Scoping tiers</H3>
          <Table
            headers={["Tier", "What you build", "Typical scope"]}
            rows={[
              ["Proof of concept", "Ingest a sample dataset, basic vector search, simple chat UI. Demonstrates the concept.", "1–2 weeks"],
              ["Internal tool", "Persistent storage (pgvector), file upload, basic admin UI, manual re-ingestion. Used by a small internal team.", "3–5 weeks"],
              ["Production system", "Automated ingestion pipeline, hybrid search, reranking, monitoring, access controls, integration with existing tools.", "2–4 months"],
              ["Managed service", "All of the above, plus ongoing maintenance, document management, and SLA.", "Retainer"],
            ]}
          />

          <H3>Red flags in client requirements</H3>
          <div className="space-y-2 mb-4">
            {[
              ["\"It needs to know everything about our company\"", "Scope creep. Anchor to specific, defined knowledge domains. RAG quality degrades with very large, inconsistently structured corpora."],
              ["\"We don't have anyone to maintain the documents\"", "Stale data is the most common production failure. A RAG system is only as good as its knowledge base. Establish who owns content freshness before signing."],
              ["\"Can it also browse the internet?\"", "That is a separate tool-calling layer, not RAG. Clarify early to avoid scope confusion."],
              ["\"It must never give a wrong answer\"", "No system achieves this. Define acceptable error rates and what happens when the system doesn't know — refusing gracefully is a feature, not a failure."],
            ].map(([flag, note]) => (
              <div key={flag as string} className="bg-neutral-900 border border-amber-900/40 rounded-lg p-3 flex gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-white mb-1">"{flag}"</p>
                  <p className="text-xs text-neutral-400">{note}</p>
                </div>
              </div>
            ))}
          </div>

          <H3>Connecting this to the live demo</H3>
          <Callout type="tip">
            When showing the RAG Pipeline demo to a client, upload a sample of <em>their</em> content — even just two or three pages from a document they already have. Ask them a question that should be answerable from it. Watching the system cite their own words is far more convincing than any description. After the demo, the conversation naturally becomes: "What would this look like with all your documentation?"
          </Callout>

          <div className="mt-10 border-t border-neutral-800 pt-8 mb-12">
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-600">RAG Pipeline Guide — Synaptica Knowledge Systems</p>
              <a
                href="/admin/rag-pipeline"
                onClick={(e) => { if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) { e.preventDefault(); setLocation("/admin/rag-pipeline"); } }}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium"
              >
                <Box className="w-4 h-4" />
                Try the Live Demo
              </a>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
