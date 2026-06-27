import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, Send, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRoles } from "@/lib/roles";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/experts/lens")({
  head: () => ({ meta: [{ title: "Expert Lens — Aetros" }] }),
  component: ExpertLensPage,
});

type LensRequest = {
  id: string;
  expert_id: string;
  body: string;
  status: string;
  response_text: string | null;
  created_at: string;
  answered_at: string | null;
};

function ExpertLensPage() {
  const { user } = useAuth();
  const { isAdmin } = useRoles();
  const { tx } = useI18n();
  const qc = useQueryClient();
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});

  const requests = useQuery({
    queryKey: ["lens-requests", user?.id, isAdmin],
    enabled: !!user,
    queryFn: async () => {
      let q = (supabase.from as any)("expert_lens_requests").select("*").order("created_at", { ascending: false }).limit(30);
      if (!isAdmin) q = q.eq("user_id", user!.id);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as LensRequest[];
    },
  });

  const answer = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const { error } = await (supabase.from as any)("expert_lens_requests")
        .update({ status: "answered", response_text: text, answered_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(tx("Reply sent", "ส่งคำตอบแล้ว"));
      qc.invalidateQueries({ queryKey: ["lens-requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pendingAdmin = (requests.data ?? []).filter((r) => r.status === "pending");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <Eye className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-display text-3xl">{tx("Expert Lens", "Expert Lens")}</h1>
            <p className="text-sm text-muted-foreground">
              {tx("Your ESG questions and expert insights.", "คำถาม ESG และคำตอบจากผู้เชี่ยวชาญ")}
            </p>
          </div>
        </div>

        {isAdmin && pendingAdmin.length > 0 && (
          <section className="mb-8 glass rounded-2xl p-5">
            <h2 className="text-sm font-medium text-primary">{tx("Pending (admin)", "รอตอบ (admin)")}</h2>
            <div className="mt-4 space-y-4">
              {pendingAdmin.map((r) => (
                <div key={r.id} className="rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground">Expert: {r.expert_id}</p>
                  <p className="mt-2 text-sm">{r.body}</p>
                  <textarea
                    value={replyDraft[r.id] ?? ""}
                    onChange={(e) => setReplyDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                    rows={3}
                    placeholder={tx("Expert reply…", "คำตอบจาก expert…")}
                    className="mt-3 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={!replyDraft[r.id]?.trim() || answer.isPending}
                    onClick={() => answer.mutate({ id: r.id, text: replyDraft[r.id]! })}
                    className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" />
                    {tx("Send reply", "ส่งคำตอบ")}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="space-y-4">
          {(requests.data ?? []).map((r) => (
            <article key={r.id} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{new Date(r.created_at).toLocaleDateString()}</span>
                <span className={r.status === "answered" ? "text-primary" : ""}>{r.status}</span>
              </div>
              {r.status === "answered" && r.response_text ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/60 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {tx("Your question", "คำถามของคุณ")}
                    </p>
                    <p className="mt-2 text-sm">{r.body}</p>
                  </div>
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-primary">
                      {tx("Expert insight", "มุมมอง expert")}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">{r.response_text}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm">{r.body}</p>
              )}
              {r.status === "answered" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {["ev_commute", "recycle", "tree_plant"].map((a) => (
                    <Link
                      key={a}
                      to="/dashboard"
                      className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary"
                    >
                      <Sparkles className="h-3 w-3" />
                      {tx("Log", "บันทึก")} {a.replace("_", " ")}
                    </Link>
                  ))}
                </div>
              )}
            </article>
          ))}
          {!requests.isLoading && (requests.data?.length ?? 0) === 0 && (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
              {tx("No lens requests yet.", "ยังไม่มีคำถาม")}{" "}
              <Link to="/experts" className="text-primary underline">
                {tx("Browse experts", "ดูผู้เชี่ยวชาญ")}
              </Link>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
