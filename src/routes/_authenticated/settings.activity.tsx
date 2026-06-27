import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/settings/activity")({
  component: ActivityPage,
});

const EVENT_LABELS_EN: Record<string, string> = {
  signup: "Joined Aetros",
  signin: "Signed in",
  signout: "Signed out",
  profile_update: "Updated profile",
  article_publish: "Published an article",
  article_view: "Read an article",
  reward_redeem: "Redeemed a reward",
  post_create: "Posted in community",
  page_view: "Viewed a page",
};
const EVENT_LABELS_TH: Record<string, string> = {
  signup: "เข้าร่วม Aetros",
  signin: "เข้าสู่ระบบ",
  signout: "ออกจากระบบ",
  profile_update: "แก้ไขโปรไฟล์",
  article_publish: "เผยแพร่บทความ",
  article_view: "อ่านบทความ",
  reward_redeem: "แลกรางวัล",
  post_create: "โพสต์ในชุมชน",
  page_view: "เปิดหน้า",
};

function ActivityPage() {
  const { user } = useAuth();
  const { locale } = useI18n();

  const q = useQuery({
    queryKey: ["activity", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase.from as any)("activity_log")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data ?? []) as Array<any>;
    },
  });

  const labels = locale === "th" ? EVENT_LABELS_TH : EVENT_LABELS_EN;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl">{locale === "th" ? "ประวัติกิจกรรม" : "Activity history"}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {locale === "th"
          ? "ทุก event ที่ระบบบันทึก (เก็บอย่างปลอดภัยและแก้ไขไม่ได้)"
          : "Every event recorded for your account — immutable for your records."}
      </p>

      <div className="mt-6 divide-y divide-border rounded-xl border border-border">
        {q.isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
        {!q.isLoading && (q.data?.length ?? 0) === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {locale === "th" ? "ยังไม่มีกิจกรรม" : "No activity yet."}
          </p>
        )}
        {q.data?.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{labels[r.event_type] ?? r.event_type}</div>
              {(r.entity_type || r.entity_id) && (
                <div className="truncate text-xs text-muted-foreground">
                  {r.entity_type}{r.entity_id ? ` · ${r.entity_id.slice(0, 12)}` : ""}
                </div>
              )}
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-[11px] text-muted-foreground">
                {new Date(r.created_at).toLocaleString(locale === "th" ? "th-TH" : "en-US")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
