import { getAiProvider } from "../index";
import type { ChatMessage } from "../provider";
import { RunDmTurnOutputSchema, type RunDmTurnOutput, type RuntimeState } from "../../game/state/schemas";

export type RunDmTurnInput = {
  system: string;
  tone: string;
  sessionLength: string;
  worldSummary: string;
  relevantNpcs: Array<{ id: string; name: string; speechStyle: string; disposition: string; goals: string[] }>;
  relevantLocations: Array<{ id: string; name: string; description: string }>;
  activeQuests: Array<{ id: string; title: string; stage: string; stakes: string; isMain: boolean }>;
  recentTurns: Array<{ role: "player" | "dm"; content: string }>;
  state: RuntimeState;
};

function buildPrompt(input: RunDmTurnInput): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "You are the Dungeon Master. Theatre-of-the-mind only. Keep the world coherent and small. " +
        "Offer 2-4 implied choices, but allow freeform input. No combat simulation. Output STRICT JSON only.",
    },
    {
      role: "user",
      content: JSON.stringify({
        task: "runDungeonMasterTurn",
        rulesStyle: "light",
        constraints: {
          maxActiveNpcInScene: 3,
          noRetcons: true,
          noNewMajorLore: true,
        },
        context: input,
        outputShape: {
          dmMessage: "string",
          spotlight: { locationId: "string?", npcIds: ["string"], questIds: ["string"] },
        },
      }),
    },
  ];
}

export async function runDmTurn(input: RunDmTurnInput): Promise<RunDmTurnOutput> {
  const provider = getAiProvider();
  const result = await provider.generateText({
    messages: buildPrompt(input),
    temperature: 0.8,
    maxOutputTokens: 900,
    jsonMode: true,
  });

  const parsed = JSON.parse(result.text);
  return RunDmTurnOutputSchema.parse(parsed);
}

