import { getAiProvider } from "../index";
import type { ChatMessage } from "../provider";
import { StateUpdateSchema, type RuntimeState, type StateUpdate } from "../../game/state/schemas";

export type ExtractStateUpdateInput = {
  system: string;
  worldSummary: string;
  state: RuntimeState;
  lastPlayerMessage: string;
  lastDmMessage: string;
};

function buildPrompt(input: ExtractStateUpdateInput): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "You extract structured state updates from a text RPG conversation. " +
        "Be conservative: do not invent facts; only update what is clearly implied. Output STRICT JSON only.",
    },
    {
      role: "user",
      content: JSON.stringify({
        task: "extractStateUpdate",
        context: input,
        outputShape: {
          currentLocationId: "string?",
          currentSceneId: "string?",
          discoveredLoreAdditions: ["string"],
          inventoryAdd: ["string"],
          inventoryRemove: ["string"],
          npcRelationshipDeltas: [{ npcId: "string", delta: "int(-5..5)", note: "string" }],
          questStageUpdates: [{ questId: "string", newStage: "string", status: "AVAILABLE|ACTIVE|COMPLETED|FAILED?" }],
        },
        hardRules: ["If uncertain, omit the field rather than guessing.", "Never remove inventory unless explicitly lost/spent."],
      }),
    },
  ];
}

export async function extractStateUpdate(input: ExtractStateUpdateInput): Promise<StateUpdate> {
  const provider = getAiProvider();
  const result = await provider.generateText({
    messages: buildPrompt(input),
    temperature: 0.2,
    maxOutputTokens: 700,
    jsonMode: true,
  });

  const parsed = JSON.parse(result.text);
  return StateUpdateSchema.parse(parsed);
}

