import { useEffect, useRef } from "react";

export interface EcoAvatarProps {
  xp: number;
  size?: number;
}

export type TierKey = "novice" | "shaper" | "guardian";

export interface Tier {
  key: TierKey;
  label: string;
  label_th: string;
  index: 1 | 2 | 3;
  min: number;
  next: number | null;
}

const TIERS: Tier[] = [
  { key: "novice", label: "Nebula Novice", label_th: "นักเดินทางเนบิวลา", index: 1, min: 0, next: 500 },
  { key: "shaper", label: "Stellar Shaper", label_th: "ผู้สร้างดวงดาว", index: 2, min: 500, next: 1500 },
  { key: "guardian", label: "Galactic Guardian", label_th: "ผู้พิทักษ์กาแล็กซี", index: 3, min: 1500, next: null },
];

export function tierFor(xp: number): Tier {
  if (xp >= 1500) return TIERS[2];
  if (xp >= 500) return TIERS[1];
  return TIERS[0];
}

export function tierProgress(xp: number) {
  const t = tierFor(xp);
  const from = t.min;
  const to = t.next ?? t.min + 1;
  const pct = t.next ? Math.min(100, Math.round(((xp - from) / (to - from)) * 100)) : 100;
  const remaining = t.next ? Math.max(0, t.next - xp) : 0;
  const nextTier = t.next ? TIERS[t.index] : null;
  return { tier: t, from, to, pct, remaining, nextTier };
}

const NEON = "#00FF66";
const AQUA = "#00E5FF";

export function EcoAvatar({ xp, size = 280 }: EcoAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const xpRef = useRef(xp);
  xpRef.current = xp;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let t0 = performance.now();
    let visible = true;
    const onVis = () => (visible = !document.hidden);
    document.addEventListener("visibilitychange", onVis);

    // pre-compute galaxy particles (regen on mount; tier change remounts via key)
    const galaxy: { a: number; r: number; hue: number; s: number }[] = [];
    for (let i = 0; i < 420; i++) {
      const arm = i % 2 === 0 ? 0 : Math.PI;
      const t = Math.pow(Math.random(), 0.6);
      const r = 18 + t * (size / 2 - 24);
      const a = arm + t * 5.4 + (Math.random() - 0.5) * 0.55;
      galaxy.push({ a, r, hue: Math.random(), s: 0.6 + Math.random() * 1.4 });
    }

    const cx = size / 2;
    const cy = size / 2;

    const drawCore = (glow: number) => {
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 36);
      grd.addColorStop(0, "#e8ffe8");
      grd.addColorStop(0.4, NEON);
      grd.addColorStop(1, "rgba(0,255,102,0)");
      ctx.globalAlpha = 0.85 + glow * 0.15;
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const drawNovice = (time: number) => {
      // dark core + single orbiting particle
      ctx.fillStyle = "rgba(11,15,25,0.9)";
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fill();

      const pulse = (Math.sin(time * 0.003) + 1) / 2;
      ctx.strokeStyle = `rgba(0,255,102,${0.15 + pulse * 0.25})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.stroke();

      const a = time * 0.0012;
      const r = 80;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      const g = ctx.createRadialGradient(px, py, 0, px, py, 18);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.3, NEON);
      g.addColorStop(1, "rgba(0,255,102,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, 18, 0, Math.PI * 2);
      ctx.fill();

      // faint dust
      for (let i = 0; i < 20; i++) {
        const aa = (i / 20) * Math.PI * 2 + time * 0.0002;
        const rr = 110 + Math.sin(time * 0.001 + i) * 8;
        ctx.fillStyle = `rgba(0,255,102,${0.05 + (i % 3) * 0.03})`;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawShaper = (time: number) => {
      drawCore((Math.sin(time * 0.003) + 1) / 2);
      const rings = [60, 92, 124];
      rings.forEach((r, ri) => {
        ctx.strokeStyle = `rgba(0,255,102,${0.18 + ri * 0.05})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        const count = 6 + ri * 3;
        const speed = 0.0008 + ri * 0.0004 * (ri % 2 === 0 ? 1 : -1);
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2 + time * speed;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          const tw = 0.6 + ((Math.sin(time * 0.004 + i + ri) + 1) / 2) * 0.4;
          const g = ctx.createRadialGradient(x, y, 0, x, y, 8);
          g.addColorStop(0, "#fff");
          g.addColorStop(0.4, NEON);
          g.addColorStop(1, "rgba(0,255,102,0)");
          ctx.globalAlpha = tw;
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
    };

    const drawGuardian = (time: number) => {
      // core glow
      drawCore(1);
      const rot = time * 0.00035;
      for (const p of galaxy) {
        const a = p.a + rot;
        const x = cx + Math.cos(a) * p.r;
        const y = cy + Math.sin(a) * p.r;
        const hueColor = p.hue < 0.5 ? NEON : AQUA;
        ctx.fillStyle = hueColor;
        ctx.globalAlpha = 0.35 + p.s * 0.25;
        ctx.beginPath();
        ctx.arc(x, y, p.s * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      if (!visible) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const time = reduced ? 0 : now - t0;
      ctx.clearRect(0, 0, size, size);

      // ambient halo
      const halo = ctx.createRadialGradient(cx, cy, 10, cx, cy, size / 2);
      halo.addColorStop(0, "rgba(0,255,102,0.12)");
      halo.addColorStop(0.6, "rgba(0,229,255,0.04)");
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, size, size);

      const tier = tierFor(xpRef.current);
      if (tier.index === 1) drawNovice(time);
      else if (tier.index === 2) drawShaper(time);
      else drawGuardian(time);

      if (!reduced) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [size]);

  const tier = tierFor(xp);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="animate-float-y"
      />
      <div
        key={tier.key}
        className="pointer-events-none absolute bottom-2 rounded-full border border-primary/40 bg-background/70 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-primary backdrop-blur animate-fade-up"
      >
        Inner Universe · {tier.label}
      </div>
    </div>
  );
}
