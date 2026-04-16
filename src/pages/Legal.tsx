import { useEffect } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { PhoenixLogo } from "@/components/PhoenixLogo";

const BUSINESS = "Miruna Cristiana Paun PFA (trading as Synaptica Knowledge Systems)";
const EFFECTIVE = "March 13, 2026";
const CONTACT_LINK = <a href="/#contact" className="underline underline-offset-2 hover:text-primary transition-colors">the contact form on this site</a>;

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16 scroll-mt-28">
      <h2 className="text-2xl font-bold mb-6 text-foreground border-b border-white/10 pb-4">{title}</h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-foreground mt-6 mb-2">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function UL({ items }: { items: (string | React.ReactNode)[] }) {
  return (
    <ul className="list-disc list-inside space-y-1 pl-2">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

export default function Legal() {
  const [location] = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <div className="bg-background min-h-screen text-foreground overflow-x-hidden">
      <header className="border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group min-h-[44px]">
            <PhoenixLogo size={28} glowIntensity="low" />
            <span className="font-semibold text-foreground tracking-wide group-hover:text-primary transition-colors">
              Synaptica <span className="font-normal text-muted-foreground">Knowledge Systems</span>
            </span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors min-h-[44px] flex items-center">
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3">Legal</h1>
          <p className="text-muted-foreground">Effective date: {EFFECTIVE}</p>

          <nav className="mt-8 flex flex-wrap gap-3 sm:gap-4 text-sm">
            {[
              { label: "Terms of Service", id: "terms" },
              { label: "Privacy Policy", id: "privacy" },
              { label: "Refund Policy", id: "refund" },
              { label: "Data Processing", id: "data-processing" },
            ].map(({ label, id }) => (
              <a
                key={id}
                href={`#${id}`}
                className="min-h-[44px] flex items-center px-4 py-2 rounded-lg border border-white/10 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* ── TERMS OF SERVICE ── */}
        <Section id="terms" title="Terms of Service">
          <P>
            These Terms of Service govern your access to and use of products and services provided by {BUSINESS}, including the Synaptica Learning OS platform and any consulting services. By accessing or using these services you agree to be bound by these terms.
          </P>

          <H3>1. Who I Am</H3>
          <P>
            Synaptica Knowledge Systems is a trade name I operate as Miruna Cristiana Paun PFA, a sole trader registered in Romania (Bucharest) under Romanian fiscal law. You can reach me using {CONTACT_LINK}.
          </P>

          <H3>2. Services</H3>
          <P>
            I provide two categories of service:
          </P>
          <UL items={[
            "Synaptica Learning OS — a web-based SaaS subscription platform offering structured learning paths, skill tracking, project management tools, and an AI tutor for professionals transitioning into AI knowledge architecture.",
            "Consulting services — knowledge architecture design, documentation audits, RAG pipeline builds, prompt engineering workshops, and monthly retainer engagements delivered remotely.",
          ]} />

          <H3>3. Accounts and Access</H3>
          <P>
            To access paid features of the Learning OS you must create an account and provide accurate information. You are responsible for maintaining the confidentiality of your credentials. I reserve the right to suspend accounts that violate these terms.
          </P>

          <H3>4. Subscriptions and Payment</H3>
          <UL items={[
            "Subscriptions are billed monthly in advance.",
            "Payment for Learning OS subscriptions is processed by Paddle.com (my Merchant of Record), who handles all billing, VAT, and payment infrastructure.",
            "Subscription prices are listed in USD. Approximate EUR and RON equivalents are shown for reference; the USD price is the binding amount.",
            "You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period; access continues until then.",
            "Consulting services are invoiced separately and governed by individual engagement agreements.",
          ]} />

          <H3>5. Free Trial</H3>
          <P>
            Paid Learning OS plans include a 7-day free trial. You will not be charged until the trial period ends. You may cancel at any time during the trial at no cost.
          </P>

          <H3>6. Intellectual Property</H3>
          <P>
            All content, curriculum, tools, and software on this site and within the Learning OS are owned by or licensed to me. You may not copy, distribute, or create derivative works from any of my content without written permission. Your own data and content uploaded to the platform remain yours.
          </P>

          <H3>7. Tool Usage and Document Handling</H3>
          <P>
            AI-powered tools on this site — including DocAudit, the Knowledge Architecture Sprint tool, the Prompt Engineering Workshop, and the RAG Pipeline tool — are used exclusively by me (Miruna Paun) as part of delivering consulting services. Clients do not operate these tools directly. As a consulting client, you may grant me access to your documentation, internal content, or other materials so that I can process and analyse them on your behalf. By sharing such content with me you acknowledge and agree that:
          </P>
          <UL items={[
            "Content you share with me is processed in server memory for the duration of the analysis session only. It is not written to any persistent database, file system, or log.",
            "Raw document content is discarded automatically once the analysis is complete. No copies are retained by the system.",
            "Only session metadata is logged — tool name, timestamp, document count, approximate size, and content type — not the content itself.",
            "Content forwarded to AI models (OpenAI) for analysis is governed by OpenAI's API data usage policy. By default, OpenAI does not use API inputs for model training.",
            "You confirm that you have the authority to share the content with me and that doing so does not breach any third-party intellectual property rights, confidentiality obligations, or data protection requirements.",
            "I accept no liability for the accuracy of AI-generated analysis results. Results are indicative and should be reviewed before acting on them.",
          ]} />
          <P>
            A processing certificate documenting the session metadata (not the content) is automatically generated for every tool session. See the <a href="#data-processing" className="underline underline-offset-2 hover:text-primary transition-colors">Data Processing</a> section for details.
          </P>

          <H3>8. Limitation of Liability</H3>
          <P>
            To the maximum extent permitted by applicable law, my total liability to you shall not exceed the amount you paid me in the 12 months preceding the claim. I am not liable for indirect, incidental, or consequential damages.
          </P>

          <H3>9. Governing Law</H3>
          <P>
            These terms are governed by the laws of Romania. Any disputes shall be subject to the exclusive jurisdiction of the courts of Bucharest.
          </P>

          <H3>10. Changes to These Terms</H3>
          <P>
            I may update these terms from time to time. I will notify active subscribers of material changes by email at least 14 days before they take effect. Continued use of the services after that date constitutes acceptance.
          </P>
        </Section>

        {/* ── PRIVACY POLICY ── */}
        <Section id="privacy" title="Privacy Policy">
          <P>
            This Privacy Policy describes how I, {BUSINESS}, collect, use, and protect your personal data in accordance with the EU General Data Protection Regulation (GDPR) and Romanian data protection law.
          </P>

          <H3>1. Data Controller</H3>
          <P>
            I am the data controller: Miruna Cristiana Paun PFA, Bucharest, Romania. You can reach me using {CONTACT_LINK}.
          </P>

          <H3>2. Data I Collect</H3>
          <UL items={[
            "Account data: name, email address, password (hashed).",
            "Payment data: billing address and payment method details — processed and stored by Paddle.com on my behalf. I do not store raw card data.",
            "Usage data: pages visited, features used, session timestamps — collected to improve the platform.",
            "Communications: emails or messages you send me directly.",
            "Tool session metadata: when I use AI analysis tools to process documentation shared with me by a client, I log metadata only (tool name, timestamp, document count, approximate character count, content type). The actual content is never stored.",
          ]} />

          <H3>3. How I Use Your Data</H3>
          <UL items={[
            "To provide and maintain the Learning OS platform and consulting services.",
            "To process payments via Paddle.",
            "To send transactional emails (receipts, cancellation confirmations, service updates).",
            "To improve my services through aggregated, anonymized usage analysis.",
            "I do not sell your personal data to third parties.",
          ]} />

          <H3>4. Tool Processing — What Is and Is Not Stored</H3>
          <P>
            When I use AI analysis tools on this site to process documentation shared with me by a client, the following applies:
          </P>
          <UL items={[
            "Raw content (files, pasted text, scraped URLs) is loaded into server memory for analysis only. It is not written to any database or storage layer.",
            "Once the analysis is complete, the raw content is released from memory. There is no persistent copy anywhere in the system.",
            "A session record is created containing only: session ID, tool name, document count, approximate total character count, content type categories (e.g. PDF, text), and timestamps. This metadata is retained for 12 months.",
            "Content submitted to AI models (OpenAI GPT-4o) via the OpenAI API is governed by OpenAI's data use policy. API data is not used for OpenAI model training by default.",
            <>Clients may request a <strong>processing certificate</strong> for any tool session — a formal record confirming what metadata was logged and that no raw content was retained. Use {CONTACT_LINK} with the session date and approximate time.</>,
          ]} />

          <H3>5. Data Processors</H3>
          <UL items={[
            "Paddle.com Market Limited — payment processing and Merchant of Record services.",
            "Replit Inc. — hosting infrastructure.",
            "OpenAI, LLC — AI model inference for tool analysis features (data processed under OpenAI's API terms; not used for training).",
          ]} />

          <H3>6. Your GDPR Rights</H3>
          <P>You have the right to:</P>
          <UL items={[
            "Access the personal data I hold about you.",
            "Request correction of inaccurate data.",
            "Request deletion of your data ('right to be forgotten').",
            "Object to or restrict processing.",
            "Request data portability.",
            "Lodge a complaint with the Romanian National Supervisory Authority for Personal Data Processing (ANSPDCP).",
          ]} />
          <P>To exercise any of these rights, use {CONTACT_LINK}.</P>

          <H3>7. Data Retention</H3>
          <UL items={[
            "Account data: retained while your account is active and for up to 3 years after closure for legal and accounting purposes.",
            "Payment records: retained as required by Romanian fiscal law (5 years).",
            "Tool session metadata (not content): retained for 12 months.",
            "Raw content submitted to tools: not retained — discarded after each session.",
          ]} />

          <H3>8. Cookies</H3>
          <P>
            I use only essential cookies required for authentication and session management. I do not use advertising or tracking cookies.
          </P>
        </Section>

        {/* ── REFUND POLICY ── */}
        <Section id="refund" title="Refund Policy">
          <P>
            I want you to feel confident purchasing from Synaptica Knowledge Systems. This policy covers the Synaptica Learning OS subscription product.
          </P>

          <H3>1. Free Trial</H3>
          <P>
            All paid plans include a 7-day free trial. No charge is made during the trial period. You may cancel at any time before the trial ends and will not be billed.
          </P>

          <H3>2. EU Statutory Withdrawal Right</H3>
          <P>
            Under EU consumer law, you have the right to withdraw from a digital subscription contract within 14 days of purchase without giving any reason, provided you have not yet accessed the digital content or requested that delivery begin. If you have accessed the platform and requested immediate access at the time of purchase, the right of withdrawal may not apply. To exercise this right, use {CONTACT_LINK} within 14 days of your first charge.
          </P>

          <H3>3. Refund Requests After the Trial</H3>
          <P>
            Outside of the statutory withdrawal period, subscription payments are non-refundable. If you cancel your subscription, you retain access until the end of the current billing period. I do not offer partial-month refunds.
          </P>

          <H3>4. Exceptions</H3>
          <P>
            If a technical fault on my side prevents you from accessing the platform for an extended period, I will issue a pro-rated credit or refund at my discretion. Use {CONTACT_LINK} with details.
          </P>

          <H3>5. Consulting Services</H3>
          <P>
            Consulting engagements are governed by individual project agreements signed before work begins. Refund terms for consulting work are stated in those agreements.
          </P>

          <H3>6. How to Request a Refund</H3>
          <P>
            Use {CONTACT_LINK} with your name, registered email address, and the reason for your request. I process refund requests within 5 business days. Approved refunds are returned via the original payment method through Paddle.
          </P>
        </Section>

        {/* ── DATA PROCESSING ── */}
        <Section id="data-processing" title="Data Processing & Client Document Policy">
          <P>
            This section explains how client documents and proprietary content are handled when I process them using AI tools as part of a consulting engagement. It is intended to give clients clear, verifiable assurance about data handling.
          </P>

          <H3>How client documents are processed</H3>
          <P>
            AI-powered tools on this site are operated by me (Miruna Paun) — not by clients directly. When a client shares documentation, internal content, or other materials with me as part of a consulting engagement, I upload and process that content on their behalf using tools such as DocAudit, Knowledge Architecture Sprint, RAG Pipeline, and Prompt Workshop. The following applies to all such sessions:
          </P>
          <UL items={[
            "Client content is loaded into server memory for the duration of that analysis session only.",
            "It is processed through the AI analysis pipeline and the results are used to deliver the agreed consulting output.",
            "The raw content is then released from memory. There is no database write, no file system copy, no cache, and no backup of the content processed.",
            "The only record created is a session metadata log containing: session ID, tool used, timestamp, number of documents, approximate total size, and content type (e.g. PDF, plain text). The actual text is never stored.",
          ]} />

          <H3>What I do not do with client content</H3>
          <UL items={[
            "I do not store, archive, or retain copies of client documents.",
            "I do not use client content to train AI models.",
            "I do not share client content with third parties, except as required by the AI model API call (OpenAI) to perform analysis.",
            "I do not use client content for any purpose beyond the specific analysis session it was shared for.",
          ]} />

          <H3>Third-party AI processing (OpenAI)</H3>
          <P>
            Analysis tools on this site use OpenAI's API to perform semantic analysis. Content is sent to OpenAI's servers as part of this process. Under OpenAI's API data usage policy (as of the effective date above), data submitted via the API is not used to train OpenAI's models. Clients with strict data residency or confidentiality requirements should raise this before the engagement begins so we can agree on appropriate handling.
          </P>

          <H3>Processing certificates</H3>
          <P>
            For every tool session, a processing certificate is automatically generated. This certificate records:
          </P>
          <UL items={[
            "A unique session ID and timestamp",
            "The tool used",
            "Number of documents processed and their approximate combined size",
            "A one-way cryptographic hash of the submitted content (proves what was processed without revealing the content)",
            "A confirmation that raw_content_retained = false",
            "The time processing completed",
          ]} />
          <P>
            Processing certificates can be provided to clients, their compliance teams, or legal counsel as evidence that proprietary documents were not retained by Synaptica Knowledge Systems. To request a certificate for a specific session, use {CONTACT_LINK} with the date and approximate time of the session.
          </P>

          <H3>Consulting engagement data handling</H3>
          <P>
            When you engage me for consulting services and share proprietary documents for analysis, the principles above apply throughout. Where the engagement involves me reviewing documents over an extended period (e.g. a multi-week sprint), this is also governed by the confidentiality clauses in your individual engagement agreement, which I sign before work begins.
          </P>
          <P>
            If you have questions about how your organisation's data will be handled before committing to an engagement, use {CONTACT_LINK} to request a pre-engagement data processing discussion.
          </P>
        </Section>

        <p className="text-xs text-muted-foreground/50 border-t border-white/5 pt-8">
          Last updated: {EFFECTIVE} · {BUSINESS}
        </p>
      </main>
    </div>
  );
}
