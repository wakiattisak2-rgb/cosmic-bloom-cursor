import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRoles } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/admin/setup")({
  head: () => ({ meta: [{ title: "Admin setup — Aetros" }] }),
  component: AdminSetup,
});

function AdminSetup() {
  const { user } = useAuth();
  const { isAdmin, loading } = useRoles();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const isAnon = !!(user as any)?.is_anonymous;

  async function claim() {
    setBusy(true);
    try {
      const { data, error } = await (supabase.rpc as any)("claim_first_admin");
      if (error) throw error;
      if (data === true) {
        toast.success("You are now admin");
        navigate({ to: "/admin" });
      } else {
        toast.error("An admin already exists. Ask them to grant you the role.");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="glass glow-border rounded-2xl p-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/40 animate-pulse-glow">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-display text-2xl">Admin Bootstrap</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The first registered user can claim admin to set up the project. Only available while no admin exists.
          </p>

          {loading ? null : isAdmin ? (
            <button
              onClick={() => navigate({ to: "/admin" })}
              className="mt-6 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground neon-glow"
            >
              Open Admin Console
            </button>
          ) : (
            <>
              {isAnon && (
                <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  You're signed in as Guest. For security, please save your account first
                  (Settings → Account) before claiming admin.
                </p>
              )}
              <button
                onClick={claim}
                disabled={busy || isAnon}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground neon-glow disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {busy ? "…" : "Claim admin role"}
              </button>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
