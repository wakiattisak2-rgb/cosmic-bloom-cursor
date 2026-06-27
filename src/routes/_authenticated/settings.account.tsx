import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, LogOut, KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/_authenticated/settings/account")({
  component: AccountSettings,
});

function AccountSettings() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const isAnon = !!(user as any)?.is_anonymous;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  async function upgrade(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ email, password });
      if (error) throw error;
      await logActivity("account_upgraded", { metadata: { from: "anonymous" } });
      toast.success(locale === "th" ? "บันทึกบัญชีเรียบร้อย ตรวจสอบอีเมลเพื่อยืนยัน" : "Account saved. Check your email to confirm.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error(locale === "th" ? "รหัสผ่านอย่างน้อย 8 ตัว" : "Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(locale === "th" ? "รหัสผ่านไม่ตรงกัน" : "Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      await logActivity("profile_update", { metadata: { field: "password" } });
      toast.success(locale === "th" ? "เปลี่ยนรหัสผ่านแล้ว" : "Password updated");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    if (deleteConfirm !== "DELETE") {
      toast.error(locale === "th" ? 'พิมพ์ DELETE เพื่อยืนยัน' : 'Type DELETE to confirm');
      return;
    }
    setBusy(true);
    try {
      const { error } = await (supabase.rpc as any)("delete_own_account");
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success(locale === "th" ? "ลบบัญชีแล้ว" : "Account deleted");
      navigate({ to: "/" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await logActivity("signout");
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="space-y-6">
      {isAnon ? (
        <form onSubmit={upgrade} className="glass glow-border rounded-2xl p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl">{locale === "th" ? "บันทึกบัญชีของคุณ" : "Save your account"}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {locale === "th"
              ? "ตอนนี้คุณเป็น Guest — เชื่อมอีเมล + รหัสผ่านเพื่อเก็บข้อมูลไว้ถาวร"
              : "You're currently a Guest. Link an email + password to keep your data permanently."}
          </p>
          <div className="mt-4 space-y-3">
            <Input icon={Mail} type="email" value={email} onChange={setEmail} placeholder="you@cosmos.app" required />
            <Input icon={KeyRound} type="password" value={password} onChange={setPassword} placeholder="••••••••" required minLength={8} />
          </div>
          <button
            disabled={busy}
            className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground neon-glow disabled:opacity-60"
          >
            {busy ? "…" : locale === "th" ? "บันทึกบัญชี" : "Save my account"}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-xl">{locale === "th" ? "บัญชี" : "Account"}</h2>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">{locale === "th" ? "อีเมล:" : "Email:"}</span>
              <span className="font-mono">{user?.email}</span>
            </div>
          </div>

          <form onSubmit={changePassword} className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg">{locale === "th" ? "เปลี่ยนรหัสผ่าน" : "Change password"}</h3>
            <div className="mt-4 space-y-3">
              <Input
                icon={KeyRound}
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder={locale === "th" ? "รหัสผ่านใหม่" : "New password"}
                required
                minLength={8}
              />
              <Input
                icon={KeyRound}
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder={locale === "th" ? "ยืนยันรหัสผ่าน" : "Confirm password"}
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {locale === "th" ? "อัปเดตรหัสผ่าน" : "Update password"}
            </button>
          </form>

          <div className="glass rounded-2xl border border-destructive/30 p-6">
            <div className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              <h3 className="font-display text-lg">{locale === "th" ? "ลบบัญชี" : "Delete account"}</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {locale === "th"
                ? "การลบถาวร — ข้อมูล XP, โพสต์ และบทความจะถูกลบทั้งหมด"
                : "Permanent deletion — all XP, posts, and articles will be removed."}
            </p>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="mt-4 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm focus:border-destructive focus:outline-none"
            />
            <button
              type="button"
              onClick={deleteAccount}
              disabled={busy}
              className="mt-3 rounded-lg border border-destructive px-4 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-60"
            >
              {locale === "th" ? "ลบบัญชีถาวร" : "Delete my account"}
            </button>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-6">
        <h3 className="font-display text-lg">{locale === "th" ? "เซสชัน" : "Session"}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {locale === "th" ? "ออกจากระบบในอุปกรณ์นี้" : "Sign out from this device."}
        </p>
        <button
          onClick={signOut}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:border-destructive hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {locale === "th" ? "ออกจากระบบ" : "Sign out"}
        </button>
      </div>
    </div>
  );
}

function Input({
  icon: Icon, type, value, onChange, placeholder, required, minLength,
}: any) {
  return (
    <div className="flex items-center rounded-lg border border-border bg-background/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
      <Icon className="ml-3 h-4 w-4 text-muted-foreground" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none"
      />
    </div>
  );
}
