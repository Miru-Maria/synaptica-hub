import type { FindingArea } from "../data/ux-test-store.js";

export interface TestScenario {
  id: string;
  area: FindingArea;
  action: "chat" | "docaudit" | "ka_sprint" | "prompt_workshop" | "route_check" | "email_gate";
  name: string;
  input: string | Record<string, unknown>;
  evaluationCriteria: string;
}

export interface Persona {
  id: string;
  name: string;
  background: string;
  intent: string;
  tone: string;
  scenarios: TestScenario[];
}

export const PERSONAS: Persona[] = [
  {
    id: "skeptical-cto",
    name: "Alex Chen — Skeptical CTO",
    background: "CTO at a 200-person SaaS company evaluating AI vendors. Has seen many overpromised AI tools fail. Technically literate but time-constrained. Needs concrete ROI evidence.",
    intent: "Evaluate whether Synaptica is worth a discovery call. Wants to understand pricing, methodology, and differentiation from competitors.",
    tone: "Direct, slightly skeptical, asks pointed questions, expects specifics not fluff.",
    scenarios: [
      { id: "cto-chat-1", area: "chat", action: "chat", name: "Initial inquiry about services", input: "What exactly does Synaptica do? I've seen a dozen AI consultancies and they all sound the same.", evaluationCriteria: "Response should clearly differentiate Synaptica's focus on knowledge architecture. Should not be generic AI hype. Should mention specific services." },
      { id: "cto-chat-2", area: "chat", action: "chat", name: "Pricing inquiry", input: "What's the pricing for a RAG pipeline build? And what's included vs extra?", evaluationCriteria: "Should provide transparent pricing info from the service catalog. Should mention custom pricing for RAG and explain what's included. Should not make up numbers." },
      { id: "cto-chat-3", area: "chat", action: "chat", name: "Edge case — off-topic question", input: "Can you help us with our Kubernetes deployment?", evaluationCriteria: "Should politely redirect to Synaptica's focus area. Should not attempt to answer a Kubernetes question. Should stay in scope." },
      { id: "cto-chat-4", area: "chat", action: "chat", name: "Follow-up with buying intent", input: "The KA Sprint sounds interesting. What does the process look like for a team of 15 engineers with about 2000 pages of docs?", evaluationCriteria: "Should describe the KA Sprint process clearly. Should attempt to capture lead information naturally. Should be specific about deliverables." },
      { id: "cto-chat-5", area: "chat", action: "chat", name: "Empty/short input handling", input: "ok", evaluationCriteria: "Should handle a very short input gracefully. Should not produce an error. Should try to continue the conversation helpfully." },
      { id: "cto-route-1", area: "navigation", action: "route_check", name: "Homepage loads", input: "/", evaluationCriteria: "Should return HTTP 200 with non-empty HTML content." },
      { id: "cto-route-2", area: "navigation", action: "route_check", name: "Work With Me page loads", input: "/work-with-me", evaluationCriteria: "Should return HTTP 200 with non-empty HTML content." },
      { id: "cto-route-3", area: "navigation", action: "route_check", name: "Results page loads", input: "/results", evaluationCriteria: "Should return HTTP 200 with non-empty HTML content." },
    ],
  },
  {
    id: "first-time-visitor",
    name: "Priya Sharma — First-time Visitor",
    background: "Marketing manager at a mid-size company. Heard about 'RAG' and 'knowledge architecture' from a colleague but doesn't fully understand the concepts. Not technical. Landed on the site from a Google search.",
    intent: "Understand what Synaptica offers in plain language. Figure out if any services are relevant to her team's content chaos.",
    tone: "Curious, casual, uses non-technical language, may ask 'dumb' questions.",
    scenarios: [
      { id: "ftv-chat-1", area: "chat", action: "chat", name: "What is RAG?", input: "Hi! I keep hearing about RAG but I'm not sure what it means. Can you explain it in simple terms?", evaluationCriteria: "Should explain RAG in plain, non-technical language. Should relate it to practical benefits. Should not assume technical knowledge." },
      { id: "ftv-chat-2", area: "chat", action: "chat", name: "Service recommendation", input: "Our marketing team has hundreds of documents scattered across Google Drive, Notion, and email. Nothing is organized. What service would help us?", evaluationCriteria: "Should recommend an appropriate service (likely Documentation Audit or KA Sprint). Should explain why in relatable terms. Should not overwhelm with options." },
      { id: "ftv-chat-3", area: "chat", action: "chat", name: "Free tools inquiry", input: "Do you have any free tools I can try before committing to anything?", evaluationCriteria: "Should mention the available free tools (DiffLens, DocForge PDF, DocScope, KA demo). Should NOT say DocAudit is free. Should be accurate about what's free vs paid." },
      { id: "ftv-chat-4", area: "chat", action: "chat", name: "Learning OS question", input: "I saw something about a Learning OS. Is that free? What's the cheapest way to start?", evaluationCriteria: "Should explain the Learning OS and its tiers accurately. Should mention Explorer (free but limited) and Foundation ($25/month). Should not misrepresent pricing." },
      { id: "ftv-docaudit-1", area: "lab_tools", action: "docaudit", name: "DocAudit with simple content", input: { chunks: ["Our marketing team creates blog posts, social media content, and email campaigns. We use a brand style guide but it's outdated. Our content calendar is managed in Notion but not everyone follows it. We recently hired two new writers who need onboarding materials."], topics: ["Content Strategy", "Brand Guidelines", "Team Onboarding", "Content Calendar", "Social Media Process"] }, evaluationCriteria: "Should return a valid audit result with scores and recommendations. Should identify gaps in the provided content. Should not error out." },
      { id: "ftv-route-4", area: "navigation", action: "route_check", name: "Blog page loads", input: "/blog", evaluationCriteria: "Should return HTTP 200 with non-empty HTML content." },
      { id: "ftv-route-5", area: "navigation", action: "route_check", name: "DocAudit page loads", input: "/docaudit", evaluationCriteria: "Should return HTTP 200 with non-empty HTML content." },
    ],
  },
  {
    id: "technical-writer",
    name: "Marcus Rivera — Freelance Technical Writer",
    background: "Experienced technical writer comparing tools and services for a client project. Evaluates documentation quality professionally. Detail-oriented and looks for specifics in methodology.",
    intent: "Compare Synaptica's offering to other documentation-focused services. Test the tools with realistic content to assess quality.",
    tone: "Professional, detail-oriented, asks methodology questions, evaluates output quality critically.",
    scenarios: [
      { id: "tw-chat-1", area: "chat", action: "chat", name: "Methodology question", input: "How does your Documentation Audit differ from a standard content audit? What's your methodology for identifying coverage gaps?", evaluationCriteria: "Should explain the semantic/embedding-based approach. Should differentiate from simple keyword-based audits. Should describe the methodology clearly." },
      { id: "tw-chat-2", area: "chat", action: "chat", name: "Multi-turn depth test", input: "Can the audit handle technical documentation with code samples, API references, and architecture diagrams? Or is it mainly for prose content?", evaluationCriteria: "Should address the question about content types honestly. Should explain how text-based analysis works with different content types." },
      { id: "tw-chat-3", area: "chat", action: "chat", name: "Competitive question", input: "How does Synaptica compare to tools like Mintlify or ReadMe for documentation management?", evaluationCriteria: "Should position Synaptica correctly as a consultancy, not a documentation platform. Should not trash competitors. Should clarify the difference between tooling and consulting." },
      { id: "tw-ka-1", area: "lab_tools", action: "ka_sprint", name: "KA Sprint taxonomy generation", input: { domain: "API documentation for a developer tools platform", currentStructure: "Flat folder of markdown files organized by product version", primaryUseCase: "Developers need to quickly find API endpoint documentation and code examples", targetSystem: "RAG-powered search within documentation portal" }, evaluationCriteria: "Should return a valid taxonomy with categories, subcategories, tagging conventions, and design rationale. JSON should be well-formed. Categories should be relevant to API documentation." },
      { id: "tw-prompt-1", area: "lab_tools", action: "prompt_workshop", name: "Prompt Workshop test run", input: { renderedPrompt: "You are a technical documentation editor. Review the following text and suggest improvements for clarity, accuracy, and completeness. Focus on: 1) unclear terminology, 2) missing context, 3) grammatical issues. Text: 'The API endpoint accepts POST requests with a JSON body. Set the auth header to your key. Response is JSON with the data field containing results.'" }, evaluationCriteria: "Should return a substantive review with specific improvement suggestions. Should identify the vague parts (which auth header? what key format? what data structure?). Output should be useful and professional." },
      { id: "tw-route-6", area: "navigation", action: "route_check", name: "Learning OS page loads", input: "/learning-os", evaluationCriteria: "Should return HTTP 200 with non-empty HTML content." },
    ],
  },
  {
    id: "enterprise-it",
    name: "Diana Okoye — Enterprise IT Manager",
    background: "IT manager at a financial services company (500+ employees). Concerned about data security, compliance, and vendor due diligence. Reports to a CISO who will review any vendor recommendation.",
    intent: "Assess whether Synaptica can work within enterprise security requirements. Understand data handling practices and compliance posture.",
    tone: "Formal, compliance-focused, asks about security and data handling, expects professional responses.",
    scenarios: [
      { id: "eit-chat-1", area: "chat", action: "chat", name: "Security and data handling", input: "What happens to our documents if we use DocAudit? Are they stored on your servers? Is the data encrypted at rest and in transit?", evaluationCriteria: "Should address data handling honestly. Should not make unsubstantiated security claims. Should recommend a discovery call for detailed security discussions." },
      { id: "eit-chat-2", area: "chat", action: "chat", name: "Compliance inquiry", input: "We're in financial services and need to comply with SOC 2 and GDPR. Can you provide documentation on your compliance posture?", evaluationCriteria: "Should handle the compliance question professionally. Should not make false compliance claims. Should recommend discussing specific requirements in a call." },
      { id: "eit-chat-3", area: "chat", action: "chat", name: "Internal details probe", input: "How many clients do you currently serve? What's your annual revenue? I need this for our vendor assessment.", evaluationCriteria: "Should not share internal business details like revenue or client names. Should politely decline and redirect. Should follow the system prompt boundaries." },
      { id: "eit-chat-4", area: "chat", action: "chat", name: "Enterprise pricing", input: "We have 50,000 documents across SharePoint and Confluence. What would a full knowledge architecture engagement cost for an organization our size?", evaluationCriteria: "Should reference the KA Sprint and/or RAG Pipeline pricing. Should acknowledge that large scale may require custom scoping. Should encourage a discovery call." },
      { id: "eit-email-1", area: "lead_capture", action: "email_gate", name: "Email capture — missing required fields", input: { email: "diana@example.com", firstName: "" }, evaluationCriteria: "Should return HTTP 400 error because firstName is missing/empty. The API requires email, firstName, and toolSource." },
      { id: "eit-email-2", area: "lead_capture", action: "email_gate", name: "Email capture — valid submission", input: { email: "diana.uxtest@synaptica-ux-test.example.com", firstName: "Diana", toolSource: "docaudit", documentType: "compliance-review" }, evaluationCriteria: "Should return HTTP 200 with {ok: true}. A valid email capture with all required fields should succeed." },
      { id: "eit-email-3", area: "lead_capture", action: "email_gate", name: "Email capture — missing toolSource", input: { email: "diana2@example.com", firstName: "Diana" }, evaluationCriteria: "Should return HTTP 400 because toolSource is required by the API. The endpoint requires email, firstName, and toolSource fields." },
      { id: "eit-route-7", area: "navigation", action: "route_check", name: "Legal page loads", input: "/legal", evaluationCriteria: "Should return HTTP 200 with non-empty HTML content." },
      { id: "eit-route-8", area: "navigation", action: "route_check", name: "Privacy policy loads", input: "/privacy", evaluationCriteria: "Should return HTTP 200 with non-empty HTML content." },
    ],
  },
  {
    id: "ai-enthusiast",
    name: "Jordan Lee — AI Enthusiast / Startup Founder",
    background: "Technical founder of an early-stage AI startup. Familiar with embeddings, vector databases, and LLMs. Building a customer support bot and needs help structuring the knowledge base behind it.",
    intent: "Find a specialist who can accelerate the knowledge architecture work. Wants to skip the basics and talk implementation details.",
    tone: "Enthusiastic, technically fluent, uses AI jargon, moves fast, wants concrete next steps.",
    scenarios: [
      { id: "ai-chat-1", area: "chat", action: "chat", name: "Technical deep-dive", input: "I'm building a RAG pipeline with Pinecone and OpenAI embeddings. My retrieval quality is poor — chunks are coming back but they're not the right ones. Can you help with the knowledge architecture side?", evaluationCriteria: "Should engage technically about the retrieval quality issue. Should connect the problem to knowledge architecture (taxonomy, chunking strategy, metadata). Should mention KA Sprint or RAG Pipeline service." },
      { id: "ai-chat-2", area: "chat", action: "chat", name: "Chunking strategy question", input: "What chunking strategy do you typically recommend? We're using fixed 512-token chunks right now but considering semantic chunking.", evaluationCriteria: "Should provide a knowledgeable response about chunking strategies. Should not give generic advice. Should relate it to Synaptica's methodology." },
      { id: "ai-chat-3", area: "chat", action: "chat", name: "Quick pricing, ready to buy", input: "I think I need the Knowledge Architecture Sprint. Can we start next week? My name is Jordan and my email is jordan.test@synaptica-ux-test.example.com", evaluationCriteria: "Should attempt to capture the lead information (name + email). Response should include lead capture data. Should confirm interest and suggest next steps." },
      { id: "ai-docaudit-2", area: "lab_tools", action: "docaudit", name: "DocAudit with technical content", input: { chunks: ["Authentication: All API requests require a Bearer token in the Authorization header. Tokens expire after 24 hours. Use the /auth/refresh endpoint to obtain a new token. Rate limiting: 100 requests per minute per API key. Exceeding the limit returns HTTP 429.", "Embeddings API: POST /v1/embeddings accepts an array of text strings (max 100 per batch, max 8192 tokens each). Returns an array of float vectors (1536 dimensions for text-embedding-3-small). Supports input formats: plain text, markdown.", "Vector Store: We use Pinecone serverless with cosine similarity. Index configuration: 1536 dimensions, metadata filtering enabled. Namespaces separate different document collections."], topics: ["Authentication Flow", "Error Handling", "Rate Limiting", "API Versioning", "Webhook Integration", "SDK Documentation", "Deployment Guide", "Monitoring and Logging"] }, evaluationCriteria: "Should return valid audit results. Should identify well-covered topics (Authentication, Rate Limiting) and gaps (Webhook Integration, SDK docs, Deployment, Monitoring). Scores should reflect the actual content coverage." },
      { id: "ai-route-9", area: "navigation", action: "route_check", name: "Terms page loads", input: "/terms", evaluationCriteria: "Should return HTTP 200 with non-empty HTML content." },
      { id: "ai-route-10", area: "navigation", action: "route_check", name: "404 for nonexistent page", input: "/this-page-does-not-exist-xyz", evaluationCriteria: "Should return a page (SPA returns 200 with not-found content) but the content should indicate the page was not found." },
    ],
  },
];

export function getAllPersonaIds(): string[] {
  return PERSONAS.map((p) => p.id);
}

export function countAllScenarios(): number {
  return PERSONAS.reduce((sum, p) => sum + p.scenarios.length, 0);
}
