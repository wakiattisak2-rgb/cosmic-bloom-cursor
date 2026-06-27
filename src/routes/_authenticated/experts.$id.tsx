import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  Clock,
  Globe,
  MapPin,
  MessageSquare,
  Send,
  Star,
  Sparkles,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Starfield } from "@/components/Starfield";
import { useI18n } from "@/lib/i18n";
import { getExpert, avatarGradient, type Expert } from "@/lib/experts";

export const Route = createFileRoute("/_authenticated/experts/$id")({
  loader: ({ params }) => {
    const expert = getExpert(params.id);
    if (!expert) throw notFound();
    return { expert };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.expert.name_en} — Aetros Expert`
          : "Expert — Aetros",
      },
    ],
  }),
  component: ExpertProfilePage,
  notFoundComponent: () => (
    <div className="relative min-h-screen">
      <Starfield />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl">Expert not found</h1>
        <Link
          to="/experts"
          className="mt-6 inline-block rounded-full border border-border px-5 py-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary"
        >
          ← Back to Experts
        </Link>
      </main>
      <SiteFooter />
    </div>
  ),
});

function ExpertProfilePage() {
  const { expert } = Route.useLoaderData() as { expert: Expert };
  const { locale } = useI18n();
  const isTH = locale === "th";

  const name = isTH ? expert.name_th : expert.name_en;
  const role = isTH ? expert.role_th : expert.role_en;
  const longBio = isTH ? expert.long_bio_th : expert.long_bio_en;
  const industries = isTH ? expert.industries_th : expert.industries_en;
  const format = isTH ? expert.format_th : expert.format_en;
  const response = isTH ? expert.responseTime_th : expert.responseTime_en;

  return (
    <div className="relative min-h-screen">
      <Starfield />
      <SiteHeader />

      <main className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          to="/experts"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {isTH ? "กลับสู่รายชื่อผู้เชี่ยวชาญ" : "Back to Experts"}
        </Link>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-6 sm:p-10 glow-border">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-6 md:flex md:flex-wrap md:items-center md:justify-between">
            <div className="col-span-2 flex min-w-0 items-start gap-5 md:col-auto">
              <div
                className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full ring-1 ring-border sm:h-24 sm:w-24"
                style={{ background: avatarGradient(expert.avatarSeed) }}
              >
                <span className="font-display text-3xl text-foreground/90">
                  {name.slice(0, 1)}
                </span>
                <BadgeCheck className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate font-display text-2xl sm:text-3xl">
                    {name}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {role} ·{" "}
                  {isTH
                    ? `${expert.years} ปีประสบการณ์`
                    : `${expert.years} yrs experience`}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {expert.certs.map((c) => (
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
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    <span className="font-semibold text-foreground">
                      {expert.rating}
                    </span>
                    <span>({expert.reviews})</span>
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {expert.projects} {isTH ? "โครงการ" : "projects"}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {expert.location}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-start-2 row-start-1 flex shrink-0 flex-col items-end gap-2 md:col-auto md:row-auto md:items-end">
              <button className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_rgba(0,255,102,0.45)] transition-transform hover:scale-[1.03]">
                {isTH ? "ติดต่อจ้างงาน" : "Hire now"}
              </button>
              <button className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary">
                {isTH ? "ส่งข้อความ" : "Message"}
              </button>
            </div>
          </div>
        </section>

        {/* Body */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Left */}
          <div className="space-y-10">
            {/* About */}
            <section>
              <SectionTitle>{isTH ? "เกี่ยวกับ" : "About"}</SectionTitle>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {longBio}
              </p>
            </section>

            {/* Services */}
            <section>
              <SectionTitle>
                <Sparkles className="h-4 w-4 text-primary" />
                {isTH ? "บริการ & ราคา" : "Services & Pricing"}
              </SectionTitle>
              <div className="mt-4 space-y-3">
                {expert.services.map((s) => (
                  <div
                    key={s.title_en}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/40 p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <div className="font-display text-base text-foreground">
                        {isTH ? s.title_th : s.title_en}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {isTH ? s.sub_th : s.sub_en}
                      </div>
                    </div>
                    <div className="shrink-0 font-mono text-base text-aurora">
                      ฿{s.price.toLocaleString()}
                      {s.unit_en && (
                        <span className="ml-0.5 text-[11px] text-muted-foreground">
                          {isTH ? s.unit_th : s.unit_en}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Industries */}
            <section>
              <SectionTitle>
                {isTH ? "อุตสาหกรรมที่เชี่ยวชาญ" : "Industries"}
              </SectionTitle>
              <div className="mt-3 flex flex-wrap gap-2">
                {industries.map((ind) => (
                  <span
                    key={ind}
                    className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground"
                  >
                    {ind}
                  </span>
                ))}
              </div>
            </section>

            {/* Portfolio */}
            <section>
              <SectionTitle>{isTH ? "ผลงาน" : "Portfolio"}</SectionTitle>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {expert.portfolio.map((p) => (
                  <article
                    key={p.seed}
                    className="overflow-hidden rounded-2xl border border-border/60 bg-card/40 transition-all hover:-translate-y-1 hover:border-primary/40"
                  >
                    <div
                      className="h-28 w-full"
                      style={{ background: avatarGradient(p.seed) }}
                    />
                    <div className="p-4">
                      <div className="font-display text-sm leading-snug text-foreground">
                        {isTH ? p.title_th : p.title_en}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {p.client}
                      </div>
                      <div className="mt-3 inline-flex rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary ring-1 ring-primary/30">
                        {p.metric}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Reviews */}
            <section>
              <SectionTitle>
                {isTH ? `รีวิว (${expert.reviews})` : `Reviews (${expert.reviews})`}
              </SectionTitle>
              <div className="mt-4 space-y-3">
                {expert.reviewsList.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-border/60 bg-card/40 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-display text-sm text-foreground">
                          {r.author}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {r.company}
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-1 text-xs">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        <span className="font-semibold text-foreground">
                          {r.rating}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      “{isTH ? r.quote_th : r.quote_en}”
                    </p>
                    <div className="mt-2 text-[11px] text-muted-foreground/70">
                      {r.date}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sticky sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border/60 bg-card/50 p-5 glow-border">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {isTH ? "สรุปโปรไฟล์" : "Profile summary"}
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <Row
                  icon={<Clock className="h-3.5 w-3.5" />}
                  label={isTH ? "ตอบเฉลี่ย" : "Response"}
                  value={response}
                />
                <Row
                  icon={<Briefcase className="h-3.5 w-3.5" />}
                  label={isTH ? "งานที่จบ" : "Projects"}
                  value={`${expert.projects} ${isTH ? "โครงการ" : "done"}`}
                />
                <Row
                  icon={<Star className="h-3.5 w-3.5" />}
                  label={isTH ? "เรตติ้ง" : "Rating"}
                  value={`${expert.rating} / 5.0`}
                />
                <Row
                  icon={<MessageSquare className="h-3.5 w-3.5" />}
                  label={isTH ? "รีวิว" : "Reviews"}
                  value={`${expert.reviews}`}
                />
                <Row
                  icon={<Globe className="h-3.5 w-3.5" />}
                  label={isTH ? "ภาษา" : "Languages"}
                  value={expert.languages.join(" / ")}
                />
                <Row
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  label={isTH ? "รูปแบบ" : "Format"}
                  value={format}
                />
              </dl>

              <div className="mt-5 space-y-2">
                <button className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_rgba(0,255,102,0.45)] transition-transform hover:scale-[1.02]">
                  <Send className="h-4 w-4" />
                  {isTH ? "ส่งข้อความ" : "Send message"}
                </button>
                <button className="flex w-full items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary">
                  <CalendarClock className="h-4 w-4" />
                  {isTH ? "นัดคุย 15 นาที (ฟรี)" : "Book 15-min intro (free)"}
                </button>
              </div>

              <div className="mt-5 border-t border-border/60 pt-4 text-[11px] text-muted-foreground">
                <div className="mb-2 inline-flex items-center gap-1.5 text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {isTH ? "ตรวจสอบโดย Aetros" : "Verified by Aetros"}
                </div>
                <div>
                  {isTH
                    ? "ยืนยัน certification (GRI / SBTi / CDP / TCFD) และผ่าน peer review"
                    : "Certifications validated (GRI / SBTi / CDP / TCFD) and peer-reviewed."}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Insight strip */}
        <section className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              t: isTH ? "ราคาโปร่งใส" : "Transparent pricing",
              d: isTH
                ? "บริการแบบ productized — เห็นราคาก่อน ลด friction การตัดสินใจ"
                : "Productized services — see prices upfront and reduce decision friction.",
            },
            {
              t: isTH ? "คุยฟรี 15 นาที" : "Free 15-min intro",
              d: isTH
                ? "นัดคุยก่อนเริ่มงาน เพื่อ scope ที่ตรงและความเข้าใจร่วมกัน"
                : "Align on scope and chemistry before any commitment.",
            },
            {
              t: isTH ? "รีวิว = ความน่าเชื่อ" : "Reviews = trust currency",
              d: isTH
                ? "ทุก expert ต้องมีรีวิวจริงจากลูกค้า ไม่มีรีวิว = โปรไฟล์ตาย"
                : "Every expert carries real client reviews — no reviews, no profile.",
            },
          ].map((c) => (
            <div
              key={c.t}
              className="rounded-2xl border border-border/60 bg-card/40 p-5"
            >
              <div className="font-mono text-[11px] uppercase tracking-wider text-primary">
                {c.t}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{c.d}</div>
            </div>
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="inline-flex items-center gap-2 font-display text-xl text-foreground">
      {children}
    </h2>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
