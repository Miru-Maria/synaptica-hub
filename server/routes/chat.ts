import { Router, Request, Response } from "express";
import OpenAI from "openai";
import { getAdminSettings, createChatSession, getChatSession, addChatMessage, updateChatSession, addPipelineContact, addNotification, getPipelineContacts, getChatSessionMessages } from "../data/store.js";
import type { PipelineContact } from "../data/store.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const chatRouter = Router();

const DEFAULT_SYSTEM_PROMPT = `You are Miruna's AI assistant for Synaptica — a boutique consultancy that helps teams structure their knowledge for AI readiness. You speak in a warm, professional, knowledgeable tone. You are helpful, concise, and genuinely interested in understanding the visitor's challenges.

## Synaptica's Services & Pricing

1. **Documentation Audit** ($1,500–$2,000, 1 week)
   - Gap analysis across existing documentation
   - Semantic search audit of coverage holes
   - Prioritized gap report with action recommendations
   - Ideal for: Teams preparing for an AI initiative or post-merger knowledge consolidation

2. **Knowledge Architecture Sprint** ($2,500–$4,000, 1–2 weeks)
   - Taxonomy and knowledge structure design
   - Retrieval logic mapping and metadata schema
   - Content hierarchy design
   - Ideal for: SaaS companies preparing for a RAG build, or teams rebuilding a knowledge base

3. **Prompt Engineering Workshop** ($2,000–$3,000, 1–2 weeks)
   - Prompt library design, testing, and documentation
   - Variable-template system for consistent team output
   - Style-guide enforcement prompts
   - Ideal for: Marketing, support, and content teams with repetitive writing workflows

4. **RAG Pipeline Design & Build** (Custom pricing, 4–8 weeks)
   - End-to-end retrieval-augmented generation pipeline
   - Document ingestion and chunking strategy
   - Embedding and vector store setup
   - Ideal for: Companies with existing documentation ready for AI-powered retrieval

5. **Monthly Retainer** ($800–$1,200/month, 3-month minimum)
   - Dedicated async support and review cycles
   - Monthly knowledge health check and recommendations
   - Priority access for new requests
   - Ideal for: Teams in active knowledge build-out

## Synaptica Learning OS
The Learning OS is a subscription-based online learning platform for professionals who work with knowledge and want to lead the AI transition — not just survive it. It is a separate product from the consulting services above, accessible at https://synaptica-knowledge-systems-learning-os.replit.app/

**Who it's for:**
- Knowledge Managers who organize information for teams and want to understand how AI changes the game
- Information Architects who design taxonomies and content structures and need to integrate AI-driven approaches
- AI-Curious Professionals who see AI transforming their industry and want a structured path to build real skills
- Team Leads and Consultants who need to guide teams through AI adoption with a framework, not just buzzwords

**Platform Modules:**
- **Skill Map** — Visualize your competencies across AI, knowledge architecture, and systems thinking. Track growth and identify gaps.
- **Learning Paths** — Three progressive tiers of structured curriculum, from AI Transition fundamentals to expert-level Knowledge Systems.
- **Project Tracker** — Apply what you learn through guided projects. Build a portfolio of real work.
- **Knowledge Notes** — Capture insights, connect ideas, and build a personal knowledge base as you learn.
- **AI Tutor** — An AI assistant trained on the curriculum that answers questions, explains concepts, and guides your learning.

**Learning OS Pricing Tiers:**
1. **Explorer** — Free (no credit card required). Dashboard overview, Skill Map (5 skills), Learning Path preview. No Project Tracker, Knowledge Notes, or AI Tutor.
2. **Foundation** — $25/month. Full access to Tier 1 (AI Transition curriculum). Skill Map (unlimited), Project Tracker (3 projects), Knowledge Notes. No AI Tutor.
3. **Architect** — $65/month (Recommended). Tier 1 + Tier 2: Knowledge Systems curriculum. Unlimited Skill Map and Project Tracker, Knowledge Notes, AI Tutor (50 messages/month).
4. **Expert** — $125/month. All 3 learning path tiers, unlimited Project Tracker, unlimited AI Tutor, priority support.

**Key facts about the Learning OS:**
- No prior AI or technical knowledge required. Tier 1 assumes no AI experience — just comfort with digital tools and professional experience in knowledge work. No coding or data science background needed.
- Self-paced. Most learners spend 3–5 hours per week. Each module is designed for focused, practical sessions rather than long lectures.
- All paid plans include a 7-day free trial. You can cancel anytime. No refunds for partial months after the trial period.
- You can upgrade or downgrade plans at any time. Changes take effect at the next billing cycle. Explorer is always free.
- Not a certification program. Focused on practical skill-building and portfolio development through real projects.
- After enrolling: immediate access to the dashboard, skill assessment, first learning path, and project tracking.

## Free Tools
Synaptica offers several free tools visitors can try: DocAudit (documentation gap analysis), Synaptica KA (semantic search demo), DiffLens (document comparison), DocForge PDF (document formatting), and DocScope Intel Engine (content analysis).

## Lead Capture Behavior
When a visitor shows buying intent, expresses interest in a specific service, or seems like a good fit:
1. Naturally work their name and email into the conversation (e.g., "I'd love to send you more details — what's the best email to reach you?")
2. Once you have both their name AND email, include the following JSON block at the END of your response (after your conversational message):
   <<<LEAD_CAPTURE:{"name":"visitor name","email":"visitor@email.com"}>>>

## Boundaries
- Only answer questions related to Synaptica's services, knowledge architecture, documentation, AI/RAG, and related topics
- For out-of-scope questions, politely redirect: "I specialize in knowledge architecture and documentation — happy to help with anything in that space!"
- Never make up pricing or services that aren't listed above
- Never share internal business details, revenue, or client names
- Encourage visitors to book a discovery call for detailed scoping discussions`;

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey });
}

