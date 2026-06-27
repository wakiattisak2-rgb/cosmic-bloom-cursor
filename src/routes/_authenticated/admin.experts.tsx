import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Database, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { seedExpertsIfEmpty } from "@/lib/experts-db";

export const Route = createFileRoute("/_authenticated/admin/experts")({
  component: AdminExperts,
});

function AdminExperts() {
  const { locale } = useI18n();
  const isTH = locale === "th";
  const qc = useQueryClient();

  useEffect(() => {
    seedExpertsIfEmpty().catch(() => {});
  }, []);

  const apps = useQuery({
    queryKey: ["admin", "expert-applications"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("expert_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const review = useMutation({
    mutationFn: async (vars: { id: string; approve: boolean }) => {
      const { error } = await (supabase.rpc as any)("admin_review_expert_application", {
        p_application_id: vars.id,
        p_approve: vars.approve,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(isTH ? "อัปเดตแล้ว" : "Updated");
      qc.invalidateQueries({ queryKey: ["admin", "expert-applications"] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const seed = useMutation({
    mutationFn: seedExpertsIfEmpty,
    onSuccess: (n) => {
      toast.success(n ? (isTH ? `seed ${n} experts` : `Seeded ${n} experts`) : isTH ? "มีข้อมูลแล้ว" : "Already seeded");
      qc.invalidateQueries({ queryKey: ["experts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = (apps.data ?? []).filter((a: { status: string }) => a.status === "pending");

  return (
    <div className="space-y-6">
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <p className="text-sm text-muted-foreground">
          {isTH ? "อนุมัติผู้สมัคร verified expert" : "Review verified expert applications"}
        </p>
        <button
          onClick={() => seed.mutate()}
          disabled={seed.isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary/40"
        >
          <Database className="h-3.5 w-3.5" />
          {isTH ? "Seed ข้อมูล experts" : "Seed expert directory"}
        </button>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <header className="border-b border-border px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">
          {isTH ? "คำขอรอดำเนินการ" : "Pending applications"} ({pending.length})
        </header>
        {pending.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">{isTH ? "ไม่มีคำขอ" : "No pending applications."}</p>
        )}
        {pending.map((a: any) => (
          <div key={a.id} className="border-b border-border/60 px-4 py-4 last:border-0">
            <div className="font-medium">{a.headline || a.bio?.slice(0, 60) || a.user_id.slice(0, 8)}</div>
            <p className="mt-1 text-sm text-muted-foreground">{a.bio}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {(a.certs ?? []).map((c: string) => (
                <span key={c} className="rounded-full border border-primary/30 px-2 py-0.5 text-[10px] text-primary">
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => review.mutate({ id: a.id, approve: true })}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                <BadgeCheck className="h-3.5 w-3.5" />
                {isTH ? "อนุมัติ" : "Approve"}
              </button>
              <button
                onClick={() => review.mutate({ id: a.id, approve: false })}
                className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs text-destructive"
              >
                <XCircle className="h-3.5 w-3.5" />
                {isTH ? "ปฏิเสธ" : "Reject"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
