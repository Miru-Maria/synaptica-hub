import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, Save, Package, Plus, Trash2, GripVertical, ExternalLink, Hammer, Download, FileText, Inbox, FolderOpen, Clock, Loader2, MessageSquare, Briefcase, BarChart3, PenLine, Mail, Activity, Users, Receipt, Settings, LayoutDashboard, Bot, ClipboardList, FlaskConical, Microscope } from "lucide-react";
import BlogManager from "./BlogManager";
import MetricsPanel from "./MetricsPanel";
import PipelineManager from "./PipelineManager";
import InvoiceManager from "./InvoiceManager";
import ChatSessionsViewer from "./ChatSessionsViewer";
import ProjectManager from "./ProjectManager";
import NotificationBell from "@/components/NotificationBell";
import AnalyticsOverview from "./AnalyticsOverview";

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
  const [adminSettings, setAdminSettings] = useState({ emailNotificationsEnabled: false, adminEmail: "", calendlyUrl: "", chatWidgetEnabled: true, chatSystemPrompt: "" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [emailTestStatus, setEmailTestStatus] = useState<{ loading: boolean; result: string; ok: boolean | null }>({ loading: false, result: "", ok: null });
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [draftGenResult, setDraftGenResult] = useState<{ title?: string; error?: string } | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

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

      const [pkgRes, inqRes, toolsRes, testRes, csRes, statRes, leadsRes, settingsRes] = await Promise.all([
        fetch("/api/admin/packages", { headers: authHeaders() }),
        fetch("/api/admin/discovery-inquiries", { headers: authHeaders() }),
        fetch("/api/admin/tools", { headers: authHeaders() }),
        fetch("/api/admin/testimonials", { headers: authHeaders() }),
        fetch("/api/admin/case-studies", { headers: authHeaders() }),
        fetch("/api/admin/outcome-stats", { headers: authHeaders() }),
        fetch("/api/admin/leads", { headers: authHeaders() }),
        fetch("/api/admin/settings", { headers: authHeaders() }),
      ]);
      if (pkgRes.ok) setPackages(await pkgRes.json());
      if (inqRes.ok) setInquiries(await inqRes.json());
      if (toolsRes.ok) setTools(await toolsRes.json());
      if (testRes.ok) setTestimonials(await testRes.json());
      if (csRes.ok) setCaseStudies(await csRes.json());
      if (statRes.ok) setOutcomeStats(await statRes.json());
      if (leadsRes.ok) setLeads(await leadsRes.json());
      if (settingsRes.ok) setAdminSettings(await settingsRes.json());
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

  type NavIcon = React.ComponentType<{ className?: string }>;

  const navBtn = (value: string, Icon: NavIcon, label: string, badge?: number, extraOnClick?: () => void) => (
    <button
      key={value}
      onClick={() => { setActiveTab(value); extraOnClick?.(); }}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
        activeTab === value
          ? "bg-neutral-800 text-neutral-100"
          : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium min-w-[18px] text-center leading-4">
          {badge}
        </span>
      )}
    </button>
  );

  const mobileNavBtn = (value: string, Icon: NavIcon, label: string, extraOnClick?: () => void) => (
    <button
      key={value}
      onClick={() => { setActiveTab(value); extraOnClick?.(); }}
      className={cn(
        "flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] flex-shrink-0 transition-colors",
        activeTab === value
          ? "text-emerald-400"
          : "text-neutral-500 hover:text-neutral-300"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <header className="border-b border-neutral-800 bg-neutral-900/60 flex-shrink-0 sticky top-0 z-20">
        <div className="h-14 px-4 sm:px-6 flex items-center justify-between">
          <h1 className="font-semibold text-base tracking-tight">Synaptica Admin</h1>
          <div className="flex items-center gap-3">
            {status && (
              <span className="text-sm text-emerald-400">{status}</span>
            )}
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-neutral-400 hover:text-neutral-100">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-52 border-r border-neutral-800 bg-neutral-900/30 hidden md:flex flex-col sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto flex-shrink-0">
          <nav className="py-3 px-2 space-y-0.5">
            {navBtn("overview", LayoutDashboard, "Overview")}

            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest px-3 pt-5 pb-1">Content</p>
            {navBtn("packages", Package, "Packages")}
            {navBtn("blog", PenLine, "Blog")}
            {navBtn("testimonials", MessageSquare, "Testimonials")}
            {navBtn("case-studies", Briefcase, "Case Studies")}
            {navBtn("stats", BarChart3, "Statistics")}

            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest px-3 pt-5 pb-1">Business</p>
            {navBtn("pipeline", Users, "Pipeline")}
            {navBtn("inquiries", Inbox, "Inquiries", inquiries.length || undefined)}
            {navBtn("leads", Mail, "Email Leads", leads.length || undefined)}
            {navBtn("chat-sessions", Bot, "Chat Sessions")}
            {navBtn("invoicing", Receipt, "Invoicing")}
            {navBtn("projects", ClipboardList, "Projects")}

            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest px-3 pt-5 pb-1">Tools</p>
            {navBtn("internal", Hammer, "Internal Tools")}
            {navBtn("metrics", Activity, "Metrics")}
            {navBtn("sessions", FolderOpen, "Sessions", undefined, () => { if (sessions.length === 0) loadSessions(); })}
            <button onClick={() => setLocation("/admin/ux-tester")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50">
              <FlaskConical className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 truncate">UX Tester</span>
            </button>
            <button onClick={() => setLocation("/admin/tool-tester")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50">
              <Microscope className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 truncate">Tool Tester</span>
            </button>

            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest px-3 pt-5 pb-1">Account</p>
            {navBtn("settings", Settings, "Settings")}
          </nav>
        </aside>

        <div className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-neutral-900/95 border-t border-neutral-800 flex overflow-x-auto px-2 py-1.5 gap-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {mobileNavBtn("overview", LayoutDashboard, "Overview")}
          {mobileNavBtn("packages", Package, "Packages")}
          {mobileNavBtn("blog", PenLine, "Blog")}
          {mobileNavBtn("testimonials", MessageSquare, "Social")}
          {mobileNavBtn("case-studies", Briefcase, "Cases")}
          {mobileNavBtn("stats", BarChart3, "Stats")}
          {mobileNavBtn("pipeline", Users, "Pipeline")}
          {mobileNavBtn("inquiries", Inbox, "Inquiries")}
          {mobileNavBtn("leads", Mail, "Leads")}
          {mobileNavBtn("chat-sessions", Bot, "Chat")}
          {mobileNavBtn("invoicing", Receipt, "Invoicing")}
          {mobileNavBtn("projects", ClipboardList, "Projects")}
          {mobileNavBtn("internal", Hammer, "Tools")}
          {mobileNavBtn("metrics", Activity, "Metrics")}
          {mobileNavBtn("sessions", FolderOpen, "Sessions")}
          <button onClick={() => setLocation("/admin/ux-tester")} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] flex-shrink-0 transition-colors text-neutral-500 hover:text-neutral-300">
            <FlaskConical className="w-4 h-4" />
            <span className="whitespace-nowrap">UX Test</span>
          </button>
          <button onClick={() => setLocation("/admin/tool-tester")} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] flex-shrink-0 transition-colors text-neutral-500 hover:text-neutral-300">
            <Microscope className="w-4 h-4" />
            <span className="whitespace-nowrap">Tool Test</span>
          </button>
          {mobileNavBtn("settings", Settings, "Settings")}
        </div>

        <main className="flex-1 min-w-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8">

          <div className={activeTab === "overview" ? "mt-6" : "hidden"}>
            <AnalyticsOverview onNavigate={setActiveTab} />
          </div>

          <div className={activeTab === "packages" ? "mt-6 space-y-4" : "hidden"}>
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
          </div>

          <div className={activeTab === "pipeline" ? "mt-6" : "hidden"}>
            <PipelineManager />
          </div>

          <div className={activeTab === "inquiries" ? "mt-6 space-y-4" : "hidden"}>
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
          </div>

          <div className={activeTab === "blog" ? "mt-6" : "hidden"}>
            <BlogManager />
          </div>

          <div className={activeTab === "testimonials" ? "mt-6 space-y-4" : "hidden"}>
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
          </div>

          <div className={activeTab === "case-studies" ? "mt-6 space-y-4" : "hidden"}>
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
          </div>

          <div className={activeTab === "stats" ? "mt-6 space-y-4" : "hidden"}>
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
          </div>

          <div className={activeTab === "internal" ? "mt-6 space-y-4" : "hidden"}>

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

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-neutral-100 flex items-center gap-2">
                  <span className="text-emerald-400">SE</span> SEOScope
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-400 mb-4">
                  SEO analysis tool. Paste a page's content, enter a URL, and set target keywords to get a structured Claude-powered report covering keyword usage, content quality, heading structure, and actionable recommendations.
                </p>
                <button
                  onClick={() => setLocation("/admin/seoscope")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium text-sm rounded-lg transition-colors"
                >
                  Launch Tool
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-neutral-100 flex items-center gap-2">
                  <span className="text-emerald-400">KA</span> Knowledge Architecture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-400 mb-4">
                  Documentation engineering suite. Five tools in one pipeline: pgvector semantic search, documentation gap analysis, audience-tailored FAQ generation, RAG-powered onboarding assistant, and a reusable prompt library with live sandbox.
                </p>
                <button
                  onClick={() => setLocation("/admin/knowledge-arch")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium text-sm rounded-lg transition-colors"
                >
                  Launch Suite
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
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
                  Word-level document comparison. Upload or paste two versions of any document and get a clear, colour-coded diff highlighting every addition, deletion, and change — with word-count stats.
                </p>
                <button
                  onClick={() => setLocation("/admin/difflens")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium text-sm rounded-lg transition-colors"
                >
                  Launch Tool
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-neutral-100 flex items-center gap-2">
                  <span className="text-emerald-400">DF</span> DocForge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-400 mb-4">
                  Transform raw notes, bullet points, or rough drafts into polished, structured documents. Choose a format (report, brief, guide, audit, proposal), add branding notes, upload a file or paste content — Claude does the rest.
                </p>
                <button
                  onClick={() => setLocation("/admin/docforge")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium text-sm rounded-lg transition-colors"
                >
                  Launch Tool
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
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
                  Paste any content — emails, Slack threads, meeting notes, or documents — and get a structured AI analysis of gaps, inconsistencies, structure problems, and coverage issues.
                </p>
                <button
                  onClick={() => setLocation("/admin/docscope")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium text-sm rounded-lg transition-colors"
                >
                  Launch Tool
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
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

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-neutral-100 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-cyan-400" />
                  UX Testing Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-400 mb-4">
                  Run autonomous AI-driven UX tests across the platform. Multiple personas exercise the chat assistant, lab tools, navigation, and lead capture — then an evaluator grades every interaction and produces a structured report.
                </p>
                <button
                  onClick={() => setLocation("/admin/ux-tester")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-medium text-sm rounded-lg transition-colors"
                >
                  Launch Tool
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-neutral-100 flex items-center gap-2">
                  <Microscope className="w-4 h-4 text-violet-400" />
                  Tool Functionality Tester
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-400 mb-4">
                  Autonomous AI evaluation across 23 hypothetical use cases — DocAudit functionality, external tool health (with response time and content checks), KA Sprint, RAG Pipeline, Prompt Workshop, and chat knowledge accuracy. Produces a downloadable Markdown report stored for 60 days, max 10 kept.
                </p>
                <button
                  onClick={() => setLocation("/admin/tool-tester")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm rounded-lg transition-colors"
                >
                  Launch Tool
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
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

          </div>

          <div className={activeTab === "metrics" ? "mt-6" : "hidden"}>
            <MetricsPanel />
          </div>

          <div className={activeTab === "sessions" ? "mt-6 space-y-4" : "hidden"}>
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
          </div>

          <div className={activeTab === "leads" ? "mt-6 space-y-4" : "hidden"}>
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
          </div>

          <div className={activeTab === "chat-sessions" ? "mt-6" : "hidden"}>
            <ChatSessionsViewer />
          </div>

          <div className={activeTab === "invoicing" ? "mt-6" : "hidden"}>
            <InvoiceManager />
          </div>

          <div className={activeTab === "projects" ? "mt-6" : "hidden"}>
            <ProjectManager />
          </div>

          <div className={activeTab === "settings" ? "mt-6 space-y-4" : "hidden"}>
            <p className="text-sm text-neutral-400">
              Configure notification preferences and admin settings.
            </p>
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-base text-neutral-100">Email Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-neutral-200">Enable email notifications</Label>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Receive email alerts for high-priority events (new discovery calls, new subscribers).
                    </p>
                  </div>
                  <Switch
                    checked={adminSettings.emailNotificationsEnabled}
                    onCheckedChange={(checked) =>
                      setAdminSettings((prev) => ({ ...prev, emailNotificationsEnabled: checked }))
                    }
                  />
                </div>
                {adminSettings.emailNotificationsEnabled && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-neutral-400 text-xs">Admin Email Address</Label>
                      <Input
                        type="email"
                        value={adminSettings.adminEmail}
                        onChange={(e) =>
                          setAdminSettings((prev) => ({ ...prev, adminEmail: e.target.value }))
                        }
                        placeholder="admin@example.com"
                        className="bg-neutral-800 border-neutral-700 text-neutral-100 max-w-md"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-neutral-600 text-neutral-300 hover:bg-neutral-800"
                        disabled={emailTestStatus.loading || !adminSettings.adminEmail}
                        onClick={async () => {
                          setEmailTestStatus({ loading: true, result: "", ok: null });
                          try {
                            const res = await fetch("/api/admin/test-email", {
                              method: "POST",
                              headers: authHeaders(),
                            });
                            const data = await res.json() as { ok?: boolean; sentTo?: string; error?: string };
                            if (res.ok) {
                              setEmailTestStatus({ loading: false, result: `Test email sent to ${data.sentTo}`, ok: true });
                            } else {
                              setEmailTestStatus({ loading: false, result: data.error || "Send failed", ok: false });
                            }
                          } catch {
                            setEmailTestStatus({ loading: false, result: "Network error — could not reach server", ok: false });
                          }
                          setTimeout(() => setEmailTestStatus({ loading: false, result: "", ok: null }), 8000);
                        }}
                      >
                        {emailTestStatus.loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Mail className="w-3.5 h-3.5 mr-1.5" />}
                        Send Test Email
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-neutral-600 text-neutral-300 hover:bg-neutral-800"
                        disabled={generatingDraft}
                        onClick={async () => {
                          setGeneratingDraft(true);
                          setDraftGenResult(null);
                          try {
                            const res = await fetch("/api/admin/blog/generate-now", {
                              method: "POST",
                              headers: authHeaders(),
                            });
                            const data = await res.json() as { ok?: boolean; draft?: { title?: string }; error?: string };
                            if (res.ok) {
                              setDraftGenResult({ title: data.draft?.title });
                            } else {
                              setDraftGenResult({ error: data.error || "Generation failed" });
                            }
                          } catch {
                            setDraftGenResult({ error: "Network error" });
                          }
                          setGeneratingDraft(false);
                          setTimeout(() => setDraftGenResult(null), 10000);
                        }}
                      >
                        {generatingDraft ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1.5" />}
                        Generate Draft Now
                      </Button>
                    </div>
                    {emailTestStatus.result && (
                      <p className={`text-xs ${emailTestStatus.ok ? "text-emerald-400" : "text-red-400"}`}>
                        {emailTestStatus.ok ? "✓" : "✗"} {emailTestStatus.result}
                      </p>
                    )}
                    {draftGenResult && (
                      <p className={`text-xs ${draftGenResult.error ? "text-red-400" : "text-emerald-400"}`}>
                        {draftGenResult.error ? `✗ ${draftGenResult.error}` : `✓ Draft created: "${draftGenResult.title}" — check the Blog tab`}
                      </p>
                    )}
                  </div>
                )}
                <div className="space-y-2 pt-2 border-t border-neutral-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-neutral-200">AI Chat Widget</Label>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Show the AI sales assistant chat bubble on the public site.
                      </p>
                    </div>
                    <Switch
                      checked={adminSettings.chatWidgetEnabled}
                      onCheckedChange={(checked) =>
                        setAdminSettings((prev) => ({ ...prev, chatWidgetEnabled: checked }))
                      }
                    />
                  </div>
                  <div className="space-y-2 mt-3">
                    <Label className="text-neutral-400 text-xs">Assistant System Prompt (optional override)</Label>
                    <p className="text-[10px] text-neutral-600">
                      Leave empty to use the default Synaptica assistant prompt. Customize to change the assistant's persona, knowledge, or behavior.
                    </p>
                    <Textarea
                      value={adminSettings.chatSystemPrompt}
                      onChange={(e) =>
                        setAdminSettings((prev) => ({ ...prev, chatSystemPrompt: e.target.value }))
                      }
                      placeholder="Leave empty for default prompt..."
                      rows={6}
                      className="bg-neutral-800 border-neutral-700 text-neutral-100 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-neutral-700">
                  <Label className="text-neutral-200">Booking Calendar URL</Label>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Your Cal.com or Calendly link. When set, an inline booking widget appears on the Work With Me page.
                  </p>
                  <Input
                    type="url"
                    value={adminSettings.calendlyUrl}
                    onChange={(e) =>
                      setAdminSettings((prev) => ({ ...prev, calendlyUrl: e.target.value }))
                    }
                    placeholder="https://cal.eu/your-name/30min"
                    className="bg-neutral-800 border-neutral-700 text-neutral-100 max-w-md"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={async () => {
                    setSavingSettings(true);
                    setStatus("");
                    try {
                      const res = await fetch("/api/admin/settings", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json", ...authHeaders() },
                        body: JSON.stringify(adminSettings),
                      });
                      if (res.ok) setStatus("Settings saved");
                      else setStatus("Failed to save settings");
                    } catch {
                      setStatus("Network error");
                    }
                    setSavingSettings(false);
                    setTimeout(() => setStatus(""), 3000);
                  }}
                  disabled={savingSettings}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
