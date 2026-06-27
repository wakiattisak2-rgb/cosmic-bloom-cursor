import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { User, Activity, Shield } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AnonymousBanner } from "@/components/AnonymousBanner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Aetros" }] }),
  component: SettingsLayout,
});

function SettingsLayout() {
  const { locale } = useI18n();
  const items = [
    { to: "/settings", label: locale === "th" ? "โปรไฟล์" : "Profile", icon: User, exact: true },
    { to: "/settings/activity", label: locale === "th" ? "ประวัติกิจกรรม" : "Activity", icon: Activity },
    { to: "/settings/account", label: locale === "th" ? "บัญชี & ความปลอดภัย" : "Account & Security", icon: Shield },
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <AnonymousBanner />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Account</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">{locale === "th" ? "ตั้งค่า" : "Settings"}</h1>
        </header>
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <nav className="space-y-1">
            {items.map((it) => {
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  activeOptions={{ exact: it.exact }}
                  activeProps={{ className: "bg-primary/10 text-primary border-primary/40" }}
                  inactiveProps={{ className: "text-muted-foreground border-transparent" }}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {it.label}
                </Link>
              );
            })}
          </nav>
          <section className="min-w-0">
            <Outlet />
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
