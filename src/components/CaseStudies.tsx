import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, FolderOpen } from "lucide-react";

interface CaseStudy {
  id: string;
  title: string;
  industry: string;
  challenge: string;
  outcome: string;
}

export function CaseStudies() {
  const [studies, setStudies] = useState<CaseStudy[]>([]);

  useEffect(() => {
    fetch("/api/public/case-studies")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CaseStudy[]) => {
        if (Array.isArray(data)) setStudies(data);
      })
      .catch(() => {});
  }, []);

  return (
    <section id="case-studies" className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-sm font-semibold text-secondary uppercase tracking-widest mb-3">
            Case Studies
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold">
            Projects & outcomes
          </h3>
        </motion.div>

        {studies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {[
              {
                industry: "SaaS / Technology",
                challenge: "Knowledge base restructuring & RAG pipeline design",
                outcome: "Structured taxonomy, retrieval-ready architecture",
              },
              {
                industry: "Professional Services",
                challenge: "Documentation audit & gap analysis",
                outcome: "Prioritized remediation plan, improved coverage",
              },
              {
                industry: "E-Commerce / Retail",
                challenge: "Prompt engineering & content workflow automation",
                outcome: "Reusable prompt library, reduced turnaround time",
              },
            ].map((example, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 border border-dashed border-white/10 relative overflow-hidden"
              >
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 bg-white/5 px-2 py-1 rounded">
                    Example format
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <Briefcase className="w-5 h-5 text-primary/50" />
                </div>
                <p className="text-xs text-secondary/70 uppercase tracking-wider font-medium mb-2">
                  {example.industry}
                </p>
                <h4 className="text-sm font-semibold text-foreground/60 mb-3">
                  {example.challenge}
                </h4>
                <p className="text-sm text-muted-foreground/50">
                  {example.outcome}
                </p>
              </div>
            ))}
            <div className="md:col-span-3 text-center mt-4">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground/60 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                <FolderOpen className="w-4 h-4" />
                Real case studies will be published as projects are completed
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {studies.map((study, i) => (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-secondary uppercase tracking-wider font-medium mb-2">
                  {study.industry}
                </p>
                <h4 className="text-lg font-semibold text-foreground mb-3">
                  {study.title}
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground font-medium">Challenge:</span>
                    <p className="text-muted-foreground mt-1">{study.challenge}</p>
                  </div>
                  <div>
                    <span className="text-primary font-medium">Outcome:</span>
                    <p className="text-foreground/80 mt-1">{study.outcome}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
