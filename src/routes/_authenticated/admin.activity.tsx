import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/activity")({
  component: AdminActivity,
});

function AdminActivity() {
  const [eventFilter, setEventFilter] = useState<string>("");
  const q = useQuery({
    queryKey: ["admin", "activity", eventFilter],
    queryFn: async () => {
      let query: any = (supabase.from as any)("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (eventFilter) query = query.eq("event_type", eventFilter);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Array<any>;
    },
  });

  const audit = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: async () => {
      const { data } = await (supabase.from as any)("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return (data ?? []) as Array<any>;
    },
  });

  const events = ["", "signup", "signin", "signout", "profile_update", "article_publish", "reward_redeem"];

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {events.map((e) => (
            <button
              key={e || "all"}
              onClick={() => setEventFilter(e)}
              className={`rounded-full border px-3 py-1 text-xs ${
                eventFilter === e
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {e || "all"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="glass overflow-hidden rounded-2xl">
          <header className="border-b border-border px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">
            User events
          </header>
          {q.isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
          {q.data?.map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-2 border-b border-border/60 px-4 py-2.5 text-sm last:border-0">
              <div className="col-span-3 truncate">
                <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                  {r.event_type}
                </span>
              </div>
              <div className="col-span-5 truncate font-mono text-[11px] text-muted-foreground">
                {r.user_id?.slice(0, 8) ?? "—"} · {r.entity_type ?? ""} {r.entity_id ?? ""}
              </div>
              <div className="col-span-4 text-right font-mono text-[11px] text-muted-foreground">
                {new Date(r.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="glass overflow-hidden rounded-2xl">
          <header className="border-b border-border px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">
            Admin audit trail
          </header>
          {audit.isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
          {(audit.data?.length ?? 0) === 0 && !audit.isLoading && (
            <p className="p-4 text-sm text-muted-foreground">No admin actions yet.</p>
          )}
          {audit.data?.map((r) => (
            <div key={r.id} className="border-b border-border/60 px-4 py-2.5 text-sm last:border-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">
                  {r.action}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                by {r.admin_id?.slice(0, 8)} → {r.target_user_id?.slice(0, 8) ?? "—"}
                {r.reason ? ` · ${r.reason}` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
