"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Turn = { turnIndex: number; role: "player" | "dm" | "system"; content: string };

export function ChatWindow(props: {
  sessionId: string;
  initialTurns: Turn[];
  onAfterTurn?: (payload: { state: any; summary: string }) => void;
}) {
  const [turns, setTurns] = useState<Turn[]>(props.initialTurns);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const lastTurnIndex = useMemo(
    () => turns.reduce((m, t) => Math.max(m, t.turnIndex), 0),
    [turns],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns.length]);

  async function send() {
    const text = message.trim();
    if (!text) return;

    setIsSending(true);
    setError(null);
    setMessage("");

    const optimisticPlayerTurn: Turn = { turnIndex: lastTurnIndex + 1, role: "player", content: text };
    setTurns((t) => [...t, optimisticPlayerTurn]);

    try {
      const res = await fetch("/api/session/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: props.sessionId, playerMessage: text }),
      });
      const json = (await res.json()) as any;
      if (!res.ok) throw new Error(json?.error ?? "Turn failed");

      const dmTurn: Turn = { turnIndex: optimisticPlayerTurn.turnIndex + 1, role: "dm", content: json.dmMessage };
      setTurns((t) => [...t, dmTurn]);

      props.onAfterTurn?.({ state: json.state, summary: json.summary });
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
      setTurns((t) => t.filter((x) => x !== optimisticPlayerTurn));
      setMessage(text);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col gap-3">
          {turns.map((t) => (
            <div
              key={t.turnIndex}
              className={[
                "max-w-[92%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm leading-6",
                t.role === "player"
                  ? "self-end bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "self-start bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100",
              ].join(" ")}
            >
              {t.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {error ? (
        <div className="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Say what you do…"
            disabled={isSending}
            className="h-10 flex-1 rounded-lg border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-800"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={isSending}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {isSending ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

