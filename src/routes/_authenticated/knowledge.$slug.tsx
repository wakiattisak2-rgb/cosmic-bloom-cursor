import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, Calendar, Tag } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Starfield } from "@/components/Starfield";
import { CoverImage } from "@/components/CoverImage";
import { MarkdownView } from "@/components/MarkdownView";
import { useI18n } from "@/lib/i18n";
import { getArticleBySlug, type KnowledgeArticle } from "@/lib/knowledge";
import { ArticleComments } from "@/components/ArticleComments";
import { logActivity } from "@/lib/activity";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/knowledge/$slug")({
  component: ArticleReader,
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="mb-4 text-sm text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
        Retry
      </button>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="text-sm text-muted-foreground">Article not found.</p>
      <Link to="/knowledge" className="mt-4 inline-block text-primary underline">
        Back to Knowledge
      </Link>
    </div>
  ),
});

function ArticleReader() {
  const { slug } = Route.useParams();
  const { locale } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [article, setArticle] = useState<KnowledgeArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getArticleBySlug(slug)
      .then((a) => {
        if (!alive) return;
        if (!a) {
          navigate({ to: "/knowledge" });
          return;
        }
        setArticle(a);
        if (user) void logActivity("article_view", { entityType: "article", entityId: a.id, metadata: { slug } });
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug, navigate, user]);

  useEffect(() => {
    if (!article) return;
    const articleTitle = locale === "th" && article.title_th ? article.title_th : article.title_en;
    const excerpt =
      locale === "th" && article.excerpt_th ? article.excerpt_th : article.excerpt_en;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: articleTitle,
      description: excerpt,
      author: { "@type": "Person", name: article.author_name },
      datePublished: article.published_at,
      keywords: article.tags.join(", "),
    };
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(el);
    return () => {
      el.remove();
    };
  }, [article, locale]);

  const title = article
    ? locale === "th" && article.title_th
      ? article.title_th
      : article.title_en
    : "";
  const body = article
    ? locale === "th" && article.body_th
      ? article.body_th
      : article.body_en
    : "";

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <Starfield />
      </div>
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          to="/knowledge"
          className="mb-6 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3" />
          {locale === "th" ? "กลับสู่คลังความรู้" : "Back to Knowledge"}
        </Link>

        {loading && (
          <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
            {locale === "th" ? "กำลังโหลด…" : "Loading…"}
          </div>
        )}

        {article && (
          <article className="space-y-6">
            <div className="overflow-hidden rounded-3xl glass glow-border">
              <CoverImage
                path={article.cover_url}
                seed={article.slug}
                className="aspect-[16/8] w-full"
                alt={title}
              />
              <div className="space-y-3 p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  <span className="rounded-md border border-primary/40 bg-primary/5 px-2 py-0.5 text-primary">
                    {article.category}
                  </span>
                  <span>{article.level}</span>
                  {article.framework && (
                    <span className="rounded-md border border-[#00E5FF]/40 px-2 py-0.5 text-[#00E5FF]">
                      {article.framework === "ONEREPORT" ? "One Report" : article.framework}
                    </span>
                  )}
                </div>
                <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
                  {title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="text-primary">{article.author_name}</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(article.published_at).toLocaleDateString(
                      locale === "th" ? "th-TH" : "en-US",
                      { year: "numeric", month: "short", day: "numeric" },
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {article.read_minutes} min
                  </span>
                </div>
                {article.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    {article.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[10px] font-mono uppercase text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="glass rounded-3xl p-6 sm:p-10">
              {body ? (
                <MarkdownView>{body}</MarkdownView>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {locale === "th"
                    ? "บทความนี้ยังไม่มีเนื้อหาในภาษานี้"
                    : "No content yet in this language."}
                </p>
              )}
            </div>

            <ArticleComments articleId={article.id} />
          </article>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
