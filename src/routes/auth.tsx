import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { useI18n } from "@/lib/i18n";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/dashboard",
  }),
  head: () => ({
    meta: [
      { title: "Save account — Aetros" },
      { name: "description", content: "Save your Aetros progress with an email or Google account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t, locale, tx } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const isAnon = !!(user as { is_anonymous?: boolean })?.is_anonymous;

  useEffect(() => {
    if (user && !isAnon) navigate({ to: redirect as "/" });
  }, [user, isAnon, navigate, redirect]);

  async function signInWithGoogle() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}${redirect}` },
      });
      if (error) throw error;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isAnon) {
        const { error } = await supabase.auth.updateUser({
          email,
          password,
          data: { display_name: name || email.split("@")[0], locale },
        });
        if (error) throw error;
        await logActivity("account_upgraded", { metadata: { from: "anonymous" } });
        toast.success(
          tx("Account saved. Check your email to confirm.", "บันทึกบัญชีแล้ว ตรวจสอบอีเมลเพื่อยืนยัน"),
        );
        navigate({ to: redirect as "/" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name || email.split("@")[0], locale },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        toast.success(tx("Welcome to Aetros", "ยินดีต้อนรับสู่ Aetros"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await logActivity("signin");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  const title = isAnon
    ? tx("Save your progress", "บันทึกความคืบหน้า")
    : t("auth.title");
  const subtitle = isAnon
    ? tx("Link an email to keep your XP and activity.", "เชื่อมอีเมลเพื่อเก็บ XP และกิจกรรมของคุณ")
    : t("auth.subtitle");
  const submitLabel = isAnon
    ? tx("Save account", "บันทึกบัญชี")
    : mode === "signin"
      ? t("auth.signin")
      : t("auth.signup");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto flex max-w-md flex-col items-center px-4 pb-16 pt-12 sm:pt-20">
        <div className="mb-6 grid h-12 w-12 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/40 animate-pulse-glow">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-medium">{title}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">{subtitle}</p>

        <form
          onSubmit={onSubmit}
          className="glass glow-border mt-8 w-full space-y-3 rounded-2xl p-6"
        >
          {(isAnon || mode === "signup") && (
            <Field
              label={t("auth.name")}
              type="text"
              value={name}
              onChange={setName}
              placeholder="Stardust Pioneer"
            />
          )}
          <Field
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@cosmos.app"
            required
          />
          <Field
            label={t("auth.password")}
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            required
            minLength={6}
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground neon-glow disabled:opacity-50"
          >
            {loading ? t("common.loading") : submitLabel}
          </button>
          {!isAnon && (
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-primary"
            >
              {mode === "signin" ? t("auth.switch_to_signup") : t("auth.switch_to_signin")}
            </button>
          )}
        </form>

        <div className="my-4 flex w-full items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {tx("or", "หรือ")}
          <span className="h-px flex-1 bg-border" />
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={signInWithGoogle}
          className="w-full rounded-full border border-border bg-background/60 py-2.5 text-sm font-medium hover:border-primary/50 disabled:opacity-50"
        >
          {tx("Continue with Google", "เข้าสู่ระบบด้วย Google")}
        </button>

        {isAnon && (
          <button
            type="button"
            onClick={() => navigate({ to: redirect as "/" })}
            className="mt-4 text-xs text-muted-foreground hover:text-primary"
          >
            {tx("Continue exploring as Guest", "เล่นต่อแบบ Guest")}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label, type, value, onChange, placeholder, required, minLength,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean; minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}
