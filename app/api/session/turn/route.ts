import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOrSetAnonUserId } from "@/lib/auth/anonUser";
import { buildCompactStateForContext, selectRecentTurnsForContext } from "@/lib/game/state/memory";
import { applyStateUpdate } from "@/lib/game/state/stateManager";
import { extractStateUpdate } from "@/lib/ai/jobs/extractStateUpdate";
import { runDmTurn } from "@/lib/ai/jobs/runDmTurn";
import { summarizeSession } from "@/lib/ai/jobs/summarizeSession";
import { RuntimeStateSchema } from "@/lib/game/state/schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const userId = await getOrSetAnonUserId();
    const body = (await req.json()) as { sessionId?: string; playerMessage?: string };
    if (!body.sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    if (!body.playerMessage || !body.playerMessage.trim())
      return NextResponse.json({ error: "Missing playerMessage" }, { status: 400 });

    const session = await prisma.session.findFirst({
      where: { id: body.sessionId, campaign: { userId } },
      include: {
        campaign: {
          include: { world: true, locations: true, npcs: true, quests: true },
        },
        turns: { orderBy: { turnIndex: "asc" }, take: 60 },
        snapshots: { orderBy: { turnNumber: "desc" }, take: 1 },
      },
    });

    if (!session || !session.campaign.world) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const latestSnapshot = session.snapshots[0];
    const previousState = RuntimeStateSchema.parse(latestSnapshot?.jsonState ?? { party: { level: session.campaign.level } });
    const compactState = buildCompactStateForContext(previousState);

    const existingTurns = session.turns.map((t) => ({
      role: t.role === "player" ? ("player" as const) : ("dm" as const),
      content: t.content,
    }));
    const recentTurns = selectRecentTurnsForContext(existingTurns, 10);

    const nextTurnIndex = (session.turns.at(-1)?.turnIndex ?? 0) + 1;
    await prisma.turn.create({
      data: {
        sessionId: session.id,
        turnIndex: nextTurnIndex,
        role: "player",
        content: body.playerMessage.trim(),
      },
    });

    const activeQuests = session.campaign.quests.map((q) => ({
      id: q.id,
      title: q.title,
      stage: (previousState.questStages[q.id] ?? (q.stateJson as any)?.stage ?? "Unknown") as string,
      stakes: q.stakes,
      isMain: q.isMain,
    }));

    const dm = await runDmTurn({
      system: session.campaign.system,
      tone: session.campaign.tone,
      sessionLength: session.campaign.sessionLength,
      worldSummary: session.campaign.world.summary,
      relevantNpcs: session.campaign.npcs.slice(0, 6).map((n) => ({
        id: n.id,
        name: n.name,
        speechStyle: n.speechStyle,
        disposition: n.disposition,
        goals: (n.goalsJson as any[])?.filter((x) => typeof x === "string") ?? [],
      })),
      relevantLocations: session.campaign.locations.slice(0, 6).map((l) => ({
        id: l.id,
        name: l.name,
        description: l.description,
      })),
      activeQuests: activeQuests.slice(0, 5),
      recentTurns: [...recentTurns, { role: "player", content: body.playerMessage.trim() }],
      state: compactState,
    });

    const dmTurnIndex = nextTurnIndex + 1;
    await prisma.turn.create({
      data: {
        sessionId: session.id,
        turnIndex: dmTurnIndex,
        role: "dm",
        content: dm.dmMessage,
      },
    });

    const update = await extractStateUpdate({
      system: session.campaign.system,
      worldSummary: session.campaign.world.summary,
      state: compactState,
      lastPlayerMessage: body.playerMessage.trim(),
      lastDmMessage: dm.dmMessage,
    });

    const nextState = applyStateUpdate(previousState, update);

    const newTurnNumber = session.turnNumber + 1;
    const shouldSummarize = newTurnNumber % 10 === 0;

    let summary = session.summary;
    if (shouldSummarize) {
      const turnsForSummary = await prisma.turn.findMany({
        where: { sessionId: session.id },
        orderBy: { turnIndex: "asc" },
        take: 30,
      });
      const recent = turnsForSummary.slice(-16).map((t) => ({
        role: t.role === "player" ? ("player" as const) : ("dm" as const),
        content: t.content,
      }));

      const sum = await summarizeSession({
        system: session.campaign.system,
        tone: session.campaign.tone,
        worldSummary: session.campaign.world.summary,
        state: buildCompactStateForContext(nextState),
        recentTurns: recent,
        priorSummary: session.summary,
      });
      summary = sum.sessionSummary;
    }

    await prisma.$transaction([
      prisma.session.update({
        where: { id: session.id },
        data: {
          turnNumber: newTurnNumber,
          currentSceneId: nextState.currentSceneId,
          currentObjective: session.currentObjective,
          summary,
        },
      }),
      prisma.stateSnapshot.create({
        data: { sessionId: session.id, turnNumber: newTurnNumber, jsonState: nextState },
      }),
    ]);

    return NextResponse.json({
      dmMessage: dm.dmMessage,
      state: nextState,
      summary,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 400 });
  }
}

