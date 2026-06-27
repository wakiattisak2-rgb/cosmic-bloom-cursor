import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Search,
  Star,
  MessageSquare,
  Sparkles,
  Filter,
  Globe,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Starfield } from "@/components/Starfield";
import { useI18n } from "@/lib/i18n";
import { listExperts } from "@/lib/experts-db";
import { avatarGradient, type Specialty } from "@/lib/experts";

export const Route = createFileRoute("/_authenticated/experts/")({
  head: () => ({ meta: [{ title: "Expert Directory — Aetros" }] }),
  component: ExpertsPage,
});

const FILTERS: { id: "all" | Specialty; en: string; th: string }[] = [
  { id: "all", en: "All", th: "ทั้งหมด" },
  { id: "carbon", en: "Carbon Accounting", th: "Carbon Accounting" },
  { id: "reporting", en: "Reporting", th: "รายงาน" },
  { id: "materiality", en: "Materiality", th: "Materiality" },
  { id: "supply", en: "Supply Chain", th: "ซัพพลายเชน" },
  { id: "climate", en: "Climate Risk", th: "Climate Risk" },
  { id: "training", en: "Training", th: "อบรม" },
];

function ExpertsPage() {
  const { locale } = useI18n();
  const isTH = locale === "th";
  const [filter, setFilter] = useState<"all" | Specialty>("all");
  const [q, setQ] = useState("");

  const expertsQ = useQuery({ queryKey: ["experts"], queryFn: listExperts });
  const experts = expertsQ.data ?? [];

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return experts.filter((e) => {
      if (filter !== "all" && !e.specialties.includes(filter)) return false;
      if (!needle) return true;
      const hay = [
        e.name_en,
        e.name_th,
        e.role_en,
        e.role_th,
        e.bio_en,
        e.bio_th,
        ...e.certs,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [experts, filter, q]);

  const stats = useMemo(() => {
    if (!experts.length) {
      return {
        count: 0,
        certs: "—",
        projects: 0,
        rating: "—",
      };
    }
    const avg = experts.reduce((s, e) => s + e.rating, 0) / experts.length;
    const projects = experts.reduce((s, e) => s + e.projects, 0);
    const certSet = new Set(experts.flatMap((e) => e.certs.filter((c) => !c.startsWith("★"))));
    return {
      count: experts.length,
      certs: certSet.size ? [...certSet].slice(0, 3).join(" · ") : "—",
      projects,
      rating: avg.toFixed(1),
    };
  }, [experts]);

  return (
    <div className="relative min-h-screen">
      <Starfield />
      <SiteHeader />

      <main className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-8 sm:p-12 glow-border">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {isTH ? "เครือข่ายผู้เชี่ยวชาญ ESG" : "ESG Expert Network"}
              </div>
              <h1 className="font-display text-4xl leading-tight sm:text-5xl">
                {isTH ? (
                  <>
                    หา <span className="text-aurora">ESG Consultant</span>{" "}
                    & Freelancer
                  </>
                ) : (
                  <>
                    Find a verified{" "}
                    <span className="text-aurora">ESG expert</span>
                  </>
                )}
              </h1>
              <p className="mt-4 text-muted-foreground">
                {isTH
                  ? "ผู้เชี่ยวชาญที่ผ่านการ verify ด้วย certification (GRI, SBTi, CDP, TCFD) และ peer review จากชุมชน Aetros"
                  : "Consultants verified via global certifications (GRI, SBTi, CDP, TCFD) and peer reviews from the Aetros community."}
              </p>
            </div>
            <Link
              to="/experts/apply"
              className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_rgba(0,255,102,0.45)] transition-transform hover:scale-[1.03] md:self-end"
            >
              {isTH ? "เป็น Expert" : "Become an Expert"}
            </Link>
          </div>

          <div className="relative mt-8 flex flex-col gap-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={
                  isTH
                    ? "ค้นหาด้วยชื่อ ความเชี่ยวชาญ หรือ certification…"
                    : "Search name, specialty, or certification…"
                }
                className="w-full rounded-full border border-border bg-background/60 py-3 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
              {FILTERS.map((f) => {
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-[0_0_18px_rgba(0,255,102,0.4)]"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {isTH ? f.th : f.en}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: isTH ? "Expert ที่ verified" : "Verified Experts", v: stats.count.toString() },
            { l: isTH ? "Certifications" : "Certifications", v: stats.certs },
            { l: isTH ? "โครงการสำเร็จ" : "Projects Delivered", v: stats.projects.toLocaleString() },
            { l: isTH ? "คะแนนเฉลี่ย" : "Average Rating", v: stats.rating === "—" ? "—" : `${stats.rating} / 5` },
          ].map((s) => (
            <div key={s.l} className="glass rounded-2xl px-4 py-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {s.l}
              </div>
              <div className="mt-1 font-display text-lg text-foreground">{s.v}</div>
            </div>
          ))}
        </section>

        {/* Grid */}
        <section className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((e, i) => (
            <article
              key={e.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_0_40px_rgba(0,255,102,0.15)] animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full ring-1 ring-border"
                  style={{ background: avatarGradient(e.avatarSeed) }}
                >
                  <span className="font-display text-lg text-foreground/90">
                    {(isTH ? e.name_th : e.name_en).slice(0, 1)}
                  </span>
                  <BadgeCheck className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg leading-tight">
                    {isTH ? e.name_th : e.name_en}
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {isTH ? e.role_th : e.role_en}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {e.certs.map((c) => (
                      <span
                        key={c}
                        className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] tracking-wider ${
                          c.startsWith("★")
                            ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">
                {isTH ? e.bio_th : e.bio_en}
              </p>

              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  <span className="font-semibold text-foreground">{e.rating}</span>
                  <span>({e.reviews})</span>
                </span>
                <span>·</span>
                <span>
                  {e.projects} {isTH ? "โครงการ" : "projects"}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {e.languages.join(" / ")}
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                <div>
                  <div className="font-display text-xl text-foreground">
                    ฿{e.rate.toLocaleString()}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      /{isTH ? "ชม." : "hr"}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{e.location}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                    aria-label="Message"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  <Link
                    to="/experts/$id"
                    params={{ id: e.id }}
                    className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
                  >
                    {isTH ? "ดูโปรไฟล์" : "View profile"}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>

        {items.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            {isTH ? "ไม่พบ Expert ที่ตรงกับคำค้น" : "No experts match your search."}
          </div>
        )}

        {/* CTA */}
        <section className="relative mt-12 overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/60 to-background p-8 sm:p-12">
          <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl sm:text-3xl">
                {isTH
                  ? "คุณคือ ESG Expert? มาเข้าร่วม Aetros"
                  : "Are you an ESG Expert? Join Aetros."}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {isTH
                  ? "สมัครเป็น verified expert — ใช้ certification ของคุณช่วยองค์กรไทยและสะสม Carbon Credits จากทุกโครงการ"
                  : "Apply as a verified expert — use your certifications to help organizations and earn Carbon Credits on every engagement."}
              </p>
            </div>
            <Link
              to="/experts/apply"
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_rgba(0,255,102,0.45)] transition-transform hover:scale-[1.03]"
            >
              {isTH ? "สมัครเป็น Expert" : "Apply as Expert"}
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
