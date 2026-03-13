import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Plus,
  ChevronRight,
  Calendar,
  DollarSign,
  Users,
  HeartPulse,
  MessageSquare,
  AlertCircle,
  Check,
  Trash2,
  X,
} from "lucide-react";

function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("admin_token");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

interface HealthCheckEntry {
  id: string;
  date: string;
  notes: string;
  recommendations: string;
}

interface SupportSessionEntry {
  id: string;
  date: string;
  description: string;
}

interface PriorityRequest {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  completed: boolean;
}

interface RetainerClient {
  id: string;
  name: string;
  startDate: string;
  monthlyRate: number;
  notes: string;
  healthChecks: HealthCheckEntry[];
  supportSessions: SupportSessionEntry[];
  priorityRequests: PriorityRequest[];
}

function getMonthsElapsed(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  return Math.max(0, months) + 1;
}

function CommitmentTracker({ startDate }: { startDate: string }) {
  const months = getMonthsElapsed(startDate);
  const minCommitment = 3;
  const progress = Math.min((months / minCommitment) * 100, 100);
  const beyondCommitment = months > minCommitment;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-400">Commitment Progress</span>
        <span
          className={`font-semibold ${beyondCommitment ? "text-[#00c8a0]" : "text-[#7c3aed]"}`}
        >
          Month {months} of {minCommitment}+
        </span>
      </div>
      <div className="h-3 rounded-full bg-neutral-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: beyondCommitment
              ? "linear-gradient(90deg, #00c8a0, #00ffd0)"
              : "linear-gradient(90deg, #7c3aed, #a78bfa)",
          }}
        />
      </div>
      <p className="text-xs text-neutral-500">
        {beyondCommitment
          ? `Commitment met — ${months - minCommitment} month(s) beyond minimum`
          : `${minCommitment - months} month(s) remaining on minimum commitment`}
      </p>
    </div>
  );
}

