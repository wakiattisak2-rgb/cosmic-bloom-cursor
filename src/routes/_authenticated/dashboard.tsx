import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { toast } from "sonner";
import { Car, Recycle, Sprout, Zap, Sparkles, RotateCcw, Rocket } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EcoAvatar } from "@/components/EcoAvatar";
import { TierBadge, TierProgress } from "@/components/TierBadge";
import { ImpactCounter } from "@/components/ImpactCounter";
import { Starfield } from "@/components/Starfield";
import { BurstLayer, type Burst } from "@/components/ParticleBurst";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Aetros" }] }),
  component: Dashboard,
});

const ACTIONS = [
  { type: "ev_commute", emoji: "🚗", labelKey: "dash.act.ev", icon: Car, xp: 50, credits: 10 },
  { type: "recycle", emoji: "♻️", labelKey: "dash.act.recycle", icon: Recycle, xp: 30, credits: 5 },
  { type: "tree_plant", emoji: "🌱", labelKey: "dash.act.tree", icon: Sprout, xp: 100, credits: 20 },
  { type: "energy", emoji: "⚡", labelKey: "dash.act.energy", icon: Zap, xp: 20, credits: 3 },
] as const;

type Action = (typeof ACTIONS)[number];

function relTime(iso: string, locale: "en" | "th") {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const f = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (diff < 60) return f.format(-Math.round(diff), "second");
  if (diff < 3600) return f.format(-Math.round(diff / 60), "minute");
  if (diff < 86400) return f.format(-Math.round(diff / 3600), "hour");
  return f.format(-Math.round(diff / 86400), "day");
}

