import { supabase } from "@/integrations/supabase/client";

export async function queueRedemptionEmail(
  userId: string,
  payload: { rewardTitle: string; cost: number; email?: string | null },
) {
  const { error } = await (supabase.from as any)("notification_outbox").insert({
    user_id: userId,
    channel: "email",
    template: "reward_redeem",
    payload: {
      reward_title: payload.rewardTitle,
      credits_spent: payload.cost,
      email: payload.email ?? undefined,
    },
  });
  if (error && !error.message.includes("notification_outbox")) throw error;
}
