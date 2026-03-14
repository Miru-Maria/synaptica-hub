import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, MessageSquare } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  photo: string;
}

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch("/api/public/testimonials")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Testimonial[]) => {
        if (Array.isArray(data)) setTestimonials(data);
      })
      .catch(() => {});
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1));
  }, [testimonials.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1));
  }, [testimonials.length]);

  return (
    <section id="testimonials" className="py-24 relative z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-sm font-semibold text-secondary uppercase tracking-widest mb-3">
            Testimonials
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold">
            What clients are saying
          </h3>
        </motion.div>

        {testimonials.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-12 text-center max-w-2xl mx-auto"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-7 h-7 text-primary/60" />
            </div>
            <h4 className="text-xl font-semibold mb-3 text-foreground/90">
              Client stories coming soon
            </h4>
            <p className="text-muted-foreground max-w-md mx-auto">
              We're currently working with our first clients. Their stories and
              feedback will appear here as projects are completed.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="glass rounded-2xl p-8 md:p-12 overflow-hidden">
              <Quote className="w-10 h-10 text-primary/30 mb-6" />
              <blockquote className="text-lg md:text-xl text-foreground/90 leading-relaxed mb-8">
                "{testimonials[current].quote}"
              </blockquote>
              <div className="flex items-center gap-4">
                {testimonials[current].photo && (
                  <img
                    src={testimonials[current].photo}
                    alt={testimonials[current].name}
                    className="w-12 h-12 rounded-full object-cover border border-white/10"
                  />
                )}
                <div>
                  <p className="font-semibold text-foreground">
                    {testimonials[current].name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonials[current].role}
                    {testimonials[current].company &&
                      ` · ${testimonials[current].company}`}
                  </p>
                </div>
              </div>
            </div>

            {testimonials.length > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={prev}
                  className="p-2 rounded-full border border-white/10 hover:border-primary/50 hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrent(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === current
                          ? "bg-primary"
                          : "bg-white/20 hover:bg-white/40"
                      }`}
                      aria-label={`Go to testimonial ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  onClick={next}
                  className="p-2 rounded-full border border-white/10 hover:border-primary/50 hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary"
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
