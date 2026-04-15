import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { BarChart3, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Testimonials } from "@/components/Testimonials";
import { CaseStudies } from "@/components/CaseStudies";
import { OutcomeStats } from "@/components/OutcomeStats";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Helmet } from "@/components/Helmet";

interface SocialData {
  testimonials: unknown[];
  caseStudies: unknown[];
  outcomeStats: unknown[];
  loaded: boolean;
}

const upcomingMetrics = [
  "Knowledge retrieval accuracy before and after architecture redesign",
  "Support ticket deflection rate from AI-powered knowledge bases",
  "Documentation coverage scores measured by DocAudit",
  "Time-to-answer reduction for internal support teams",
];

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
      <Helmet
        title="Client Results — Synaptica Knowledge Systems"
        description="Outcomes from knowledge architecture and RAG pipeline engagements — measurable improvements in knowledge access, documentation quality, and team productivity."
        ogTitle="Client Results — Synaptica Knowledge Systems"
        ogType="website"
      />
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
            <div className="space-y-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-3xl border border-white/10 p-10 md:p-14 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-7 h-7 text-primary/60" />
                </div>
                <h2 className="text-2xl font-semibold mb-3">First engagements in progress</h2>
                <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                  Synaptica launched in early 2026. Active client engagements are underway — documented outcomes, case studies, and measurable metrics will be published here as projects conclude.
                </p>
                <button
                  onClick={() => setLocation("/work-with-me")}
                  className="btn-primary py-3 px-8 inline-flex items-center gap-2"
                >
                  Start a conversation <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <h3 className="text-lg font-semibold text-foreground mb-5 text-center">
                  What I'll be measuring
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                  {upcomingMetrics.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 glass rounded-xl border border-white/8 p-5"
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary/60 shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{m}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-center"
              >
                <div className="inline-flex items-center gap-2 glass border border-white/10 rounded-full px-5 py-3">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Results page updates as projects wrap up — check back soon.
                  </span>
                </div>
              </motion.div>
            </div>
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
