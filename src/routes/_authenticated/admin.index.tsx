import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, FileText, Activity, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const stats = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [users, articles, activity, totals] = await Promise.all([
        (supabase.from as any)("profiles").select("id", { count: "exact", head: true }),
        (supabase.from as any)("knowledge_articles").select("id", { count: "exact", head: true }),
        (supabase.from as any)("activity_log").select("id", { count: "exact", head: true }),
        (supabase.from as any)("profiles").select("xp, carbon_credits"),
      ]);
      const totalXp = (totals.data ?? []).reduce((s: number, r: any) => s + (r.xp ?? 0), 0);
      const totalCredits = (totals.data ?? []).reduce((s: number, r: any) => s + (r.carbon_credits ?? 0), 0);
      return {
        users: users.count ?? 0,
        articles: articles.count ?? 0,
        events: activity.count ?? 0,
        totalXp,
        totalCredits,
      };
    },
  });

  const cards = [
    { label: "Total members", value: stats.data?.users ?? 0, icon: Users },
    { label: "Articles published", value: stats.data?.articles ?? 0, icon: FileText },
    { label: "Activity events", value: stats.data?.events ?? 0, icon: Activity },
    { label: "XP distributed", value: stats.data?.totalXp ?? 0, icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-lg">Carbon Credits in circulation</h2>
        <div className="mt-3 font-display text-4xl text-aurora">
          {(stats.data?.totalCredits ?? 0).toLocaleString()} CC
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Total carbon credits issued across all members.
        </p>
      </div>
    </div>
  );
}
