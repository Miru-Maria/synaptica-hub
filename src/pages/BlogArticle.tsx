import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Calendar, Clock, Tag, ArrowLeft } from "lucide-react";
import { PhoenixLogo } from "@/components/PhoenixLogo";
import { Helmet } from "@/components/Helmet";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  featuredImage?: string;
  publishDate: string;
  readingTime: number;
}

export default function BlogArticle() {
  const [, params] = useRoute("/blog/:slug");
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!params?.slug) return;
    fetch(`/api/blog/public/${params.slug}`)
      .then((r) => {
        if (!r.ok) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setArticle(data);
          setLoading(false);
        }
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [params?.slug]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-lg">Article not found</p>
        <Link href="/blog">
          <span className="text-primary hover:underline cursor-pointer">Back to Blog</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet
        title={`${article.title} | Synaptica Blog`}
        description={article.excerpt}
        ogTitle={article.title}
        ogDescription={article.excerpt}
        ogImage={article.featuredImage}
        ogType="article"
      />

      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-white/10 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="relative w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <PhoenixLogo size={22} glowIntensity="medium" />
              </div>
              <span className="font-semibold tracking-wide text-sm md:text-base hidden sm:block">
                Synaptica <span className="text-muted-foreground font-normal">Knowledge Systems</span>
              </span>
            </div>
          </Link>
          <Link href="/blog">
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              All Articles
            </span>
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <article className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                <Tag className="w-3 h-3" />
                {article.category}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {formatDate(article.publishDate)}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {article.readingTime} min read
              </span>
            </div>

            {article.featuredImage && (
              <div className="aspect-video rounded-xl overflow-hidden mb-8 border border-white/10">
                <img
                  src={article.featuredImage}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="prose prose-invert prose-lg max-w-none
              prose-headings:font-semibold prose-headings:text-foreground
              prose-h1:text-3xl prose-h1:md:text-4xl prose-h1:mb-6
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground
              prose-code:text-primary prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-pre:bg-white/[0.03] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl
              prose-li:text-muted-foreground
              prose-table:border-collapse
              prose-th:border prose-th:border-white/10 prose-th:bg-white/5 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:text-foreground
              prose-td:border prose-td:border-white/10 prose-td:px-4 prose-td:py-2 prose-td:text-muted-foreground
              prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
              prose-hr:border-white/10
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.body}
              </ReactMarkdown>
            </div>
          </motion.div>

          <div className="mt-16 pt-8 border-t border-white/10">
            <Link href="/blog">
              <span className="inline-flex items-center gap-2 text-primary hover:underline cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
                Back to all articles
              </span>
            </Link>
          </div>
        </article>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Synaptica Knowledge Systems. All rights reserved.</p>
      </footer>
    </div>
  );
}
