import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { LogOut, Save, Package, Wrench, Plus, Trash2, GripVertical, ExternalLink, Hammer } from "lucide-react";

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

interface ClientTool {
  name: string;
  slug: string;
  enabled: boolean;
}

function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [tools, setTools] = useState<ClientTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

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

  useEffect(() => {
    async function load() {
      const authed = await checkAuth();
      if (!authed) return;

      const [pkgRes, toolRes] = await Promise.all([
        fetch("/api/admin/packages", { headers: authHeaders() }),
        fetch("/api/admin/tools", { headers: authHeaders() }),
      ]);

      if (pkgRes.ok) setPackages(await pkgRes.json());
      if (toolRes.ok) setTools(await toolRes.json());
      setLoading(false);
    }
    load();
  }, [checkAuth]);

  const handleLogout = async () => {
    sessionStorage.removeItem("admin_token");
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

  const saveTools = async () => {
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/admin/tools", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(tools),
      });
      if (res.ok) setStatus("Tools saved");
      else setStatus("Failed to save tools");
    } catch {
      setStatus("Network error");
    }
    setSaving(false);
    setTimeout(() => setStatus(""), 3000);
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

  const toggleTool = (index: number) => {
    setTools((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], enabled: !next[index].enabled };
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
            <TabsTrigger value="tools" className="data-[state=active]:bg-neutral-800 gap-2">
              <Wrench className="w-4 h-4" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="internal" className="data-[state=active]:bg-neutral-800 gap-2">
              <Hammer className="w-4 h-4" />
              Internal Tools
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

          <TabsContent value="tools" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">
                Toggle client-facing tools on or off.
              </p>
              <Button size="sm" onClick={saveTools} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />
                Save Changes
              </Button>
            </div>

            {tools.map((tool, idx) => (
              <div key={tool.slug}>
                <Card className="bg-neutral-900 border-neutral-800">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-neutral-100">{tool.name}</p>
                        <a
                          href={`/${tool.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-500 hover:text-neutral-300 transition-colors"
                          title={`Open /${tool.slug}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <p className="text-sm text-neutral-500">/{tool.slug}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${tool.enabled ? "text-emerald-400" : "text-neutral-500"}`}>
                        {tool.enabled ? "Enabled" : "Disabled"}
                      </span>
                      <Switch checked={tool.enabled} onCheckedChange={() => toggleTool(idx)} />
                    </div>
                  </CardContent>
                </Card>
                {tool.slug === "docaudit" && (
                  <div className="ml-6 mt-1 border-l-2 border-neutral-700 pl-4 py-2">
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
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="internal" className="mt-6 space-y-4">
            <p className="text-sm text-neutral-400">
              Internal admin-only tools for knowledge architecture work.
            </p>

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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-neutral-950 font-medium text-sm rounded-lg transition-colors"
                >
                  Launch Tool
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
