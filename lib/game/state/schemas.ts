import { z } from "zod";

export const CampaignInputSchema = z.object({
  system: z.string().min(1),
  level: z.number().int().min(1).max(20),
  aestheticPrompt: z.string().min(1),
  tone: z.string().min(1),
  sessionLength: z.string().min(1),
});

export type CampaignInput = z.infer<typeof CampaignInputSchema>;

export const LocationPacketSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  secrets: z.array(z.string()).default([]),
});

export const NpcPacketSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  backstory: z.string().min(1),
  personality: z.string().min(1),
  speechStyle: z.string().min(1),
  goals: z.array(z.string()).default([]),
  secrets: z.array(z.string()).default([]),
  disposition: z.string().min(1),
});

export const QuestPacketSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  stakes: z.string().min(1),
  isMain: z.boolean(),
  initialStage: z.string().min(1),
});

export const OpeningSceneSchema = z.object({
  locationId: z.string().min(1),
  sceneId: z.string().min(1),
  text: z.string().min(1),
  impliedChoices: z.array(z.string().min(1)).min(2).max(4),
});

export const GenerateCampaignOutputSchema = z.object({
  title: z.string().min(1),
  world: z.object({
    summary: z.string().min(1),
    lore: z.array(z.string()).default([]),
    themes: z.array(z.string()).default([]),
  }),
  locations: z.array(LocationPacketSchema).min(3).max(7),
  npcs: z.array(NpcPacketSchema).min(4).max(8),
  quests: z.array(QuestPacketSchema).min(3).max(5),
  openingScene: OpeningSceneSchema,
});

export type GenerateCampaignOutput = z.infer<typeof GenerateCampaignOutputSchema>;

export const RunDmTurnOutputSchema = z.object({
  dmMessage: z.string().min(1),
  spotlight: z.object({
    locationId: z.string().optional(),
    npcIds: z.array(z.string()).default([]),
    questIds: z.array(z.string()).default([]),
  }),
  rollPrompt: z.preprocess(
    (value) => (value === null ? undefined : value),
    z
      .object({
        kind: z.literal("d20"),
        reason: z.string().min(1),
        stakes: z.string().min(1),
        promptKey: z.string().min(1),
        dc: z.number().int().min(5).max(20),
      })
      .optional(),
  ),
});

export type RunDmTurnOutput = z.infer<typeof RunDmTurnOutputSchema>;

export const StateUpdateSchema = z.object({
  currentLocationId: z.string().optional(),
  currentSceneId: z.string().optional(),
  discoveredLoreAdditions: z.array(z.string()).default([]),
  inventoryAdd: z.array(z.string()).default([]),
  inventoryRemove: z.array(z.string()).default([]),
  npcRelationshipDeltas: z
    .array(
      z.object({
        npcId: z.string(),
        delta: z.number().int().min(-5).max(5),
        note: z.string().min(1),
      }),
    )
    .default([]),
  questStageUpdates: z
    .array(
      z.object({
        questId: z.string(),
        newStage: z.string().min(1),
        status: z.enum(["AVAILABLE", "ACTIVE", "COMPLETED", "FAILED"]).optional(),
      }),
    )
    .default([]),
  commitmentFacts: z.array(z.string().min(1)).default([]),
});

export type StateUpdate = z.infer<typeof StateUpdateSchema>;

export const SummaryOutputSchema = z.object({
  sessionSummary: z.string().min(1),
  memoryFacts: z.array(z.string()).default([]),
  doNotForget: z.array(z.string()).default([]),
});

export type SummaryOutput = z.infer<typeof SummaryOutputSchema>;

export const RuntimeStateSchema = z.object({
  party: z.object({
    name: z.string().default("The party"),
    level: z.number().int().min(1).max(20),
    hpAbstract: z.string().default("OK"),
  }),
  inventory: z.array(z.string()).default([]),
  discoveredLore: z.array(z.string()).default([]),
  npcRelationships: z.record(z.string(), z.number().int().min(-10).max(10)).default({}),
  questStages: z.record(z.string(), z.string()).default({}),
  pinnedFacts: z.array(z.string()).default([]),
  commitments: z.array(z.string()).default([]),
  lastRoll: z
    .object({
      type: z.literal("d20"),
      value: z.number().int().min(1).max(20),
      reason: z.string(),
      turnNumber: z.number().int().min(0),
    })
    .optional(),
  resolvedRollPromptKeys: z.array(z.string()).default([]),
  currentLocationId: z.string().optional(),
  currentSceneId: z.string().optional(),
});

export type RuntimeState = z.infer<typeof RuntimeStateSchema>;

