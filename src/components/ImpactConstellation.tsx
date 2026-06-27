import { useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { actionsToStars, co2EstimateKg, type ActionLogRow } from "@/lib/constellation";
import { useI18n } from "@/lib/i18n";

type Props = {
  actions: ActionLogRow[];
  width?: number;
  height?: number;
  highlightId?: string | null;
};

function nebulaHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function ImpactConstellation({ actions, width = 320, height = 320, highlightId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { locale, tx } = useI18n();
  const [selected, setSelected] = useState<ActionLogRow | null>(null);
  const stars = actionsToStars(actions, width, height);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "rgba(5, 8, 16, 0.85)";
    ctx.fillRect(0, 0, width, height);

    const grad = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, width * 0.55);
    grad.addColorStop(0, "rgba(0, 255, 102, 0.08)");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    for (const s of stars) {
      const isHi = highlightId === s.id || selected?.id === s.id;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = isHi ? "#00FF66" : s.cluster === "E" ? "#00E5FF" : s.cluster === "S" ? "#00FF66" : "#a78bfa";
      ctx.shadowColor = isHi ? "#00FF66" : "transparent";
      ctx.shadowBlur = isHi ? 16 : 0;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    if (stars.length === 0) {
      for (let i = 0; i < 40; i++) {
        const nx = ((nebulaHash(`n${i}`) % 1000) / 1000) * width;
        const ny = ((nebulaHash(`n${i}a`) % 1000) / 1000) * height;
        const nr = 0.5 + (nebulaHash(`n${i}b`) % 100) / 80;
        ctx.beginPath();
        ctx.arc(nx, ny, nr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167, 139, 250, ${0.08 + (i % 5) * 0.04})`;
        ctx.fill();
      }
      const nebula = ctx.createRadialGradient(width * 0.4, height * 0.5, 0, width * 0.5, height * 0.5, width * 0.45);
      nebula.addColorStop(0, "rgba(0, 229, 255, 0.12)");
      nebula.addColorStop(0.5, "rgba(0, 255, 102, 0.06)");
      nebula.addColorStop(1, "transparent");
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        tx("Log an action to birth your first star", "บันทึกการกระทำเพื่อสร้างดาวดวงแรก"),
        width / 2,
        height / 2 + 24,
      );
    }
  }, [actions, width, height, highlightId, selected, locale, tx, stars]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = stars.find((s) => Math.hypot(s.x - x, s.y - y) < s.radius + 6);
    if (hit) {
      const row = actions.find((a) => a.id === hit.id) ?? null;
      setSelected(row);
    } else setSelected(null);
  };

  const sharePng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "aetros-constellation.png";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className="cursor-pointer rounded-xl ring-1 ring-primary/20"
        onClick={handleClick}
        aria-label="Impact constellation"
      />
      {selected && (
        <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-primary/30 bg-background/90 p-3 text-xs backdrop-blur">
          <div className="font-medium text-primary">{selected.action_type.replace("_", " ")}</div>
          <div className="mt-1 text-muted-foreground">
            +{selected.xp_awarded} XP · +{selected.credits_awarded} CC · ~
            {co2EstimateKg(selected.action_type).toFixed(1)} kg CO₂
          </div>
          <div className="text-[10px] text-muted-foreground">
            {new Date(selected.created_at).toLocaleString(locale === "th" ? "th-TH" : "en-US")}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={sharePng}
        disabled={actions.length === 0}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-primary/40 bg-background/80 px-2.5 py-1 text-[10px] font-medium text-primary backdrop-blur disabled:opacity-40"
      >
        <Share2 className="h-3 w-3" />
        {tx("Share", "แชร์")}
      </button>
    </div>
  );
}
