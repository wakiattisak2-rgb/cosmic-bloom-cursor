import type { User } from "@supabase/supabase-js";

/** When true, guests can post/redeem/publish without email verification. */
export const EARLY_ACCESS_MODE = true;

export function isAnonymousUser(user: User | null | undefined): boolean {
  return !!(user as { is_anonymous?: boolean } | null)?.is_anonymous;
}

/** Verified email/password or OAuth member (not guest). */
export function isVerifiedMember(user: User | null | undefined): boolean {
  if (!user || isAnonymousUser(user)) return false;
  if (user.email_confirmed_at) return true;
  const providers = user.app_metadata?.providers as string[] | undefined;
  return Array.isArray(providers) && providers.some((p) => p === "google" || p === "github");
}

/** Whether the user may perform gated actions (post, redeem, publish, etc.). */
export function canPerformActions(user: User | null | undefined): boolean {
  if (!user) return false;
  if (EARLY_ACCESS_MODE) return true;
  return isVerifiedMember(user);
}

export function memberRequiredMessage(locale: "en" | "th"): string {
  return locale === "th"
    ? "กรุณาบันทึกบัญชีและยืนยันอีเมลก่อนทำรายการนี้"
    : "Save your account and verify your email before doing this.";
}
