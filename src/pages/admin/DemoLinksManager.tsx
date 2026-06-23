import { useState, useEffect, useCallback } from "react";
import { Copy, Trash2, Plus, Check, Clock, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface DemoToken {
  id: number;
  token: string;
  label: string;
  tools: string[];
  expiresAt: string;
  createdAt: string;
  usedCount: number;
  lastUsedAt: string | null;
}

const ALL_TOOLS = [
  { key: "ka-sprint", label: "KA Sprint" },
  { key: "prompt-workshop", label: "Prompt Workshop" },
  { key: "rag", label: "RAG Pipeline" },
  { key: "docscope", label: "DocScope" },
  { key: "docforge", label: "DocForge" },
];

function getBaseUrl(): string {
  return window.location.origin;
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

function formatExpiry(expiresAt: string): string {
  const d = new Date(expiresAt);
  const now = new Date();
  if (d < now) return "Expired";
  const ms = d.getTime() - now.getTime();
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h remaining`;
}

export default function DemoLinksManager() {
  const [tokens, setTokens] = useState<DemoToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [label, setLabel] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [expiryDays, setExpiryDays] = useState(7);

  const loadTokens = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/demo/tokens", { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json() as DemoToken[];
        setTokens(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTokens(); }, [loadTokens]);

  const createToken = async () => {
    if (!label.trim() || !selectedTools.length) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/demo/tokens", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), tools: selectedTools, expiryDays }),
      });
      if (res.ok) {
        const token = await res.json() as DemoToken;
        setTokens((prev) => [token, ...prev]);
        setLabel("");
        setSelectedTools([]);
        setExpiryDays(7);
        setShowForm(false);
      }
    } finally {
      setCreating(false);
    }
  };

  const deleteToken = async (id: number) => {
    await fetch(`/api/admin/demo/tokens/${id}`, { method: "DELETE", headers: authHeaders() });
    setTokens((prev) => prev.filter((t) => t.id !== id));
  };

  const copyLink = async (token: DemoToken) => {
    const url = `${getBaseUrl()}/demo?token=${token.token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(token.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleTool = (key: string) => {
    setSelectedTools((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const active = tokens.filter((t) => !isExpired(t.expiresAt));
  const expired = tokens.filter((t) => isExpired(t.expiresAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-400">
            Share a time-limited link with a client to demo specific tools without exposing the admin dashboard.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadTokens} className="border-neutral-700 text-neutral-400">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" onClick={() => setShowForm((v) => !v)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-1.5" />
            New Demo Link
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-sm text-neutral-100">Create Demo Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-400">Client / session label</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Acme Corp — Discovery Call"
                className="bg-neutral-800 border-neutral-700 text-neutral-100 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400">Tools to include</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_TOOLS.map(({ key, label: toolLabel }) => (
                  <button
                    key={key}
                    onClick={() => toggleTool(key)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                      selectedTools.includes(key)
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                        : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600"
                    )}
                  >
                    {toolLabel}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-400">Expires after</Label>
              <select
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 text-sm rounded-md px-3 py-2"
              >
                {[1, 2, 3, 7, 14, 30].map((d) => (
                  <option key={d} value={d}>{d === 1 ? "1 day" : `${d} days`}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={createToken}
                disabled={creating || !label.trim() || !selectedTools.length}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {creating ? "Creating…" : "Create Link"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="text-neutral-400">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : tokens.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-8 text-center">
          <p className="text-sm text-neutral-500">No demo links yet. Create one to share with a client.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Active ({active.length})</p>
              {active.map((t) => (
                <TokenRow key={t.id} token={t} onCopy={copyLink} onDelete={deleteToken} copied={copiedId === t.id} />
              ))}
            </div>
          )}
          {expired.length > 0 && (
            <div className="space-y-2 opacity-50">
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Expired ({expired.length})</p>
              {expired.map((t) => (
                <TokenRow key={t.id} token={t} onCopy={copyLink} onDelete={deleteToken} copied={copiedId === t.id} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TokenRow({
  token,
  onCopy,
  onDelete,
  copied,
}: {
  token: DemoToken;
  onCopy: (t: DemoToken) => void;
  onDelete: (id: number) => void;
  copied: boolean;
}) {
  const expired = isExpired(token.expiresAt);
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-neutral-200 truncate">{token.label}</span>
          {!expired && (
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
              active
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatExpiry(token.expiresAt)}
          </span>
          <span>{token.tools.map((k) => ALL_TOOLS.find((t) => t.key === k)?.label ?? k).join(", ")}</span>
          {token.usedCount > 0 && <span>{token.usedCount} visit{token.usedCount !== 1 ? "s" : ""}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => window.open(`${getBaseUrl()}/demo?token=${token.token}`, "_blank")}
          className="p-1.5 text-neutral-500 hover:text-neutral-300 transition-colors"
          title="Open demo link"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onCopy(token)}
          className="p-1.5 text-neutral-500 hover:text-emerald-400 transition-colors"
          title="Copy link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => onDelete(token.id)}
          className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
