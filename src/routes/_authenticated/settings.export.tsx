import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileJson } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/settings/export")({
  component: ExportSettings,
});

function ExportSettings() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const [busy, setBusy] = useState(false);

  async function exportData() {
    if (!user) return;
    setBusy(true);
    try {
      const [profileRes, actionsRes, activityRes, postsRes, redemptionsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("actions_log").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        (supabase.from as any)("activity_log").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("redemptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (actionsRes.error) throw actionsRes.error;
      if (activityRes.error) throw activityRes.error;
      if (postsRes.error) throw postsRes.error;
      if (redemptionsRes.error) throw redemptionsRes.error;

      const payload = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        profile: profileRes.data,
        actions_log: actionsRes.data ?? [],
        activity_log: activityRes.data ?? [],
        posts: postsRes.data ?? [],
        redemptions: redemptionsRes.data ?? [],
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aetros-export-${user.id.slice(0, 8)}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(locale === "th" ? "ดาวน์โหลดแล้ว" : "Download started");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Export failed";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2">
        <FileJson className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl">{locale === "th" ? "ส่งออกข้อมูล" : "Export my data"}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {locale === "th"
          ? "ดาวน์โหลดข้อมูลของคุณเป็น JSON (โปรไฟล์, กิจกรรม, โพสต์, การแลกรางวัล)"
          : "Download your data as JSON (profile, activity, posts, redemptions)."}
      </p>
      <ul className="mt-4 list-inside list-disc text-xs text-muted-foreground">
        <li>{locale === "th" ? "โปรไฟล์และคะแนน" : "Profile and gamification stats"}</li>
        <li>{locale === "th" ? "ประวัติ eco actions" : "Eco action history"}</li>
        <li>{locale === "th" ? "Activity log" : "Activity log events"}</li>
        <li>{locale === "th" ? "โพสต์ชุมชน" : "Community posts"}</li>
      </ul>
      <button
        onClick={exportData}
        disabled={busy || !user}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground neon-glow disabled:opacity-60"
      >
        <Download className="h-4 w-4" />
        {busy
          ? locale === "th"
            ? "กำลังเตรียม…"
            : "Preparing…"
          : locale === "th"
            ? "ดาวน์โหลด JSON"
            : "Download JSON"}
      </button>
    </div>
  );
}
