export const ECO_ACTIONS = [
  { type: "ev_commute", emoji: "🚗", labelKey: "dash.act.ev", xp: 50, credits: 10 },
  { type: "recycle", emoji: "♻️", labelKey: "dash.act.recycle", xp: 30, credits: 5 },
  { type: "tree_plant", emoji: "🌱", labelKey: "dash.act.tree", xp: 100, credits: 20 },
  { type: "energy", emoji: "⚡", labelKey: "dash.act.energy", xp: 20, credits: 3 },
] as const;

export type EcoActionType = (typeof ECO_ACTIONS)[number]["type"];

export function getEcoAction(type: string) {
  return ECO_ACTIONS.find((a) => a.type === type);
}

export const ECO_ACTION_LABELS: Record<EcoActionType, { en: string; th: string }> = {
  ev_commute: { en: "EV commute", th: "ใช้ EV / ขนส่งสาธารณะ" },
  recycle: { en: "Recycle", th: "รีไซเคิล" },
  tree_plant: { en: "Tree planting", th: "ปลูกต้นไม้" },
  energy: { en: "Save energy", th: "ประหยัดพลังงาน" },
};
