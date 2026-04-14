"use client";

import dynamic from "next/dynamic";

const D20Die = dynamic(
  () => import("./dice/D20Die").then((m) => m.D20Die),
  { ssr: false },
);

export function DiceRollCard(props: {
  reason: string;
  stakes: string;
  value?: number;
  isRolling: boolean;
  isResolved: boolean;
  lockedMessage?: string;
  onRoll: () => void;
}) {
  return (
    <div className="mx-4 mb-3 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm dark:border-violet-900/50 dark:bg-violet-950/30">
      <div className="font-semibold text-violet-900 dark:text-violet-100">Roll Required: d20</div>
      <div className="mt-1 text-violet-800 dark:text-violet-200">{props.reason}</div>
      <div className="text-xs text-violet-700 dark:text-violet-300">Stakes: {props.stakes}</div>

      <div className="mt-3 overflow-hidden rounded-lg border border-violet-200 bg-white dark:border-violet-900/60 dark:bg-zinc-950">
        <D20Die value={props.value ?? null} rolling={props.isRolling} />
      </div>

      {typeof props.value === "number" ? (
        <div className="mt-2 rounded-lg border border-violet-200 bg-violet-100 px-3 py-2 text-center dark:border-violet-800 dark:bg-violet-900/40">
          <div className="text-[11px] uppercase tracking-wide text-violet-700 dark:text-violet-300">D20 Result</div>
          <div className="text-2xl font-bold text-violet-900 dark:text-violet-100">{props.value}</div>
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={props.isRolling || props.isResolved}
          onClick={props.onRoll}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-violet-700 px-3 text-xs font-semibold text-white hover:bg-violet-600 disabled:opacity-60"
        >
          {props.isRolling ? "Rolling..." : props.isResolved ? "Resolved" : "Roll d20"}
        </button>
        {props.lockedMessage ? <span className="text-xs text-violet-700 dark:text-violet-300">{props.lockedMessage}</span> : null}
      </div>
    </div>
  );
}

