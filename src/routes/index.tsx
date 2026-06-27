import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Users, Sparkles, Activity, Gift, Leaf, Trees } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ParticleHero } from "@/components/ParticleHero";
import { ImpactCounter } from "@/components/ImpactCounter";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aetros — The Universe Begins Within You" },
      { name: "description", content: "Join the global ESG community: log impact, earn XP, redeem real-world rewards." },
      { property: "og:title", content: "Aetros — The Universe Begins Within You" },
      { property: "og:description", content: "A futuristic, bilingual community platform for ESG." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t, locale } = useI18n();

  const impact = useQuery({
    queryKey: ["impact"],
    queryFn: async () => {
      const [{ data: agg }, { count: users }] = await Promise.all([
        supabase.from("actions_log").select("xp_awarded,credits_awarded"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      const credits = (agg ?? []).reduce((s, r) => s + (r.credits_awarded ?? 0), 0);
      const xp = (agg ?? []).reduce((s, r) => s + (r.xp_awarded ?? 0), 0);
      // base + community
      return {
        carbon: 12847 + credits * 1.5,
        trees: 482 + Math.floor(credits / 25),
        innovators: 1240 + (users ?? 0),
        xp,
      };
    },
    refetchInterval: 12_000,
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <ParticleHero />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 sm:pt-24 md:pb-32 md:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-primary">
              <Sparkles className="h-3 w-3" /> {t("hero.tag")}
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] text-foreground sm:text-6xl md:text-7xl animate-fade-up">
              {locale === "th" ? (
                <>
                  จักรวาล<br />
                  <span className="text-aurora">เริ่มต้น</span>
                  <br />ที่ตัวคุณ.
                </>
              ) : (
                <>
                  The Universe<br />
                  Begins <span className="text-aurora">Within</span> You.
                </>
              )}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
              {t("hero.subtitle")}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/auth"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground neon-glow transition-transform hover:scale-[1.03]"
              >
                {t("hero.cta")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#story"
                className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground hover:border-primary/50 hover:text-primary"
              >
                {t("hero.secondary")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT COUNTERS */}
      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-px overflow-hidden rounded-none sm:grid-cols-3">
          <ImpactCell
            label={t("impact.carbon")}
            value={impact.data?.carbon ?? 0}
            decimals={0}
            icon={<Leaf className="h-4 w-4" />}
          />
          <ImpactCell
            label={t("impact.trees")}
            value={impact.data?.trees ?? 0}
            icon={<Trees className="h-4 w-4" />}
          />
          <ImpactCell
            label={t("impact.innovators")}
            value={impact.data?.innovators ?? 0}
            icon={<Users className="h-4 w-4" />}
          />
        </div>
      </section>

      {/* STORY */}
      <section id="story" className="mx-auto max-w-4xl px-4 py-24 sm:px-6 sm:py-32">
        <div className="space-y-6">
          <span className="font-mono text-xs uppercase tracking-widest text-primary">
            {t("story.title")}
          </span>
          <h2 className="font-display text-3xl font-medium leading-tight text-foreground sm:text-5xl">
            We are not separate from the Earth.<br />
            <span className="text-aurora">We are made of the same stardust.</span>
          </h2>
          <p className="text-base text-muted-foreground sm:text-lg">
            {t("story.body")}
          </p>
          <p className="border-l-2 border-primary/50 pl-4 text-base italic text-foreground/80">
            {t("story.body_th")}
          </p>
        </div>
      </section>

      {/* BENTO */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <h2 className="mb-10 max-w-2xl font-display text-2xl font-medium sm:text-4xl">
          {t("features.title")}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2">
          <BentoCard
            className="md:col-span-2 md:row-span-2"
            icon={<Sparkles className="h-5 w-5" />}
            title={t("features.avatar")}
            body={t("features.avatar.d")}
            feature
          />
          <BentoCard
            icon={<Users className="h-5 w-5" />}
            title={t("features.community")}
            body={t("features.community.d")}
          />
          <BentoCard
            icon={<Activity className="h-5 w-5" />}
            title={t("features.tracker")}
            body={t("features.tracker.d")}
          />
          <BentoCard
            className="md:col-span-3"
            icon={<Gift className="h-5 w-5" />}
            title={t("features.market")}
            body={t("features.market.d")}
          />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function ImpactCell({
  label, value, decimals = 0, icon,
}: { label: string; value: number; decimals?: number; icon: React.ReactNode }) {
  return (
    <div className="bg-background p-8 text-center">
      <div className="mx-auto mb-3 grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
        {icon}
      </div>
      <div className="font-display text-3xl font-semibold text-foreground sm:text-5xl">
        <ImpactCounter value={value} decimals={decimals} />
      </div>
      <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function BentoCard({
  className = "", icon, title, body, feature = false,
}: {
  className?: string; icon: React.ReactNode; title: string; body: string; feature?: boolean;
}) {
  return (
    <div
      className={`group glass glow-border relative overflow-hidden rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,255,102,0.15)] ${className}`}
    >
      {feature && (
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: "var(--gradient-aurora)" }}
        />
      )}
      <div className="relative">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
          {icon}
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
