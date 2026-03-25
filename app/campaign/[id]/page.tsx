import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getOrSetAnonUserId } from "@/lib/auth/anonUser";

export default async function CampaignPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const userId = await getOrSetAnonUserId();

  const campaign = await prisma.campaign.findFirst({
    where: { id, userId },
    include: { sessions: { orderBy: { updatedAt: "desc" }, take: 1 }, world: true },
  });

  if (!campaign) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
        <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
          ← Back
        </Link>
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          Campaign not found.
        </div>
      </div>
    );
  }

  const lastSession = campaign.sessions[0];

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          PocketDM
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 pb-16">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-2xl font-semibold tracking-tight">{campaign.title}</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {campaign.system} • Level {campaign.level} • {campaign.tone}
          </p>
          <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
            {campaign.world?.summary}
          </p>

          {lastSession ? (
            <Link
              href={`/session/${lastSession.id}`}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Resume session
            </Link>
          ) : (
            <div className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
              No session yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

