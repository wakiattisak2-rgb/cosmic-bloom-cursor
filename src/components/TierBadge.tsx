import { Sparkles, Star, Orbit } from "lucide-react";
import { tierFor, tierProgress } from "./EcoAvatar";
import type { Locale } from "@/lib/i18n";

export function TierBadge({ xp, locale }: { xp: number; locale: Locale }) {
  const tier = tierFor(xp);
  const Icon = tier.index === 1 ? Sparkles : tier.index === 2 ? Star : Orbit;
  const label = locale === "th" ? tier.label_th : tier.label;
  return (
    <div className="relative inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs font-mono uppercase tracking-widest text-primary shadow-[0_0_24px_rgba(0,255,102,0.35)] animate-pulse-glow">
      <Icon className="h-3.5 w-3.5" />
      <span>Tier {tier.index}</span>
      <span className="text-foreground/80 normal-case tracking-normal font-sans">· {label}</span>
    </div>
  );
}

export function TierProgress({ xp, locale }: { xp: number; locale: Locale }) {
  const { tier, pct, remaining, nextTier } = tierProgress(xp);
  const nextLabel = nextTier ? (locale === "th" ? nextTier.label_th : nextTier.label) : null;
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
        <span>{xp.toLocaleString()} XP</span>
        <span>
          {nextTier
            ? `${remaining.toLocaleString()} XP → ${nextLabel}`
            : locale === "th"
              ? "ระดับสูงสุดแล้ว"
              : "Max tier reached"}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #00FF66 0%, #00E5FF 100%)",
            boxShadow: "0 0 18px rgba(0,255,102,0.7)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-[shimmer_2.4s_linear_infinite]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
            mixBlendMode: "screen",
          }}
        />
      </div>
      <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80">
        {tier.label} · {pct}%
      </div>
    </div>
  );
}
