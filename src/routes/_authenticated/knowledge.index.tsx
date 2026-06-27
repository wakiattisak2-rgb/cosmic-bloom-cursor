import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Sparkles,
  Leaf,
  Users,
  Scale,
  FileBarChart,
  BookOpen,
  GraduationCap,
  Compass,
  Star,
  Globe2,
  PenSquare,
  Clock,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Starfield } from "@/components/Starfield";
import { ImpactCounter } from "@/components/ImpactCounter";
import { CoverImage } from "@/components/CoverImage";
import { useI18n } from "@/lib/i18n";
import {
  listArticles,
  type KnowledgeArticle,
  type Category,
  type Level,
  type Framework,
} from "@/lib/knowledge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/knowledge/")({
  head: () => ({
    meta: [
      { title: "Knowledge Cosmos — Aetros" },
      {
        name: "description",
        content:
          "Bilingual ESG knowledge hub: articles, templates, and frameworks for reporters and curious minds.",
      },
      { property: "og:title", content: "Knowledge Cosmos — Aetros" },
      {
        property: "og:description",
        content: "Explore ESG articles, templates, and frameworks across GRI, SASB, TCFD, CSRD.",
      },
    ],
  }),
  component: KnowledgeHub,
});

const CATEGORIES: { id: Category | "all"; icon: typeof Leaf }[] = [
  { id: "all", icon: Compass },
  { id: "environment", icon: Leaf },
  { id: "social", icon: Users },
  { id: "governance", icon: Scale },
  { id: "reporting", icon: FileBarChart },
];

const LEVELS: { id: Level; icon: typeof BookOpen }[] = [
  { id: "beginner", icon: BookOpen },
  { id: "practitioner", icon: GraduationCap },
  { id: "strategist", icon: Compass },
];

const FRAMEWORKS: Framework[] = ["GRI", "SASB", "TCFD", "CSRD", "ONEREPORT"];

type Sort = "latest" | "frameworks";

