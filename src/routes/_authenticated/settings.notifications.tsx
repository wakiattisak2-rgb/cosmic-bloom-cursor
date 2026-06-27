import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { logActivity } from "@/lib/activity";

type NotificationPrefs = {
  email_digest?: boolean;
  mentions?: boolean;
  replies?: boolean;
};

export const Route = createFileRoute("/_authenticated/settings/notifications")({
  component: NotificationSettings,
});

function NotificationSettings() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const qc = useQueryClient();
  const isTH = locale === "th";
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    email_digest: true,
    mentions: true,
    replies: true,
  });

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("profiles")
        .select("notification_prefs")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as { notification_prefs?: NotificationPrefs };
    },
  });

  useEffect(() => {
    if (profile.data?.notification_prefs) {
      setPrefs({ ...prefs, ...profile.data.notification_prefs });
    }
  }, [profile.data]);

  const save = useMutation({
    mutationFn: async (next: NotificationPrefs) => {
      const { error } = await (supabase.from as any)("profiles")
        .update({ notification_prefs: next, updated_at: new Date().toISOString() })
        .eq("id", user!.id);
      if (error) throw error;
      await logActivity("profile_update", { metadata: { field: "notification_prefs" } });
    },
    onSuccess: () => {
      toast.success(isTH ? "บันทึกแล้ว" : "Saved");
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed"),
  });

  function toggle(key: keyof NotificationPrefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    save.mutate(next);
  }

  if (profile.isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const items = [
    {
      key: "email_digest" as const,
      icon: Mail,
      title: isTH ? "สรุปอีเมลรายสัปดาห์" : "Weekly email digest",
      desc: isTH ? "รับสรุปกิจกรรมและบทความใหม่" : "Get a weekly summary of activity and new articles",
    },
    {
      key: "mentions" as const,
      icon: Bell,
      title: isTH ? "การกล่าวถึง" : "Mentions",
      desc: isTH ? "แจ้งเตือนเมื่อมีคนกล่าวถึงคุณ" : "Notify when someone mentions you",
    },
    {
      key: "replies" as const,
      icon: MessageSquare,
      title: isTH ? "การตอบกลับ" : "Replies",
      desc: isTH ? "แจ้งเตือนเมื่อมีคนตอบโพสต์ของคุณ" : "Notify when someone replies to your posts",
    },
  ];

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-display text-xl">{isTH ? "การแจ้งเตือน" : "Notifications"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {isTH ? "เลือกประเภทการแจ้งเตือนที่ต้องการ (Beta)" : "Choose notification types (Beta — delivery coming soon)."}
      </p>
      <div className="mt-6 space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <label
              key={item.key}
              className="flex cursor-pointer items-start gap-4 rounded-xl border border-border p-4 hover:border-primary/40"
            >
              <Icon className="mt-0.5 h-5 w-5 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{item.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={!!prefs[item.key]}
                disabled={save.isPending}
                onChange={() => toggle(item.key)}
                className="mt-1 h-4 w-4 accent-primary"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
