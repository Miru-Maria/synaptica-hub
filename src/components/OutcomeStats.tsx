import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

interface OutcomeStat {
  id: string;
  label: string;
  value: string;
}

export function OutcomeStats() {
  const [stats, setStats] = useState<OutcomeStat[]>([]);

  useEffect(() => {
    fetch("/api/public/outcome-stats")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: OutcomeStat[]) => {
        if (Array.isArray(data)) setStats(data);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-16 relative z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {stats.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-8"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center">
              {[
                { label: "Teams helped", value: "—" },
                { label: "Documents audited", value: "—" },
                { label: "Hours saved", value: "—" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-foreground/30">
                    {item.value}
                  </span>
                  <span className="text-sm text-muted-foreground/50 mt-1">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground/50 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                <BarChart3 className="w-3 h-3" />
                Tracking in progress
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-8"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center">
              {stats.map((stat) => (
                <div key={stat.id} className="flex flex-col items-center">
                  <span className="text-3xl md:text-4xl font-bold text-primary">
                    {stat.value}
                  </span>
                  <span className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
