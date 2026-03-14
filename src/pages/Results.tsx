import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { PhoenixLogo } from "@/components/PhoenixLogo";
import { Testimonials } from "@/components/Testimonials";
import { CaseStudies } from "@/components/CaseStudies";
import { OutcomeStats } from "@/components/OutcomeStats";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface SocialData {
  testimonials: unknown[];
  caseStudies: unknown[];
  outcomeStats: unknown[];
  loaded: boolean;
}

export default function Results() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<SocialData>({
    testimonials: [],
    caseStudies: [],
    outcomeStats: [],
    loaded: false,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/public/testimonials").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/public/case-studies").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/public/outcome-stats").then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([testimonials, caseStudies, outcomeStats]) => {
      setData({
        testimonials: Array.isArray(testimonials) ? testimonials : [],
        caseStudies: Array.isArray(caseStudies) ? caseStudies : [],
        outcomeStats: Array.isArray(outcomeStats) ? outcomeStats : [],
        loaded: true,
      });
    });
  }, []);

  const hasAnyData =
    data.testimonials.length > 0 ||
    data.caseStudies.length > 0 ||
    data.outcomeStats.length > 0;

  return (
    <div className="bg-background min-h-screen text-foreground selection:bg-primary/30 selection:text-white overflow-x-hidden">
      <Navbar />

      <main className="relative pt-24 pb-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Client Results</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real outcomes from real organizations — measurable improvements in knowledge access, documentation quality, and team productivity.
            </p>
          </motion.div>

          {!data.loaded ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : !hasAnyData ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-32"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-9 h-9 text-primary/40" />
              </div>
              <h2 className="text-2xl font-semibold mb-3">Results Coming Soon</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                We're currently completing engagements with our first clients. Their outcomes, stories, and metrics will be published here as projects wrap up.
              </p>
              <button
                onClick={() => setLocation("/work-with-me")}
                className="btn-primary mt-8 py-3 px-8 inline-flex items-center gap-2"
              >
                Start a Conversation
              </button>
            </motion.div>
          ) : (
            <>
              {data.outcomeStats.length > 0 && <OutcomeStats />}
              {data.testimonials.length > 0 && <Testimonials />}
              {data.caseStudies.length > 0 && <CaseStudies />}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
