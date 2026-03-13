import { useEffect } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { PhoenixLogo } from "@/components/PhoenixLogo";

const BUSINESS = "Miruna Cristiana Paun PFA (trading as Synaptica Knowledge Systems)";
const EMAIL = "cristiana_paun@protonmail.com";
const EFFECTIVE = "March 13, 2026";

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

function UL({ items }: { items: string[] }) {
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
    <div className="bg-background min-h-screen text-foreground">
      {/* Minimal header */}
      <header className="border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <PhoenixLogo size={28} glowIntensity="low" />
            <span className="font-semibold text-foreground tracking-wide group-hover:text-primary transition-colors">
              Synaptica <span className="font-normal text-muted-foreground">Knowledge Systems</span>
            </span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Page title */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3">Legal</h1>
          <p className="text-muted-foreground">Effective date: {EFFECTIVE}</p>

          {/* In-page navigation */}
          <nav className="mt-8 flex flex-wrap gap-4 text-sm">
            {[
              { label: "Terms of Service", id: "terms" },
              { label: "Privacy Policy", id: "privacy" },
              { label: "Refund Policy", id: "refund" },
            ].map(({ label, id }) => (
              <a
                key={id}
                href={`#${id}`}
                className="px-4 py-2 rounded-lg border border-white/10 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
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
            Synaptica Knowledge Systems is a trade name I operate as Miruna Cristiana Paun PFA, a sole trader registered in Romania (Bucharest) under Romanian fiscal law. Contact: {EMAIL}.
          </P>

          <H3>2. Services</H3>
          <P>
            I provide two categories of service:
          </P>
          <UL items={[
            "Synaptica Learning OS — a web-based SaaS subscription platform offering structured learning paths, skill tracking, project management tools, and an AI tutor for professionals transitioning into AI knowledge architecture.",
            "Consulting services — knowledge architecture design, documentation audits, RAG pipeline builds, prompt engineering workshops, and monthly retainer engagements delivered remotely."
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

          <H3>7. Limitation of Liability</H3>
          <P>
            To the maximum extent permitted by applicable law, my total liability to you shall not exceed the amount you paid me in the 12 months preceding the claim. I am not liable for indirect, incidental, or consequential damages.
          </P>

          <H3>8. Governing Law</H3>
          <P>
            These terms are governed by the laws of Romania. Any disputes shall be subject to the exclusive jurisdiction of the courts of Bucharest.
          </P>

          <H3>9. Changes to These Terms</H3>
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
            I am the data controller: Miruna Cristiana Paun PFA, Bucharest, Romania. Contact: {EMAIL}.
          </P>

          <H3>2. Data I Collect</H3>
          <UL items={[
            "Account data: name, email address, password (hashed).",
            "Payment data: billing address and payment method details — processed and stored by Paddle.com on my behalf. I do not store raw card data.",
            "Usage data: pages visited, features used, session timestamps — collected to improve the platform.",
            "Communications: emails or messages you send me directly.",
          ]} />

          <H3>3. How I Use Your Data</H3>
          <UL items={[
            "To provide and maintain the Learning OS platform and consulting services.",
            "To process payments via Paddle.",
            "To send transactional emails (receipts, cancellation confirmations, service updates).",
            "To improve my services through aggregated, anonymized usage analysis.",
            "I do not sell your personal data to third parties."
          ]} />

          <H3>4. Data Processors</H3>
          <UL items={[
            "Paddle.com Market Limited — payment processing and Merchant of Record services.",
            "Replit Inc. — hosting infrastructure.",
          ]} />

          <H3>5. Your GDPR Rights</H3>
          <P>You have the right to:</P>
          <UL items={[
            "Access the personal data I hold about you.",
            "Request correction of inaccurate data.",
            "Request deletion of your data ('right to be forgotten').",
            "Object to or restrict processing.",
            "Request data portability.",
            "Lodge a complaint with the Romanian National Supervisory Authority for Personal Data Processing (ANSPDCP)."
          ]} />
          <P>To exercise any of these rights, contact me at {EMAIL}.</P>

          <H3>6. Data Retention</H3>
          <P>
            I retain account data for as long as your account is active and for up to 3 years after closure for legal and accounting purposes. Payment records are retained as required by Romanian fiscal law (5 years).
          </P>

          <H3>7. Cookies</H3>
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
            Under EU consumer law, you have the right to withdraw from a digital subscription contract within 14 days of purchase without giving any reason, provided you have not yet accessed the digital content or requested that delivery begin. If you have accessed the platform and requested immediate access at the time of purchase, the right of withdrawal may not apply. To exercise this right, contact me at {EMAIL} within 14 days of your first charge.
          </P>

          <H3>3. Refund Requests After the Trial</H3>
          <P>
            Outside of the statutory withdrawal period, subscription payments are non-refundable. If you cancel your subscription, you retain access until the end of the current billing period. I do not offer partial-month refunds.
          </P>

          <H3>4. Exceptions</H3>
          <P>
            If a technical fault on my side prevents you from accessing the platform for an extended period, I will issue a pro-rated credit or refund at my discretion. Contact me at {EMAIL} with details.
          </P>

          <H3>5. Consulting Services</H3>
          <P>
            Consulting engagements are governed by individual project agreements signed before work begins. Refund terms for consulting work are stated in those agreements.
          </P>

          <H3>6. How to Request a Refund</H3>
          <P>
            Email {EMAIL} with your name, registered email address, and the reason for your request. I process refund requests within 5 business days. Approved refunds are returned via the original payment method through Paddle.
          </P>
        </Section>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground/50 border-t border-white/5 pt-8">
          Last updated: {EFFECTIVE} · {BUSINESS} · {EMAIL}
        </p>
      </main>
    </div>
  );
}
