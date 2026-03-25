"use client";

type Quest = { id: string; title: string; status: string; isMain: boolean };

export function QuestPanel(props: { quests: Quest[] }) {
  const main = props.quests.find((q) => q.isMain);
  const side = props.quests.filter((q) => !q.isMain);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Quests</div>

      <div className="mt-2 flex flex-col gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Main
          </div>
          {main ? (
            <div className="mt-1 rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
              <div className="font-medium text-zinc-900 dark:text-zinc-100">{main.title}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">{main.status}</div>
            </div>
          ) : (
            <div className="mt-1 text-zinc-600 dark:text-zinc-400">No main quest.</div>
          )}
        </div>

        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Side developments
          </div>
          <div className="mt-1 flex flex-col gap-2">
            {side.length ? (
              side.slice(0, 4).map((q) => (
                <div key={q.id} className="rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">{q.title}</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">{q.status}</div>
                </div>
              ))
            ) : (
              <div className="text-zinc-600 dark:text-zinc-400">No side quests.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

