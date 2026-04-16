import { motion } from "framer-motion";
import { Network, FileSearch, MessageSquareCode, Terminal } from "lucide-react";

export function ServicesAndTools() {
  const services = [
    {
      icon: <Network className="w-8 h-8 text-primary" />,
      title: "Knowledge Architecture",
      description: "Designing the taxonomy, structure, and retrieval logic of your organization's knowledge systems — so the right information reaches the right people, every time."
    },
    {
      icon: <FileSearch className="w-8 h-8 text-secondary" />,
      title: "AI Documentation Systems",
      description: "Gap analysis, content strategy, and AI-assisted documentation workflows that keep your knowledge base accurate, complete, and useful."
    },
    {
      icon: <MessageSquareCode className="w-8 h-8 text-primary" />,
      title: "RAG & Conversational AI",
      description: "Building retrieval-augmented generation pipelines and AI assistants grounded in your company's own documentation and processes."
    },
    {
      icon: <Terminal className="w-8 h-8 text-secondary" />,
      title: "Prompt Engineering",
      description: "Designing and testing systematic prompt libraries for knowledge work — from FAQ generation to onboarding scripts and style-guide enforcement."
    }
  ];

  return (
    <section id="services" className="py-16 sm:py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What I Design</h2>
          <p className="text-lg text-muted-foreground">
            Custom AI knowledge architecture for organizations that need more than just keyword search.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1 }}
              className="glass p-8 rounded-2xl group hover:border-primary/50 transition-colors duration-500 hover:bg-white/[0.03]"
            >
              <div className="w-16 h-16 rounded-xl bg-background border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:glow-primary">
                {service.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
                {service.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
