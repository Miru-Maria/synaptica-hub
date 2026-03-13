import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Linkedin, Github } from "lucide-react";
import { ContactModal } from "./ContactModal";

export function Contact() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section id="contact" className="py-24 relative z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Work With Me</h2>
          <p className="text-xl text-muted-foreground">
            Have a knowledge problem? Let's design the solution.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-8 md:p-12 border border-white/10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="flex items-center gap-3 mb-8">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            <span className="text-sm font-medium text-gray-300">Available for new projects — Q2 2026</span>
          </div>

          <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-10 max-w-2xl">
            I take on a select number of freelance engagements each quarter. If you're building AI-powered knowledge systems, need documentation strategy, or want to explore what knowledge architecture could look like for your organization — I'd love to hear from you.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">

            {/* Contact Form Trigger */}
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-4 group bg-black/40 hover:bg-black/60 border border-white/10 hover:border-primary/50 transition-all rounded-2xl p-4 w-full sm:w-auto text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex-grow pr-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Send a Message</p>
                <p className="text-lg font-medium text-white">Open Contact Form</p>
              </div>
            </button>

            {/* Social Links */}
            <div className="flex gap-4">
              <a
                href="https://www.linkedin.com/in/miruna-c-paun-97286471/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 rounded-2xl glass flex items-center justify-center hover:bg-white/10 hover:border-secondary/50 transition-all hover:-translate-y-1"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-6 h-6 text-gray-300" />
              </a>
              <a
                href="https://github.com/Miru-Maria"
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 rounded-2xl glass flex items-center justify-center hover:bg-white/10 hover:border-white/30 transition-all hover:-translate-y-1"
                aria-label="GitHub"
              >
                <Github className="w-6 h-6 text-gray-300" />
              </a>
            </div>

          </div>

          <div className="mt-12 pt-8 border-t border-white/5">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="block w-1.5 h-1.5 rounded-full bg-secondary"></span>
              Based in Romania · Available for remote engagements worldwide
            </p>
          </div>

        </motion.div>
      </div>

      <ContactModal open={modalOpen} onOpenChange={setModalOpen} />
    </section>
  );
}
