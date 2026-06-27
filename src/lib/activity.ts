import { supabase } from "@/integrations/supabase/client";

export type ActivityEvent =
  | "signin"
  | "signout"
  | "signup"
  | "profile_update"
  | "article_publish"
  | "article_view"
  | "article_like"
  | "post_create"
  | "comment_create"
  | "reward_redeem"
  | "expert_apply"
  | "page_view";

export async function logActivity(
  event: ActivityEvent | string,
  opts: { entityType?: string; entityId?: string; metadata?: Record<string, unknown> } = {},
) {
  try {
    await (supabase.rpc as any)("log_activity", {
      p_event_type: event,
      p_entity_type: opts.entityType ?? null,
      p_entity_id: opts.entityId ?? null,
      p_metadata: opts.metadata ?? {},
    });
  } catch {
    // silent — activity log must never break UX
  }
}
