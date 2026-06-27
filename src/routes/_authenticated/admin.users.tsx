import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, ShieldCheck, ShieldOff, UserCog, Ban, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

type Row = {
  id: string;
  display_name: string | null;
  handle: string | null;
  email: string | null;
  is_anonymous: boolean | null;
  xp: number;
  carbon_credits: number;
  roles: string[];
  suspended_at: string | null;
  created_at: string;
  event_count: number;
  article_count: number;
};

function AdminUsers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const users = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("admin_user_stats")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const filtered = (users.data ?? []).filter((u) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      u.email?.toLowerCase().includes(s) ||
      u.display_name?.toLowerCase().includes(s) ||
      u.handle?.toLowerCase().includes(s) ||
      u.id.includes(s)
    );
  });

  const grant = useMutation({
    mutationFn: async (vars: { id: string; role: string; revoke?: boolean }) => {
      const fn = vars.revoke ? "admin_revoke_role" : "admin_grant_role";
      const { error } = await (supabase.rpc as any)(fn, { p_user_id: vars.id, p_role: vars.role });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const suspend = useMutation({
    mutationFn: async (vars: { id: string; suspend: boolean }) => {
      const { error } = await (supabase.rpc as any)("admin_set_suspended", {
        p_user_id: vars.id,
        p_suspend: vars.suspend,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="glass flex items-center gap-2 rounded-xl px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by email, name, handle, id…"
          className="w-full bg-transparent text-sm focus:outline-none"
        />
        <span className="font-mono text-xs text-muted-foreground">{filtered.length}</span>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="grid grid-cols-12 gap-2 border-b border-border px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          <div className="col-span-4">User</div>
          <div className="col-span-2">Roles</div>
          <div className="col-span-1 text-right">XP</div>
          <div className="col-span-1 text-right">CC</div>
          <div className="col-span-1 text-right">Posts</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>
        {users.isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
        {filtered.map((u) => {
          const isAdmin = u.roles?.includes("admin");
          return (
            <div key={u.id} className="grid grid-cols-12 items-center gap-2 border-b border-border/60 px-4 py-3 text-sm last:border-0">
              <div className="col-span-4 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{u.display_name ?? "—"}</span>
                  {u.is_anonymous && (
                    <span className="rounded-full bg-muted px-1.5 text-[9px] uppercase text-muted-foreground">Guest</span>
                  )}
                  {u.suspended_at && (
                    <span className="rounded-full bg-destructive/20 px-1.5 text-[9px] uppercase text-destructive">Suspended</span>
                  )}
                </div>
                <div className="truncate font-mono text-[11px] text-muted-foreground">{u.email ?? u.id.slice(0, 12)}</div>
              </div>
              <div className="col-span-2 flex flex-wrap gap-1">
                {(u.roles ?? []).map((r) => (
                  <span key={r} className="rounded-full border border-primary/40 bg-primary/10 px-1.5 text-[10px] text-primary">{r}</span>
                ))}
              </div>
              <div className="col-span-1 text-right font-mono text-xs">{u.xp}</div>
              <div className="col-span-1 text-right font-mono text-xs text-aurora">{u.carbon_credits}</div>
              <div className="col-span-1 text-right font-mono text-xs">{u.article_count}</div>
              <div className="col-span-3 flex justify-end gap-1.5">
                {!isAdmin ? (
                  <IconBtn title="Grant admin" onClick={() => grant.mutate({ id: u.id, role: "admin" })}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </IconBtn>
                ) : (
                  <IconBtn title="Revoke admin" onClick={() => grant.mutate({ id: u.id, role: "admin", revoke: true })}>
                    <ShieldOff className="h-3.5 w-3.5" />
                  </IconBtn>
                )}
                {!u.roles?.includes("expert") ? (
                  <IconBtn title="Grant expert" onClick={() => grant.mutate({ id: u.id, role: "expert" })}>
                    <UserCog className="h-3.5 w-3.5" />
                  </IconBtn>
                ) : (
                  <IconBtn title="Revoke expert" onClick={() => grant.mutate({ id: u.id, role: "expert", revoke: true })}>
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </IconBtn>
                )}
                {!u.suspended_at ? (
                  <IconBtn title="Suspend" danger onClick={() => suspend.mutate({ id: u.id, suspend: true })}>
                    <Ban className="h-3.5 w-3.5" />
                  </IconBtn>
                ) : (
                  <IconBtn title="Unsuspend" onClick={() => suspend.mutate({ id: u.id, suspend: false })}>
                    <Check className="h-3.5 w-3.5" />
                  </IconBtn>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-md border px-2 py-1 transition-colors ${
        danger
          ? "border-border text-muted-foreground hover:border-destructive hover:text-destructive"
          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}
