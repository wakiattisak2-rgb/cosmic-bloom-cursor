import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/_authenticated/settings/privacy")({
  component: PrivacySettings,
});

function PrivacySettings() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const qc = useQueryClient();
  const [isPublic, setIsPublic] = useState(true);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("is_public").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (profile.data) setIsPublic(profile.data.is_public ?? true);
  }, [profile.data]);

  const save = useMutation({
    mutationFn: async (next: boolean) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_public: next, updated_at: new Date().toISOString() })
        .eq("id", user!.id);
      if (error) throw error;
      await logActivity("profile_update", { metadata: { field: "is_public", value: next } });
    },
    onSuccess: () => {
      toast.success(locale === "th" ? "บันทึกแล้ว" : "Saved");
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed"),
  });

  if (profile.isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-display text-xl">{locale === "th" ? "ความเป็นส่วนตัว" : "Privacy"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {locale === "th"
          ? "ควบคุมว่าผู้อื่นเห็นโปรไฟล์สาธารณะของคุณได้หรือไม่"
          : "Control whether others can view your public profile."}
      </p>

      <label className="mt-6 flex cursor-pointer items-start gap-4 rounded-xl border border-border p-4 transition-colors hover:border-primary/40">
        <div className="mt-0.5">
          {isPublic ? (
            <Eye className="h-5 w-5 text-primary" />
          ) : (
            <EyeOff className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium">
            {locale === "th" ? "โปรไฟล์สาธารณะ" : "Public profile"}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {locale === "th"
              ? "เมื่อเปิด ผู้ใช้คนอื่นสามารถดูโปรไฟล์ที่ /u/handle ของคุณได้"
              : "When enabled, others can view your profile at /u/your-handle."}
          </p>
        </div>
        <input
          type="checkbox"
          checked={isPublic}
          disabled={save.isPending}
          onChange={(e) => {
            const next = e.target.checked;
            setIsPublic(next);
            save.mutate(next);
          }}
          className="mt-1 h-4 w-4 accent-primary"
        />
      </label>
    </div>
  );
}
