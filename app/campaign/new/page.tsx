import { CampaignForm } from "@/components/CampaignForm";
import Link from "next/link";

export default function NewCampaignPage() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          PocketDM
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-16">
        <CampaignForm />
      </main>
    </div>
  );
}

