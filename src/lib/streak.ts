type ActionRow = { created_at: string };

/** Consecutive calendar days with at least one logged action (including today). */
export function computeStreak(actions: ActionRow[]): number {
  if (!actions.length) return 0;

  const days = new Set(
    actions.map((a) => {
      const d = new Date(a.created_at);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function weeklyActionSummary(actions: ActionRow[]): { count: number; credits: number; xp: number } {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = actions.filter((a) => new Date(a.created_at).getTime() >= weekAgo);
  return {
    count: recent.length,
    credits: recent.reduce((s, a) => s + ((a as { credits_awarded?: number }).credits_awarded ?? 0), 0),
    xp: recent.reduce((s, a) => s + ((a as { xp_awarded?: number }).xp_awarded ?? 0), 0),
  };
}
