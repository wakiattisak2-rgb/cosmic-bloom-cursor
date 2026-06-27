import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type AppRole = "user" | "expert" | "moderator" | "admin";

export function useRoles() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["roles", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AppRole[]> => {
      const { data, error } = await (supabase.from as any)("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) return [];
      return (data ?? []).map((r: any) => r.role as AppRole);
    },
    staleTime: 60_000,
  });
  const roles = q.data ?? [];
  return {
    roles,
    loading: q.isLoading,
    isAdmin: roles.includes("admin"),
    isModerator: roles.includes("moderator") || roles.includes("admin"),
    isExpert: roles.includes("expert"),
  };
}
