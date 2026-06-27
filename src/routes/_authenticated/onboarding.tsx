import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Check, Compass, Sparkles, Target, User } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — Aetros" }] }),
  component: Onboarding,
});

const INTERESTS = [
  "climate",
  "carbon",
  "reporting",
  "governance",
  "social",
  "supply_chain",
  "biodiversity",
  "energy",
] as const;

const ROLES = [
  { id: "student", en: "Student / Learner", th: "นักเรียน / ผู้เรียนรู้" },
  { id: "analyst", en: "ESG Analyst", th: "นักวิเคราะห์ ESG" },
  { id: "manager", en: "Sustainability Manager", th: "ผู้จัดการความยั่งยืน" },
  { id: "executive", en: "Executive / Founder", th: "ผู้บริหาร / ผู้ก่อตั้ง" },
  { id: "consultant", en: "Consultant", th: "ที่ปรึกษา" },
  { id: "other", en: "Other", th: "อื่นๆ" },
] as const;

const GOALS = [
  { id: "learn", en: "Learn ESG fundamentals", th: "เรียนรู้พื้นฐาน ESG" },
  { id: "report", en: "Improve reporting", th: "พัฒนาการรายงาน" },
  { id: "community", en: "Join the community", th: "เข้าร่วมชุมชน" },
  { id: "impact", en: "Track personal impact", th: "ติดตามผลกระทบส่วนตัว" },
] as const;

function Onboarding() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const isTH = locale === "th";
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [role, setRole] = useState("");
  const [goal, setGoal] = useState("");
  const [country, setCountry] = useState("");
  const [busy, setBusy] = useState(false);

  function toggleInterest(id: string) {
    setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function finish() {
    if (!user || interests.length === 0 || !role || !goal) {
      toast.error(isTH ? "กรุณากรอกข้อมูลให้ครบ" : "Please complete all steps");
      return;
    }
    setBusy(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          interests,
          country: country.trim() || null,
          onboarded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (profileError) throw profileError;

      const { error: xpError } = await supabase.rpc("log_action", {
        p_action_type: "onboarding_complete",
        p_xp: 50,
        p_credits: 0,
        p_note: JSON.stringify({ role, goal }),
      });
      if (xpError) throw xpError;

      await logActivity("profile_update", {
        metadata: { onboarding: true, role, goal, interests },
      });

      toast.success(isTH ? "ยินดีต้อนรับ! +50 XP" : "Welcome aboard! +50 XP");
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  const steps = [
    { icon: Compass, title: isTH ? "ความสนใจ" : "Interests", sub: isTH ? "เลือกหัวข้อ ESG ที่คุณสนใจ" : "Pick ESG topics you care about" },
    { icon: User, title: isTH ? "บทบาท" : "Your role", sub: isTH ? "คุณทำงานด้านไหน" : "What best describes you" },
    { icon: Target, title: isTH ? "เป้าหมาย" : "Goals", sub: isTH ? "คุณมา Aetros เพื่ออะไร" : "What brings you to Aetros" },
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" />
            {isTH ? "เริ่มต้นใช้งาน" : "Getting started"}
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold">
            {isTH ? "ยินดีต้อนรับสู่ Aetros" : "Welcome to Aetros"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isTH ? "ตอบ 3 คำถามสั้นๆ รับ +50 XP" : "Answer 3 quick questions and earn +50 XP"}
          </p>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className={`h-1.5 w-16 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <div className="glass glow-border mt-8 rounded-2xl p-6">
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = steps[step].icon;
              return <Icon className="h-5 w-5 text-primary" />;
            })()}
            <h2 className="font-display text-xl">{steps[step].title}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{steps[step].sub}</p>

          {step === 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {INTERESTS.map((id) => {
                const on = interests.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleInterest(id)}
                    className={`rounded-full border px-3 py-1.5 text-xs capitalize transition-colors ${
                      on
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {on && <Check className="mr-1 inline h-3 w-3" />}
                    {id.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          )}

          {step === 1 && (
            <div className="mt-4 space-y-2">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    role === r.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {isTH ? r.th : r.en}
                </button>
              ))}
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder={isTH ? "ประเทศ (ไม่บังคับ)" : "Country (optional)"}
                className="mt-2 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          )}

          {step === 2 && (
            <div className="mt-4 space-y-2">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    goal === g.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {isTH ? g.th : g.en}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
              className="text-sm text-muted-foreground disabled:opacity-40"
            >
              {isTH ? "ย้อนกลับ" : "Back"}
            </button>
            {step < 2 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 0 && interests.length === 0}
                className="inline-flex items-center gap-1 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {isTH ? "ถัดไป" : "Next"}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                disabled={busy || !goal}
                className="inline-flex items-center gap-1 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {busy ? "…" : isTH ? "เริ่มเลย (+50 XP)" : "Let's go (+50 XP)"}
              </button>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
