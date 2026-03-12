import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { PhoenixLogo } from "./PhoenixLogo";

export function Hero() {
  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-24 overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 -left-64 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 flex flex-col items-center">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mb-8"
        >
          {/* Logo glow halo */}
          <div className="absolute inset-0 rounded-full glow-primary blur-xl opacity-60 animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full glass flex items-center justify-center bg-background/50 border-primary/30 p-4">
            <PhoenixLogo size={96} glowIntensity="high" />
          </div>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6"
        >
          <span className="gradient-text">Synaptica</span> <br className="hidden sm:block"/> Knowledge Systems
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-6 max-w-3xl"
        >
          <h2 className="text-xl sm:text-2xl text-foreground font-medium flex items-center justify-center gap-3">
            <Sparkles className="text-primary w-5 h-5 sm:w-6 sm:h-6" />
            AI Knowledge Systems Design & Architecture
            <Sparkles className="text-secondary w-5 h-5 sm:w-6 sm:h-6" />
          </h2>
          
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            I design the intelligence infrastructure of modern organizations — AI-powered knowledge bases, documentation systems, semantic search, RAG pipelines, and prompt engineering frameworks that help teams find, use, and build on what they know.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 mt-10 w-full sm:w-auto"
        >
          <button 
            onClick={() => scrollTo("services")}
            className="btn-primary group flex items-center justify-center gap-2"
          >
            Explore My Work
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={() => scrollTo("contact")}
            className="btn-secondary"
          >
            Get In Touch
          </button>
        </motion.div>
      </div>
    </section>
  );
}
