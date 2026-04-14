"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  value: number | null;
  rolling: boolean;
  band?: string | null;
  onRollVisualComplete?: () => void;
};

function bandLabel(band: string | null | undefined): string {
  if (!band) return "";
  if (band === "critical_success") return "Critical success";
  if (band === "success") return "Success";
  if (band === "moderate_success") return "Moderate success";
  if (band === "fail") return "Fail";
  if (band === "critical_fail") return "Critical fail";
  return band.replace(/_/g, " ");
}

function bandColor(band: string | null | undefined): string {
  if (!band) return "text-white/70";
  if (band === "critical_success") return "text-emerald-300";
  if (band === "success") return "text-green-300";
  if (band === "moderate_success") return "text-amber-200";
  if (band === "fail") return "text-orange-300";
  if (band === "critical_fail") return "text-red-400";
  return "text-white/70";
}

export function D20Die({ value, rolling, band, onRollVisualComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<any>(null);
  const initRef = useRef(false);
  const [use3D, setUse3D] = useState(true);
  const [settled, setSettled] = useState(false);
  const [fallbackTick, setFallbackTick] = useState<number | null>(null);

  const initDiceBox = useCallback(async () => {
    if (initRef.current || !containerRef.current) return;
    initRef.current = true;

    try {
      const DiceBox = (await import("@3d-dice/dice-box-threejs")).default;
      const box = new DiceBox(containerRef.current, {
        theme_surface: "green-felt",
        theme_colorset: "white",
        theme_material: "glass",
        theme_texture: "",
        gravity_multiplier: 600,
        light_intensity: 0.9,
        shadows: true,
        sounds: false,
        strength: 1.8,
        baseScale: 110,
        onRollComplete: () => {},
      });

      await box.initialize();
      boxRef.current = box;
    } catch (err) {
      console.error("3D dice init failed, using fallback:", err);
      setUse3D(false);
    }
  }, []);

  useEffect(() => {
    void initDiceBox();
    return () => {
      if (boxRef.current?.clear) {
        try {
          boxRef.current.clear();
        } catch {
          // noop
        }
      }
    };
  }, [initDiceBox]);

  useEffect(() => {
    if (!rolling) {
      if (value != null && !settled) {
        setSettled(true);
        onRollVisualComplete?.();
      }
      return;
    }

    setSettled(false);

    if (use3D && boxRef.current && value != null) {
      (async () => {
        try {
          if (boxRef.current.clear) boxRef.current.clear();
          await boxRef.current.roll(`1d20@${value}`);
          setSettled(true);
          onRollVisualComplete?.();
        } catch {
          setUse3D(false);
        }
      })();
    } else if (!use3D) {
      const id = window.setInterval(() => {
        setFallbackTick(Math.floor(Math.random() * 20) + 1);
      }, 80);
      return () => window.clearInterval(id);
    }
  }, [rolling, value, use3D, onRollVisualComplete, settled]);

  if (use3D) {
    return (
      <div className="rounded-lg bg-black/20">
        <div ref={containerRef} className="relative w-full" style={{ height: "200px", minHeight: "200px" }} />
        {settled && value != null && (
          <div className="pb-4 text-center">
            <p className="font-mono text-3xl font-black tabular-nums text-white">{value}</p>
            {band ? <p className={`mt-0.5 text-sm font-semibold ${bandColor(band)}`}>{bandLabel(band)}</p> : null}
          </div>
        )}
        {rolling && !settled ? <p className="animate-pulse pb-4 text-center text-sm text-white/50">Rolling...</p> : null}
      </div>
    );
  }

  const display = rolling ? (fallbackTick ?? "—") : (value ?? "—");
  const isFallbackSettled = !rolling && value != null;

  return (
    <div className="rounded-lg bg-black/20">
      <div className="relative flex flex-col items-center py-6">
        <div
          className={`absolute left-1/2 top-1/2 h-16 w-32 -translate-x-1/2 -translate-y-[40%] rounded-full blur-2xl transition-opacity duration-500 ${
            isFallbackSettled ? "opacity-50" : "opacity-30"
          }`}
          style={{ background: "radial-gradient(ellipse, rgba(245,158,11,0.6), transparent 70%)" }}
        />
        <div className={`relative h-32 w-32 ${rolling ? "animate-spin" : ""}`} style={{ perspective: "600px", transformStyle: "preserve-3d" }}>
          <div
            className="absolute inset-0"
            style={{
              clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
              background: "linear-gradient(135deg, #fbbf24 0%, #d97706 40%, #92400e 100%)",
            }}
          />
          <span className="absolute inset-0 z-10 flex items-center justify-center pb-[0.15em] font-mono text-4xl font-black tabular-nums text-white">
            {display}
          </span>
        </div>
        {isFallbackSettled && (
          <div className="mt-4 text-center">
            <p className="font-mono text-3xl font-black tabular-nums text-white">{value}</p>
            {band ? <p className={`mt-0.5 text-sm font-semibold ${bandColor(band)}`}>{bandLabel(band)}</p> : null}
          </div>
        )}
        {rolling ? <p className="mt-4 animate-pulse text-sm text-white/50">Rolling...</p> : null}
      </div>
    </div>
  );
}

