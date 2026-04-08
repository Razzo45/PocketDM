"use client";

import dynamic from "next/dynamic";

const ThreeDiceRoll = dynamic(
  () => import("./dice/ThreeDiceRoll").then((m) => m.ThreeDiceRoll),
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
        <ThreeDiceRoll isRolling={props.isRolling} targetValue={props.value} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={props.isRolling || props.isResolved}
          onClick={props.onRoll}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-violet-700 px-3 text-xs font-semibold text-white hover:bg-violet-600 disabled:opacity-60"
        >
          {props.isRolling ? "Rolling..." : props.isResolved ? "Resolved" : "Roll d20"}
        </button>
        {props.value ? <span className="text-xs font-medium text-violet-800 dark:text-violet-200">Result: {props.value}</span> : null}
        {props.lockedMessage ? <span className="text-xs text-violet-700 dark:text-violet-300">{props.lockedMessage}</span> : null}
      </div>
    </div>
  );
}