export default function MonthlyRetainer() {
  const [, setLocation] = useLocation();
  const [authed, setAuthed] = useState(false);
  const [clients, setClients] = useState<RetainerClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<RetainerClient | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", startDate: "", monthlyRate: 0, notes: "" });

  const [showHCForm, setShowHCForm] = useState(false);
  const [newHC, setNewHC] = useState({ date: "", notes: "", recommendations: "" });
  const [showSSForm, setShowSSForm] = useState(false);
  const [newSS, setNewSS] = useState({ date: "", description: "" });
  const [showPRForm, setShowPRForm] = useState(false);
  const [newPR, setNewPR] = useState({ title: "", description: "" });

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/me", { headers: authHeaders() });
      if (!res.ok) {
        setLocation("/admin/login");
        return false;
      }
      setAuthed(true);
      return true;
    } catch {
      setLocation("/admin/login");
      return false;
    }
  }, [setLocation]);

  const handleUnauth = useCallback(() => {
    sessionStorage.removeItem("admin_token");
    setLocation("/admin/login");
  }, [setLocation]);

  const loadClients = useCallback(async () => {
    const res = await fetch("/api/admin/retainers", { headers: authHeaders() });
    if (res.status === 401 || res.status === 403) {
      handleUnauth();
      return [];
    }
    if (res.ok) {
      const data = await res.json();
      setClients(data);
      return data;
    }
    return [];
  }, [handleUnauth]);

  useEffect(() => {
    checkAuth().then((ok) => {
      if (ok) loadClients();
    });
  }, [checkAuth, loadClients]);

  const guardedFetch = async (url: string, options?: RequestInit): Promise<Response | null> => {
    const res = await fetch(url, options);
    if (res.status === 401 || res.status === 403) {
      handleUnauth();
      return null;
    }
    return res;
  };

  const refreshSelected = (updated: RetainerClient[]) => {
    if (selectedClient) {
      setSelectedClient(updated.find((c) => c.id === selectedClient.id) || null);
    }
  };

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.startDate || !newClient.monthlyRate) return;
    const res = await guardedFetch("/api/admin/retainers", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(newClient),
    });
    if (res?.ok) {
      await loadClients();
      setNewClient({ name: "", startDate: "", monthlyRate: 0, notes: "" });
      setShowAddForm(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    const res = await guardedFetch(`/api/admin/retainers/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res?.ok) {
      if (selectedClient?.id === id) setSelectedClient(null);
      await loadClients();
    }
  };

  const handleAddHealthCheck = async () => {
    if (!selectedClient || !newHC.date || !newHC.notes) return;
    const res = await guardedFetch(`/api/admin/retainers/${selectedClient.id}/health-checks`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(newHC),
    });
    if (res?.ok) {
      const updated = await loadClients();
      refreshSelected(updated);
      setNewHC({ date: "", notes: "", recommendations: "" });
      setShowHCForm(false);
    }
  };

  const handleAddSupportSession = async () => {
    if (!selectedClient || !newSS.date || !newSS.description) return;
    const res = await guardedFetch(`/api/admin/retainers/${selectedClient.id}/support-sessions`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(newSS),
    });
    if (res?.ok) {
      const updated = await loadClients();
      refreshSelected(updated);
      setNewSS({ date: "", description: "" });
      setShowSSForm(false);
    }
  };

  const handleAddPriorityRequest = async () => {
    if (!selectedClient || !newPR.title) return;
    const res = await guardedFetch(`/api/admin/retainers/${selectedClient.id}/priority-requests`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(newPR),
    });
    if (res?.ok) {
      const updated = await loadClients();
      refreshSelected(updated);
      setNewPR({ title: "", description: "" });
      setShowPRForm(false);
    }
  };

  const handleTogglePR = async (requestId: string, completed: boolean) => {
    if (!selectedClient) return;
    const res = await guardedFetch(
      `/api/admin/retainers/${selectedClient.id}/priority-requests/${requestId}`,
      {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ completed }),
      }
    );
    if (res?.ok) {
      const updated = await loadClients();
      refreshSelected(updated);
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center">
        <p className="text-neutral-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b14] text-neutral-100">
      <header className="border-b border-neutral-800/60 bg-gradient-to-r from-[#0a0b14] via-[#0f1029] to-[#0a0b14]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="flex items-center gap-2 text-neutral-400 hover:text-neutral-100 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </a>
            <div className="w-px h-6 bg-neutral-700" />
            <h1 className="font-semibold text-lg">
              <span className="text-[#00c8a0]">Monthly</span> Retainer
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {!selectedClient ? (
          <div className="space-y-6">
            <div
              className="p-6 rounded-xl border border-neutral-800/60 bg-neutral-900/30"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,200,160,0.05) 0%, rgba(124,58,237,0.05) 100%)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Client Roster</h2>
                  <p className="text-sm text-neutral-400">
                    {clients.length} retainer client{clients.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00c8a0] hover:bg-[#00ddb0] text-[#0a0b14] font-medium text-sm rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Client
                </button>
              </div>
            </div>

            {showAddForm && (
              <div
                className="p-6 rounded-xl border border-[#00c8a0]/20 space-y-4"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,200,160,0.08) 0%, rgba(124,58,237,0.04) 100%)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#00c8a0]">New Retainer Client</h3>
                  <button onClick={() => setShowAddForm(false)} className="text-neutral-500 hover:text-neutral-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs text-neutral-400">Client Name *</label>
                    <input
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                      className="w-full bg-neutral-800/80 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-[#00c8a0]/50"
                      placeholder="Client name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs text-neutral-400">Start Date *</label>
                    <input
                      type="date"
                      value={newClient.startDate}
                      onChange={(e) => setNewClient({ ...newClient, startDate: e.target.value })}
                      className="w-full bg-neutral-800/80 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-[#00c8a0]/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs text-neutral-400">Monthly Rate (USD) *</label>
                    <input
                      type="number"
                      value={newClient.monthlyRate || ""}
                      onChange={(e) =>
                        setNewClient({ ...newClient, monthlyRate: Number(e.target.value) })
                      }
                      className="w-full bg-neutral-800/80 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-[#00c8a0]/50"
                      placeholder="1000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs text-neutral-400">Notes / Context</label>
                    <input
                      value={newClient.notes}
                      onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                      className="w-full bg-neutral-800/80 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-[#00c8a0]/50"
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddClient}
                  disabled={!newClient.name || !newClient.startDate || !newClient.monthlyRate}
                  className="px-5 py-2 bg-[#00c8a0] hover:bg-[#00ddb0] text-[#0a0b14] font-medium text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add Client
                </button>
              </div>
            )}

            {clients.length === 0 && !showAddForm && (
              <div className="text-center py-16 text-neutral-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No retainer clients yet. Add one to get started.</p>
              </div>
            )}

            <div className="grid gap-4">
              {clients.map((client) => {
                const months = getMonthsElapsed(client.startDate);
                const beyondCommitment = months > 3;
                return (
                  <div
                    key={client.id}
                    className="group p-5 rounded-xl border border-neutral-800/60 hover:border-[#00c8a0]/30 cursor-pointer transition-all"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      backdropFilter: "blur(16px)",
                    }}
                    onClick={() => setSelectedClient(client)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00c8a0]/20 to-[#7c3aed]/20 flex items-center justify-center border border-neutral-700/50">
                          <Users className="w-5 h-5 text-[#00c8a0]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-100 group-hover:text-[#00c8a0] transition-colors">
                            {client.name}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(client.startDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />${client.monthlyRate}/mo
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            beyondCommitment
                              ? "bg-[#00c8a0]/10 text-[#00c8a0] border border-[#00c8a0]/20"
                              : "bg-[#7c3aed]/10 text-[#a78bfa] border border-[#7c3aed]/20"
                          }`}
                        >
                          Month {months} of 3+
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClient(client.id);
                          }}
                          className="text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-[#00c8a0] transition-colors" />
                      </div>
                    </div>
                    {client.notes && (
                      <p className="mt-2 text-xs text-neutral-500 ml-14">{client.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <button
              onClick={() => {
                setSelectedClient(null);
                setShowHCForm(false);
                setShowSSForm(false);
                setShowPRForm(false);
              }}
              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Roster
            </button>

            <div
              className="p-6 rounded-xl border border-neutral-800/60"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,200,160,0.06) 0%, rgba(124,58,237,0.06) 100%)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold gradient-text">{selectedClient.name}</h2>
                  <div className="flex items-center gap-4 text-sm text-neutral-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Started {new Date(selectedClient.startDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />${selectedClient.monthlyRate}/mo
                    </span>
                  </div>
                  {selectedClient.notes && (
                    <p className="text-sm text-neutral-500 mt-2">{selectedClient.notes}</p>
                  )}
                </div>
              </div>
              <CommitmentTracker startDate={selectedClient.startDate} />
            </div>

            <div
              className="p-6 rounded-xl border border-neutral-800/60 space-y-4"
              style={{
                background: "rgba(255,255,255,0.02)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-[#00c8a0]" />
                  Monthly Health Check Log
                </h3>
                <button
                  onClick={() => setShowHCForm(!showHCForm)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#00c8a0]/10 hover:bg-[#00c8a0]/20 text-[#00c8a0] rounded-lg border border-[#00c8a0]/20 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Entry
                </button>
              </div>

              {showHCForm && (
                <div className="p-4 rounded-lg bg-neutral-800/40 border border-neutral-700/50 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs text-neutral-400">Date *</label>
                      <input
                        type="date"
                        value={newHC.date}
                        onChange={(e) => setNewHC({ ...newHC, date: e.target.value })}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-[#00c8a0]/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs text-neutral-400">Notes *</label>
                    <textarea
                      value={newHC.notes}
                      onChange={(e) => setNewHC({ ...newHC, notes: e.target.value })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 resize-none h-20 focus:outline-none focus:border-[#00c8a0]/50"
                      placeholder="Health check observations..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs text-neutral-400">Recommendations</label>
                    <textarea
                      value={newHC.recommendations}
                      onChange={(e) => setNewHC({ ...newHC, recommendations: e.target.value })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 resize-none h-20 focus:outline-none focus:border-[#00c8a0]/50"
                      placeholder="Recommended actions..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddHealthCheck}
                      disabled={!newHC.date || !newHC.notes}
                      className="px-4 py-1.5 bg-[#00c8a0] hover:bg-[#00ddb0] text-[#0a0b14] font-medium text-sm rounded-lg transition-colors disabled:opacity-40"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowHCForm(false)}
                      className="px-4 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-sm rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {selectedClient.healthChecks.length === 0 ? (
                <p className="text-sm text-neutral-500 py-2">No health check entries yet.</p>
              ) : (
                <div className="space-y-3">
                  {[...selectedClient.healthChecks].reverse().map((hc) => (
                    <div
                      key={hc.id}
                      className="p-3 rounded-lg bg-neutral-800/30 border border-neutral-700/40"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-medium text-[#00c8a0]">
                          {new Date(hc.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-300">{hc.notes}</p>
                      {hc.recommendations && (
                        <p className="text-xs text-neutral-500 mt-1.5 border-t border-neutral-700/30 pt-1.5">
                          Recommendations: {hc.recommendations}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className="p-6 rounded-xl border border-neutral-800/60 space-y-4"
              style={{
                background: "rgba(255,255,255,0.02)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#7c3aed]" />
                  Support Session Log
                </h3>
                <button
                  onClick={() => setShowSSForm(!showSSForm)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#7c3aed]/10 hover:bg-[#7c3aed]/20 text-[#a78bfa] rounded-lg border border-[#7c3aed]/20 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Log Session
                </button>
              </div>

              {showSSForm && (
                <div className="p-4 rounded-lg bg-neutral-800/40 border border-neutral-700/50 space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs text-neutral-400">Date *</label>
                    <input
                      type="date"
                      value={newSS.date}
                      onChange={(e) => setNewSS({ ...newSS, date: e.target.value })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-[#7c3aed]/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs text-neutral-400">Description *</label>
                    <textarea
                      value={newSS.description}
                      onChange={(e) => setNewSS({ ...newSS, description: e.target.value })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 resize-none h-20 focus:outline-none focus:border-[#7c3aed]/50"
                      placeholder="Session details..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddSupportSession}
                      disabled={!newSS.date || !newSS.description}
                      className="px-4 py-1.5 bg-[#7c3aed] hover:bg-[#8b5cf6] text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-40"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowSSForm(false)}
                      className="px-4 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-sm rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {selectedClient.supportSessions.length === 0 ? (
                <p className="text-sm text-neutral-500 py-2">No support sessions logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {[...selectedClient.supportSessions].reverse().map((ss) => (
                    <div
                      key={ss.id}
                      className="p-3 rounded-lg bg-neutral-800/30 border border-neutral-700/40"
                    >
                      <span className="text-xs font-medium text-[#a78bfa]">
                        {new Date(ss.date).toLocaleDateString()}
                      </span>
                      <p className="text-sm text-neutral-300 mt-1">{ss.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className="p-6 rounded-xl border border-neutral-800/60 space-y-4"
              style={{
                background: "rgba(255,255,255,0.02)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Priority Request Queue
                </h3>
                <button
                  onClick={() => setShowPRForm(!showPRForm)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 rounded-lg border border-amber-400/20 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Request
                </button>
              </div>

              {showPRForm && (
                <div className="p-4 rounded-lg bg-neutral-800/40 border border-neutral-700/50 space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs text-neutral-400">Title *</label>
                    <input
                      value={newPR.title}
                      onChange={(e) => setNewPR({ ...newPR, title: e.target.value })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-400/50"
                      placeholder="Request title"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs text-neutral-400">Description</label>
                    <textarea
                      value={newPR.description}
                      onChange={(e) => setNewPR({ ...newPR, description: e.target.value })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 resize-none h-20 focus:outline-none focus:border-amber-400/50"
                      placeholder="Request details..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddPriorityRequest}
                      disabled={!newPR.title}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-medium text-sm rounded-lg transition-colors disabled:opacity-40"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowPRForm(false)}
                      className="px-4 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-sm rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {selectedClient.priorityRequests.length === 0 ? (
                <p className="text-sm text-neutral-500 py-2">No priority requests yet.</p>
              ) : (
                <div className="space-y-2">
                  {[...selectedClient.priorityRequests].reverse().map((pr) => (
                    <div
                      key={pr.id}
                      className={`p-3 rounded-lg border flex items-start gap-3 ${
                        pr.completed
                          ? "bg-neutral-800/20 border-neutral-700/30 opacity-60"
                          : "bg-neutral-800/30 border-neutral-700/40"
                      }`}
                    >
                      <button
                        onClick={() => handleTogglePR(pr.id, !pr.completed)}
                        className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                          pr.completed
                            ? "bg-[#00c8a0] border-[#00c8a0] text-[#0a0b14]"
                            : "border-neutral-600 hover:border-[#00c8a0]/50"
                        }`}
                      >
                        {pr.completed && <Check className="w-3 h-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            pr.completed
                              ? "line-through text-neutral-500"
                              : "text-neutral-200"
                          }`}
                        >
                          {pr.title}
                        </p>
                        {pr.description && (
                          <p className="text-xs text-neutral-500 mt-0.5">{pr.description}</p>
                        )}
                        <p className="text-xs text-neutral-600 mt-1">
                          {new Date(pr.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}