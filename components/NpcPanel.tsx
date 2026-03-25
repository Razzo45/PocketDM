"use client";

type Npc = { id: string; name: string; role: string; disposition: string };

export function NpcPanel(props: { npcs: Npc[] }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">NPCs</div>
      <div className="mt-2 flex flex-col gap-2">
        {props.npcs.length ? (
          props.npcs.slice(0, 8).map((n) => (
            <div key={n.id} className="rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
              <div className="font-medium text-zinc-900 dark:text-zinc-100">{n.name}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                {n.role} • {n.disposition}
              </div>
            </div>
          ))
        ) : (
          <div className="text-zinc-600 dark:text-zinc-400">No NPCs loaded.</div>
        )}
      </div>
    </div>
  );
}

