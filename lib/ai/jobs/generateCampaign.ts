import { getAiProvider } from "../index";
import type { ChatMessage } from "../provider";
import { GenerateCampaignOutputSchema, type CampaignInput, type GenerateCampaignOutput } from "../../game/state/schemas";
import { z } from "zod";

function buildPrompt(input: CampaignInput): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "You are an expert tabletop Dungeon Master. Create small, coherent, theatre-of-the-mind fantasy adventures. " +
        "Keep the world small (one region), avoid retcons, avoid sprawling lore. Output STRICT JSON only.",
    },
    {
      role: "user",
      content: JSON.stringify({
        task: "generateCampaignPacket",
        constraints: {
          option: "A_storyteller_first_light_rules",
          maxActiveNpcInScene: 3,
          locationsCount: "3-7",
          npcsCount: "4-8",
          oneMainQuest: true,
          sideDevelopments: "2-4",
        },
        input,
        outputShape: {
          title: "string",
          world: { summary: "string", lore: ["string"], themes: ["string"] },
          locations: [{ id: "string", name: "string", description: "string", secrets: ["string"] }],
          npcs: [
            {
              id: "string",
              name: "string",
              role: "string",
              backstory: "string",
              personality: "string",
              speechStyle: "string",
              goals: ["string"],
              secrets: ["string"],
              disposition: "string",
            },
          ],
          quests: [{ id: "string", title: "string", description: "string", stakes: "string", isMain: "boolean", initialStage: "string" }],
          openingScene: { locationId: "string", sceneId: "string", text: "string", impliedChoices: ["string"] },
        },
        hardRules: [
          "Do not introduce more than 8 NPCs total.",
          "Do not introduce more than 7 locations.",
          "Always output at least 4 NPCs and at least 3 quests.",
          "IDs must be short stable strings (kebab-case).",
          "Opening scene must start in medias res with immediate tension.",
        ],
      }),
    },
  ];
}

function buildRepairPrompt(params: {
  input: CampaignInput;
  previousJsonText: string;
  issues: unknown;
}): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "You are repairing a JSON campaign packet for a small fantasy adventure. " +
        "Output STRICT JSON only. Do not add extra keys. Ensure counts meet requirements.",
    },
    {
      role: "user",
      content: JSON.stringify({
        task: "repairCampaignPacket",
        requirements: { locationsMin: 3, locationsMax: 7, npcsMin: 4, npcsMax: 8, questsMin: 3, questsMax: 5 },
        input: params.input,
        validationIssues: params.issues,
        previousJsonText: params.previousJsonText,
        instructions: [
          "Return a full corrected JSON object (not a patch).",
          "If npcs is too small, add distinct NPCs consistent with the setting.",
          "If quests is too small, add side developments (keep exactly 1 main quest).",
          "Keep IDs short kebab-case strings, and ensure openingScene.locationId exists in locations[].id.",
        ],
      }),
    },
  ];
}

export async function generateCampaign(input: CampaignInput): Promise<GenerateCampaignOutput> {
  const provider = getAiProvider();
  let lastText = "";
  let lastIssues: unknown = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const messages =
      attempt === 0
        ? buildPrompt(input)
        : buildRepairPrompt({ input, previousJsonText: lastText, issues: lastIssues });

    const result = await provider.generateText({
      messages,
      temperature: attempt === 0 ? 0.8 : 0.5,
      maxOutputTokens: 1600,
      jsonMode: true,
    });

    lastText = result.text;
    try {
      const parsed = JSON.parse(result.text);
      return GenerateCampaignOutputSchema.parse(parsed);
    } catch (err) {
      if (err instanceof z.ZodError) {
        lastIssues = err.issues;
        continue;
      }
      // JSON parse or other error: provide a minimal issue payload to the repair step
      lastIssues = { message: (err as any)?.message ?? String(err) };
    }
  }

  throw new Error(`generateCampaign failed validation after retries: ${JSON.stringify(lastIssues)}`);
}

