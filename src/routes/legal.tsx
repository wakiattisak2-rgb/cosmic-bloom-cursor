import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/legal")({
  component: LegalLayout,
});

function LegalLayout() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <nav className="mb-8 flex flex-wrap gap-4 text-sm">
          <Link to="/legal/privacy" className="text-muted-foreground hover:text-primary">
            Privacy
          </Link>
          <Link to="/legal/terms" className="text-muted-foreground hover:text-primary">
            Terms
          </Link>
          <Link to="/legal/cookies" className="text-muted-foreground hover:text-primary">
            Cookies
          </Link>
        </nav>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
