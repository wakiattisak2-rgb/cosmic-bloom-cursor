import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { uploadAvatar } from "@/lib/avatars";
import { logActivity } from "@/lib/activity";
import { UserCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: ProfileSettings,
});

function ProfileSettings() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile.data) return;
    const p = profile.data as any;
    setDisplayName(p.display_name ?? "");
    setHandle(p.handle ?? "");
    setBio(p.bio ?? "");
    setCountry(p.country ?? "");
    setAvatarUrl(p.avatar_url ?? null);
  }, [profile.data]);

  async function onAvatar(file: File | null) {
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(user.id, file);
      await (supabase.from as any)("profiles").update({ avatar_url: url }).eq("id", user.id);
      setAvatarUrl(url);
      toast.success(locale === "th" ? "อัปเดตรูปแล้ว" : "Avatar updated");
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from as any)("profiles")
        .update({
          display_name: displayName,
          handle: handle || null,
          bio: bio || null,
          country: country || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user!.id);
      if (error) throw error;
      await logActivity("profile_update");
    },
    onSuccess: () => {
      toast.success(locale === "th" ? "บันทึกแล้ว" : "Saved");
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  if (profile.isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-display text-xl">{locale === "th" ? "โปรไฟล์สาธารณะ" : "Public profile"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {locale === "th" ? "ข้อมูลที่แสดงในชุมชน" : "How you appear across the community."}
      </p>
      <div className="mt-6 flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full border border-border bg-muted/30">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserCircle className="h-10 w-10 text-muted-foreground" />
          )}
        </div>
        <label className="cursor-pointer text-xs text-primary hover:underline">
          {uploading ? "…" : locale === "th" ? "เปลี่ยนรูปโปรไฟล์" : "Change avatar"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => onAvatar(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label={locale === "th" ? "ชื่อที่แสดง" : "Display name"} value={displayName} onChange={setDisplayName} />
        <Field label="Handle" value={handle} onChange={setHandle} placeholder="stardust" prefix="@" />
        <Field label={locale === "th" ? "ประเทศ" : "Country"} value={country} onChange={setCountry} placeholder="Thailand" />
        <Field
          label={locale === "th" ? "แนะนำตัว" : "Bio"}
          value={bio}
          onChange={setBio}
          placeholder={locale === "th" ? "นักวิเคราะห์ ESG ที่..." : "ESG analyst working on…"}
          textarea
          className="sm:col-span-2"
        />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {locale === "th" ? "ID:" : "User ID:"} <span className="font-mono">{user?.id?.slice(0, 8)}…</span>
        </p>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground neon-glow disabled:opacity-60"
        >
          {save.isPending ? "Saving…" : locale === "th" ? "บันทึก" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, prefix, textarea, className = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; prefix?: string; textarea?: boolean; className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-stretch overflow-hidden rounded-lg border border-border bg-background/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
        {prefix && <span className="grid place-items-center bg-muted/40 px-3 text-sm text-muted-foreground">{prefix}</span>}
        {textarea ? (
          <textarea
            rows={3}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none"
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none"
          />
        )}
      </div>
    </label>
  );
}
