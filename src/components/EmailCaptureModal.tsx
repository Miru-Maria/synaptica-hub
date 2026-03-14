import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Sparkles } from "lucide-react";

interface EmailCaptureModalProps {
  open: boolean;
  onSubmit: (data: { email: string; firstName: string }) => Promise<boolean>;
  onSkip: () => void;
  toolName?: string;
}

export function EmailCaptureModal({
  open,
  onSubmit,
  onSkip,
  toolName = "Your report",
}: EmailCaptureModalProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !firstName.trim()) {
      setError("Please fill in both fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const success = await onSubmit({ email: email.trim(), firstName: firstName.trim() });
      if (!success) {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="bg-neutral-900 border-neutral-700 sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl text-neutral-100">
            {toolName} is ready!
          </DialogTitle>
          <DialogDescription className="text-center text-neutral-400">
            Enter your details below to unlock the full detailed report.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="capture-first-name" className="text-neutral-300 text-sm">
              First Name
            </Label>
            <Input
              id="capture-first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              className="bg-neutral-800 border-neutral-700 text-neutral-100"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capture-email" className="text-neutral-300 text-sm">
              Email Address
            </Label>
            <Input
              id="capture-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              className="bg-neutral-800 border-neutral-700 text-neutral-100"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Mail className="w-4 h-4 mr-2" />
            {submitting ? "Unlocking..." : "View Full Report"}
          </Button>

          <button
            type="button"
            onClick={onSkip}
            className="w-full text-center text-xs text-neutral-500 hover:text-neutral-400 transition-colors py-1"
          >
            Skip — view summary only
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
