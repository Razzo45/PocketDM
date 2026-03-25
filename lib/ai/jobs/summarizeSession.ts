import { getAiProvider } from "../index";
import type { ChatMessage } from "../provider";
import { SummaryOutputSchema, type SummaryOutput, type RuntimeState } from "../../game/state/schemas";

export type SummarizeSessionInput = {
  system: string;
  tone: string;
  worldSummary: string;
  state: RuntimeState;
  recentTurns: Array<{ role: "player" | "dm"; content: string }>;
  priorSummary: string;
};

function buildPrompt(input: SummarizeSessionInput): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "You summarize a text RPG session to preserve coherence. " +
        "Only include stable facts and unresolved hooks. Output STRICT JSON only.",
    },
    {
      role: "user",
      content: JSON.stringify({
        task: "summarizeSession",
        context: input,
        outputShape: {
          sessionSummary: "string",
          memoryFacts: ["string"],
          doNotForget: ["string"],
        },
        rules: [
          "Do not add new lore.",
          "Prefer names, promises, debts, revealed secrets, and current objective.",
          "Keep memoryFacts short and atomic.",
        ],
      }),
    },
  ];
}

export async function summarizeSession(input: SummarizeSessionInput): Promise<SummaryOutput> {
  const provider = getAiProvider();
  const result = await provider.generateText({
    messages: buildPrompt(input),
    temperature: 0.3,
    maxOutputTokens: 700,
    jsonMode: true,
  });

  const parsed = JSON.parse(result.text);
  return SummaryOutputSchema.parse(parsed);
}

