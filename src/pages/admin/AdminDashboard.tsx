import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, Save, Package, Plus, Trash2, GripVertical, ExternalLink, Hammer, Download, FileText, Inbox, FolderOpen, Clock, Loader2, MessageSquare, Briefcase, BarChart3, PenLine, Mail, Activity } from "lucide-react";
import BlogManager from "./BlogManager";
import MetricsPanel from "./MetricsPanel";

interface DiscoveryInquiry {
  id: string;
  name: string;
  company: string;
  challenge: string;
  timeline: string;
  createdAt: string;
}

interface ServicePackage {
  id: string;
  name: string;
  tagline: string;
  priceLow: number;
  priceHigh: number;
  priceLabel?: string;
  duration: string;
  type: string;
  features: string[];
  ideal: string;
  highlighted: boolean;
}

interface SavedSession {
  id: string;
  tool: string;
  clientName: string;
  name: string;
  step?: string;
  version?: string;
  promptCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface ClientTool {
  name: string;
  slug: string;
  enabled: boolean;
  onboardingCopy?: string;
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  photo: string;
}

interface CaseStudy {
  id: string;
  title: string;
  industry: string;
  challenge: string;
  outcome: string;
}

interface OutcomeStat {
  id: string;
  label: string;
  value: string;
}

interface EmailLead {
  id: string;
  email: string;
  firstName: string;
  toolSource: string;
  documentType?: string;
  capturedAt: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [inquiries, setInquiries] = useState<DiscoveryInquiry[]>([]);
  const [tools, setTools] = useState<ClientTool[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [outcomeStats, setOutcomeStats] = useState<OutcomeStat[]>([]);
  const [leads, setLeads] = useState<EmailLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingTools, setSavingTools] = useState(false);
  const [status, setStatus] = useState("");
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me", {
        headers: authHeaders(),
      });
      if (!res.ok) {
        setLocation("/admin/login");
        return false;
      }
      return true;
    } catch {
      setLocation("/admin/login");
      return false;
    }
  }, [setLocation]);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/admin/sessions", { headers: authHeaders() });
      if (res.ok) setSessions(await res.json());
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
    setSessionsLoading(false);
  }, []);

  useEffect(() => {
    async function load() {
      const authed = await checkAuth();
      if (!authed) return;

      const [pkgRes, inqRes, toolsRes, testRes, csRes, statRes, leadsRes] = await Promise.all([
        fetch("/api/admin/packages", { headers: authHeaders() }),
        fetch("/api/admin/discovery-inquiries", { headers: authHeaders() }),
        fetch("/api/admin/tools", { headers: authHeaders() }),
        fetch("/api/admin/testimonials", { headers: authHeaders() }),
        fetch("/api/admin/case-studies", { headers: authHeaders() }),
        fetch("/api/admin/outcome-stats", { headers: authHeaders() }),
        fetch("/api/admin/leads", { headers: authHeaders() }),
      ]);
      if (pkgRes.ok) setPackages(await pkgRes.json());
      if (inqRes.ok) setInquiries(await inqRes.json());
      if (toolsRes.ok) setTools(await toolsRes.json());
      if (testRes.ok) setTestimonials(await testRes.json());
      if (csRes.ok) setCaseStudies(await csRes.json());
      if (statRes.ok) setOutcomeStats(await statRes.json());
      if (leadsRes.ok) setLeads(await leadsRes.json());
      setLoading(false);
    }
    load();
  }, [checkAuth]);

  const handleLogout = async () => {
    localStorage.removeItem("admin_token");
    setLocation("/admin/login");
  };

  const savePackages = async () => {
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/admin/packages", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(packages),
      });
      if (res.ok) setStatus("Packages saved");
      else setStatus("Failed to save packages");
    } catch {
      setStatus("Network error");
    }
    setSaving(false);
    setTimeout(() => setStatus(""), 3000);
  };

  const saveToolSettings = async () => {
    setSavingTools(true);
    setStatus("");
    try {
      const res = await fetch("/api/admin/tools", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(tools),
      });
      if (res.ok) setStatus("Tool settings saved");
      else setStatus("Failed to save tool settings");
    } catch {
      setStatus("Network error");
    }
    setSavingTools(false);
    setTimeout(() => setStatus(""), 3000);
  };

  const updateTool = (index: number, field: keyof ClientTool, value: string | boolean) => {
    setTools((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updatePackage = (index: number, field: keyof ServicePackage, value: ServicePackage[keyof ServicePackage]) => {
    setPackages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateFeature = (pkgIndex: number, featIndex: number, value: string) => {
    setPackages((prev) => {
      const next = [...prev];
      const features = [...next[pkgIndex].features];
      features[featIndex] = value;
      next[pkgIndex] = { ...next[pkgIndex], features };
      return next;
    });
  };

  const addFeature = (pkgIndex: number) => {
    setPackages((prev) => {
      const next = [...prev];
      next[pkgIndex] = { ...next[pkgIndex], features: [...next[pkgIndex].features, ""] };
      return next;
    });
  };

  const removeFeature = (pkgIndex: number, featIndex: number) => {
    setPackages((prev) => {
      const next = [...prev];
      const features = next[pkgIndex].features.filter((_, i) => i !== featIndex);
      next[pkgIndex] = { ...next[pkgIndex], features };
      return next;
    });
  };

  const addPackage = () => {
    setPackages((prev) => [
      ...prev,
      {
        id: `pkg-${Date.now()}`,
        name: "New Package",
        tagline: "",
        priceLow: 0,
        priceHigh: 0,
        duration: "",
        type: "Fixed price",
        features: [],
        ideal: "",
        highlighted: false,
      },
    ]);
  };

  const removePackage = (index: number) => {
    setPackages((prev) => prev.filter((_, i) => i !== index));
  };

  const saveTestimonialsData = async () => {
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(testimonials),
      });
      if (res.ok) setStatus("Testimonials saved");
      else setStatus("Failed to save testimonials");
    } catch {
      setStatus("Network error");
    }
    setSaving(false);
    setTimeout(() => setStatus(""), 3000);
  };

  const addTestimonial = () => {
    setTestimonials((prev) => [
      ...prev,
      { id: `test-${Date.now()}`, name: "", role: "", company: "", quote: "", photo: "" },
    ]);
  };

  const removeTestimonial = (index: number) => {
    setTestimonials((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTestimonial = (index: number, field: keyof Testimonial, value: string) => {
    setTestimonials((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const saveCaseStudiesData = async () => {
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/admin/case-studies", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(caseStudies),
      });
      if (res.ok) setStatus("Case studies saved");
      else setStatus("Failed to save case studies");
    } catch {
      setStatus("Network error");
    }
    setSaving(false);
    setTimeout(() => setStatus(""), 3000);
  };

  const addCaseStudy = () => {
    setCaseStudies((prev) => [
      ...prev,
      { id: `cs-${Date.now()}`, title: "", industry: "", challenge: "", outcome: "" },
    ]);
  };

  const removeCaseStudy = (index: number) => {
    setCaseStudies((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCaseStudy = (index: number, field: keyof CaseStudy, value: string) => {
    setCaseStudies((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const saveOutcomeStatsData = async () => {
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/admin/outcome-stats", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(outcomeStats),
      });
      if (res.ok) setStatus("Statistics saved");
      else setStatus("Failed to save statistics");
    } catch {
      setStatus("Network error");
    }
    setSaving(false);
    setTimeout(() => setStatus(""), 3000);
  };

  const addOutcomeStat = () => {
    setOutcomeStats((prev) => [
      ...prev,
      { id: `stat-${Date.now()}`, label: "", value: "" },
    ]);
  };

  const removeOutcomeStat = (index: number) => {
    setOutcomeStats((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOutcomeStat = (index: number, field: keyof OutcomeStat, value: string) => {
    setOutcomeStats((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <p className="text-neutral-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <h1 className="font-semibold text-lg">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            {status && (
              <span className="text-sm text-emerald-400">{status}</span>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-neutral-400 hover:text-neutral-100">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Tabs defaultValue="packages">
          <TabsList className="bg-neutral-900 border border-neutral-800">
            <TabsTrigger value="packages" className="data-[state=active]:bg-neutral-800 gap-2">
              <Package className="w-4 h-4" />
              Packages
            </TabsTrigger>
            <TabsTrigger value="inquiries" className="data-[state=active]:bg-neutral-800 gap-2">
              <Inbox className="w-4 h-4" />
              Inquiries{inquiries.length > 0 && ` (${inquiries.length})`}
            </TabsTrigger>
            <TabsTrigger value="blog" className="data-[state=active]:bg-neutral-800 gap-2">
              <PenLine className="w-4 h-4" />
              Blog
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="data-[state=active]:bg-neutral-800 gap-2">
              <MessageSquare className="w-4 h-4" />
              Testimonials
            </TabsTrigger>
            <TabsTrigger value="case-studies" className="data-[state=active]:bg-neutral-800 gap-2">
              <Briefcase className="w-4 h-4" />
              Case Studies
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-neutral-800 gap-2">
              <BarChart3 className="w-4 h-4" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="internal" className="data-[state=active]:bg-neutral-800 gap-2">
              <Hammer className="w-4 h-4" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-neutral-800 gap-2">
              <Activity className="w-4 h-4" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-neutral-800 gap-2" onClick={() => { if (sessions.length === 0) loadSessions(); }}>
              <FolderOpen className="w-4 h-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-neutral-800 gap-2">
              <Mail className="w-4 h-4" />
              Email Leads
              {leads.length > 0 && (
                <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{leads.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="packages" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">
                Manage service packages shown on the public site.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addPackage} className="border-neutral-700 text-neutral-300">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Package
                </Button>
                <Button size="sm" onClick={savePackages} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" />
                  Save Changes
                </Button>
              </div>
            </div>

            {packages.map((pkg, pkgIdx) => (
              <Card key={pkg.id} className="bg-neutral-900 border-neutral-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-neutral-600" />
                      <CardTitle className="text-base text-neutral-100">{pkg.name || "Untitled"}</CardTitle>
                      {pkg.highlighted && (
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Highlighted</span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removePackage(pkgIdx)} className="text-neutral-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-neutral-400 text-xs">Name</Label>
                      <Input
                        value={pkg.name}
                        onChange={(e) => updatePackage(pkgIdx, "name", e.target.value)}
                        className="bg-neutral-800 border-neutral-700 text-neutral-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 text-xs">Tagline</Label>
                      <Input
                        value={pkg.tagline}
                        onChange={(e) => updatePackage(pkgIdx, "tagline", e.target.value)}
                        className="bg-neutral-800 border-neutral-700 text-neutral-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 text-xs">Price Low (USD)</Label>
                      <Input
                        type="number"
                        value={pkg.priceLow}
                        onChange={(e) => updatePackage(pkgIdx, "priceLow", Number(e.target.value))}
                        className="bg-neutral-800 border-neutral-700 text-neutral-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 text-xs">Price High (USD)</Label>
                      <Input
                        type="number"
                        value={pkg.priceHigh}
                        onChange={(e) => updatePackage(pkgIdx, "priceHigh", Number(e.target.value))}
                        className="bg-neutral-800 border-neutral-700 text-neutral-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 text-xs">Price Label (overrides range)</Label>
                      <Input
                        value={pkg.priceLabel || ""}
                        onChange={(e) => updatePackage(pkgIdx, "priceLabel", e.target.value || undefined)}
                        placeholder="e.g. Custom — quoted on scope"
                        className="bg-neutral-800 border-neutral-700 text-neutral-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 text-xs">Duration</Label>
                      <Input
                        value={pkg.duration}
                        onChange={(e) => updatePackage(pkgIdx, "duration", e.target.value)}
                        className="bg-neutral-800 border-neutral-700 text-neutral-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 text-xs">Type</Label>
                      <Input
                        value={pkg.type}
                        onChange={(e) => updatePackage(pkgIdx, "type", e.target.value)}
                        className="bg-neutral-800 border-neutral-700 text-neutral-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 text-xs">Ideal For</Label>
                      <Input
                        value={pkg.ideal}
                        onChange={(e) => updatePackage(pkgIdx, "ideal", e.target.value)}
                        className="bg-neutral-800 border-neutral-700 text-neutral-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={pkg.highlighted}
                      onCheckedChange={(val) => updatePackage(pkgIdx, "highlighted", val)}
                    />
                    <Label className="text-neutral-400 text-sm">Highlighted package</Label>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-neutral-400 text-xs">Features / Deliverables</Label>
                      <Button variant="ghost" size="sm" onClick={() => addFeature(pkgIdx)} className="text-neutral-500 h-7">
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    {pkg.features.map((feat, featIdx) => (
                      <div key={featIdx} className="flex gap-2">
                        <Input
                          value={feat}
                          onChange={(e) => updateFeature(pkgIdx, featIdx, e.target.value)}
                          className="bg-neutral-800 border-neutral-700 text-neutral-100"
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeFeature(pkgIdx, featIdx)} className="text-neutral-500 hover:text-red-400 shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="inquiries" className="mt-6 space-y-4">
            <p className="text-sm text-neutral-400">
              Discovery call inquiries submitted through the Work With Me page.
            </p>
            {inquiries.length === 0 ? (
              <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="py-12 text-center">
                  <Inbox className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-500">No inquiries yet</p>
                </CardContent>
              </Card>
            ) : (
              inquiries.map((inq) => (
                <Card key={inq.id} className="bg-neutral-900 border-neutral-800">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base text-neutral-100">
                        {inq.name} <span className="text-neutral-500 font-normal">— {inq.company}</span>
                      </CardTitle>
                      <span className="text-xs text-neutral-500">
                        {new Date(inq.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="text-xs text-neutral-500 uppercase tracking-wider">Challenge / Goal</span>
                      <p className="text-sm text-neutral-300 mt-1 whitespace-pre-wrap">{inq.challenge}</p>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-500 uppercase tracking-wider">Timeline</span>
                      <p className="text-sm text-neutral-300 mt-1">{inq.timeline}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="blog" className="mt-6">
            <BlogManager />
          </TabsContent>

          <TabsContent value="testimonials" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">
                Manage testimonials shown on the public site.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addTestimonial} className="border-neutral-700 text-neutral-300">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Testimonial
                </Button>
                <Button size="sm" onClick={saveTestimonialsData} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" />
                  Save Changes
                </Button>
              </div>
            </div>

            {testimonials.length === 0 && (
              <div className="text-center py-12 text-neutral-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No testimonials yet. Add one to get started.</p>
              </div>
            )}

            {testimonials.map((t, idx) => (
              <Card key={t.id} className="bg-neutral-900 border-neutral-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-neutral-100">{t.name || "Untitled testimonial"}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => removeTestimonial(idx)} className="text-neutral-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-neutral-400 text-xs">Name</Label>
                      <Input value={t.name} onChange={(e) => updateTestimonial(idx, "name", e.target.value)} className="bg-neutral-800 border-neutral-700 text-neutral-100" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 text-xs">Role</Label>
                      <Input value={t.role} onChange={(e) => updateTestimonial(idx, "role", e.target.value)} className="bg-neutral-800 border-neutral-700 text-neutral-100" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 text-xs">Company</Label>
                      <Input value={t.company} onChange={(e) => updateTestimonial(idx, "company", e.target.value)} className="bg-neutral-800 border-neutral-700 text-neutral-100" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 text-xs">Photo URL</Label>
                      <Input value={t.photo} onChange={(e) => updateTestimonial(idx, "photo", e.target.value)} placeholder="https://..." className="bg-neutral-800 border-neutral-700 text-neutral-100" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-400 text-xs">Quote</Label>
                    <Textarea value={t.quote} onChange={(e) => updateTestimonial(idx, "quote", e.target.value)} rows={3} className="bg-neutral-800 border-neutral-700 text-neutral-100" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="case-studies" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">
                Manage case studies shown on the public site.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addCaseStudy} className="border-neutral-700 text-neutral-300">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Case Study
                </Button>
                <Button size="sm" onClick={saveCaseStudiesData} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" />
                  Save Changes
                </Button>
              </div>
            </div>

            {caseStudies.length === 0 && (
              <div className="text-center py-12 text-neutral-500">
                <Briefcase className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No case studies yet. Add one to get started.</p>
              </div>
            )}

            {caseStudies.map((cs, idx) => (
              <Card key={cs.id} className="bg-neutral-900 border-neutral-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-neutral-100">{cs.title || "Untitled case study"}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => removeCaseStudy(idx)} className="text-neutral-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-neutral-400 text-xs">Title</Label>
                      <Input value={cs.title} onChange={(e) => updateCaseStudy(idx, "title", e.target.value)} className="bg-neutral-800 border-neutral-700 text-neutral-100" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-400 text-xs">Industry</Label>
                      <Input value={cs.industry} onChange={(e) => updateCaseStudy(idx, "industry", e.target.value)} className="bg-neutral-800 border-neutral-700 text-neutral-100" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-400 text-xs">Challenge</Label>
                    <Textarea value={cs.challenge} onChange={(e) => updateCaseStudy(idx, "challenge", e.target.value)} rows={2} className="bg-neutral-800 border-neutral-700 text-neutral-100" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-400 text-xs">Outcome</Label>
                    <Textarea value={cs.outcome} onChange={(e) => updateCaseStudy(idx, "outcome", e.target.value)} rows={2} className="bg-neutral-800 border-neutral-700 text-neutral-100" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="stats" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">
                Manage outcome statistics shown on the public site.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addOutcomeStat} className="border-neutral-700 text-neutral-300">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Statistic
                </Button>
                <Button size="sm" onClick={saveOutcomeStatsData} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" />
                  Save Changes
                </Button>
              </div>
            </div>

            {outcomeStats.length === 0 && (
              <div className="text-center py-12 text-neutral-500">
                <BarChart3 className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No statistics yet. Add one to get started.</p>
              </div>
            )}

            {outcomeStats.map((stat, idx) => (
              <Card key={stat.id} className="bg-neutral-900 border-neutral-800">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                      <div className="space-y-2">
                        <Label className="text-neutral-400 text-xs">Label</Label>
                        <Input value={stat.label} onChange={(e) => updateOutcomeStat(idx, "label", e.target.value)} placeholder="e.g. Teams helped" className="bg-neutral-800 border-neutral-700 text-neutral-100" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 text-xs">Value</Label>
                        <Input value={stat.value} onChange={(e) => updateOutcomeStat(idx, "value", e.target.value)} placeholder="e.g. 12 or 50+" className="bg-neutral-800 border-neutral-700 text-neutral-100" />
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeOutcomeStat(idx)} className="text-neutral-500 hover:text-red-400 mt-6">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="blog" className="mt-6">
            <BlogManager />
          </TabsContent>

          <TabsContent value="internal" className="mt-6 space-y-4">

            <Card className="bg-neutral-900 border-neutral-800 border-emerald-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-neutral-100 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    Public Tool Onboarding Copy
                  </CardTitle>
                  <Button size="sm" onClick={saveToolSettings} disabled={savingTools}>
                    <Save className="w-4 h-4 mr-1" />
                    Save Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-neutral-400">
                  Edit the plain-English introduction shown on each public tool card and embedded tool page. This helps visitors understand what each tool does before they use it.
                </p>
                {tools.map((tool, idx) => (
                  <div key={tool.slug} className="space-y-2 border border-neutral-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-neutral-300 text-sm font-medium">{tool.name}</Label>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={tool.enabled}
                          onCheckedChange={(val) => updateTool(idx, "enabled", val)}
                        />
                        <span className="text-xs text-neutral-500">{tool.enabled ? "Enabled" : "Disabled"}</span>
                      </div>
                    </div>
                    <textarea
                      value={tool.onboardingCopy || ""}
                      onChange={(e) => updateTool(idx, "onboardingCopy", e.target.value)}
                      placeholder="Write a 2-3 sentence plain-English introduction for this tool..."
                      rows={3}
                      className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                    />
                    <p className="text-xs text-neutral-600">{(tool.onboardingCopy || "").length} characters</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex items-center gap-6 my-6">
              <div className="flex-1 h-px bg-neutral-800" />
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500 px-2">Tool Links</span>
              <div className="flex-1 h-px bg-neutral-800" />
            </div>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-neutral-100 flex items-center gap-2">
                  <span className="text-emerald-400">DA</span> DocAudit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-400 mb-4">
                  AI-powered document analysis tool. Upload a document to receive a structured audit covering clarity, completeness, structure, and actionable recommendations.
                </p>
                <a
                  href="/docaudit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium text-sm rounded-lg transition-colors"
                >
                  Open Tool
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </CardContent>
            </Card>

            <div className="ml-6 border-l-2 border-neutral-700 pl-4 py-1">
              <div className="flex items-center justify-between bg-neutral-900/60 rounded-md px-4 py-3 border border-neutral-800">
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-0.5">Companion Tool</p>
                  <p className="text-sm font-medium text-neutral-300">SEOScope</p>
                </div>
                <a
                  href="https://seo-scope.replit.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-400/10 hover:bg-emerald-400/20 rounded px-3 py-1.5"
                >
                  Open SEOScope
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-neutral-100 flex items-center gap-2">
                  <span className="text-emerald-400">SKA</span> Synaptica Knowledge Architecture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-400 mb-4">
                  Semantic knowledge architecture search and exploration tool for mapping and navigating complex knowledge domains.
                </p>
                <a
                  href="/synaptica-ka"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium text-sm rounded-lg transition-colors"
                >
                  Open Tool
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-neutral-100 flex items-center gap-2">
                  <span className="text-emerald-400">DL</span> DiffLens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-400 mb-4">
                  Document diff and comparison tool. Identify structural and semantic differences between document versions to support content governance and change tracking.
                </p>
                <a
                  href="/difflens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium text-sm rounded-lg transition-colors"
                >
                  Open Tool
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-neutral-100 flex items-center gap-2">
                  <span className="text-emerald-400">DF</span> DocForge PDF
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-400 mb-4">
                  Structured PDF generation tool for producing clean, branded documentation from raw content inputs — reports, audits, and deliverables.
                </p>
                <a
                  href="/docforge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium text-sm rounded-lg transition-colors"
                >
                  Open Tool
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-neutral-100 flex items-center gap-2">
                  <span className="text-emerald-400">DS</span> DocScope Intel Engine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-400 mb-4">
                  Competitive and content intelligence engine. Scope, analyze, and benchmark documentation landscapes to surface gaps and strategic opportunities.
                </p>
                <a
                  href="/docscope"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium text-sm rounded-lg transition-colors"
                >
                  Open Tool
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-neutral-100 flex items-center gap-2">
                  <span className="text-emerald-400">KA</span> Knowledge Architecture Sprint
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-400 mb-4">
                  Walk through a guided, AI-powered sprint to design taxonomy, retrieval logic, metadata schemas, and generate a complete knowledge architecture document — ready for client delivery or internal use.
                </p>
                <a
                  href="/admin/ka-sprint"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium text-sm rounded-lg transition-colors"
                >
                  Launch Tool
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-neutral-100 flex items-center gap-2">
                  <span className="text-purple-400">RAG</span> Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-400 mb-4">
                  Ingest internal documentation, configure chunking and embedding settings, and chat with an AI that answers questions grounded in your uploaded documents — a live demo of the core RAG product offering.
                </p>
                <a
                  href="/admin/rag-pipeline"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-medium text-sm rounded-lg transition-colors"
                >
                  Launch Tool
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-neutral-100 flex items-center gap-2">
                  <span className="text-purple-400">PE</span> Prompt Engineering Workshop
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-400 mb-4">
                  Design, test, document, and share prompt templates with variable placeholders. Includes a live test panel powered by OpenAI, style guide enforcement, and exportable handover documentation for team use.
                </p>
                <a
                  href="/admin/prompt-workshop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-medium text-sm rounded-lg transition-colors"
                >
                  Launch Tool
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-neutral-100 flex items-center gap-2">
                  <span className="text-teal-400">MR</span> Monthly Retainer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-400 mb-4">
                  Manage ongoing retainer client relationships — track commitments, monthly health checks, support sessions, and priority requests for clients on the knowledge architecture support retainer.
                </p>
                <a
                  href="/admin/monthly-retainer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-neutral-950 font-medium text-sm rounded-lg transition-colors"
                >
                  Launch Tool
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800 border-amber-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-neutral-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Platform Audit Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-400 mb-4">
                  Full platform audit covering competitive assessment, prioritized improvement roadmap, and strategic recommendations. Prepared March 14, 2026.
                </p>
                <a
                  href="/synaptica-audit-report.md"
                  download="synaptica-audit-report.md"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-medium text-sm rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Audit Report
                </a>
              </CardContent>
            </Card>

          </TabsContent>

          <TabsContent value="metrics" className="mt-6">
            <MetricsPanel />
          </TabsContent>

          <TabsContent value="sessions" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">
                Recent saved sessions from KA Sprint and Prompt Workshop tools.
              </p>
              <Button variant="outline" size="sm" onClick={loadSessions} className="border-neutral-700 text-neutral-300">
                <Loader2 className={`w-4 h-4 mr-1 ${sessionsLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {sessionsLoading && sessions.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              </div>
            ) : sessions.length === 0 ? (
              <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="py-12 text-center">
                  <FolderOpen className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400 text-sm">No saved sessions yet.</p>
                  <p className="text-neutral-500 text-xs mt-1">Save a session from the KA Sprint or Prompt Workshop tools to see it here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <Card key={s.id} className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-colors">
                    <CardContent className="py-4 px-5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              s.tool === "KA Sprint"
                                ? "bg-emerald-400/15 text-emerald-400"
                                : "bg-purple-400/15 text-purple-300"
                            }`}>
                              {s.tool}
                            </span>
                            <span className="font-medium text-neutral-100 text-sm">{s.clientName}</span>
                            {s.version && (
                              <span className="text-xs text-neutral-500">v{s.version}</span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 truncate">{s.name}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(s.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            {s.step && <span>Step: {s.step}</span>}
                            {s.promptCount !== undefined && <span>{s.promptCount} prompt{s.promptCount !== 1 ? "s" : ""}</span>}
                          </div>
                        </div>
                        <a
                          href={s.tool === "KA Sprint" ? "/admin/ka-sprint" : "/admin/prompt-workshop"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md transition-colors text-neutral-300 shrink-0 ml-3"
                        >
                          Open Tool
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="blog" className="mt-6">
            <BlogManager />
          </TabsContent>

          <TabsContent value="leads" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">
                Email leads captured from public tools.
              </p>
              <a
                href="/api/admin/leads/export"
                onClick={(e) => {
                  e.preventDefault();
                  const token = localStorage.getItem("admin_token");
                  fetch("/api/admin/leads/export", {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                  })
                    .then((res) => res.blob())
                    .then((blob) => {
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "email-leads.csv";
                      a.click();
                      URL.revokeObjectURL(url);
                    });
                }}
                className="inline-flex items-center gap-1.5"
              >
                <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300">
                  <Download className="w-4 h-4 mr-1" />
                  Export CSV
                </Button>
              </a>
            </div>

            {leads.length === 0 ? (
              <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="py-12 text-center">
                  <Mail className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400 text-sm">No email leads captured yet.</p>
                  <p className="text-neutral-500 text-xs mt-1">Leads will appear here when users submit their email on tool result pages.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-800">
                          <th className="text-left px-4 py-3 text-neutral-400 font-medium text-xs uppercase tracking-wider">Name</th>
                          <th className="text-left px-4 py-3 text-neutral-400 font-medium text-xs uppercase tracking-wider">Email</th>
                          <th className="text-left px-4 py-3 text-neutral-400 font-medium text-xs uppercase tracking-wider">Tool</th>
                          <th className="text-left px-4 py-3 text-neutral-400 font-medium text-xs uppercase tracking-wider">Document</th>
                          <th className="text-left px-4 py-3 text-neutral-400 font-medium text-xs uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...leads].reverse().map((lead) => (
                          <tr key={lead.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                            <td className="px-4 py-3 text-neutral-200">{lead.firstName}</td>
                            <td className="px-4 py-3 text-neutral-300">{lead.email}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded">{lead.toolSource}</span>
                            </td>
                            <td className="px-4 py-3 text-neutral-400">{lead.documentType || "—"}</td>
                            <td className="px-4 py-3 text-neutral-500 text-xs">{new Date(lead.capturedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
