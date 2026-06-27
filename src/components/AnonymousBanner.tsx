import { Link } from "@tanstack/react-router";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

const DISMISS_KEY = "aetros.anonBanner.dismissedAt";

export function AnonymousBanner() {
  const { user } = useAuth();
  const { tx } = useI18n();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ts = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    setDismissed(Date.now() - ts < 24 * 3600 * 1000);
  }, []);

  if (!user || !(user as { is_anonymous?: boolean }).is_anonymous || dismissed) return null;

  return (
    <div className="border-b border-primary/20 bg-primary/5">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6">
        <p className="min-w-0 flex-1 text-xs text-muted-foreground">
          {tx(
            "Guest mode — link an email anytime to save your XP.",
            "โหมด Guest — เชื่อมอีเมลเมื่อไหร่ก็ได้เพื่อเก็บ XP",
          )}
        </p>
        <Link
          to="/auth"
          className="hidden shrink-0 items-center gap-1 rounded-full border border-primary/40 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 sm:flex"
        >
          {tx("Save account", "บันทึกบัญชี")}
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
