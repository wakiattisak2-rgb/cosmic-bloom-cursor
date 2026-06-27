import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Compass, Info, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import {
  computeMaterialityV2,
  defaultRatings,
  getTopicsForSector,
  SECTOR_LABELS,
  type CompassSector,
  type CompassV2Input,
  type CompassV2Result,
  type ScoredTopic,
} from "@/lib/compass";
import { ECO_ACTION_LABELS, type EcoActionType } from "@/lib/eco-actions";
import {
  bubbleOffset,
  bubbleSizePx,
  groupSurveyCoordinates,
  isPriorityQuadrant,
  SEVERITY_COLORS,
  severityLevelFromRating,
  severityStyles,
  topicBubblePreviewStyle,
} from "@/lib/compass/matrix-visual";

export const Route = createFileRoute("/_authenticated/compass")({
  head: () => ({ meta: [{ title: "Materiality Compass — Aetros" }] }),
  component: CompassPage,
});

const GOALS = [
  { id: "carbon", en: "Reduce carbon", th: "ลด carbon" },
  { id: "reporting", en: "Better reporting", th: "รายงานที่ดีขึ้น" },
  { id: "community", en: "Community impact", th: "ผลกระทบชุมชน" },
];

const SECTORS: CompassSector[] = ["general", "manufacturing", "services", "construction", "energy"];

const RESULT_STEP = 6;

const METHODOLOGY_DISCLAIMER = {
  en: "Methodology inspired by GRI & ESRS double materiality — not a certified materiality assessment.",
  th: "วิธีการอิง GRI และ ESRS double materiality — ไม่ใช่การประเมิน materiality ที่ได้รับการรับรอง",
};