function KnowledgeHub() {
  const { locale } = useI18n();
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | "all">("all");
  const [level, setLevel] = useState<Level | null>(null);
  const [framework, setFramework] = useState<Framework | null>(null);
  const [sort, setSort] = useState<Sort>("latest");
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    listArticles()
      .then((rows) => alive && setArticles(rows))
      .finally(() => alive && setLoading(false));

    // Realtime — new articles pop in
    const channel = supabase
      .channel("knowledge-articles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "knowledge_articles" },
        () => listArticles().then((rows) => alive && setArticles(rows)),
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const norm = q.trim().toLowerCase();
    let list = articles.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (level && a.level !== level) return false;
      if (framework && a.framework !== framework) return false;
      if (norm) {
        const hay =
          `${a.title_en} ${a.title_th} ${a.tags.join(" ")} ${a.author_name}`.toLowerCase();
        if (!hay.includes(norm)) return false;
      }
      return true;
    });
    if (sort === "frameworks") {
      list = [...list].sort((a, b) => (a.framework ?? "").localeCompare(b.framework ?? ""));
    }
    return list;
  }, [articles, category, level, framework, sort, q]);

  const featured = useMemo(
    () => articles.slice(0, 3),
    [articles],
  );

  const counts = useMemo(() => {
    const byCat = new Map<string, number>();
    for (const a of articles) byCat.set(a.category, (byCat.get(a.category) ?? 0) + 1);
    byCat.set("all", articles.length);
    const byLevel = new Map<string, number>();
    for (const a of articles) byLevel.set(a.level, (byLevel.get(a.level) ?? 0) + 1);
    return { byCat, byLevel };
  }, [articles]);

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <Starfield />
      </div>

      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* HERO */}
        <section className="relative mb-10 overflow-hidden rounded-3xl glass glow-border p-8 sm:p-12 animate-fade-up">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,255,102,0.18),transparent_70%)]" />
          <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,229,255,0.12),transparent_70%)]" />

          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-primary">
                  <Sparkles className="h-3 w-3" />
                  {locale === "th" ? "คลังความรู้" : "Knowledge Cosmos"}
                </div>
                <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-5xl">
                  {locale === "th" ? (
                    <>
                      ทุกบทความ คือ <span className="text-aurora">ดาวดวงหนึ่ง</span>
                      <br className="hidden sm:block" /> ในจักรวาล ESG ของคุณ
                    </>
                  ) : (
                    <>
                      Every article is a <span className="text-aurora">star</span>
                      <br className="hidden sm:block" /> in your ESG universe.
                    </>
                  )}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {locale === "th"
                    ? "บทความ เทมเพลต และเฟรมเวิร์กที่คัดมาเพื่อคนทำรายงาน ESG และทุกคนที่อยากเข้าใจ — สองภาษา เปิดให้ทุกคน"
                    : "Curated articles, templates, and frameworks for ESG reporters and the curious — bilingual, open to everyone."}
                </p>
              </div>

              <Link
                to="/knowledge/new"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_rgba(0,255,102,0.45)] transition-all hover:scale-[1.03] hover:shadow-[0_0_32px_rgba(0,255,102,0.6)]"
              >
                <PenSquare className="h-4 w-4" />
                {locale === "th" ? "+ เขียนบทความ" : "+ New Article"}
              </Link>
            </div>

            {/* Search */}
            <div className="mt-6 flex max-w-2xl items-center gap-2 rounded-full border border-border bg-background/40 px-4 py-2 backdrop-blur-xl focus-within:border-primary/60 focus-within:shadow-[0_0_24px_rgba(0,255,102,0.25)]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={
                  locale === "th"
                    ? "ค้นบทความ เทมเพลต หรือเฟรมเวิร์ก…"
                    : "Search articles, templates, frameworks…"
                }
                className="w-full bg-transparent text-sm placeholder:text-muted-foreground/60 focus:outline-none"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="rounded-full px-2 py-0.5 text-[10px] font-mono uppercase text-muted-foreground hover:text-foreground"
                >
                  clear
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="mt-6 flex flex-wrap gap-3">
              <StatChip icon={BookOpen} value={articles.length} label={locale === "th" ? "บทความ" : "Articles"} />
              <StatChip
                icon={Globe2}
                value={new Set(articles.map((a) => a.author_name)).size}
                label={locale === "th" ? "ผู้ร่วมเขียน" : "Contributors"}
              />
            </div>
          </div>
        </section>

        {/* BODY */}
        <div className="grid gap-8 md:grid-cols-[260px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="md:sticky md:top-20 md:self-start">
            <div className="glass rounded-2xl p-5">
              <SidebarGroup label={locale === "th" ? "หมวดหลัก" : "Category"}>
                {CATEGORIES.map((c) => (
                  <SidebarItem
                    key={c.id}
                    icon={c.icon}
                    label={catLabel(c.id, locale)}
                    count={counts.byCat.get(c.id) ?? 0}
                    active={category === c.id}
                    onClick={() => setCategory(c.id)}
                  />
                ))}
              </SidebarGroup>

              <SidebarGroup label={locale === "th" ? "ระดับ" : "Level"}>
                {LEVELS.map((l) => (
                  <SidebarItem
                    key={l.id}
                    icon={l.icon}
                    label={levelLabel(l.id, locale)}
                    count={counts.byLevel.get(l.id) ?? 0}
                    active={level === l.id}
                    onClick={() => setLevel(level === l.id ? null : l.id)}
                  />
                ))}
              </SidebarGroup>

              <SidebarGroup label={locale === "th" ? "เฟรมเวิร์ก" : "Framework"}>
                {FRAMEWORKS.map((f) => (
                  <SidebarItem
                    key={f}
                    icon={FileBarChart}
                    label={f === "ONEREPORT" ? "One Report" : f}
                    count={articles.filter((a) => a.framework === f).length}
                    active={framework === f}
                    onClick={() => setFramework(framework === f ? null : f)}
                  />
                ))}
              </SidebarGroup>
            </div>
          </aside>

          {/* Main column */}
          <div className="min-w-0 space-y-8">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ["latest", locale === "th" ? "ล่าสุด" : "Latest"],
                  ["frameworks", locale === "th" ? "ตามเฟรมเวิร์ก" : "By framework"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setSort(id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    sort === id
                      ? "bg-primary text-primary-foreground shadow-[0_0_16px_rgba(0,255,102,0.45)]"
                      : "border border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Featured */}
            {!q && category === "all" && !level && !framework && sort === "latest" && featured.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  <Star className="h-3 w-3 text-primary" />
                  {locale === "th" ? "ดาวเด่น" : "Featured"}
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {featured.map((a) => (
                    <FeaturedCard key={a.id} article={a} locale={locale} />
                  ))}
                </div>
              </section>
            )}

            {/* List */}
            <section className="space-y-3">
              {loading && (
                <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
                  {locale === "th" ? "กำลังโหลด…" : "Loading…"}
                </div>
              )}

              {!loading &&
                filtered.map((a, i) => (
                  <ArticleRow key={a.id} article={a} locale={locale} delay={i * 30} />
                ))}

              {!loading && filtered.length === 0 && (
                <div className="glass rounded-2xl p-10 text-center">
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border border-border">
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {articles.length === 0
                      ? locale === "th"
                        ? "ยังไม่มีบทความ มาเป็นคนแรกที่เผยแพร่"
                        : "No articles yet. Be the first to publish."
                      : locale === "th"
                        ? "ยังไม่มีบทความตรงกับตัวกรองนี้"
                        : "No signals yet for this filter."}
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

// ---------------- Subcomponents ----------------

function StatChip({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Leaf;
  value: number;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1.5 backdrop-blur-xl">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span className="text-sm font-semibold">
        <ImpactCounter value={value} />
      </span>
      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function SidebarGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-2 px-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: typeof Leaf;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-all ${
        active
          ? "bg-primary/10 text-primary shadow-[0_0_18px_rgba(0,255,102,0.25)]"
          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : ""}`} />
        <span className="truncate">{label}</span>
      </span>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono ${
          active ? "bg-primary/20 text-primary" : "bg-muted/40 text-muted-foreground"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function FeaturedCard({
  article,
  locale,
}: {
  article: KnowledgeArticle;
  locale: "en" | "th";
}) {
  const title = locale === "th" && article.title_th ? article.title_th : article.title_en;
  const excerpt =
    locale === "th" && article.excerpt_th ? article.excerpt_th : article.excerpt_en;
  return (
    <Link
      to="/knowledge/$slug"
      params={{ slug: article.slug }}
      className="group glass glow-border relative block overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(0,255,102,0.18)]"
    >
      <div className="mb-4 h-28 w-full overflow-hidden rounded-xl">
        <CoverImage
          path={article.cover_url}
          seed={article.slug}
          className="h-28 w-full"
          alt={title}
        />
      </div>
      <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <span className="text-primary">{article.author_name}</span>
        <span>· {article.read_minutes} min</span>
      </div>
      <h3 className="font-display text-lg font-semibold leading-snug">{title}</h3>
      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{excerpt}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {article.tags.slice(0, 4).map((tg) => (
          <span
            key={tg}
            className="rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[10px] font-mono uppercase text-muted-foreground"
          >
            {tg}
          </span>
        ))}
      </div>
    </Link>
  );
}

function ArticleRow({
  article,
  locale,
  delay,
}: {
  article: KnowledgeArticle;
  locale: "en" | "th";
  delay: number;
}) {
  const title = locale === "th" && article.title_th ? article.title_th : article.title_en;
  return (
    <Link
      to="/knowledge/$slug"
      params={{ slug: article.slug }}
      style={{ animationDelay: `${delay}ms` }}
      className="animate-row-in group glass relative grid grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl p-4 transition-all hover:border-primary/40 hover:shadow-[0_0_24px_rgba(0,255,102,0.15)] sm:grid-cols-[112px_minmax(0,1fr)_auto]"
    >
      <div className="h-16 w-full overflow-hidden rounded-xl sm:h-20">
        <CoverImage
          path={article.cover_url}
          seed={article.slug}
          className="h-16 w-full sm:h-20"
          alt={title}
        />
      </div>

      <div className="min-w-0">
        <h3 className="truncate font-display text-base font-semibold sm:text-lg">{title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          <span className="text-primary/90">{article.author_name}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {article.read_minutes} min
          </span>
          {article.framework && (
            <span className="rounded-md border border-[#00E5FF]/40 px-1.5 py-0.5 text-[10px] normal-case text-[#00E5FF]">
              {article.framework === "ONEREPORT" ? "One Report" : article.framework}
            </span>
          )}
          {article.tags.slice(0, 3).map((tg) => (
            <span
              key={tg}
              className="rounded-md border border-border bg-muted/30 px-1.5 py-0.5 text-[10px] normal-case text-muted-foreground"
            >
              {tg}
            </span>
          ))}
        </div>
      </div>

      <span className="hidden text-[11px] font-mono uppercase tracking-wider text-muted-foreground group-hover:text-primary sm:inline">
        {locale === "th" ? "อ่าน →" : "Read →"}
      </span>
    </Link>
  );
}

function catLabel(c: Category | "all", locale: "en" | "th") {
  const map: Record<string, [string, string]> = {
    all: ["All", "ทั้งหมด"],
    environment: ["Environment", "Environment"],
    social: ["Social", "Social"],
    governance: ["Governance", "Governance"],
    reporting: ["Reporting", "Reporting"],
  };
  return locale === "th" ? map[c][1] : map[c][0];
}

function levelLabel(l: Level, locale: "en" | "th") {
  const map: Record<Level, [string, string]> = {
    beginner: ["Beginner", "มือใหม่"],
    practitioner: ["Practitioner", "ปฏิบัติ"],
    strategist: ["Strategist", "กลยุทธ์"],
  };
  return locale === "th" ? map[l][1] : map[l][0];
}
