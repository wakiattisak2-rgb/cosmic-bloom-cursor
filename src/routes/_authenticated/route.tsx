import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AnonymousBanner } from "@/components/AnonymousBanner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    let { data } = await supabase.auth.getUser();
    if (!data.user) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) console.warn("[auth] anonymous sign-in failed:", error.message);
      ({ data } = await supabase.auth.getUser());
    }
    return { user: data.user ?? null };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <>
      <AnonymousBanner />
      <Outlet />
    </>
  );
}
