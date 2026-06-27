import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Eye, Upload } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { getExpertById } from "@/lib/experts-db";

export const Route = createFileRoute("/_authenticated/experts/$id/lens")({
  loader: async ({ params }) => {
    const expert = await getExpertById(params.id);
    return { expert };
  },
  head: () => ({ meta: [{ title: "Ask Expert Lens — Aetros" }] }),
  component: AskLensPage,
});

const LENS_COST = 50;

function AskLensPage() {
  const { expert } = Route.useLoaderData();
  const { id: expertId } = Route.useParams();
  const { user } = useAuth();
  const { locale, tx } = useI18n();
  const navigate = useNavigate();
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const isTH = locale === "th";
  const name = isTH ? expert?.name_th : expert?.name_en;

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (body.trim().length < 10) throw new Error(tx("Question too short", "คำถามสั้นเกินไป"));

      const { data: prof } = await supabase.from("profiles").select("carbon_credits").eq("id", user.id).single();
      if ((prof?.carbon_credits ?? 0) < LENS_COST) {
        throw new Error(tx(`Need ${LENS_COST} CC`, `ต้องมี ${LENS_COST} CC`));
      }

      let attachment_url: string | null = null;
      if (file) {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("lens-uploads").upload(path, file);
        if (upErr) throw upErr;
        attachment_url = path;
      }

      const { error } = await (supabase.from as any)("expert_lens_requests").insert({
        user_id: user.id,
        expert_id: expertId,
        body: body.trim(),
        attachment_url,
        credits_cost: LENS_COST,
      });
      if (error) throw error;

      await supabase
        .from("profiles")
        .update({ carbon_credits: (prof!.carbon_credits ?? 0) - LENS_COST })
        .eq("id", user.id);
    },
    onSuccess: () => {
      toast.success(tx("Question sent!", "ส่งคำถามแล้ว!"));
      navigate({ to: "/experts/lens" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!expert) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <p>{tx("Expert not found", "ไม่พบ expert")}</p>
          <Link to="/experts" className="mt-4 inline-block text-primary">
            ← {tx("Back", "กลับ")}
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <Link
          to="/experts/$id"
          params={{ id: expertId }}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {name}
        </Link>

        <div className="mb-6 flex items-center gap-2 text-primary">
          <Eye className="h-5 w-5" />
          <h1 className="font-display text-2xl">{tx("Ask Lens", "Ask Lens")}</h1>
        </div>

        <div className="glass glow-border space-y-4 rounded-2xl p-6">
          <p className="text-sm text-muted-foreground">
            {tx(
              `Describe your ESG challenge. Cost: ${LENS_COST} CC.`,
              `อธิบายความท้าทาย ESG ของคุณ ค่าใช้จ่าย: ${LENS_COST} CC`,
            )}
          </p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder={tx("What should we focus on?", "ควรโฟกus อะไร?")}
            className="w-full rounded-xl border border-border bg-background/60 px-3 py-2 text-sm"
          />
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground hover:border-primary/40">
            <Upload className="h-4 w-4" />
            {file ? file.name : tx("Optional attachment", "ไฟล์แนบ (ไม่บังคับ)")}
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <button
            type="button"
            disabled={submit.isPending || body.trim().length < 10}
            onClick={() => submit.mutate()}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {tx("Submit question", "ส่งคำถาม")}
          </button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
