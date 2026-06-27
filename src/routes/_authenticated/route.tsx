import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AnonymousBanner } from "@/components/AnonymousBanner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    let { data } = await supabase.auth.getUser();
    let user = data.user;

    if (!user) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        throw redirect({ to: "/auth", search: { redirect: location.pathname } });
      }
      ({ data } = await supabase.auth.getUser());
      user = data.user;
      if (!user) {
        throw redirect({ to: "/auth", search: { redirect: location.pathname } });
      }
    }

    const onOnboarding = location.pathname === "/onboarding";
    const isAnon = !!(user as { is_anonymous?: boolean }).is_anonymous;

    if (!isAnon && !onOnboarding) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded_at")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile?.onboarded_at) {
        throw redirect({ to: "/onboarding" });
      }
    }

    return { user };
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
