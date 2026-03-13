import { useState, useEffect } from "react";
import { Mail, MailOpen, RefreshCw, Lock } from "lucide-react";

interface Submission {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  created_at: string;
  read: boolean;
}

export function Admin() {
  const [key, setKey] = useState(() => sessionStorage.getItem("admin_key") || "");
  const [input, setInput] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Submission | null>(null);

  const fetchSubmissions = async (adminKey: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/submissions", {
        headers: { "x-admin-key": adminKey },
      });
      if (res.status === 401) {
        setError("Wrong key — please try again.");
        sessionStorage.removeItem("admin_key");
        setKey("");
        return;
      }
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch {
      setError("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (key) fetchSubmissions(key);
  }, [key]);

  const markRead = async (id: number) => {
    await fetch(`/api/admin/submissions/${id}/read`, {
      method: "PATCH",
      headers: { "x-admin-key": key },
    });
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, read: true } : s)));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, read: true } : null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem("admin_key", input);
    setKey(input);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const unread = submissions.filter((s) => !s.read).length;

  if (!key) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="glass rounded-3xl p-8 border border-white/10 w-full max-w-sm text-center">
          <Lock className="w-10 h-10 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin Inbox</h1>
          <p className="text-muted-foreground text-sm mb-6">Enter your admin key to view submissions.</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Admin key"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              required
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="btn-primary py-3">Unlock</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Contact Inbox</h1>
            {unread > 0 && (
              <p className="text-sm text-primary mt-1">{unread} unread message{unread !== 1 ? "s" : ""}</p>
            )}
          </div>
          <button
            onClick={() => fetchSubmissions(key)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {loading && <p className="text-muted-foreground">Loading…</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && submissions.length === 0 && (
          <div className="glass rounded-2xl p-12 border border-white/10 text-center text-muted-foreground">
            No submissions yet.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            {submissions.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelected(s); if (!s.read) markRead(s.id); }}
                className={`w-full text-left glass rounded-2xl p-4 border transition-all ${
                  selected?.id === s.id
                    ? "border-primary/50 bg-primary/5"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {s.read
                      ? <MailOpen className="w-4 h-4 text-muted-foreground" />
                      : <Mail className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${s.read ? "text-gray-400" : "text-white"}`}>
                      {s.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{s.subject || "(no subject)"}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(s.created_at)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="glass rounded-2xl border border-white/10 p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold">{selected.subject || "(no subject)"}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  From: <span className="text-white">{selected.name}</span>{" "}
                  &lt;<a href={`mailto:${selected.email}`} className="text-primary hover:underline">{selected.email}</a>&gt;
                </p>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(selected.created_at)}</p>
              </div>
              <hr className="border-white/10" />
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
              <a
                href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || "Your message")}`}
                className="btn-primary py-2 text-center text-sm mt-auto"
              >
                Reply via email
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
