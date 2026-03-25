"use client";

export function WorldPanel(props: { title: string; summary?: string; objective?: string; sessionSummary?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          World
        </div>
        <div className="text-base font-semibold">{props.title}</div>
      </div>

      {props.objective ? (
        <div className="mt-3">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Current objective
          </div>
          <div className="mt-1 text-zinc-900 dark:text-zinc-100">{props.objective}</div>
        </div>
      ) : null}

      {props.summary ? (
        <div className="mt-3">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Setting
          </div>
          <div className="mt-1 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{props.summary}</div>
        </div>
      ) : null}

      {props.sessionSummary ? (
        <div className="mt-3">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Session summary
          </div>
          <div className="mt-1 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {props.sessionSummary}
          </div>
        </div>
      ) : null}
    </div>
  );
}

