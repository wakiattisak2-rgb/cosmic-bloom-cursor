import { useEffect, useRef } from "react";

export function ParticleHero() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    type P = { x: number; y: number; r: number; a: number; s: number; o: number };
    let parts: P[] = [];

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(140, Math.floor((w * h) / 9000));
      parts = Array.from({ length: count }).map(() => spawn());
    }
    function spawn(): P {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.8 + 0.4,
        a: Math.random() * Math.PI * 2,
        s: Math.random() * 0.25 + 0.05,
        o: Math.random() * 0.6 + 0.2,
      };
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      // central aurora
      const cx = w / 2, cy = h / 2;
      const grd = ctx!.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.55);
      grd.addColorStop(0, "rgba(0,255,102,0.18)");
      grd.addColorStop(0.4, "rgba(0,255,102,0.05)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = grd;
      ctx!.fillRect(0, 0, w, h);

      // connecting lines
      ctx!.strokeStyle = "rgba(0,255,102,0.08)";
      ctx!.lineWidth = 1;
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i], b = parts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 110 * 110) {
            ctx!.globalAlpha = 1 - d2 / (110 * 110);
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }
      ctx!.globalAlpha = 1;

      for (const p of parts) {
        p.a += 0.005;
        p.x += Math.cos(p.a) * p.s;
        p.y += Math.sin(p.a) * p.s;
        if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) Object.assign(p, spawn());
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(0,255,102,${p.o})`;
        ctx!.shadowBlur = 8;
        ctx!.shadowColor = "rgba(0,255,102,0.7)";
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    }

    resize();
    draw();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
