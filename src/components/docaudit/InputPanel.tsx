import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Globe, Database, X, Plus, Loader2, Search, Check } from "lucide-react";

interface NotionPage {
  id: string;
  title: string;
  type: "page" | "database";
  url: string;
}

interface InputPanelProps {
  onChunksReady: (chunks: string[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

type TabId = "upload" | "paste" | "url" | "notion";

export function InputPanel({ onChunksReady, isLoading, setIsLoading }: InputPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [urls, setUrls] = useState<string[]>([""]);
  const [notionToken, setNotionToken] = useState("");
  const [notionPageIds, setNotionPageIds] = useState<string[]>([]);
  const [notionSearchResults, setNotionSearchResults] = useState<NotionPage[]>([]);
  const [notionSearching, setNotionSearching] = useState(false);
  const [notionConnected, setNotionConnected] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "upload", label: "File Upload", icon: <Upload className="w-4 h-4" /> },
    { id: "paste", label: "Paste Text", icon: <FileText className="w-4 h-4" /> },
    { id: "url", label: "URL Import", icon: <Globe className="w-4 h-4" /> },
    { id: "notion", label: "Notion", icon: <Database className="w-4 h-4" /> },
  ];

  const acceptedTypes = ".pdf,.docx,.md,.txt,.text,.markdown";

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase();
      return ["pdf", "docx", "md", "txt", "text", "markdown"].includes(ext || "");
    });
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const connectNotion = async () => {
    if (!notionToken.trim()) {
      setError("Please enter your Notion integration token");
      return;
    }
    setNotionSearching(true);
    setError(null);
    try {
      const res = await fetch("/api/audit/notion-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiToken: notionToken, query: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotionSearchResults(data.results);
      setNotionConnected(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setNotionConnected(false);
    } finally {
      setNotionSearching(false);
    }
  };

  const toggleNotionPage = (id: string) => {
    setNotionPageIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      let chunks: string[] = [];

      if (activeTab === "upload") {
        if (files.length === 0) throw new Error("Please add at least one file");
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));
        const res = await fetch("/api/audit/parse-files", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        chunks = data.chunks;
      } else if (activeTab === "paste") {
        if (!pasteText.trim()) throw new Error("Please paste some text");
        const res = await fetch("/api/audit/parse-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: pasteText }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        chunks = data.chunks;
      } else if (activeTab === "url") {
        const validUrls = urls.filter((u) => u.trim());
        if (validUrls.length === 0) throw new Error("Please enter at least one URL");
        const res = await fetch("/api/audit/parse-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: validUrls }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        chunks = data.chunks;
      } else if (activeTab === "notion") {
        if (!notionToken.trim()) throw new Error("Please enter your Notion API token");
        if (notionPageIds.length === 0) throw new Error("Please connect and select at least one page or database");
        const selectedItems = notionSearchResults
          .filter((p) => notionPageIds.includes(p.id))
          .map((p) => ({ id: p.id, type: p.type }));
        const res = await fetch("/api/audit/parse-notion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiToken: notionToken, items: selectedItems }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        chunks = data.chunks;
      }

      if (chunks.length === 0) throw new Error("No content could be extracted from the provided source");

      onChunksReady(chunks);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-primary/15 text-primary border border-primary/30"
                : "glass text-muted-foreground hover:text-foreground hover:border-white/10"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl p-6 min-h-[250px]">
        {activeTab === "upload" && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                dragOver
                  ? "border-primary/60 bg-primary/5"
                  : "border-white/10 hover:border-white/20"
              }`}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-foreground font-medium mb-1">Drop files here or click to browse</p>
              <p className="text-sm text-muted-foreground">Supports PDF, DOCX, Markdown, and plain text</p>
              <input
                id="file-input"
                type="file"
                multiple
                accept={acceptedTypes}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between glass rounded-lg px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "paste" && (
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your documentation content here..."
            className="w-full h-56 bg-transparent border border-white/10 rounded-xl p-4 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/40 transition-colors"
          />
        )}

        {activeTab === "url" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-2">
              Enter URLs of documentation pages to scrape and analyze.
            </p>
            {urls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    const newUrls = [...urls];
                    newUrls[i] = e.target.value;
                    setUrls(newUrls);
                  }}
                  placeholder="https://docs.example.com/page"
                  className="flex-1 bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
                />
                {urls.length > 1 && (
                  <button
                    onClick={() => setUrls(urls.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-destructive transition-colors px-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setUrls([...urls, ""])}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add another URL
            </button>
          </div>
        )}

        {activeTab === "notion" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Notion Integration Token</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={notionToken}
                  onChange={(e) => { setNotionToken(e.target.value); setNotionConnected(false); }}
                  placeholder="ntn_..."
                  className="flex-1 bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
                />
                <button
                  onClick={connectNotion}
                  disabled={notionSearching || !notionToken.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-foreground hover:border-primary/40 hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {notionSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {notionConnected ? "Connected" : "Connect"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Create an integration at notion.so/my-integrations and share pages with it.
              </p>
            </div>

            {notionConnected && notionSearchResults.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select pages & databases ({notionPageIds.length} selected)
                </label>
                <div className="max-h-64 overflow-y-auto space-y-1.5 border border-white/10 rounded-xl p-2">
                  {notionSearchResults.map((page) => {
                    const isSelected = notionPageIds.includes(page.id);
                    return (
                      <button
                        key={page.id}
                        onClick={() => toggleNotionPage(page.id)}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                          isSelected
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center border flex-shrink-0 ${
                          isSelected ? "bg-primary border-primary" : "border-white/20"
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground truncate">{page.title}</p>
                          <p className="text-xs text-muted-foreground">{page.type === "database" ? "Database" : "Page"}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {notionConnected && notionSearchResults.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No pages found. Make sure you have shared pages with your integration.
              </p>
            )}
          </div>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive"
        >
          {error}
        </motion.div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing documents...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            Process Documents
          </>
        )}
      </button>
    </div>
  );
}
