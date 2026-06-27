import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Users, Activity, ShieldAlert, FileText, BadgeCheck, Gift } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useRoles } from "@/lib/roles";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Aetros" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, loading } = useRoles();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const onSetup = location.pathname.startsWith("/admin/setup");

  useEffect(() => {
    if (!loading && !isAdmin && !onSetup) {
      navigate({ to: "/admin/setup" });
    }
  }, [loading, isAdmin, navigate, onSetup]);

  if (loading) return null;

  // Setup page renders its own full layout (no sidebar)
  if (onSetup) return <Outlet />;

  const items = [
    { to: "/admin", label: locale === "th" ? "ภาพรวม" : "Overview", icon: LayoutDashboard, exact: true },
    { to: "/admin/users", label: locale === "th" ? "ผู้ใช้" : "Users", icon: Users },
    { to: "/admin/content", label: locale === "th" ? "เนื้อหา" : "Content", icon: FileText },
    { to: "/admin/experts", label: locale === "th" ? "Experts" : "Experts", icon: BadgeCheck },
    { to: "/admin/rewards", label: locale === "th" ? "รางวัล" : "Rewards", icon: Gift },
    { to: "/admin/activity", label: locale === "th" ? "บันทึก" : "Audit log", icon: Activity },
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
              <ShieldAlert className="h-3 w-3" /> Admin Console
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold">Aetros Control Room</h1>
          </div>
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
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {it.label}
                </Link>
              );
            })}
          </nav>
          <section className="min-w-0">
            {isAdmin ? <Outlet /> : null}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