function Dashboard() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const qc = useQueryClient();
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [simBoost, setSimBoost] = useState(0);
  const burstId = useRef(0);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const recent = useQuery({
    queryKey: ["actions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actions_log")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Realtime subscription to actions_log for live updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`actions-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "actions_log", filter: `user_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["actions", user.id] });
          qc.invalidateQueries({ queryKey: ["profile", user.id] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  const logMut = useMutation({
    mutationFn: async (a: Action) => {
      const { error } = await supabase.rpc("log_action", {
        p_action_type: a.type,
        p_xp: a.xp,
        p_credits: a.credits,
        p_note: undefined,
      });
      if (error) throw error;
      return a;
    },
    onMutate: async (a) => {
      await qc.cancelQueries({ queryKey: ["profile", user?.id] });
      const prev = qc.getQueryData<any>(["profile", user?.id]);
      if (prev) {
        qc.setQueryData(["profile", user?.id], {
          ...prev,
          xp: (prev.xp ?? 0) + a.xp,
          carbon_credits: (prev.carbon_credits ?? 0) + a.credits,
        });
      }
      return { prev };
    },
    onError: (e: any, _a, ctx) => {
      if (ctx?.prev) qc.setQueryData(["profile", user?.id], ctx.prev);
      toast.error(e.message ?? "Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["actions", user?.id] });
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
      qc.invalidateQueries({ queryKey: ["impact"] });
    },
  });

  const fireBurst = (e: MouseEvent, a: Action) => {
    const id = ++burstId.current;
    setBursts((b) => [...b, { id, x: e.clientX, y: e.clientY, label: `+${a.xp} XP`, sub: `+${a.credits} CC` }]);
  };

  const onLog = (e: MouseEvent, a: Action) => {
    fireBurst(e, a);
    logMut.mutate(a);
  };

  const trueXp = profile.data?.xp ?? 0;
  const xp = trueXp + simBoost;
  const credits = profile.data?.carbon_credits ?? 0;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
          <Starfield />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="space-y-6">
            {/* Greeting + Tier */}
            <header className="glass glow-border rounded-2xl p-6 animate-fade-up">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {t("dash.greeting")}
                  </p>
                  <h1 className="mt-1 truncate font-display text-3xl font-semibold sm:text-4xl">
                    {profile.data?.display_name ?? "Pioneer"}
                  </h1>
                  <div className="mt-3">
                    <TierBadge xp={xp} locale={locale} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:w-72">
                  <StatCard label={t("dash.xp_total")} value={xp} />
                  <StatCard label={t("dash.balance_total")} value={credits} accent />
                </div>
              </div>
              <div className="mt-6">
                <TierProgress xp={xp} locale={locale} />
              </div>
            </header>

            {/* Action Tracker */}
            <section className="animate-fade-up" style={{ animationDelay: "80ms" }}>
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg">
                <Sparkles className="h-4 w-4 text-primary" />
                {t("dash.log")}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ACTIONS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.type}
                      disabled={logMut.isPending}
                      onClick={(e) => onLog(e, a)}
                      className="glass group relative flex items-center gap-4 overflow-hidden rounded-xl border border-border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-[0_8px_32px_rgba(0,255,102,0.25)] disabled:opacity-60"
                    >
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-2xl ring-1 ring-primary/30 transition-transform group-hover:scale-110">
                        <span>{a.emoji}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{t(a.labelKey as any)}</div>
                        <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-aurora">
                          +{a.xp} XP · +{a.credits} CC
                        </div>
                      </div>
                      <Icon className="h-4 w-4 text-primary/60 transition-colors group-hover:text-primary" />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity group-hover:opacity-100"
                        style={{
                          background:
                            "radial-gradient(400px circle at var(--x,50%) var(--y,50%), rgba(0,255,102,0.12), transparent 40%)",
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Recent */}
            <section className="animate-fade-up" style={{ animationDelay: "160ms" }}>
              <h2 className="mb-3 font-display text-lg">{t("dash.recent")}</h2>
              <div className="glass divide-y divide-border rounded-xl">
                {recent.isLoading && (
                  <p className="p-4 text-sm text-muted-foreground">{t("common.loading")}</p>
                )}
                {!recent.isLoading && (recent.data?.length ?? 0) === 0 && (
                  <p className="p-6 text-center text-sm text-muted-foreground">{t("dash.none")}</p>
                )}
                {recent.data?.map((r, i) => {
                  const def = ACTIONS.find((a) => a.type === r.action_type);
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 p-4 animate-row-in"
                      style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-lg ring-1 ring-primary/20">
                          {def?.emoji ?? "✨"}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {def ? t(def.labelKey as any) : r.action_type}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            {relTime(r.created_at, locale)}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm text-primary">+{r.credits_awarded} CC</div>
                        <div className="text-[11px] text-muted-foreground">+{r.xp_awarded} XP</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </section>

          {/* Avatar column */}
          <aside className="space-y-4">
            <div className="glass glow-border flex flex-col items-center rounded-2xl p-6 animate-fade-up" style={{ animationDelay: "40ms" }}>
              <h3 className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                Inner Universe
              </h3>
              <EcoAvatar xp={xp} size={280} />
              <div className="mt-4 flex w-full gap-2">
                <button
                  onClick={() => setSimBoost((s) => s + 250)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-mono uppercase tracking-widest text-primary transition-all hover:bg-primary/20 hover:shadow-[0_0_16px_rgba(0,255,102,0.4)]"
                >
                  <Rocket className="h-3.5 w-3.5" />
                  {t("dash.simulate")}
                </button>
                {simBoost > 0 && (
                  <button
                    onClick={() => setSimBoost(0)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground transition-all hover:text-foreground"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {t("dash.reset_sim")}
                  </button>
                )}
              </div>
              <div className="mt-6 grid w-full grid-cols-2 gap-3 text-center">
                <div>
                  <div className="font-display text-2xl text-aurora">
                    <ImpactCounter value={credits} />
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {t("dash.credits")}
                  </div>
                </div>
                <div>
                  <div className="font-display text-2xl">
                    <ImpactCounter value={xp} />
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {t("dash.xp")}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
      <BurstLayer
        bursts={bursts}
        onDone={(id) => setBursts((b) => b.filter((x) => x.id !== id))}
      />
    </div>
  );
}

function StatCard({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <div className={`font-display text-2xl ${accent ? "text-aurora" : "text-foreground"}`}>
        <ImpactCounter value={value} />
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
