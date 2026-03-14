import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Play,
  Search,
  Copy,
  Check,
  X,
  FileText,
  BookOpen,
  Palette,
  Variable,
} from "lucide-react";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

interface PromptTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  body: string;
  tags: string[];
  variables: string[];
  useStyleGuide: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StyleGuide {
  content: string;
  updatedAt: string;
}

type Tab = "library" | "styleguide" | "handover";

const DEFAULT_CATEGORIES = ["Marketing", "Support", "Content", "Sales", "Engineering", "HR"];

function extractVariables(body: string): string[] {
  const matches = body.match(/\{\{([\w-]+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))];
}

function highlightVariables(text: string): JSX.Element[] {
  const parts = text.split(/(\{\{[\w-]+\}\})/g);
  return parts.map((part, i) => {
    if (/^\{\{[\w-]+\}\}$/.test(part)) {
      return (
        <span key={i} className="bg-purple-500/20 text-purple-300 px-1 rounded">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function PromptWorkshop() {
  const [, setLocation] = useLocation();
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("library");

  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [styleGuide, setStyleGuide] = useState<StyleGuide>({ content: "", updatedAt: "" });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [showEditor, setShowEditor] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [editorForm, setEditorForm] = useState({
    title: "",
    category: "",
    customCategory: "",
    description: "",
    body: "",
    tags: "",
    useStyleGuide: false,
  });
  const [editorSaving, setEditorSaving] = useState(false);

  const [testPrompt, setTestPrompt] = useState<PromptTemplate | null>(null);
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});
  const [testOutput, setTestOutput] = useState("");
  const [testRunning, setTestRunning] = useState(false);
  const [testCopied, setTestCopied] = useState(false);

  const [styleGuideText, setStyleGuideText] = useState("");
  const [styleGuideSaving, setStyleGuideSaving] = useState(false);
  const [styleGuideSaved, setStyleGuideSaved] = useState(false);

  const [handoverCopied, setHandoverCopied] = useState(false);

  const [status, setStatus] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [promptsRes, guideRes] = await Promise.all([
        fetch("/api/admin/prompt-workshop/prompts", { headers: authHeaders() }),
        fetch("/api/admin/prompt-workshop/style-guide", { headers: authHeaders() }),
      ]);
      if (promptsRes.ok) setPrompts(await promptsRes.json());
      if (guideRes.ok) {
        const guide = await guideRes.json();
        setStyleGuide(guide);
        setStyleGuideText(guide.content);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    }
    setLoading(false);
  }, []);

  const checkAuthRef = useCallback(async (): Promise<boolean> => {
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

  useEffect(() => {
    (async () => {
      const isAuthed = await checkAuthRef();
      if (isAuthed) await loadData();
      else setLoading(false);
    })();
  }, [checkAuthRef, loadData]);

  const categories = [...new Set([...DEFAULT_CATEGORIES, ...prompts.map((p) => p.category)])].filter(Boolean).sort();

  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const openEditor = (prompt?: PromptTemplate) => {
    if (prompt) {
      setEditingPrompt(prompt);
      const isCustom = !DEFAULT_CATEGORIES.includes(prompt.category);
      setEditorForm({
        title: prompt.title,
        category: isCustom ? "__custom__" : prompt.category,
        customCategory: isCustom ? prompt.category : "",
        description: prompt.description,
        body: prompt.body,
        tags: prompt.tags.join(", "),
        useStyleGuide: prompt.useStyleGuide,
      });
    } else {
      setEditingPrompt(null);
      setEditorForm({
        title: "",
        category: DEFAULT_CATEGORIES[0],
        customCategory: "",
        description: "",
        body: "",
        tags: "",
        useStyleGuide: false,
      });
    }
    setShowEditor(true);
  };

  const saveEditor = async () => {
    setEditorSaving(true);
    const category = editorForm.category === "__custom__" ? editorForm.customCategory : editorForm.category;
    const payload = {
      title: editorForm.title,
      category,
      description: editorForm.description,
      body: editorForm.body,
      tags: editorForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      useStyleGuide: editorForm.useStyleGuide,
    };

    try {
      let res;
      if (editingPrompt) {
        res = await fetch(`/api/admin/prompt-workshop/prompts/${editingPrompt.id}`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/prompt-workshop/prompts", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
      }
      if (res.ok) {
        setShowEditor(false);
        await loadData();
        setStatus(editingPrompt ? "Prompt updated" : "Prompt created");
        setTimeout(() => setStatus(""), 3000);
      }
    } catch (err) {
      console.error("Save error:", err);
    }
    setEditorSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this prompt?")) return;
    try {
      const res = await fetch(`/api/admin/prompt-workshop/prompts/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        await loadData();
        setStatus("Prompt deleted");
        setTimeout(() => setStatus(""), 3000);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const openTest = (prompt: PromptTemplate) => {
    setTestPrompt(prompt);
    setTestVariables(Object.fromEntries(prompt.variables.map((v) => [v, ""])));
    setTestOutput("");
    setTestCopied(false);
  };

  const runTest = async () => {
    if (!testPrompt) return;
    setTestRunning(true);
    setTestOutput("");

    let rendered = testPrompt.body;
    for (const [key, value] of Object.entries(testVariables)) {
      rendered = rendered.replace(new RegExp(`\\{\\{${key.replace(/[-]/g, '\\$&')}\\}\\}`, "g"), value || `[${key}]`);
    }

    if (testPrompt.useStyleGuide && styleGuide.content) {
      rendered += "\n\n---\nStyle Guide:\n" + styleGuide.content;
    }

    try {
      const res = await fetch("/api/admin/prompt-workshop/test", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ renderedPrompt: rendered }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestOutput(data.output);
      } else {
        setTestOutput(`Error: ${data.error || "Failed to run prompt"}`);
      }
    } catch (err) {
      setTestOutput("Network error. Please try again.");
    }
    setTestRunning(false);
  };

  const copyTestOutput = async () => {
    try {
      await navigator.clipboard.writeText(testOutput);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = testOutput;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setTestCopied(true);
    setTimeout(() => setTestCopied(false), 2000);
  };

  const saveStyleGuideHandler = async () => {
    setStyleGuideSaving(true);
    try {
      const res = await fetch("/api/admin/prompt-workshop/style-guide", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ content: styleGuideText }),
      });
      if (res.ok) {
        const guide = await res.json();
        setStyleGuide(guide);
        setStyleGuideSaved(true);
        setTimeout(() => setStyleGuideSaved(false), 3000);
      }
    } catch (err) {
      console.error("Style guide save error:", err);
    }
    setStyleGuideSaving(false);
  };

  const generateHandoverMarkdown = (): string => {
    const lines: string[] = [];
    lines.push("# Prompt Engineering Workshop — Handover Documentation\n");
    lines.push(`Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}\n`);
    lines.push("---\n");

    if (styleGuide.content) {
      lines.push("## Style Guide\n");
      lines.push(styleGuide.content);
      lines.push("\n---\n");
    }

    const grouped: Record<string, PromptTemplate[]> = {};
    for (const p of prompts) {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    }

    lines.push("## Prompt Library\n");

    for (const [category, categoryPrompts] of Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))) {
      lines.push(`### ${category}\n`);
      for (const p of categoryPrompts) {
        lines.push(`#### ${p.title}\n`);
        if (p.description) lines.push(`${p.description}\n`);
        if (p.variables.length > 0) {
          lines.push("**Variables:**\n");
          for (const v of p.variables) {
            lines.push(`- \`{{${v}}}\` — Replace with the appropriate ${v.replace(/_/g, " ")} value`);
          }
          lines.push("");
        }
        lines.push("**Prompt Template:**\n");
        lines.push("```");
        lines.push(p.body);
        lines.push("```\n");
        if (p.useStyleGuide) {
          lines.push("*This prompt auto-appends the style guide when used.*\n");
        }
        if (p.tags.length > 0) {
          lines.push(`**Tags:** ${p.tags.join(", ")}\n`);
        }
        lines.push("---\n");
      }
    }

    return lines.join("\n");
  };

  const copyHandover = async () => {
    const md = generateHandoverMarkdown();
    try {
      await navigator.clipboard.writeText(md);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = md;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setHandoverCopied(true);
    setTimeout(() => setHandoverCopied(false), 2000);
  };

  if (!authed || loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <p className="text-neutral-400">Loading…</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: "library", label: "Library", icon: BookOpen },
    { id: "styleguide", label: "Style Guide", icon: Palette },
    { id: "handover", label: "Handover Docs", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/50">
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
              <span className="text-purple-400">PE</span> Prompt Workshop
            </h1>
          </div>
          {status && <span className="text-sm text-emerald-400">{status}</span>}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-2 mb-6 border-b border-neutral-800 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "library" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-1 gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search prompts..."
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-4 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-purple-500/50"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => openEditor()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-medium text-sm rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Prompt
              </button>
            </div>

            {filteredPrompts.length === 0 ? (
              <div className="text-center py-16">
                <Variable className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400 text-sm">
                  {prompts.length === 0 ? "No prompts yet. Create your first one!" : "No prompts match your search."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-neutral-100 text-sm leading-tight">{prompt.title}</h3>
                      <span className="text-xs bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-full shrink-0 ml-2">
                        {prompt.category}
                      </span>
                    </div>
                    {prompt.description && (
                      <p className="text-xs text-neutral-400 mb-3 line-clamp-2">{prompt.description}</p>
                    )}
                    <div className="mt-auto space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {prompt.variables.length > 0 && (
                          <span className="text-xs text-neutral-500 flex items-center gap-1">
                            <Variable className="w-3 h-3" />
                            {prompt.variables.length} variable{prompt.variables.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        {prompt.useStyleGuide && (
                          <span className="text-xs text-teal-400 flex items-center gap-1">
                            <Palette className="w-3 h-3" />
                            Style guide
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openEditor(prompt)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md text-xs text-neutral-300 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => openTest(prompt)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 rounded-md text-xs text-purple-300 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          Test
                        </button>
                        <button
                          onClick={() => handleDelete(prompt.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-red-500/15 border border-neutral-700 hover:border-red-500/30 rounded-md text-xs text-neutral-400 hover:text-red-400 transition-colors ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "styleguide" && (
          <div className="space-y-4 max-w-3xl">
            <div>
              <h2 className="text-xl font-semibold mb-1">Style Guide</h2>
              <p className="text-sm text-neutral-400">
                Define tone, formatting rules, and brand voice. Prompts with "auto-append style guide" enabled will include this text when tested or exported.
              </p>
            </div>
            <textarea
              value={styleGuideText}
              onChange={(e) => setStyleGuideText(e.target.value)}
              placeholder="Enter your style guide here...&#10;&#10;Example:&#10;- Use active voice&#10;- Keep sentences under 20 words&#10;- Always address the reader as 'you'&#10;- Maintain a professional but approachable tone"
              className="w-full h-80 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-neutral-100 text-sm font-mono placeholder:text-neutral-600 resize-none focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={saveStyleGuideHandler}
                disabled={styleGuideSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {styleGuideSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Style Guide"
                )}
              </button>
              {styleGuideSaved && <span className="text-sm text-emerald-400">Saved successfully</span>}
            </div>
          </div>
        )}

        {activeTab === "handover" && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-1">Handover Documentation</h2>
                <p className="text-sm text-neutral-400">
                  A formatted overview of the entire prompt library, ready to share with your team.
                </p>
              </div>
              <button
                onClick={copyHandover}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-medium text-sm rounded-lg transition-colors shrink-0"
              >
                {handoverCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy All as Markdown
                  </>
                )}
              </button>
            </div>

            {prompts.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400 text-sm">No prompts in the library yet. Create some prompts first.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {styleGuide.content && (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-purple-300 uppercase tracking-wider mb-3">Style Guide</h3>
                    <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-sans leading-relaxed">
                      {styleGuide.content}
                    </pre>
                  </div>
                )}

                {Object.entries(
                  prompts.reduce<Record<string, PromptTemplate[]>>((acc, p) => {
                    if (!acc[p.category]) acc[p.category] = [];
                    acc[p.category].push(p);
                    return acc;
                  }, {})
                )
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([category, categoryPrompts]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-neutral-200 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400" />
                        {category}
                      </h3>
                      <div className="space-y-3">
                        {categoryPrompts.map((p) => (
                          <div key={p.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                            <h4 className="font-medium text-neutral-100 mb-1">{p.title}</h4>
                            {p.description && (
                              <p className="text-sm text-neutral-400 mb-3">{p.description}</p>
                            )}
                            {p.variables.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                                  Variables
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {p.variables.map((v) => (
                                    <span
                                      key={v}
                                      className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-md font-mono"
                                    >
                                      {`{{${v}}}`}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-3">
                              <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed">
                                {highlightVariables(p.body)}
                              </pre>
                            </div>
                            <div className="flex items-center gap-3 mt-3">
                              {p.useStyleGuide && (
                                <span className="text-xs text-teal-400 flex items-center gap-1">
                                  <Palette className="w-3 h-3" />
                                  Auto-appends style guide
                                </span>
                              )}
                              {p.tags.length > 0 && (
                                <span className="text-xs text-neutral-500">Tags: {p.tags.join(", ")}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showEditor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <h2 className="font-semibold text-lg text-neutral-100">
                {editingPrompt ? "Edit Prompt" : "New Prompt"}
              </h2>
              <button onClick={() => setShowEditor(false)} className="text-neutral-400 hover:text-neutral-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Title</label>
                <input
                  type="text"
                  value={editorForm.title}
                  onChange={(e) => setEditorForm({ ...editorForm, title: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-purple-500/50"
                  placeholder="e.g., Customer Onboarding Email"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">Category</label>
                  <select
                    value={editorForm.category}
                    onChange={(e) => setEditorForm({ ...editorForm, category: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-purple-500/50"
                  >
                    {DEFAULT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__custom__">Custom...</option>
                  </select>
                </div>
                {editorForm.category === "__custom__" && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1.5">Custom Category</label>
                    <input
                      type="text"
                      value={editorForm.customCategory}
                      onChange={(e) => setEditorForm({ ...editorForm, customCategory: e.target.value })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-purple-500/50"
                      placeholder="Enter category name"
                    />
                  </div>
                )}
                <div className={editorForm.category === "__custom__" ? "col-span-2" : ""}>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={editorForm.tags}
                    onChange={(e) => setEditorForm({ ...editorForm, tags: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-purple-500/50"
                    placeholder="e.g., email, onboarding, welcome"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Description</label>
                <input
                  type="text"
                  value={editorForm.description}
                  onChange={(e) => setEditorForm({ ...editorForm, description: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-purple-500/50"
                  placeholder="Brief description of what this prompt does"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Prompt Body
                  <span className="text-neutral-500 font-normal ml-2">Use {"{{variable}}"} for placeholders</span>
                </label>
                <textarea
                  value={editorForm.body}
                  onChange={(e) => setEditorForm({ ...editorForm, body: e.target.value })}
                  className="w-full h-48 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-sm text-neutral-100 font-mono resize-none focus:outline-none focus:border-purple-500/50"
                  placeholder={"Write a {{tone}} email to {{recipient_name}} about {{topic}}.\n\nInclude a clear call to action and keep it under {{word_count}} words."}
                />
                {extractVariables(editorForm.body).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {extractVariables(editorForm.body).map((v) => (
                      <span
                        key={v}
                        className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-md font-mono"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={editorForm.useStyleGuide}
                  onClick={() => setEditorForm({ ...editorForm, useStyleGuide: !editorForm.useStyleGuide })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    editorForm.useStyleGuide ? "bg-purple-500" : "bg-neutral-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                      editorForm.useStyleGuide ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
                <label className="text-sm text-neutral-300">Auto-append style guide</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-800">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEditor}
                disabled={editorSaving || !editorForm.title || !editorForm.body}
                className="flex items-center gap-2 px-5 py-2 bg-purple-500 hover:bg-purple-400 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {editorSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : editingPrompt ? (
                  "Update Prompt"
                ) : (
                  "Create Prompt"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {testPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <div>
                <h2 className="font-semibold text-lg text-neutral-100">Test Prompt</h2>
                <p className="text-sm text-neutral-400">{testPrompt.title}</p>
              </div>
              <button
                onClick={() => setTestPrompt(null)}
                className="text-neutral-400 hover:text-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-3">
                <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {highlightVariables(testPrompt.body)}
                </pre>
              </div>

              {testPrompt.variables.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-neutral-300">Fill in variables:</h3>
                  {testPrompt.variables.map((v) => (
                    <div key={v}>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">{`{{${v}}}`}</label>
                      <input
                        type="text"
                        value={testVariables[v] || ""}
                        onChange={(e) =>
                          setTestVariables({ ...testVariables, [v]: e.target.value })
                        }
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-purple-500/50"
                        placeholder={`Enter ${v.replace(/_/g, " ")}...`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {testPrompt.useStyleGuide && styleGuide.content && (
                <p className="text-xs text-teal-400 flex items-center gap-1">
                  <Palette className="w-3 h-3" />
                  Style guide will be appended automatically
                </p>
              )}

              <button
                onClick={runTest}
                disabled={testRunning}
                className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {testRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running…
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Prompt
                  </>
                )}
              </button>

              {testOutput && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-neutral-300">Output</h3>
                    <button
                      onClick={copyTestOutput}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md transition-colors"
                    >
                      {testCopied ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy output
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 max-h-80 overflow-y-auto">
                    <pre className="text-sm text-neutral-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {testOutput}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
