import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Helmet } from "@/components/Helmet";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { TrustSignals } from "@/components/TrustSignals";
import { ServicesAndTools } from "@/components/ServicesAndTools";
import { ServicePackages } from "@/components/ServicePackages";
import { LearningOS } from "@/components/LearningOS";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { CurrencyProvider } from "@/context/currency";

export default function Home() {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const tryScroll = (attempts: number) => {
        const el = document.getElementById(hash);
        if (el) {
          setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 80);
        } else if (attempts > 0) {
          setTimeout(() => tryScroll(attempts - 1), 150);
        }
      };
      tryScroll(5);
    }
  }, []);

  return (
    <CurrencyProvider>
      <div className="bg-background min-h-screen text-foreground selection:bg-primary/30 selection:text-white overflow-x-hidden">
        <Helmet
          title="Synaptica Knowledge Systems — AI Knowledge Architecture & RAG Design"
          description="I design AI-powered knowledge bases, RAG pipelines, documentation systems, and prompt engineering frameworks that help teams find, use, and build on what they know."
          ogTitle="Synaptica Knowledge Systems"
          ogDescription="Freelance AI Knowledge Systems design — knowledge bases, RAG pipelines, documentation audits, and prompt engineering frameworks."
          ogType="website"
        />
        <Navbar />

        <main>
          <Hero />
          <About />
          <TrustSignals />
          <ServicesAndTools />
          <ServicePackages />
          <LearningOS />
          <Contact />
        </main>

        <Footer />
      </div>
    </CurrencyProvider>
  );
}
