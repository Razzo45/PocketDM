"use client";

import { useState } from "react";

type CampaignCreateResponse = { campaignId: string; sessionId: string };

export function CampaignForm() {
  const [system, setSystem] = useState("D&D 5e (lite)");
  const [level, setLevel] = useState(3);
  const [tone, setTone] = useState("Adventurous");
  const [sessionLength, setSessionLength] = useState("20 minutes");
  const [aestheticPrompt, setAestheticPrompt] = useState(
    "Misty highlands, crumbling watchtowers, and an old road with strange lanterns that never go out.",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaign/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, level, aestheticPrompt, tone, sessionLength }),
      });
      const json = (await res.json()) as any;
      if (!res.ok) throw new Error(json?.error ?? "Failed to create campaign");

      const data = json as CampaignCreateResponse;
      window.location.href = `/session/${data.sessionId}`;
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">PocketDM</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Generate a compact world and play a short theatre-of-the-mind adventure.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">System</span>
          <input
            className="h-10 rounded-lg border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-800"
            value={system}
            onChange={(e) => setSystem(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Starting level</span>
          <input
            className="h-10 rounded-lg border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-800"
            type="number"
            min={1}
            max={20}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Tone</span>
          <input
            className="h-10 rounded-lg border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-800"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Session length</span>
          <input
            className="h-10 rounded-lg border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-800"
            value={sessionLength}
            onChange={(e) => setSessionLength(e.target.value)}
          />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-1">
        <span className="text-sm font-medium">Aesthetic prompt</span>
        <textarea
          className="min-h-28 resize-y rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-800"
          value={aestheticPrompt}
          onChange={(e) => setAestheticPrompt(e.target.value)}
        />
      </label>

      {error ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {isLoading ? "Generating…" : "Generate campaign"}
        </button>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Requires an AI key (e.g. <code className="font-mono">OPENROUTER_API_KEY</code>).
        </p>
      </div>
    </div>
  );
}

