"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DiceRollCard } from "./DiceRollCard";

type Turn = {
  turnIndex: number;
  role: "player" | "dm" | "system";
  content: string;
  metadataJson?: { rollPrompt?: RollPrompt };
};
type RollPrompt = { kind: "d20"; reason: string; stakes: string; promptKey: string; sourceTurnIndex?: number };

export function ChatWindow(props: {
  sessionId: string;
  initialTurns: Turn[];
  initialRollPrompt?: RollPrompt | null;
  onAfterTurn?: (payload: { state: any; summary: string }) => void;
}) {
  const [turns, setTurns] = useState<Turn[]>(props.initialTurns);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rollPrompt, setRollPrompt] = useState<RollPrompt | null>(props.initialRollPrompt ?? null);
  const [rollValue, setRollValue] = useState<number | undefined>(undefined);
  const [rollLocked, setRollLocked] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const lastTurnIndex = useMemo(
    () => turns.reduce((m, t) => Math.max(m, t.turnIndex), 0),
    [turns],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns.length]);

  function makeIdempotencyKey(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  async function send(payload?: { text?: string; rollContext?: { promptKey: string; reason: string; value: number } }) {
    const text = (payload?.text ?? message).trim();
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
        body: JSON.stringify({
          sessionId: props.sessionId,
          playerMessage: text,
          rollContext: payload?.rollContext,
          idempotencyKey: makeIdempotencyKey("turn"),
        }),
      });
      const json = (await res.json()) as any;
      if (!res.ok) throw new Error(json?.error ?? "Turn failed");

      const dmTurn: Turn = {
        turnIndex: optimisticPlayerTurn.turnIndex + 1,
        role: "dm",
        content: json.dmMessage,
        metadataJson: json.rollPrompt ? { rollPrompt: json.rollPrompt } : undefined,
      };
      setTurns((t) => [...t, dmTurn]);
      setRollPrompt(
        json.rollPrompt
          ? ({
              ...(json.rollPrompt as RollPrompt),
              sourceTurnIndex: json.rollPromptTurnIndex ?? dmTurn.turnIndex,
            } as RollPrompt)
          : null,
      );
      setRollValue(undefined);
      setRollLocked(false);

      props.onAfterTurn?.({ state: json.state, summary: json.summary });
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
      setTurns((t) => t.filter((x) => x !== optimisticPlayerTurn));
      setMessage(text);
    } finally {
      setIsSending(false);
    }
  }

  async function sendHiddenRollContext(payload: { rollContext: { promptKey: string; reason: string; value: number } }) {
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch("/api/session/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: props.sessionId,
          hiddenContext: `Resolved d20 roll for "${payload.rollContext.reason}" with result ${payload.rollContext.value}.`,
          rollContext: payload.rollContext,
          idempotencyKey: makeIdempotencyKey("turn-hidden"),
        }),
      });
      const json = (await res.json()) as any;
      if (!res.ok) throw new Error(json?.error ?? "Turn failed");

      const dmTurn: Turn = {
        turnIndex: (turns.at(-1)?.turnIndex ?? 0) + 1,
        role: "dm",
        content: json.dmMessage,
        metadataJson: json.rollPrompt ? { rollPrompt: json.rollPrompt } : undefined,
      };
      setTurns((t) => [...t, dmTurn]);
      setRollPrompt(
        json.rollPrompt
          ? ({
              ...(json.rollPrompt as RollPrompt),
              sourceTurnIndex: json.rollPromptTurnIndex ?? dmTurn.turnIndex,
            } as RollPrompt)
          : null,
      );
      setRollValue(undefined);
      setRollLocked(false);
      props.onAfterTurn?.({ state: json.state, summary: json.summary });
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setIsSending(false);
    }
  }

  async function resolveRoll() {
    if (!rollPrompt || isRolling) return;
    setIsRolling(true);
    setError(null);
    try {
      const rollRes = await fetch("/api/session/roll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: props.sessionId,
          reason: rollPrompt.reason,
          promptKey: rollPrompt.promptKey,
          idempotencyKey: makeIdempotencyKey("roll"),
        }),
      });
      const rollJson = (await rollRes.json()) as any;
      if (!rollRes.ok) throw new Error(rollJson?.error ?? "Roll failed");
      setRollValue(rollJson.value);
      setRollLocked(true);
      setIsRolling(false);

      await sendHiddenRollContext({
        rollContext: {
          promptKey: rollPrompt.promptKey,
          reason: rollPrompt.reason,
          value: rollJson.value,
        },
      });
    } catch (e: any) {
      setError(e?.message ?? "Roll failed");
    } finally {
      setIsRolling(false);
      setRollPrompt(null);
      setRollLocked(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col gap-3">
          {turns
            .filter((turn) => turn.role !== "system")
            .map((t) => (
            <div key={t.turnIndex} className="contents">
              <div
                className={[
                  "max-w-[92%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm leading-6",
                  t.role === "player"
                    ? "self-end bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "self-start bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100",
                ].join(" ")}
              >
                {t.content}
              </div>
              {rollPrompt && rollPrompt.sourceTurnIndex === t.turnIndex ? (
                <div className="self-start max-w-[92%]">
                  <DiceRollCard
                    reason={rollPrompt.reason}
                    stakes={rollPrompt.stakes}
                    isRolling={isRolling}
                    value={rollValue}
                    isResolved={typeof rollValue === "number" && !isRolling}
                    lockedMessage={rollLocked && typeof rollValue === "number" ? `Roll locked (${rollValue}). Narrating outcome...` : undefined}
                    onRoll={() => void resolveRoll()}
                  />
                </div>
              ) : null}
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

