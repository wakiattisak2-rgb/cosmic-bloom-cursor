import { Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, LogOut, Languages, Settings, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useRoles } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity";

export function SiteHeader() {
  const { t, locale, setLocale } = useI18n();
  const { user } = useAuth();
  const { isAdmin } = useRoles();
  const navigate = useNavigate();
  const isAnon = !!(user as any)?.is_anonymous;

  async function signOut() {
    await logActivity("signout");
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="group flex items-center gap-2">
          <span className="relative grid h-8 w-8 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/40 animate-pulse-glow">
            <Sparkles className="h-4 w-4 text-primary" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Aetros</span>
          <span className="hidden rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-primary sm:inline">
            {locale === "th" ? "ฟรีช่วง Beta" : "Free during Beta"}
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          <NavLink to="/" label={t("nav.home")} />
          <NavLink to="/dashboard" label={t("nav.dashboard")} />
          <NavLink to="/wallet" label={t("nav.wallet")} />
          <NavLink to="/knowledge" label={t("nav.knowledge")} />
          <NavLink to="/experts" label={t("nav.experts")} />
          <NavLink to="/community" label={t("nav.community")} />
          <NavLink to="/marketplace" label={t("nav.market")} />
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isAnon && (
            <span className="hidden rounded-full border border-muted bg-muted/40 px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
              Guest
            </span>
          )}

          <button
            onClick={() => setLocale(locale === "en" ? "th" : "en")}
            className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            aria-label="Toggle language"
          >
            <Languages className="h-3.5 w-3.5" />
            {locale === "en" ? "ไทย" : "EN"}
          </button>

          {isAdmin && (
            <Link
              to="/admin"
              className="hidden items-center gap-1 rounded-full border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 sm:flex"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}

          {user && (
            <Link
              to="/settings"
              className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-primary"
              aria-label="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{locale === "th" ? "ตั้งค่า" : "Settings"}</span>
            </Link>
          )}

          {user && !isAnon ? (
            <button
              onClick={signOut}
              className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-primary"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("nav.signout")}</span>
            </button>
          ) : (
            <Link
              to="/dashboard"
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-[0_0_20px_rgba(0,255,102,0.45)] transition-transform hover:scale-[1.03]"
            >
              {t("hero.cta")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "text-primary" }}
      inactiveProps={{ className: "text-muted-foreground" }}
      className="rounded-md px-3 py-1.5 text-sm transition-colors hover:text-foreground"
    >
      {label}
    </Link>
  );
}