function CompassPage() {
  const { user } = useAuth();
  const { tx } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [input, setInput] = useState<Omit<CompassV2Input, "profileInterests">>({
    sector: "general",
    orgSize: "solo",
    region: "th",
    maturity: "start",
    goals: [],
    stakeholderRatings: defaultRatings(getTopicsForSector("general")),
    financialRatings: defaultRatings(getTopicsForSector("general")),
  });
  const [result, setResult] = useState<CompassV2Result | null>(null);

  const profile = useQuery({
    queryKey: ["profile", user?.id, "compass"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("interests, country, materiality_profile")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!profile.data) return;
    const mp = profile.data.materiality_profile as { sector?: CompassSector; version?: number } | null;
    if (mp?.version === 2 && mp.sector && SECTORS.includes(mp.sector)) {
      setInput((i) => ({
        ...i,
        sector: mp.sector!,
        stakeholderRatings: defaultRatings(getTopicsForSector(mp.sector!)),
        financialRatings: defaultRatings(getTopicsForSector(mp.sector!)),
      }));
    }
    if (profile.data.country?.toLowerCase().includes("thailand") || profile.data.country === "TH") {
      setInput((i) => ({ ...i, region: "th" }));
    }
  }, [profile.data]);

  const sectorTopics = useMemo(() => getTopicsForSector(input.sector), [input.sector]);

  const setSector = (sector: CompassSector) => {
    const topics = getTopicsForSector(sector);
    setInput((i) => ({
      ...i,
      sector,
      stakeholderRatings: defaultRatings(topics),
      financialRatings: defaultRatings(topics),
    }));
  };

  const save = useMutation({
    mutationFn: async (payload: CompassV2Result) => {
      const { error } = await supabase
        .from("profiles")
        .update({ materiality_profile: payload as unknown as Record<string, unknown> })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => toast.success(tx("Saved", "บันทึกแล้ว")),
  });

  const finish = () => {
    const r = computeMaterialityV2({
      ...input,
      profileInterests: profile.data?.interests ?? [],
    });
    setResult(r);
    setSelectedTopicId(r.materialTopics[0]?.id ?? r.topics[0]?.id ?? null);
    void save.mutate(r);
    setStep(RESULT_STEP);
  };

  const toggleGoal = (id: string) => {
    setInput((i) => ({
      ...i,
      goals: i.goals.includes(id) ? i.goals.filter((g) => g !== id) : [...i.goals, id],
    }));
  };

  const setRating = (kind: "stakeholderRatings" | "financialRatings", topicId: string, value: number) => {
    setInput((i) => ({
      ...i,
      [kind]: { ...i[kind], [topicId]: value },
    }));
  };

  const canNext =
    (step !== 1 || input.goals.length > 0) &&
    (step !== 2 || sectorTopics.every((t) => input.stakeholderRatings[t.id] >= 1)) &&
    (step !== 3 || sectorTopics.every((t) => input.financialRatings[t.id] >= 1));

  const selected = result?.topics.find((t) => t.id === selectedTopicId) ?? result?.topics[0];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <Compass className="h-5 w-5" />
          <h1 className="font-display text-2xl">{tx("Materiality Compass", "เข็มทิศ Materiality")}</h1>
        </div>

        <p className="mb-6 flex gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {tx(METHODOLOGY_DISCLAIMER.en, METHODOLOGY_DISCLAIMER.th)}
        </p>

        {step < RESULT_STEP && (
          <div className="glass glow-border space-y-4 rounded-2xl p-6">
            <div className="flex gap-1">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>

            {step === 0 && (
              <>
                <p className="text-sm text-muted-foreground">{tx("Your sector", "อุตสาหกรรม / sector ของคุณ")}</p>
                {SECTORS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSector(s)}
                    className={`block w-full rounded-lg border px-3 py-2 text-left text-sm ${
                      input.sector === s ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    {tx(SECTOR_LABELS[s].en, SECTOR_LABELS[s].th)}
                  </button>
                ))}
                <p className="pt-2 text-sm text-muted-foreground">{tx("Organization size", "ขนาดองค์กร")}</p>
                {(["solo", "sme", "enterprise"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setInput({ ...input, orgSize: s })}
                    className={`block w-full rounded-lg border px-3 py-2 text-left text-sm ${
                      input.orgSize === s ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </>
            )}

            {step === 1 && (
              <>
                <p className="text-sm text-muted-foreground">{tx("Region / market", "ภูมิภาค / ตลาด")}</p>
                {(
                  [
                    { id: "th" as const, en: "Thailand / ASEAN", th: "ไทย / ASEAN" },
                    { id: "global" as const, en: "Global", th: "ระดับโลก" },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setInput({ ...input, region: r.id })}
                    className={`block w-full rounded-lg border px-3 py-2 text-left text-sm ${
                      input.region === r.id ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    {tx(r.en, r.th)}
                  </button>
                ))}
                <p className="pt-2 text-sm text-muted-foreground">{tx("ESG maturity", "ความ mature ด้าน ESG")}</p>
                {(["start", "growing", "advanced"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setInput({ ...input, maturity: m })}
                    className={`block w-full rounded-lg border px-3 py-2 text-left text-sm ${
                      input.maturity === m ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    {m}
                  </button>
                ))}
                <p className="pt-2 text-sm text-muted-foreground">{tx("Primary goals", "เป้าหมายหลัก")}</p>
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGoal(g.id)}
                    className={`block w-full rounded-lg border px-3 py-2 text-left text-sm ${
                      input.goals.includes(g.id) ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    {tx(g.en, g.th)}
                  </button>
                ))}
              </>
            )}

            {step === 2 && (
              <SurveyStep
                title={tx(
                  "How important is each topic to your stakeholders?",
                  "แต่ละหัวข้อสำคัญต่อ stakeholder แค่ไหน?",
                )}
                topics={sectorTopics}
                ratings={input.stakeholderRatings}
                onRate={(id, v) => setRating("stakeholderRatings", id, v)}
                tx={tx}
              />
            )}

            {step === 3 && (
              <SurveyStep
                title={tx(
                  "How significant is each topic to your business / finances?",
                  "แต่ละหัวข้อสำคัญต่อธุรกิจ/การเงินแค่ไหน?",
                )}
                topics={sectorTopics}
                ratings={input.financialRatings}
                onRate={(id, v) => setRating("financialRatings", id, v)}
                tx={tx}
              />
            )}

            {step === 4 && (
              <div className="space-y-2 text-sm">
                <p>{tx("Ready to compute your materiality map?", "พร้อมคำนวณแผนที่ materiality?")}</p>
                <p className="text-xs text-muted-foreground">
                  {tx("Sector", "Sector")}: {tx(SECTOR_LABELS[input.sector].en, SECTOR_LABELS[input.sector].th)} ·{" "}
                  {sectorTopics.length} {tx("topics rated", "หัวข้อที่ให้คะแนนแล้ว")}
                </p>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => setStep((s) => s - 1)}
                className="text-xs text-muted-foreground disabled:opacity-40"
              >
                {tx("Back", "ย้อน")}
              </button>
              <button
                type="button"
                disabled={!canNext}
                onClick={() => (step >= 4 ? finish() : setStep((s) => s + 1))}
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                {step >= 4 ? tx("See results", "ดูผลลัพธ์") : tx("Next", "ถัดไป")}
              </button>
            </div>
          </div>
        )}

        {step === RESULT_STEP && result && (
          <div className="space-y-4">
            <DoubleMaterialityMatrix
              topics={result.topics}
              selectedId={selectedTopicId}
              onSelect={setSelectedTopicId}
              tx={tx}
            />

            <div className="glass rounded-2xl p-6">
              <h2 className="font-display text-lg">{tx("Material topics", "หัวข้อ material")}</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {result.frameworkNote.gri} · {result.frameworkNote.esrs}
              </p>
              <div className="mt-4 space-y-2">
                {(result.materialTopics.length ? result.materialTopics : result.topics.slice(0, 3)).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTopicId(t.id)}
                    className={`w-full rounded-xl border p-3 text-left text-xs transition-all ${
                      selectedTopicId === t.id ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-0.5 shrink-0 rounded-full"
                        style={topicBubblePreviewStyle(t.surveyImpact, t.surveyFinancial)}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium">{tx(t.label_en, t.label_th)}</span>
                          <span className="shrink-0 font-mono text-primary">{t.materialityIndex}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                          <span>{t.griRef}</span>
                          <span>{t.esrsRef}</span>
                          <span
                            className={
                              t.pillar === "E"
                                ? "text-cyan-400"
                                : t.pillar === "S"
                                  ? "text-primary"
                                  : "text-violet-400"
                            }
                          >
                            {t.pillar}
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          {tx("Your ratings", "คะแนนที่ให้")}: Impact {t.surveyImpact} · Financial{" "}
                          {t.surveyFinancial}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selected && (
              <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-primary">{tx(selected.label_en, selected.label_th)}</span>
                {" — "}
                {tx(selected.summary_en, selected.summary_th)}
              </p>
            )}

            <div className="glass rounded-2xl p-6">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-primary" />
                {tx("Suggested actions", "การกระทำที่แนะนำ")}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {tx("Tap to log instantly on your dashboard", "แตะเพื่อบันทึกทันทีบน Dashboard")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.suggestedActions.map((a) => {
                  const labels = ECO_ACTION_LABELS[a as EcoActionType];
                  return (
                    <Link
                      key={a}
                      to="/dashboard"
                      search={{ log: a }}
                      className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                      {tx("Log", "บันทึก")} {labels ? tx(labels.en, labels.th) : a}
                    </Link>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate({ to: "/dashboard" })}
              className="w-full rounded-full border border-border py-2.5 text-sm font-medium text-muted-foreground hover:border-primary/40"
            >
              {tx("Go to Dashboard", "ไป Dashboard")}
            </button>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function SurveyStep({
  title,
  topics,
  ratings,
  onRate,
  tx,
}: {
  title: string;
  topics: ReturnType<typeof getTopicsForSector>;
  ratings: Record<string, number>;
  onRate: (id: string, value: number) => void;
  tx: (en: string, th: string) => string;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-[10px] text-muted-foreground">{tx("Rate 1 (low) to 5 (high)", "ให้คะแนน 1 (ต่ำ) ถึง 5 (สูง)")}</p>
      {topics.map((t) => (
        <div key={t.id} className="rounded-xl border border-border p-3">
          <div className="text-xs font-medium">{tx(t.label_en, t.label_th)}</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">
            {t.griRef} · {t.esrsRef}
          </div>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => {
              const level = severityLevelFromRating(n);
              const colors = SEVERITY_COLORS[level];
              const selected = ratings[t.id] === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onRate(t.id, n)}
                  className={`flex-1 rounded-md border-2 py-1.5 text-xs font-mono transition-all ${
                    selected ? "font-semibold text-white" : "text-muted-foreground hover:opacity-90"
                  }`}
                  style={
                    selected
                      ? { backgroundColor: colors.bg, borderColor: colors.border }
                      : { borderColor: `${colors.border}66`, backgroundColor: "transparent" }
                  }
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function DoubleMaterialityMatrix({
  topics,
  selectedId,
  onSelect,
  tx,
}: {
  topics: ScoredTopic[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  tx: (en: string, th: string) => string;
}) {
  const overlapGroups = useMemo(() => groupSurveyCoordinates(topics), [topics]);

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-display text-lg">{tx("Double materiality map", "แผนที่ double materiality")}</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {tx(
          "Position = your survey ratings per topic (X = financial, Y = impact)",
          "ตำแหน่ง = คะแนนที่คุณให้แต่ละ topic (X = การเงิน, Y = ผลกระทบ)",
        )}
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground/80">
        {tx(
          "Visual encoding inspired by common materiality matrix practice",
          "การเข้ารหัสภาพอิงแนวทาง materiality matrix ที่ใช้กันทั่วไป",
        )}
      </p>

      <div className="relative mx-auto mt-6 aspect-square max-h-72 w-full">
        <div className="absolute inset-8 rounded-xl border border-border/80 bg-background/40">
          {/* Priority zone: high impact (top) + high financial (right) */}
          <div
            className="pointer-events-none absolute bottom-1/2 left-1/2 right-0 top-0 rounded-tr-xl"
            style={{
              background: "linear-gradient(135deg, rgba(0,255,102,0.06) 0%, rgba(0,255,102,0.14) 100%)",
            }}
            aria-hidden
          />
          <span className="pointer-events-none absolute right-2 top-2 text-[8px] uppercase tracking-wider text-primary/50">
            {tx("Priority zone", "โซน priority")}
          </span>

          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/60" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-border/60" />
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-widest text-muted-foreground">
            {tx("Financial", "การเงิน")}
          </span>
          <span className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] uppercase tracking-widest text-muted-foreground">
            {tx("Impact", "ผลกระทบ")}
          </span>

          {topics.map((t) => {
            const isSelected = t.id === selectedId;
            const size = bubbleSizePx(t.surveyImpact);
            const x = (t.surveyFinancial / 5) * 100;
            const y = (1 - t.surveyImpact / 5) * 100;
            const colors = severityStyles(t.surveyImpact, t.surveyFinancial);
            const inPriority = isPriorityQuadrant(t.surveyImpact, t.surveyFinancial);
            const severity = SEVERITY_COLORS[colors.colorLevel];
            const group = overlapGroups.get(t.id) ?? { index: 0, total: 1 };
            const spreadRadius = Math.max(size * 0.55, 10 + group.total * 2);
            const { dx, dy } = bubbleOffset(group.index, group.total, spreadRadius);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelect(t.id)}
                title={`${t.label_en} · ${severity.label_en} · Impact ${t.surveyImpact} · Financial ${t.surveyFinancial}`}
                className={`absolute rounded-full border-2 transition-all hover:scale-110 ${
                  isSelected
                    ? "ring-2 ring-primary shadow-[0_0_16px_rgba(0,255,102,0.5)]"
                    : t.isMaterial
                      ? "ring-1 ring-primary/50 shadow-[0_0_8px_rgba(0,255,102,0.2)]"
                      : inPriority
                        ? "shadow-[0_0_6px_rgba(0,255,102,0.12)]"
                        : ""
                }`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: size,
                  height: size,
                  transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
                  backgroundColor: colors.backgroundColor,
                  borderColor: colors.borderColor,
                }}
                aria-label={t.label_en}
              />
            );
          })}
        </div>
      </div>

      <MatrixLegend tx={tx} />
    </div>
  );
}

function MatrixLegend({ tx }: { tx: (en: string, th: string) => string }) {
  const levels = [1, 2, 3, 4, 5] as const;
  return (
    <div className="mt-6 space-y-2 text-[10px] text-muted-foreground">
      <p>
        {tx(
          "Position = your survey ratings (1–5 per topic)",
          "ตำแหน่ง = คะแนนที่คุณให้ในแบบสอบถาม (1–5 ต่อ topic)",
        )}
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex items-end gap-0.5">
            <span className="h-2.5 w-2.5 rounded-full border border-primary/40 bg-primary/20" />
            <span className="h-4 w-4 rounded-full border-2 border-primary/60 bg-primary/35" />
          </span>
          {tx("Size = your impact rating", "ขนาด = คะแนน impact ที่คุณให้")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-5 rounded-sm bg-primary/10 ring-1 ring-primary/20" />
          {tx("Shaded corner = priority zone", "มุมเงา = โซน priority")}
        </span>
      </div>
      <div className="space-y-1">
        <p>
          {tx(
            "Color = combined ratings (impact + financial): red = urgent, blue = low concern",
            "สี = คะแนนร่วม (impact + financial): แดง = เร่งด่วน, ฟ้า = ต่ำความกังวล",
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {levels.map((level) => {
            const c = SEVERITY_COLORS[level];
            return (
              <span key={level} className="inline-flex items-center gap-1">
                <span
                  className="h-3 w-3 rounded-full border-2"
                  style={{ backgroundColor: c.bg, borderColor: c.border }}
                />
                <span>
                  {level} · {tx(c.label_en, c.label_th)}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
