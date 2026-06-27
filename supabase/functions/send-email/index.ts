// Supabase Edge Function: processes notification_outbox (reward_redeem emails).
// Deploy: npx supabase functions deploy send-email --no-verify-jwt
// Set RESEND_API_KEY in Supabase Dashboard → Edge Functions → Secrets.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "Aetros <noreply@aetros.app>";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: pending } = await supabase
    .from("notification_outbox")
    .select("*")
    .is("sent_at", null)
    .limit(20);

  if (!pending?.length) {
    return new Response(JSON.stringify({ processed: 0 }), { headers: { "Content-Type": "application/json" } });
  }

  let processed = 0;
  for (const row of pending) {
    const email = row.payload?.email as string | undefined;
    if (!email || !RESEND_API_KEY) continue;

    const subject =
      row.template === "reward_redeem"
        ? `Redemption confirmed: ${row.payload?.reward_title ?? "Reward"}`
        : "Notification from Aetros";

    const html =
      row.template === "reward_redeem"
        ? `<p>Your redemption of <strong>${row.payload?.reward_title}</strong> for ${row.payload?.credits_spent} CC is confirmed.</p>`
        : `<p>You have a new notification from Aetros.</p>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: email, subject, html }),
    });

    if (res.ok) {
      await supabase.from("notification_outbox").update({ sent_at: new Date().toISOString() }).eq("id", row.id);
      processed += 1;
    }
  }

  return new Response(JSON.stringify({ processed }), { headers: { "Content-Type": "application/json" } });
});