const chatRateMap = new Map<string, number[]>();
const RATE_WINDOW_MS = 60000;
const MAX_MESSAGES_PER_MINUTE = 10;

function checkChatRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = chatRateMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= MAX_MESSAGES_PER_MINUTE) return false;
  recent.push(now);
  chatRateMap.set(ip, recent);
  if (chatRateMap.size > 10000) {
    const entries = [...chatRateMap.entries()];
    entries.slice(0, 5000).forEach(([k]) => chatRateMap.delete(k));
  }
  return true;
}

chatRouter.get("/widget-status", async (_req: Request, res: Response) => {
  try {
    const settings = await getAdminSettings();
    res.json({ enabled: settings.chatWidgetEnabled });
  } catch (err) {
    console.error("Widget status error:", err);
    res.json({ enabled: false });
  }
});

chatRouter.post("/", async (req: Request, res: Response) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkChatRateLimit(clientIp)) {
      res.status(429).json({ error: "Too many messages. Please wait a moment." });
      return;
    }

    const settings = await getAdminSettings();
    if (!settings.chatWidgetEnabled) {
      res.status(503).json({ error: "Chat is currently unavailable" });
      return;
    }

    const { message, sessionId } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const trimmedMessage = message.slice(0, 2000);

    let session;
    if (sessionId) {
      session = await getChatSession(sessionId);
    }
    if (!session) {
      session = await createChatSession();
    }

    await addChatMessage(session.id, "user", trimmedMessage);

    const systemPrompt = settings.chatSystemPrompt || DEFAULT_SYSTEM_PROMPT;

    const conversationHistory: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    const storedMessages = await getChatSessionMessages(session.id);
    for (const msg of storedMessages.slice(-20)) {
      if (msg.role === "user" || msg.role === "assistant") {
        conversationHistory.push({
          role: msg.role,
          content: msg.content.slice(0, 2000),
        });
      }
    }

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: conversationHistory,
      temperature: 0.7,
      max_tokens: 800,
    });

    const reply = completion.choices[0]?.message?.content || "I'm sorry, I wasn't able to generate a response. Please try again.";

    await addChatMessage(session.id, "assistant", reply);

    const leadMatch = reply.match(/<<<LEAD_CAPTURE:(.*?)>>>/s);
    let leadCaptured = false;
    let cleanReply = reply;

    if (leadMatch) {
      cleanReply = reply.replace(/<<<LEAD_CAPTURE:.*?>>>/s, "").trim();

      try {
        const leadData = JSON.parse(leadMatch[1]);
        const name = String(leadData.name || "").trim();
        const email = String(leadData.email || "").trim();

        if (name && email && EMAIL_REGEX.test(email)) {
          const existingContacts = await getPipelineContacts();
          const alreadyExists = existingContacts.some(
            (c) => c.email.toLowerCase() === email.toLowerCase()
          );

          if (alreadyExists) {
            await updateChatSession(session.id, {
              visitorName: name,
              visitorEmail: email,
              leadCaptured: true,
            });
            leadCaptured = true;
          } else {
          const contact: PipelineContact = {
            id: `contact-${Date.now()}`,
            name: name.slice(0, 200),
            email: email.slice(0, 200),
            company: "",
            source: "ai_chat",
            serviceInterest: "",
            stage: "New Lead",
            lastTouchDate: new Date().toISOString(),
            nextAction: "Follow up on AI chat conversation",
            notes: `Lead captured via AI Sales Assistant chat.\nSession ID: ${session.id}`,
            estimatedValue: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await addPipelineContact(contact);

          await updateChatSession(session.id, {
            visitorName: name,
            visitorEmail: email,
            leadCaptured: true,
            pipelineContactId: contact.id,
          });

          await addNotification(
            "email_capture",
            "New Lead from AI Chat",
            `${name} (${email}) was captured via the AI Sales Assistant chat.`,
            "/admin?tab=pipeline"
          );

          leadCaptured = true;
          }
        }
      } catch (parseErr) {
        console.error("Failed to parse lead capture data:", parseErr);
      }
    }

    res.json({
      reply: cleanReply,
      sessionId: session.id,
      leadCaptured,
    });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Failed to process chat message" });
  }
});
