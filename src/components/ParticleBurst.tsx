import { useEffect, useRef } from "react";

export interface Burst {
  id: number;
  x: number;
  y: number;
  label: string;
  sub?: string;
}

export function BurstLayer({ bursts, onDone }: { bursts: Burst[]; onDone: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {bursts.map((b) => (
        <BurstItem key={b.id} burst={b} onDone={() => onDone(b.id)} />
      ))}
    </div>
  );
}

function BurstItem({ burst, onDone }: { burst: Burst; onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const SIZE = 220;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const parts = Array.from({ length: 28 }, () => {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.2 + Math.random() * 3.2;
      return {
        x: SIZE / 2,
        y: SIZE / 2,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0,
        max: 50 + Math.random() * 30,
        r: 1.2 + Math.random() * 2.2,
        hue: Math.random() < 0.7 ? "#00FF66" : "#00E5FF",
      };
    });

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      let alive = false;
      for (const p of parts) {
        if (p.life >= p.max) continue;
        alive = true;
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.vx *= 0.98;
        p.vy *= 0.98;
        const alpha = 1 - p.life / p.max;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.hue;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.hue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      if (alive) raf = requestAnimationFrame(tick);
      else onDone();
    };
    raf = requestAnimationFrame(tick);
    const timeout = setTimeout(onDone, 1400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [onDone]);

  return (
    <div
      className="absolute"
      style={{ left: burst.x - 110, top: burst.y - 110, width: 220, height: 220 }}
    >
      <canvas ref={ref} style={{ width: 220, height: 220 }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-[particle-rise_1.1s_ease-out_forwards] text-center">
          <div
            className="font-display text-3xl font-bold text-primary"
            style={{ textShadow: "0 0 18px rgba(0,255,102,0.9)" }}
          >
            {burst.label}
          </div>
          {burst.sub && (
            <div className="mt-1 text-xs font-mono uppercase tracking-widest text-aurora">
              {burst.sub}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
