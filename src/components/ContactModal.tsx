import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Status = "idle" | "sending" | "success" | "error";

export function ContactModal({ open, onOpenChange }: ContactModalProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_KEY,
          name: form.name,
          email: form.email,
          subject: form.subject || "New message from Synaptica site",
          message: form.message,
          from_name: "Synaptica Contact Form",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) setStatus("idle");
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-background border border-white/10 text-foreground max-w-lg w-full rounded-2xl p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Send a Message</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            I'll get back to you within 1–2 business days.
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-primary" />
            <p className="text-lg font-semibold">Message sent!</p>
            <p className="text-sm text-muted-foreground">Thanks for reaching out. I'll be in touch soon.</p>
            <button
              onClick={() => handleClose(false)}
              className="mt-2 btn-primary py-2 px-6 text-sm"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name *</label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                  className="bg-white/5 border-white/10 focus-visible:ring-primary/50 h-11"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email *</label>
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                  className="bg-white/5 border-white/10 focus-visible:ring-primary/50 h-11"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subject</label>
              <Input
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="What's this about?"
                className="bg-white/5 border-white/10 focus-visible:ring-primary/50 h-11"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Message *</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Tell me about your project or question..."
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 resize-none transition-colors"
              />
            </div>

            {status === "error" && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Something went wrong. Please try again or reach out directly.
              </div>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="btn-primary py-3 flex items-center justify-center gap-2 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "sending" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
