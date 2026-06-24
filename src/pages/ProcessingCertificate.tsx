import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Helmet } from "@/components/Helmet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle2, Loader2, FileText } from "lucide-react";

export default function ProcessingCertificate() {
  const [form, setForm] = useState({ clientName: "", clientCompany: "", clientEmail: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; certRef?: string; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/certificates/public/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({ ok: true, certRef: data.certRef });
      } else {
        setResult({ ok: false, error: data.error || "Something went wrong. Please try again." });
      }
    } catch {
      setResult({ ok: false, error: "Network error. Please try again." });
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet
        title="Request Data Processing Certificate — Synaptica Knowledge Systems"
        description="Request your GDPR-compliant data processing certificate from Synaptica Knowledge Systems."
      />
      <Navbar />
      <main className="min-h-screen bg-neutral-950 pt-24 pb-20 px-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Data Processing Certificate</h1>
              <p className="text-sm text-neutral-400">GDPR Art. 28 — Processor compliance record</p>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-6">
            <p className="text-neutral-300 text-sm leading-relaxed mb-4">
              If Synaptica Knowledge Systems has processed data on your behalf — through any of our
              consulting services or AI-powered tools — you can request an official Data Processing
              Certificate here.
            </p>
            <p className="text-neutral-400 text-sm leading-relaxed">
              The certificate will be emailed to you immediately and confirms the processor identity,
              legal basis, processing activities, and sub-processor chain (OpenAI) in accordance with
              GDPR Article 28.
            </p>
          </div>

          {result?.ok ? (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Certificate Issued</h2>
              <p className="text-neutral-300 text-sm mb-4">
                Your certificate has been sent to <strong>{form.clientEmail}</strong>.
              </p>
              <div className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2">
                <FileText className="w-4 h-4 text-neutral-400" />
                <span className="text-xs text-neutral-300 font-mono">{result.certRef}</span>
              </div>
              <p className="text-neutral-500 text-xs mt-4">
                Please check your spam folder if the email doesn't arrive within a few minutes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
              <h2 className="text-white font-semibold text-base mb-1">Your details</h2>

              <div className="space-y-1.5">
                <Label className="text-neutral-300 text-sm">Full name <span className="text-emerald-400">*</span></Label>
                <Input
                  required
                  value={form.clientName}
                  onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                  placeholder="e.g. Jane Smith"
                  className="bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-neutral-300 text-sm">Company / organisation</Label>
                <Input
                  value={form.clientCompany}
                  onChange={(e) => setForm((f) => ({ ...f, clientCompany: e.target.value }))}
                  placeholder="e.g. Acme Ltd (optional)"
                  className="bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-neutral-300 text-sm">Email address <span className="text-emerald-400">*</span></Label>
                <Input
                  required
                  type="email"
                  value={form.clientEmail}
                  onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
                  placeholder="you@company.com"
                  className="bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500"
                />
                <p className="text-xs text-neutral-500">The certificate PDF will be sent here.</p>
              </div>

              {result?.error && (
                <p className="text-red-400 text-sm bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3">
                  {result.error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Issuing certificate…
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Request Certificate
                  </>
                )}
              </Button>

              <p className="text-xs text-neutral-600 text-center leading-relaxed">
                By submitting, you confirm that data was processed on your behalf by Synaptica Knowledge Systems.
                Your details will only be used to issue this certificate.
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
