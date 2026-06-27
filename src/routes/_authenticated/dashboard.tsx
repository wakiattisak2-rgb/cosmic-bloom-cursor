import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { toast } from "sonner";
import { Car, Recycle, Sprout, Zap, Sparkles, Compass, Wallet } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ImpactConstellation } from "@/components/ImpactConstellation";
import { ImpactReceiptModal } from "@/components/ImpactReceiptModal";
import { type ReceiptData } from "@/components/ImpactReceiptCard";
import { TierBadge, TierProgress } from "@/components/TierBadge";
import { ImpactCounter } from "@/components/ImpactCounter";
import { Starfield } from "@/components/Starfield";
import { BurstLayer, type Burst } from "@/components/ParticleBurst";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { computeStreak, weeklyActionSummary } from "@/lib/streak";
import { useI18n } from "@/lib/i18n";
import type { ActionLogRow } from "@/lib/constellation";
import { ECO_ACTIONS, getEcoAction } from "@/lib/eco-actions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Aetros" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    log: typeof s.log === "string" ? s.log : undefined,
  }),
  component: Dashboard,
});

const ACTIONS = ECO_ACTIONS.map((a) => ({
  ...a,
  icon: { ev_commute: Car, recycle: Recycle, tree_plant: Sprout, energy: Zap }[a.type],
}));

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
  const { t, locale, tx } = useI18n();
  const navigate = useNavigate();
  const { log: logFromCompass } = Route.useSearch();
  const qc = useQueryClient();
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const burstId = useRef(0);
  const consumedLogRef = useRef<string | null>(null);

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

  const constellationActions = useQuery({
    queryKey: ["constellation-actions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actions_log")
        .select("id, action_type, xp_awarded, credits_awarded, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as ActionLogRow[];
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
          qc.invalidateQueries({ queryKey: ["constellation-actions", user.id] });
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
      const { data: row, error } = await supabase.rpc("log_action", {
        p_action_type: a.type,
        p_xp: a.xp,
        p_credits: a.credits,
        p_note: undefined,
      });
      if (error) throw error;

      let receipt: ReceiptData | null = null;
      try {
        const { data: r } = await (supabase.from as any)("impact_receipts")
          .select("*")
          .eq("action_log_id", (row as { id: string }).id)
          .maybeSingle();
        if (r) receipt = r as ReceiptData;
      } catch {
        /* migration may not be applied yet */
      }
      return { action: a, receipt };
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
    onSuccess: ({ action: a, receipt }) => {
      void logActivity("eco_action", {
        entityType: "action",
        metadata: { action_type: a.type, xp: a.xp, credits: a.credits },
      });
      qc.invalidateQueries({ queryKey: ["actions", user?.id] });
      qc.invalidateQueries({ queryKey: ["constellation-actions", user?.id] });
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
      qc.invalidateQueries({ queryKey: ["impact"] });
      qc.invalidateQueries({ queryKey: ["receipts", user?.id] });
      if (receipt) {
        setLastReceipt(receipt);
        setReceiptOpen(true);
      }
    },
  });

  useEffect(() => {
    if (!logFromCompass || !user) return;
    if (consumedLogRef.current === logFromCompass) return;
    consumedLogRef.current = logFromCompass;
    navigate({ to: "/dashboard", search: {}, replace: true });

    const def = getEcoAction(logFromCompass);
    if (!def) return;
    const action = ACTIONS.find((a) => a.type === def.type);
    if (action) {
      logMut.mutate(action);
      toast.success(tx("Logged from Compass", "บันทึกจาก Compass แล้ว"));
    }
  }, [logFromCompass, user, navigate, logMut, tx]);

  const fireBurst = (e: MouseEvent, a: Action) => {
    const id = ++burstId.current;
    setBursts((b) => [...b, { id, x: e.clientX, y: e.clientY, label: `+${a.xp} XP`, sub: `+${a.credits} CC` }]);
  };

  const onLog = (e: MouseEvent, a: Action) => {
    fireBurst(e, a);
    logMut.mutate(a);
  };

  const trueXp = profile.data?.xp ?? 0;
  const xp = trueXp;
  const credits = profile.data?.carbon_credits ?? 0;
  const streak = computeStreak(recent.data ?? []);
  const week = weeklyActionSummary(recent.data ?? []);

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

            <div className="grid gap-3 sm:grid-cols-2 animate-fade-up" style={{ animationDelay: "40ms" }}>
              <Link
                to="/compass"
                className="glass group flex items-center gap-3 rounded-xl border border-primary/20 p-4 transition-all hover:border-primary/50 hover:shadow-[0_0_24px_rgba(0,255,102,0.15)]"
              >
                <Compass className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{tx("Find your ESG focus", "หาโฟกus ESG ของคุณ")}</p>
                  <p className="text-[11px] text-muted-foreground">{tx("ESG focus wizard", "เข็มทิศ ESG")}</p>
                </div>
              </Link>
              <Link
                to="/wallet"
                className="glass group flex items-center gap-3 rounded-xl border border-primary/20 p-4 transition-all hover:border-primary/50"
              >
                <Wallet className="h-5 w-5 text-aurora" />
                <div>
                  <p className="text-sm font-medium">{tx("Impact Wallet", "กระเป๋า Impact")}</p>
                  <p className="text-[11px] text-muted-foreground">{tx("Verified receipts", "ใบเสร็จยืนยัน")}</p>
                </div>
              </Link>
              <div className="glass rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {locale === "th" ? "สตรีครายวัน" : "Daily streak"}
                </p>
                <p className="mt-1 font-display text-3xl text-aurora">
                  {streak} {locale === "th" ? "วัน" : "days"}
                </p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {locale === "th" ? "สรุป 7 วัน" : "Weekly summary"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {week.count} {locale === "th" ? "การกระทำ" : "actions"} · +{week.xp} XP · +{week.credits} CC
                </p>
              </div>
            </div>

            {/* Action Tracker — secondary */}
            <section className="animate-fade-up" style={{ animationDelay: "80ms" }}>
              <h2 className="mb-3 flex items-center gap-2 font-display text-base text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                {t("dash.log")}
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ACTIONS.map((a) => (
                  <button
                    key={a.type}
                    disabled={logMut.isPending}
                    onClick={(e) => onLog(e, a)}
                      className="glass group relative flex flex-col items-center gap-2 overflow-hidden rounded-xl border border-border p-3 text-center transition-all hover:-translate-y-0.5 hover:border-primary/60 disabled:opacity-60"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-xl ring-1 ring-primary/30">
                        <span>{a.emoji}</span>
                      </div>
                      <div className="text-[11px] font-medium leading-tight">{t(a.labelKey as any)}</div>
                      <div className="font-mono text-[9px] uppercase tracking-wider text-aurora">
                        +{a.xp} XP
                      </div>
                    </button>
                ))}
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

          {/* Constellation hero */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="glass glow-border rounded-2xl p-4 animate-fade-up" style={{ animationDelay: "40ms" }}>
              <h3 className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
                {tx("Impact Constellation", "กลุ่มดาว Impact")}
              </h3>
              <ImpactConstellation actions={constellationActions.data ?? []} width={340} height={340} />
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
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
      <ImpactReceiptModal receipt={lastReceipt} open={receiptOpen} onClose={() => setReceiptOpen(false)} />
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
