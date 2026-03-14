import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Calendar, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { PhoenixLogo } from "@/components/PhoenixLogo";

const TIMELINE_OPTIONS = [
  "ASAP — within 2 weeks",
  "This quarter",
  "Next quarter",
  "Just exploring",
];

export default function WorkWithMe() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({
    name: "",
    company: "",
    challenge: "",
    timeline: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = form.name && form.company && form.challenge && form.timeline;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/public/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit");
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-background min-h-screen text-foreground selection:bg-primary/30 selection:text-white">
      <div className="absolute top-1/4 -left-64 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />

      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-white/10 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setLocation("/")}
          >
            <div className="relative w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <PhoenixLogo size={22} glowIntensity="medium" />
            </div>
            <span className="font-semibold tracking-wide text-sm md:text-base hidden sm:block">
              Synaptica <span className="text-muted-foreground font-normal">Knowledge Systems</span>
            </span>
          </div>
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Work With Me</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tell me a bit about your project and what you're trying to solve. I'll review your inquiry and get back to you within 48 hours.
          </p>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-8 md:p-12 border border-white/10 text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3">Inquiry Received</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Thanks, {form.name}! I'll review your project details and follow up within 48 hours to discuss next steps.
            </p>
            <button
              onClick={() => setLocation("/")}
              className="btn-primary py-3 px-8"
            >
              Back to Home
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              onSubmit={handleSubmit}
              className="lg:col-span-3 glass rounded-3xl p-8 border border-white/10 space-y-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                <span className="text-sm font-medium text-gray-300">Available for new projects</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Your Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Smith"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Company / Organization</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Acme Corp"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">What are you trying to solve?</label>
                <textarea
                  value={form.challenge}
                  onChange={(e) => setForm({ ...form, challenge: e.target.value })}
                  placeholder="Describe your challenge or goal — e.g., 'We need a better way for our support team to find answers in our internal docs' or 'We're building a RAG pipeline and need help with knowledge architecture.'"
                  rows={5}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Preferred Timeline</label>
                <div className="grid grid-cols-2 gap-3">
                  {TIMELINE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setForm({ ...form, timeline: option })}
                      className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all text-left ${
                        form.timeline === option
                          ? "bg-primary/20 border-primary/50 text-white"
                          : "bg-black/40 border-white/10 text-muted-foreground hover:border-white/20"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Send Inquiry"}
                {!submitting && <Send className="w-4 h-4" />}
              </button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="glass rounded-3xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Book a Discovery Call</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Prefer to talk it through? Schedule a free 30-minute discovery call.
                </p>
                <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 min-h-[320px] flex items-center justify-center">
                  <div className="text-center p-6">
                    <Calendar className="w-10 h-10 text-primary/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Calendly integration coming soon.
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      In the meantime, submit the form and I'll send you a scheduling link.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-3xl p-6 border border-white/10">
                <h3 className="font-semibold mb-3">What to expect</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary mt-0.5">1.</span>
                    <span>Submit your inquiry with project details</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary mt-0.5">2.</span>
                    <span>I'll review and reply within 48 hours</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary mt-0.5">3.</span>
                    <span>We'll schedule a discovery call to scope the engagement</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary mt-0.5">4.</span>
                    <span>Receive a tailored proposal with timeline and deliverables</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
