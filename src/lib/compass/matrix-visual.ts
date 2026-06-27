export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

/** Bubble diameter from impact score (1–5). Larger = higher stakeholder impact. */
export function bubbleSizePx(impactScore: number): number {
  const clamped = Math.min(5, Math.max(1, impactScore));
  return 14 + clamped * 6;
}

export const SEVERITY_COLORS: Record<
  SeverityLevel,
  { bg: string; border: string; label_en: string; label_th: string }
> = {
  1: { bg: "rgba(239,68,68,0.55)", border: "rgba(239,68,68,0.95)", label_en: "Urgent", label_th: "อันตราย" },
  2: { bg: "rgba(249,115,22,0.5)", border: "rgba(249,115,22,0.9)", label_en: "High", label_th: "ค่อนข้างเร่งด่วน" },
  3: { bg: "rgba(234,179,8,0.5)", border: "rgba(234,179,8,0.9)", label_en: "Medium", label_th: "กลางๆ" },
  4: { bg: "rgba(34,197,94,0.45)", border: "rgba(34,197,94,0.85)", label_en: "Low", label_th: "ต่ำ-ปานกลาง" },
  5: { bg: "rgba(56,189,248,0.45)", border: "rgba(56,189,248,0.85)", label_en: "Minimal", label_th: "ต่ำความกังวล" },
};

function clampScore(n: number): number {
  return Math.min(5, Math.max(1, Math.round(n)));
}

/** Average of impact + financial (1–5). Higher = more material concern. */
export function combinedMaterialityLevel(impactScore: number, financialScore: number): number {
  return clampScore((impactScore + financialScore) / 2);
}

/** 1 = red (urgent) … 5 = blue (low concern). High combined materiality → 1. */
export function severityColorLevel(impactScore: number, financialScore: number): SeverityLevel {
  const combined = combinedMaterialityLevel(impactScore, financialScore);
  return (6 - combined) as SeverityLevel;
}

/** Map a single 1–5 rating to severity (high rating → red). For survey buttons. */
export function severityLevelFromRating(rating: number): SeverityLevel {
  return (6 - clampScore(rating)) as SeverityLevel;
}

export function severityStyles(
  impactScore: number,
  financialScore: number,
): { backgroundColor: string; borderColor: string; colorLevel: SeverityLevel } {
  const colorLevel = severityColorLevel(impactScore, financialScore);
  const { bg, border } = SEVERITY_COLORS[colorLevel];
  return { backgroundColor: bg, borderColor: border, colorLevel };
}

export function isPriorityQuadrant(impactScore: number, financialScore: number): boolean {
  return impactScore >= 3 && financialScore >= 3;
}

/** Spread overlapping bubbles in a small circle around the shared coordinate. */
export function bubbleOffset(index: number, total: number, radiusPx: number): { dx: number; dy: number } {
  if (total <= 1) return { dx: 0, dy: 0 };
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return {
    dx: Math.cos(angle) * radiusPx,
    dy: Math.sin(angle) * radiusPx,
  };
}

export function surveyCoordKey(surveyFinancial: number, surveyImpact: number): string {
  return `${surveyFinancial},${surveyImpact}`;
}

/** Assign index/total within each group of topics sharing the same survey coordinates. */
export function groupSurveyCoordinates<T extends { id: string; surveyImpact: number; surveyFinancial: number }>(
  topics: T[],
): Map<string, { index: number; total: number }> {
  const groups = new Map<string, T[]>();
  for (const t of topics) {
    const key = surveyCoordKey(t.surveyFinancial, t.surveyImpact);
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }
  const result = new Map<string, { index: number; total: number }>();
  for (const list of groups.values()) {
    list.forEach((t, i) => result.set(t.id, { index: i, total: list.length }));
  }
  return result;
}

/** Mini preview bubble for topic list rows. */
export function topicBubblePreviewStyle(
  impactScore: number,
  financialScore: number,
): {
  width: number;
  height: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: "solid";
} {
  const size = Math.max(12, bubbleSizePx(impactScore) * 0.45);
  const { backgroundColor, borderColor } = severityStyles(impactScore, financialScore);
  return {
    width: size,
    height: size,
    backgroundColor,
    borderColor,
    borderWidth: 2,
    borderStyle: "solid",
  };
}
