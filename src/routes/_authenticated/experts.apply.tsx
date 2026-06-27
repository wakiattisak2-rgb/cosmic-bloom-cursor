import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, BadgeCheck, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { canPerformActions, memberRequiredMessage } from "@/lib/member";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/experts/apply")({
  head: () => ({ meta: [{ title: "Apply as Expert — Aetros" }] }),
  component: ExpertApplyPage,
});

function ExpertApplyPage() {
  const { user } = useAuth();
  const { t, tx, locale } = useI18n();
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [certs, setCerts] = useState("");

  const existing = useQuery({
    queryKey: ["expert-application", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase.from as any)("expert_applications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!canPerformActions(user)) throw new Error(memberRequiredMessage(locale));
      const certList = certs
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      const { error } = await (supabase.from as any)("expert_applications").insert({
        user_id: user!.id,
        headline: headline.trim(),
        bio: bio.trim(),
        certs: certList,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(tx("Application submitted.", "ส่งคำขอแล้ว"));
      existing.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = existing.data?.status === "pending";
  const approved = existing.data?.status === "approved";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <Link
          to="/experts"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("nav.experts")}
        </Link>

        <h1 className="font-display text-3xl font-semibold">
          {tx("Apply as verified expert", "สมัครเป็น verified expert")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {tx(
            "Share your ESG credentials. Our team reviews applications within a few business days.",
            "แชร์ certification ESG ของคุณ ทีมงานจะตรวจสอบภายในไม่กี่วันทำการ",
          )}
        </p>

        {approved && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm text-primary">
            <BadgeCheck className="h-5 w-5 shrink-0" />
            {tx("You are a verified expert.", "คุณเป็น verified expert แล้ว")}
          </div>
        )}

        {pending && (
          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            {tx("Your application is under review.", "คำขอของคุณอยู่ระหว่างตรวจสอบ")}
          </div>
        )}

        {!pending && !approved && (
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!headline.trim() || !bio.trim()) {
                toast.error(tx("Headline and bio are required.", "กรุณากรอกหัวข้อและประวัติ"));
                return;
              }
              submit.mutate();
            }}
          >
            <Field label={tx("Professional headline", "หัวข้อวิชาชีพ")}>
              <input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary/50"
                placeholder={tx("e.g. GRI-certified sustainability consultant", "เช่น GRI-certified sustainability consultant")}
              />
            </Field>
            <Field label={tx("Bio", "ประวัติ")}>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                className="w-full resize-none rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
            </Field>
            <Field label={tx("Certifications (comma separated)", "Certifications (คั่นด้วยจุลภาค)")}>
              <input
                value={certs}
                onChange={(e) => setCerts(e.target.value)}
                className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary/50"
                placeholder="GRI, SBTi, CDP"
              />
            </Field>
            <button
              type="submit"
              disabled={submit.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {tx("Submit application", "ส่งคำขอ")}
            </button>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
