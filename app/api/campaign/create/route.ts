import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOrSetAnonUserId } from "@/lib/auth/anonUser";
import { CampaignInputSchema, RuntimeStateSchema } from "@/lib/game/state/schemas";
import { generateCampaign } from "@/lib/ai/jobs/generateCampaign";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const userId = await getOrSetAnonUserId();
    const body = await req.json();
    const input = CampaignInputSchema.parse(body);

    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId },
      update: {},
    });

    const packet = await generateCampaign(input);

    const campaign = await prisma.campaign.create({
      data: {
        userId,
        title: packet.title,
        system: input.system,
        level: input.level,
        aestheticPrompt: input.aestheticPrompt,
        tone: input.tone,
        sessionLength: input.sessionLength,
        world: {
          create: {
            summary: packet.world.summary,
            loreJson: packet.world.lore,
            themesJson: packet.world.themes,
          },
        },
        locations: {
          create: packet.locations.map((l) => ({
            name: l.name,
            description: l.description,
            secretsJson: l.secrets,
            stateJson: {},
            isDiscovered: l.id === packet.openingScene.locationId,
          })),
        },
        npcs: {
          create: packet.npcs.map((n) => ({
            name: n.name,
            role: n.role,
            backstory: n.backstory,
            personality: n.personality,
            speechStyle: n.speechStyle,
            goalsJson: n.goals,
            secretsJson: n.secrets,
            disposition: n.disposition,
            relationshipStateJson: {},
          })),
        },
        quests: {
          create: packet.quests.map((q) => ({
            title: q.title,
            description: q.description,
            stakes: q.stakes,
            isMain: q.isMain,
            stateJson: { stage: q.initialStage },
          })),
        },
      },
      include: {
        quests: true,
      },
    });

    const questStages: Record<string, string> = {};
    for (const q of campaign.quests) {
      const stage = (q.stateJson as any)?.stage;
      if (typeof stage === "string") questStages[q.id] = stage;
    }

    const initialState = RuntimeStateSchema.parse({
      party: { level: input.level },
      inventory: [],
      discoveredLore: [],
      npcRelationships: {},
      questStages,
      pinnedFacts: [],
      commitments: [],
      resolvedRollPromptKeys: [],
      currentLocationId: packet.openingScene.locationId,
      currentSceneId: packet.openingScene.sceneId,
    });

    const session = await prisma.session.create({
      data: {
        campaignId: campaign.id,
        turnNumber: 0,
        currentSceneId: initialState.currentSceneId,
        currentObjective: campaign.quests.find((q) => q.isMain)?.title ?? "Survive the opening scene",
        summary: "",
        turns: {
          create: [
            {
              turnIndex: 0,
              role: "dm",
              content:
                packet.openingScene.text +
                "\n\nChoices: " +
                packet.openingScene.impliedChoices.map((c) => `- ${c}`).join("\n"),
            },
          ],
        },
        snapshots: {
          create: [
            {
              turnNumber: 0,
              jsonState: initialState,
            },
          ],
        },
      },
    });

    return NextResponse.json({
      campaignId: campaign.id,
      sessionId: session.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message ?? "Unknown error",
      },
      { status: 400 },
    );
  }
}

