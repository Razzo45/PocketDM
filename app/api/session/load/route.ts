import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOrSetAnonUserId } from "@/lib/auth/anonUser";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const userId = await getOrSetAnonUserId();
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

    const session = await prisma.session.findFirst({
      where: { id: sessionId, campaign: { userId } },
      include: {
        campaign: {
          include: {
            world: true,
            locations: true,
            npcs: true,
            quests: true,
          },
        },
        turns: { orderBy: { turnIndex: "asc" }, take: 60 },
        snapshots: { orderBy: { turnNumber: "desc" }, take: 1 },
        memory: { where: { isActive: true }, orderBy: { updatedAt: "desc" }, take: 80 },
        events: { orderBy: { createdAt: "desc" }, take: 60 },
      },
    });

    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      session: {
        id: session.id,
        campaignId: session.campaignId,
        turnNumber: session.turnNumber,
        currentSceneId: session.currentSceneId,
        currentObjective: session.currentObjective,
        summary: session.summary,
      },
      campaign: {
        id: session.campaign.id,
        title: session.campaign.title,
        system: session.campaign.system,
        level: session.campaign.level,
        tone: session.campaign.tone,
        sessionLength: session.campaign.sessionLength,
      },
      world: session.campaign.world,
      locations: session.campaign.locations,
      npcs: session.campaign.npcs,
      quests: session.campaign.quests,
      turns: session.turns,
      snapshot: session.snapshots[0] ?? null,
      memoryFacts: session.memory,
      events: session.events,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 400 });
  }
}

