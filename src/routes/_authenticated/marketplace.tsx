import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Trees, Leaf, Gift, Star, Award, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ImpactCounter } from "@/components/ImpactCounter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { canPerformActions, memberRequiredMessage } from "@/lib/member";
import { queueRedemptionEmail } from "@/lib/notifications";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace — Aetros" }] }),
  component: Marketplace,
});

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles, trees: Trees, leaf: Leaf, gift: Gift, star: Star, badge: Award,
};

function Marketplace() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const qc = useQueryClient();
  const [receipt, setReceipt] = useState<{ title: string; cost: number } | null>(null);

  const rewards = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rewards").select("*").order("cost");
      if (error) throw error;
      return data ?? [];
    },
  });

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const balance = profile.data?.carbon_credits ?? 0;

  const redeem = useMutation({
    mutationFn: async (r: { id: string; title: string; cost: number }) => {
      if (!canPerformActions(user)) throw new Error(memberRequiredMessage(locale));
      const { error } = await supabase.rpc("redeem_reward", { p_reward_id: r.id });
      if (error) throw error;
      return r;
    },
    onSuccess: (r) => {
      void logActivity("reward_redeem", {
        entityType: "reward",
        entityId: r.id,
        metadata: { cost: r.cost, title: r.title },
      });
      void queueRedemptionEmail(user!.id, {
        rewardTitle: r.title,
        cost: r.cost,
        email: user?.email,
      });
      setReceipt({ title: r.title, cost: r.cost });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <header className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-medium sm:text-4xl">{t("market.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("market.subtitle")}</p>
          </div>
          <div className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {t("market.balance")}
            </div>
            <div className="font-display text-xl text-aurora">
              <ImpactCounter value={balance} /> CC
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.data?.map((r) => {
            const Icon = ICONS[r.icon] ?? Sparkles;
            const ok = balance >= r.cost;
            return (
              <article
                key={r.id}
                className="glass glow-border group flex flex-col rounded-2xl p-5 transition-all hover:-translate-y-1"
              >
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">
                  {locale === "th" && r.title_th ? r.title_th : r.title}
                </h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">
                  {locale === "th" && r.description_th ? r.description_th : r.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-sm text-primary">{r.cost} CC</span>
                  <button
                    disabled={!ok || redeem.isPending}
                    onClick={() => redeem.mutate({ id: r.id, title: r.title, cost: r.cost })}
                    className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground neon-glow disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                  >
                    {ok ? t("market.redeem") : t("market.insufficient")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </main>
      <SiteFooter />

      {receipt && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur"
          onClick={() => setReceipt(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass glow-border w-full max-w-sm rounded-2xl p-8 text-center"
          >
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/40 animate-pulse-glow">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mt-4 font-display text-2xl">{t("market.redeemed")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{receipt.title}</p>
            <p className="mt-1 font-mono text-xs text-primary">−{receipt.cost} CC</p>
            <button
              onClick={() => setReceipt(null)}
              className="mt-6 w-full rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
