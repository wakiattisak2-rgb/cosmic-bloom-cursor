import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, FileText, Activity, Sparkles, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { tx } = useI18n();

  const stats = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [users, articles, activity, totals, dauRows, wauRow] = await Promise.all([
        (supabase.from as any)("profiles").select("id", { count: "exact", head: true }),
        (supabase.from as any)("knowledge_articles").select("id", { count: "exact", head: true }),
        (supabase.from as any)("activity_log").select("id", { count: "exact", head: true }),
        (supabase.from as any)("profiles").select("xp, carbon_credits"),
        (supabase.from as any)("admin_daily_active").select("day, dau").limit(7),
        (supabase.from as any)("admin_weekly_active").select("wau").maybeSingle(),
      ]);
      const totalXp = (totals.data ?? []).reduce((s: number, r: any) => s + (r.xp ?? 0), 0);
      const totalCredits = (totals.data ?? []).reduce((s: number, r: any) => s + (r.carbon_credits ?? 0), 0);
      const todayDau = (dauRows.data ?? [])[0]?.dau ?? 0;
      return {
        users: users.count ?? 0,
        articles: articles.count ?? 0,
        events: activity.count ?? 0,
        totalXp,
        totalCredits,
        dau: todayDau,
        wau: wauRow.data?.wau ?? 0,
        dauTrend: (dauRows.data ?? []) as { day: string; dau: number }[],
      };
    },
  });

  const cards = [
    { label: tx("Total members", "สมาชิกทั้งหมด"), value: stats.data?.users ?? 0, icon: Users },
    { label: tx("DAU (today)", "DAU วันนี้"), value: stats.data?.dau ?? 0, icon: TrendingUp },
    { label: tx("WAU (7 days)", "WAU 7 วัน"), value: stats.data?.wau ?? 0, icon: Activity },
    { label: tx("Articles published", "บทความเผยแพร่"), value: stats.data?.articles ?? 0, icon: FileText },
    { label: tx("Activity events", "เหตุการณ์กิจกรรม"), value: stats.data?.events ?? 0, icon: Activity },
    { label: tx("XP distributed", "XP ที่แจก"), value: stats.data?.totalXp ?? 0, icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="glass rounded-2xl p-5">
              <Icon className="h-4 w-4 text-primary" />
              <div className="mt-3 font-display text-3xl">{c.value.toLocaleString()}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{c.label}</div>
            </div>
          );
        })}
      </div>

      {(stats.data?.dauTrend?.length ?? 0) > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-lg">{tx("Daily active users (7 days)", "ผู้ใช้รายวัน (7 วัน)")}</h2>
          <div className="mt-4 flex items-end gap-2">
            {stats.data!.dauTrend.slice(0, 7).reverse().map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary/80"
                  style={{ height: `${Math.max(8, Math.min(80, d.dau * 4))}px` }}
                  title={`${d.dau} DAU`}
                />
                <span className="text-[9px] text-muted-foreground">
                  {new Date(d.day).toLocaleDateString(undefined, { weekday: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-lg">{tx("Carbon Credits in circulation", "Carbon Credits ในระบบ")}</h2>
        <div className="mt-3 font-display text-4xl text-aurora">
          {(stats.data?.totalCredits ?? 0).toLocaleString()} CC
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {tx("Total carbon credits issued across all members.", "Carbon credits ที่ออกให้สมาชิกทั้งหมด")}
        </p>
      </div>
    </div>
  );
}
