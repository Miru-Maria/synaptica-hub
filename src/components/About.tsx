import { motion } from "framer-motion";
import { PhoenixLogo } from "./PhoenixLogo";

export function About() {
  const skills = [
    "AI Knowledge Architecture", 
    "RAG Design", 
    "Documentation Strategy", 
    "Prompt Engineering", 
    "Technical Writing", 
    "Information Architecture", 
    "OpenAI", 
    "LangChain", 
    "PostgreSQL", 
    "React"
  ];

  return (
    <section id="about" className="py-16 sm:py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16 md:hidden"
        >
          <h2 className="text-3xl font-bold mb-4">About Synaptica</h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Visual Left Side */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="lg:col-span-5 flex flex-col items-center justify-center p-8 lg:p-12 glass rounded-3xl relative overflow-hidden"
          >
            {/* Background decorative glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-50 mix-blend-overlay" />
            
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 mb-8">
              <div className="absolute inset-0 rounded-full border border-primary/30 animate-[spin_10s_linear_infinite] border-t-primary glow-primary" />
              <div className="absolute inset-2 rounded-full border border-secondary/30 animate-[spin_15s_linear_infinite_reverse] border-b-secondary" />
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <PhoenixLogo size={120} glowIntensity="high" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold tracking-tight mb-1 text-center">Miruna Paun</h3>
            <p className="text-primary text-sm font-medium uppercase tracking-widest text-center">Systems Architect</p>
          </motion.div>

          {/* Content Right Side */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="lg:col-span-7"
          >
            <h2 className="hidden md:block text-sm font-semibold text-secondary uppercase tracking-widest mb-3">About Synaptica</h2>
            <h3 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">
              Building knowledge infrastructure for the AI era.
            </h3>
            
            <div className="space-y-6 text-muted-foreground text-lg mb-10">
              <p>
                <strong className="text-foreground font-semibold">Synaptica Knowledge Systems</strong> is the freelance practice of Miruna Paun — an AI Knowledge Systems Designer & Architect with a background in technical writing, documentation strategy, and applied AI.
              </p>
              <p>
                I work at the intersection of human expertise and machine intelligence — designing systems that capture, structure, and surface organizational knowledge in ways that AI can augment and humans can trust.
              </p>
              <p>
                Whether you need a knowledge base rebuilt from scratch, a RAG pipeline designed around your internal docs, or a suite of prompt templates your team can rely on — I design solutions that are practical, scalable, and grounded in how your people actually work.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-300 hover:border-primary/50 hover:text-primary transition-colors cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
