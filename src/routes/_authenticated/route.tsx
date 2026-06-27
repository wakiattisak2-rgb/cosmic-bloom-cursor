import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) return { user: data.user };
    // Auto-provision an anonymous session so the app is usable without sign-in
    const { data: anon, error } = await supabase.auth.signInAnonymously();
    if (error || !anon.user) throw redirect({ to: "/auth" });
    return { user: anon.user };
  },
  component: () => <Outlet />,
});
