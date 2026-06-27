import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

const CONSENT_KEY = "aetros.cookie.consent";

export function CookieConsent() {
  const { locale } = useI18n();
  const isTH = locale === "th";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setVisible(!localStorage.getItem(CONSENT_KEY));
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border/80 bg-background/95 p-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground sm:text-sm">
          {isTH
            ? "เราใช้ cookies เพื่อ session และการวิเคราะห์ที่จำเป็น "
            : "We use essential cookies for session and analytics. "}
          <Link to="/legal/cookies" className="text-primary hover:underline">
            {isTH ? "นโยบาย cookies" : "Cookie policy"}
          </Link>
        </p>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(CONSENT_KEY, "1");
            setVisible(false);
          }}
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
        >
          {isTH ? "ยอมรับ" : "Accept"}
        </button>
      </div>
    </div>
  );
}
