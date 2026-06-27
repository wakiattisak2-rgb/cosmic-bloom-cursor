import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

const DISMISS_KEY = "aetros.anonBanner.dismissedAt";

export function AnonymousBanner() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ts = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    // re-show after 24h
    setDismissed(Date.now() - ts < 24 * 3600 * 1000);
  }, []);

  if (!user || !(user as any).is_anonymous || dismissed) return null;

  const title = locale === "th" ? "บันทึกบัญชีของคุณ" : "Save your account";
  const body =
    locale === "th"
      ? "ตอนนี้คุณเล่นแบบ Guest อยู่ ข้อมูล XP, บทความ, และกิจกรรมจะหายถ้าออกจากระบบ — เชื่อมอีเมลเพื่อบันทึกถาวร (ฟรีช่วง Beta)"
      : "You're using Aetros as a Guest. Your XP, articles, and activity will be lost if you sign out. Link an email to keep them forever (free during Beta).";
  const cta = locale === "th" ? "บันทึกบัญชี" : "Save my account";

  return (
    <div className="border-b border-primary/30 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-2.5 sm:items-center sm:px-6">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:mt-0" />
        <div className="min-w-0 flex-1 text-xs sm:text-sm">
          <span className="font-semibold text-primary">{title} · </span>
          <span className="text-muted-foreground">{body}</span>
        </div>
        <Link
          to="/auth"
          className="hidden shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:scale-[1.02] sm:flex"
        >
          {cta}
          <ArrowRight className="h-3 w-3" />
        </Link>
        <button
          aria-label="Dismiss"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, String(Date.now()));
            setDismissed(true);
          }}
          className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
