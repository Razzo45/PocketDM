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
  pinnedFacts?: string[];
  rollContext?: {
    promptKey: string;
    reason: string;
    value: number;
    dc?: number;
    band?: "critical_fail" | "fail" | "success" | "moderate_success" | "critical_success";
  };
};

function buildPrompt(input: RunDmTurnInput): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "You are the Dungeon Master. Theatre-of-the-mind only. Keep the world coherent and small. " +
        "Offer 2-4 implied choices, but allow freeform input. No combat simulation. Output STRICT JSON only. " +
        "Never contradict established facts from prior turns, pinned facts, or active scene details.",
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
          d20Only: true,
          rollPromptPolicy: "Suggest rolls only when failure is interesting and the action is impactful",
          noContradictions: true,
          continuityPriority: "Recent established facts must remain consistent",
        },
        context: input,
        outputShape: {
          dmMessage: "string",
          spotlight: { locationId: "string?", npcIds: ["string"], questIds: ["string"] },
          rollPrompt: { kind: "\"d20\"", reason: "string", stakes: "string", promptKey: "string", dc: "number(5..20)" },
        },
        hardRules: [
          "If rollContext is present, narrate outcome from that roll and do not request another roll for same action.",
          "Never require more than one pending roll at a time.",
          "Do not request a roll for trivial movement or casual dialogue.",
          "Request a roll when the player attempts high-impact uncertain actions where both success and failure create interesting outcomes.",
          "Use d20 policy bands: 1 critical fail, 2-9 fail, 10 success, 11-19 moderate success, 20 critical success.",
          "When requesting a roll, set dc to reflect difficulty: easy ~10, medium ~12-14, hard >=15.",
        ],
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

