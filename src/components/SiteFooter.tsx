import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-background/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/40">
            <Sparkles className="h-4 w-4 text-primary" />
          </span>
          <div>
            <div className="font-display text-base font-semibold">Aetros</div>
            <div className="text-xs text-muted-foreground">The Universe Begins Within You.</div>
          </div>
        </div>
        <nav className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link to="/legal/privacy" className="hover:text-primary">
            Privacy
          </Link>
          <Link to="/legal/terms" className="hover:text-primary">
            Terms
          </Link>
          <Link to="/legal/cookies" className="hover:text-primary">
            Cookies
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Aetros — Built for an ESG community without borders.
        </p>
      </div>
    </footer>
  );
}
