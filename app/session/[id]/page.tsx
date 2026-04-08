import { prisma } from "@/lib/db/prisma";
import { getOrSetAnonUserId } from "@/lib/auth/anonUser";
import { ChatWindow } from "@/components/ChatWindow";
import { WorldPanel } from "@/components/WorldPanel";
import { NpcPanel } from "@/components/NpcPanel";
import { QuestPanel } from "@/components/QuestPanel";
import Link from "next/link";

export default async function SessionPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const userId = await getOrSetAnonUserId();

  const session = await prisma.session.findFirst({
    where: { id, campaign: { userId } },
    include: {
      campaign: { include: { world: true, npcs: true, quests: true } },
      turns: { orderBy: { turnIndex: "asc" }, take: 60 },
      snapshots: { orderBy: { turnNumber: "desc" }, take: 1 },
    },
  });

  if (!session || !session.campaign.world) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
        <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
          ← Back
        </Link>
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          Session not found.
        </div>
      </div>
    );
  }

  const latestSnapshot = session.snapshots[0];
  const resolvedPromptKeys =
    ((latestSnapshot?.jsonState as any)?.resolvedRollPromptKeys as string[] | undefined) ?? [];
  const latestDmWithPrompt = [...session.turns]
    .reverse()
    .find((t) => t.role === "dm" && (t.metadataJson as any)?.rollPrompt);
  const rawPrompt = latestDmWithPrompt ? ((latestDmWithPrompt.metadataJson as any)?.rollPrompt as any) : null;
  const initialRollPrompt =
    rawPrompt && !resolvedPromptKeys.includes(rawPrompt.promptKey)
      ? {
          ...rawPrompt,
          sourceTurnIndex: latestDmWithPrompt!.turnIndex,
        }
      : null;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          PocketDM
        </Link>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {session.campaign.system} • Level {session.campaign.level} • {session.campaign.tone}
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-6 pb-16 lg:grid-cols-[1fr_360px]">
        <div className="h-[calc(100vh-140px)] min-h-[560px]">
          <ChatWindow sessionId={session.id} initialTurns={session.turns as any} initialRollPrompt={initialRollPrompt} />
        </div>

        <aside className="flex flex-col gap-4">
          <WorldPanel
            title={session.campaign.title}
            summary={session.campaign.world.summary}
            objective={session.currentObjective ?? undefined}
            sessionSummary={session.summary || undefined}
          />
          <QuestPanel
            quests={session.campaign.quests.map((q) => ({
              id: q.id,
              title: q.title,
              status: q.status,
              isMain: q.isMain,
            }))}
          />
          <NpcPanel
            npcs={session.campaign.npcs.map((n) => ({
              id: n.id,
              name: n.name,
              role: n.role,
              disposition: n.disposition,
            }))}
          />
        </aside>
      </main>
    </div>
  );
}

