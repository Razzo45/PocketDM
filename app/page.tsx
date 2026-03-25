import Link from "next/link";
import { CampaignForm } from "@/components/CampaignForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-sm font-semibold tracking-tight">PocketDM</div>
        <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/campaign/new" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            New campaign
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="mb-8 max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            A Dungeon Master in your pocket.
          </h1>
          <p className="mt-3 text-base leading-7 text-zinc-700 dark:text-zinc-300">
            Text-first, theatre-of-the-mind adventures. Small worlds. Coherent state. Light rules.
          </p>
        </div>

        <CampaignForm />
      </main>
    </div>
  );
}
