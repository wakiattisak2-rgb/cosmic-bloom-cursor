import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ImpactReceiptCard, type ReceiptData } from "@/components/ImpactReceiptCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({ meta: [{ title: "Impact Wallet — Aetros" }] }),
  component: WalletPage,
});

function WalletPage() {
  const { user } = useAuth();
  const { tx } = useI18n();

  const receipts = useQuery({
    queryKey: ["receipts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("impact_receipts")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ReceiptData[];
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <Wallet className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-display text-3xl">{tx("Impact Wallet", "กระเป๋า Impact")}</h1>
            <p className="text-sm text-muted-foreground">
              {tx("Verified receipts from every action you log.", "ใบเสร็จยืนยันจากทุกการกระทำที่คุณบันทึก")}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {(receipts.data ?? []).map((r) => (
            <ImpactReceiptCard key={r.id} receipt={r} compact />
          ))}
          {!receipts.isLoading && (receipts.data?.length ?? 0) === 0 && (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
              {tx("No receipts yet.", "ยังไม่มีใบเสร็จ")}{" "}
              <Link to="/dashboard" className="text-primary underline">
                {tx("Log an action", "บันทึกการกระทำ")}
              </Link>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
