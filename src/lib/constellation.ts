export type ActionLogRow = {
  id: string;
  action_type: string;
  xp_awarded: number;
  credits_awarded: number;
  created_at: string;
};

export type StarNode = {
  id: string;
  x: number;
  y: number;
  radius: number;
  cluster: "E" | "S" | "G";
  action_type: string;
  xp: number;
  credits: number;
  created_at: string;
};

const CLUSTER: Record<string, "E" | "S" | "G"> = {
  ev_commute: "E",
  energy: "E",
  recycle: "E",
  tree_plant: "S",
};

const CLUSTER_CENTER: Record<"E" | "S" | "G", { cx: number; cy: number }> = {
  E: { cx: 0.35, cy: 0.45 },
  S: { cx: 0.65, cy: 0.35 },
  G: { cx: 0.5, cy: 0.72 },
};

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** Map actions to star positions (deterministic per action id). */
export function actionsToStars(actions: ActionLogRow[], width = 1, height = 1): StarNode[] {
  const byCluster: Record<"E" | "S" | "G", ActionLogRow[]> = { E: [], S: [], G: [] };
  for (const a of actions) {
    const c = CLUSTER[a.action_type] ?? "G";
    byCluster[c].push(a);
  }

  const stars: StarNode[] = [];
  for (const cluster of ["E", "S", "G"] as const) {
    const { cx, cy } = CLUSTER_CENTER[cluster];
    byCluster[cluster].forEach((a, i) => {
      const h = hash(a.id);
      const angle = ((h % 360) * Math.PI) / 180 + i * 0.7;
      const dist = 0.08 + (i % 5) * 0.04 + ((h >> 8) % 100) / 2000;
      stars.push({
        id: a.id,
        x: (cx + Math.cos(angle) * dist) * width,
        y: (cy + Math.sin(angle) * dist) * height,
        radius: 3 + Math.min(6, Math.floor(a.xp_awarded / 25)),
        cluster,
        action_type: a.action_type,
        xp: a.xp_awarded,
        credits: a.credits_awarded,
        created_at: a.created_at,
      });
    });
  }
  return stars;
}

export function co2EstimateKg(actionType: string): number {
  const map: Record<string, number> = {
    ev_commute: 2.4,
    recycle: 0.8,
    tree_plant: 5.0,
    energy: 1.2,
  };
  return map[actionType] ?? 0.5;
}
