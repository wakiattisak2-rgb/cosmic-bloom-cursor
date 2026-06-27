import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { co2EstimateKg } from "@/lib/constellation";

export type ReceiptData = {
  id: string;
  verification_id: string;
  payload: {
    action_type?: string;
    xp_awarded?: number;
    credits_awarded?: number;
    created_at?: string;
  };
  created_at: string;
};

export function ImpactReceiptCard({ receipt, compact = false }: { receipt: ReceiptData; compact?: boolean }) {
  const { locale, tx } = useI18n();
  const p = receipt.payload;
  const action = p.action_type ?? "action";
  const xp = p.xp_awarded ?? 0;
  const credits = p.credits_awarded ?? 0;
  const when = p.created_at ?? receipt.created_at;

  const copyId = () => {
    void navigator.clipboard.writeText(receipt.verification_id);
    toast.success(tx("Copied", "คัดลอกแล้ว"));
  };

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-background to-[#00E5FF]/10 ${compact ? "p-4" : "p-6"}`}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />
      <p className="text-[10px] uppercase tracking-[0.2em] text-primary">
        {tx("Impact Receipt", "ใบเสร็จผลกระทบ")}
      </p>
      <h3 className="mt-2 font-display text-xl capitalize">{action.replace(/_/g, " ")}</h3>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">XP</span>
          <div className="font-mono text-primary">+{xp}</div>
        </div>
        <div>
          <span className="text-muted-foreground">CC</span>
          <div className="font-mono text-aurora">+{credits}</div>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">CO₂ est.</span>
          <div className="font-mono">~{co2EstimateKg(action).toFixed(1)} kg</div>
        </div>
      </div>
      <p className="mt-3 font-mono text-[10px] text-muted-foreground">{receipt.verification_id}</p>
      <p className="text-[10px] text-muted-foreground">
        {new Date(when).toLocaleString(locale === "th" ? "th-TH" : "en-US")}
      </p>
      {!compact && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={copyId}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-border py-1.5 text-xs hover:border-primary/40"
          >
            <Copy className="h-3 w-3" />
            {tx("Copy ID", "คัดลอก ID")}
          </button>
        </div>
      )}
    </article>
  );
}
