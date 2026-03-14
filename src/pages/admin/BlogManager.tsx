import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit, Eye, EyeOff, ArrowLeft, ExternalLink } from "lucide-react";

interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  featuredImage?: string;
  publishDate: string;
  published: boolean;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function BlogManager() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BlogArticle | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const loadArticles = useCallback(async () => {
    const res = await fetch("/api/blog", { headers: authHeaders() });
    if (res.ok) {
      setArticles(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const showStatus = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 3000);
  };

  const startNew = () => {
    setEditing({
      id: "",
      title: "",
      slug: "",
      excerpt: "",
      body: "",
      category: "",
      publishDate: new Date().toISOString().split("T")[0],
      published: false,
      readingTime: 1,
      createdAt: "",
      updatedAt: "",
    });
    setIsNew(true);
  };

  const startEdit = (article: BlogArticle) => {
    setEditing({ ...article });
    setIsNew(false);
  };

  const cancelEdit = () => {
    setEditing(null);
    setIsNew(false);
  };

  const saveArticle = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const url = isNew ? "/api/blog" : `/api/blog/${editing.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          title: editing.title,
          slug: editing.slug,
          excerpt: editing.excerpt,
          body: editing.body,
          category: editing.category,
          featuredImage: editing.featuredImage,
          publishDate: editing.publishDate,
          published: editing.published,
        }),
      });
      if (res.ok) {
        showStatus(isNew ? "Article created" : "Article saved");
        setEditing(null);
        setIsNew(false);
        await loadArticles();
      } else {
        const err = await res.json();
        showStatus(err.error || "Failed to save");
      }
    } catch {
      showStatus("Network error");
    }
    setSaving(false);
  };

  const togglePublished = async (article: BlogArticle) => {
    const res = await fetch(`/api/blog/${article.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ published: !article.published }),
    });
    if (res.ok) {
      await loadArticles();
      showStatus(article.published ? "Article unpublished" : "Article published");
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm("Delete this article permanently?")) return;
    const res = await fetch(`/api/blog/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) {
      await loadArticles();
      showStatus("Article deleted");
    }
  };

  const updateField = (field: keyof BlogArticle, value: string | boolean) => {
    if (!editing) return;
    const updated = { ...editing, [field]: value };
    if (field === "title" && isNew) {
      updated.slug = slugify(value as string);
    }
    setEditing(updated);
  };

  if (loading) {
    return <p className="text-neutral-400 text-sm">Loading articles...</p>;
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-neutral-400">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to list
          </Button>
          <div className="flex items-center gap-2">
            {status && <span className="text-sm text-emerald-400">{status}</span>}
            <Button size="sm" onClick={saveArticle} disabled={saving || !editing.title || !editing.slug || !editing.body}>
              {saving ? "Saving..." : isNew ? "Create Article" : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-neutral-400 text-xs">Title</Label>
            <Input
              value={editing.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Article title"
              className="bg-neutral-800 border-neutral-700 text-neutral-100"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-neutral-400 text-xs">Slug</Label>
            <Input
              value={editing.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              placeholder="url-friendly-slug"
              className="bg-neutral-800 border-neutral-700 text-neutral-100"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-neutral-400 text-xs">Category</Label>
            <Input
              value={editing.category}
              onChange={(e) => updateField("category", e.target.value)}
              placeholder="e.g. RAG & Retrieval"
              className="bg-neutral-800 border-neutral-700 text-neutral-100"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-neutral-400 text-xs">Publish Date</Label>
            <Input
              type="date"
              value={editing.publishDate}
              onChange={(e) => updateField("publishDate", e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-neutral-100"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-neutral-400 text-xs">Featured Image URL (optional)</Label>
            <Input
              value={editing.featuredImage || ""}
              onChange={(e) => updateField("featuredImage", e.target.value)}
              placeholder="https://..."
              className="bg-neutral-800 border-neutral-700 text-neutral-100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-neutral-400 text-xs">Excerpt</Label>
          <textarea
            value={editing.excerpt}
            onChange={(e) => updateField("excerpt", e.target.value)}
            placeholder="A brief 1-2 sentence summary for the blog listing"
            rows={2}
            className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-neutral-400 text-xs">Body (Markdown)</Label>
          <textarea
            value={editing.body}
            onChange={(e) => updateField("body", e.target.value)}
            placeholder="Write your article content in Markdown..."
            rows={20}
            className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-md px-3 py-2 text-sm font-mono resize-vertical focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={editing.published}
            onCheckedChange={(val) => updateField("published", val)}
          />
          <Label className="text-neutral-400 text-sm">
            {editing.published ? "Published" : "Draft"}
          </Label>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400">
          Manage blog articles. Published articles appear on the public blog.
        </p>
        <div className="flex items-center gap-2">
          {status && <span className="text-sm text-emerald-400">{status}</span>}
          <a
            href="/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            View Blog
            <ExternalLink className="w-3 h-3" />
          </a>
          <Button variant="outline" size="sm" onClick={startNew} className="border-neutral-700 text-neutral-300">
            <Plus className="w-4 h-4 mr-1" />
            New Article
          </Button>
        </div>
      </div>

      {articles.length === 0 ? (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="py-12 text-center">
            <p className="text-neutral-500 mb-4">No articles yet</p>
            <Button variant="outline" size="sm" onClick={startNew} className="border-neutral-700 text-neutral-300">
              <Plus className="w-4 h-4 mr-1" />
              Create your first article
            </Button>
          </CardContent>
        </Card>
      ) : (
        articles.map((article) => (
          <Card key={article.id} className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <CardTitle className="text-base text-neutral-100 truncate">{article.title}</CardTitle>
                  {article.published ? (
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded shrink-0">Published</span>
                  ) : (
                    <span className="text-xs bg-neutral-700/50 text-neutral-400 px-2 py-0.5 rounded shrink-0">Draft</span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => togglePublished(article)} className="text-neutral-500 hover:text-neutral-300" title={article.published ? "Unpublish" : "Publish"}>
                    {article.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => startEdit(article)} className="text-neutral-500 hover:text-neutral-300">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteArticle(article.id)} className="text-neutral-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <span>{article.category}</span>
                <span>{article.publishDate}</span>
                <span>{article.readingTime} min read</span>
                <span className="text-neutral-600">/{article.slug}</span>
              </div>
              {article.excerpt && (
                <p className="text-sm text-neutral-400 mt-2 line-clamp-1">{article.excerpt}</p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
