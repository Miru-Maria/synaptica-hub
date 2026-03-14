import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Users, DollarSign, TrendingUp, Filter, X, ChevronDown, ChevronUp } from "lucide-react";

type PipelineStage = "New Lead" | "Contacted" | "Proposal Sent" | "Active Client" | "Closed";
type ContactSource = "discovery_call" | "tool_email_capture" | "manual" | "ai_chat";

interface PipelineContact {
  id: string;
  name: string;
  email: string;
  company: string;
  source: ContactSource;
  serviceInterest: string;
  stage: PipelineStage;
  lastTouchDate: string;
  nextAction: string;
  notes: string;
  estimatedValue: number;
  createdAt: string;
  updatedAt: string;
}

const STAGES: PipelineStage[] = ["New Lead", "Contacted", "Proposal Sent", "Active Client", "Closed"];
const SOURCES: ContactSource[] = ["discovery_call", "tool_email_capture", "manual", "ai_chat"];

const STAGE_COLORS: Record<PipelineStage, string> = {
  "New Lead": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Contacted": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Proposal Sent": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "Active Client": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Closed": "bg-neutral-500/15 text-neutral-400 border-neutral-500/30",
};

const SOURCE_LABELS: Record<ContactSource, string> = {
  discovery_call: "Discovery Call",
  tool_email_capture: "Tool Email",
  manual: "Manual",
  ai_chat: "AI Chat",
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const EMPTY_CONTACT: Omit<PipelineContact, "id" | "createdAt" | "updatedAt" | "lastTouchDate"> = {
  name: "",
  email: "",
  company: "",
  source: "manual",
  serviceInterest: "",
  stage: "New Lead",
  nextAction: "",
  notes: "",
  estimatedValue: 0,
};

export default function PipelineManager() {
  const [contacts, setContacts] = useState<PipelineContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<PipelineContact | null>(null);
  const [form, setForm] = useState(EMPTY_CONTACT);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [saving, setSaving] = useState(false);

  const loadContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pipeline", { headers: authHeaders() });
      if (res.ok) setContacts(await res.json());
    } catch (err) {
      console.error("Failed to load pipeline contacts:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const openNewDialog = () => {
    setEditingContact(null);
    setForm({ ...EMPTY_CONTACT });
    setSaveError("");
    setDialogOpen(true);
  };

  const openEditDialog = (contact: PipelineContact) => {
    setEditingContact(contact);
    setSaveError("");
    setForm({
      name: contact.name,
      email: contact.email,
      company: contact.company,
      source: contact.source,
      serviceInterest: contact.serviceInterest,
      stage: contact.stage,
      nextAction: contact.nextAction,
      notes: contact.notes,
      estimatedValue: contact.estimatedValue,
    });
    setDialogOpen(true);
  };

  const [saveError, setSaveError] = useState("");

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    setSaveError("");
    try {
      if (editingContact) {
        const res = await fetch(`/api/admin/pipeline/${editingContact.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const updated = await res.json();
          setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          setDialogOpen(false);
        } else {
          const err = await res.json().catch(() => ({ error: "Failed to update contact" }));
          setSaveError(err.error || "Failed to update contact");
        }
      } else {
        const res = await fetch("/api/admin/pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const newContact = await res.json();
          setContacts((prev) => [newContact, ...prev]);
          setDialogOpen(false);
        } else {
          const err = await res.json().catch(() => ({ error: "Failed to add contact" }));
          setSaveError(err.error || "Failed to add contact");
        }
      }
    } catch (err) {
      console.error("Failed to save contact:", err);
      setSaveError("Network error — please try again");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/pipeline/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete contact:", err);
    }
  };

  const handleStageChange = async (id: string, newStage: PipelineStage) => {
    try {
      const res = await fetch(`/api/admin/pipeline/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ stage: newStage, lastTouchDate: new Date().toISOString() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      }
    } catch (err) {
      console.error("Failed to update stage:", err);
    }
  };

  const serviceInterests = Array.from(new Set(contacts.map((c) => c.serviceInterest).filter(Boolean)));

  const filtered = contacts.filter((c) => {
    if (stageFilter !== "all" && c.stage !== stageFilter) return false;
    if (serviceFilter !== "all" && c.serviceInterest !== serviceFilter) return false;
    return true;
  });

  const totalLeads = contacts.filter((c) => c.stage !== "Closed").length;
  const activeClients = contacts.filter((c) => c.stage === "Active Client").length;
  const pipelineValue = contacts
    .filter((c) => c.stage !== "Closed" && c.stage !== "Active Client")
    .reduce((sum, c) => sum + c.estimatedValue, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-400">Loading pipeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-100">{totalLeads}</p>
                <p className="text-xs text-neutral-500">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-100">{activeClients}</p>
                <p className="text-xs text-neutral-500">Active Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-100">
                  ${pipelineValue.toLocaleString()}
                </p>
                <p className="text-xs text-neutral-500">Pipeline Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-neutral-500" />
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[160px] bg-neutral-800 border-neutral-700 text-neutral-100 h-8 text-xs">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700">
              <SelectItem value="all" className="text-neutral-100">All Stages</SelectItem>
              {STAGES.map((s) => (
                <SelectItem key={s} value={s} className="text-neutral-100">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-[180px] bg-neutral-800 border-neutral-700 text-neutral-100 h-8 text-xs">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700">
              <SelectItem value="all" className="text-neutral-100">All Services</SelectItem>
              {serviceInterests.map((s) => (
                <SelectItem key={s} value={s} className="text-neutral-100">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(stageFilter !== "all" || serviceFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setStageFilter("all"); setServiceFilter("all"); }}
              className="text-neutral-500 h-8 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <Button size="sm" onClick={openNewDialog} className="shrink-0">
          <Plus className="w-4 h-4 mr-1" />
          Add Contact
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="py-12 text-center">
            <Users className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-500">
              {contacts.length === 0 ? "No contacts yet. Add one to get started." : "No contacts match the current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((contact) => {
            const isExpanded = expandedId === contact.id;
            return (
              <Card key={contact.id} className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-colors">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : contact.id)}
                      className="text-neutral-500 hover:text-neutral-300 transition-colors shrink-0"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-neutral-100 text-sm">{contact.name}</span>
                        {contact.company && (
                          <span className="text-neutral-500 text-xs">({contact.company})</span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STAGE_COLORS[contact.stage]}`}>
                          {contact.stage}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                          {SOURCE_LABELS[contact.source]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-500">
                        {contact.email && <span>{contact.email}</span>}
                        {contact.serviceInterest && (
                          <>
                            <span className="text-neutral-700">|</span>
                            <span>{contact.serviceInterest}</span>
                          </>
                        )}
                        {contact.estimatedValue > 0 && (
                          <>
                            <span className="text-neutral-700">|</span>
                            <span className="text-emerald-500">${contact.estimatedValue.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Select value={contact.stage} onValueChange={(val) => handleStageChange(contact.id, val as PipelineStage)}>
                        <SelectTrigger className="w-[130px] bg-neutral-800 border-neutral-700 text-neutral-100 h-7 text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700">
                          {STAGES.map((s) => (
                            <SelectItem key={s} value={s} className="text-neutral-100 text-xs">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(contact)} className="text-neutral-500 hover:text-neutral-300 h-7 w-7 p-0">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(contact.id)} className="text-neutral-500 hover:text-red-400 h-7 w-7 p-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-neutral-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Last Touch</p>
                        <p className="text-neutral-300">
                          {new Date(contact.lastTouchDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Next Action</p>
                        <p className="text-neutral-300">{contact.nextAction || "—"}</p>
                      </div>
                      {contact.notes && (
                        <div className="md:col-span-2">
                          <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Notes</p>
                          <p className="text-neutral-300 whitespace-pre-wrap text-xs">{contact.notes}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Created</p>
                        <p className="text-neutral-400 text-xs">
                          {new Date(contact.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-neutral-100">
              {editingContact ? "Edit Contact" : "Add Contact"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-neutral-400 text-xs">Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="bg-neutral-800 border-neutral-700 text-neutral-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-400 text-xs">Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="bg-neutral-800 border-neutral-700 text-neutral-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-neutral-400 text-xs">Company</Label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className="bg-neutral-800 border-neutral-700 text-neutral-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-400 text-xs">Service Interest</Label>
                <Input
                  value={form.serviceInterest}
                  onChange={(e) => setForm((f) => ({ ...f, serviceInterest: e.target.value }))}
                  placeholder="e.g. RAG Pipeline, Documentation Audit"
                  className="bg-neutral-800 border-neutral-700 text-neutral-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-neutral-400 text-xs">Pipeline Stage</Label>
                <Select value={form.stage} onValueChange={(val) => setForm((f) => ({ ...f, stage: val as PipelineStage }))}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s} className="text-neutral-100">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-400 text-xs">Source</Label>
                <Select value={form.source} onValueChange={(val) => setForm((f) => ({ ...f, source: val as ContactSource }))}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {SOURCES.map((s) => (
                      <SelectItem key={s} value={s} className="text-neutral-100">{SOURCE_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-400 text-xs">Estimated Value ($)</Label>
              <Input
                type="number"
                value={form.estimatedValue}
                onChange={(e) => setForm((f) => ({ ...f, estimatedValue: Number(e.target.value) || 0 }))}
                className="bg-neutral-800 border-neutral-700 text-neutral-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-400 text-xs">Next Action</Label>
              <Input
                value={form.nextAction}
                onChange={(e) => setForm((f) => ({ ...f, nextAction: e.target.value }))}
                placeholder="e.g. Schedule follow-up call"
                className="bg-neutral-800 border-neutral-700 text-neutral-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-400 text-xs">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={4}
                className="bg-neutral-800 border-neutral-700 text-neutral-100"
              />
            </div>
          </div>
          {saveError && (
            <p className="text-sm text-red-400">{saveError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-neutral-700 text-neutral-300">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving ? "Saving..." : editingContact ? "Update Contact" : "Add Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}