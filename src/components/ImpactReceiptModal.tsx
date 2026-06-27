import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { ImpactReceiptCard, type ReceiptData } from "@/components/ImpactReceiptCard";
import { useI18n } from "@/lib/i18n";

type Props = {
  receipt: ReceiptData | null;
  open: boolean;
  onClose: () => void;
};

export function ImpactReceiptModal({ receipt, open, onClose }: Props) {
  const { tx } = useI18n();
  if (!open || !receipt) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 w-full max-w-md animate-fade-up rounded-t-3xl border border-primary/30 bg-background p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-primary">
            {tx("Action verified", "ยืนยันการกระทำแล้ว")}
          </p>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <ImpactReceiptCard receipt={receipt} />
        <Link
          to="/wallet"
          onClick={onClose}
          className="mt-4 block w-full rounded-full border border-primary/40 py-2 text-center text-xs font-medium text-primary hover:bg-primary/10"
        >
          {tx("View all receipts", "ดูใบเสร็จทั้งหมด")}
        </Link>
      </div>
    </div>
  );
}
