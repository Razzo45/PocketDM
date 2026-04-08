import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOrSetAnonUserId } from "@/lib/auth/anonUser";
import { buildCompactStateForContext, buildContextBundle } from "@/lib/game/state/memory";
import { applyStateUpdate } from "@/lib/game/state/stateManager";
import { extractStateUpdate } from "@/lib/ai/jobs/extractStateUpdate";
import { runDmTurn } from "@/lib/ai/jobs/runDmTurn";
import { summarizeSession } from "@/lib/ai/jobs/summarizeSession";
import { RuntimeStateSchema } from "@/lib/game/state/schemas";

export const runtime = "nodejs";

type TurnRequest = {
  sessionId?: string;
  playerMessage?: string;
  idempotencyKey?: string;
  rollContext?: {
    promptKey: string;
    reason: string;
    value: number;
  };
};

export async function POST(req: Request) {
  try {
    const userId = await getOrSetAnonUserId();
    const body = (await req.json()) as TurnRequest;
    if (!body.sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    if (!body.playerMessage || !body.playerMessage.trim())
      return NextResponse.json({ error: "Missing playerMessage" }, { status: 400 });

    if (body.idempotencyKey) {
      const cached = await prisma.processedRequest.findFirst({
        where: {
          sessionId: body.sessionId,
          route: "session.turn",
          idempotencyKey: body.idempotencyKey,
        },
      });
      if (cached) {
        return NextResponse.json(cached.responseJson);
      }
    }

    const session = await prisma.session.findFirst({
      where: { id: body.sessionId, campaign: { userId } },
      include: {
        campaign: {
          include: { world: true, locations: true, npcs: true, quests: true },
        },
        turns: { orderBy: { turnIndex: "asc" }, take: 60 },
        snapshots: { orderBy: { turnNumber: "desc" }, take: 1 },
        memory: { where: { isActive: true }, orderBy: { updatedAt: "desc" }, take: 80 },
      },
    });

    if (!session || !session.campaign.world) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const latestSnapshot = session.snapshots[0];
    const previousState = RuntimeStateSchema.parse(
      latestSnapshot?.jsonState ?? {
        party: { level: session.campaign.level },
        pinnedFacts: [],
        commitments: [],
        resolvedRollPromptKeys: [],
      },
    );

    const existingTurns = session.turns
      .filter((t) => t.role === "player" || t.role === "dm")
      .map((t) => ({
        role: t.role as "player" | "dm",
        content: t.content,
      }));
    const pinnedFacts = session.memory.filter((m) => m.type === "PINNED" || m.type === "COMMITMENT").map((m) => m.fact);
    const compactFacts = session.memory.filter((m) => m.type === "COMPACT").map((m) => m.fact);
    const context = buildContextBundle({
      state: previousState,
      recentTurns: existingTurns,
      pinnedFacts,
      compactFacts,
    });

    const nextTurnIndex = (session.turns.at(-1)?.turnIndex ?? 0) + 1;
    await prisma.turn.create({
      data: {
        sessionId: session.id,
        turnIndex: nextTurnIndex,
        role: "player",
        content: body.playerMessage.trim(),
        metadataJson: body.rollContext ? { rollContext: body.rollContext } : undefined,
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
      recentTurns: [...context.recentTurns, { role: "player", content: body.playerMessage.trim() }],
      state: context.state,
      pinnedFacts: context.pinnedFacts,
      rollContext: body.rollContext,
    });

    const safeRollPrompt =
      dm.rollPrompt && previousState.resolvedRollPromptKeys.includes(dm.rollPrompt.promptKey)
        ? undefined
        : dm.rollPrompt;

    const dmTurnIndex = nextTurnIndex + 1;
    await prisma.turn.create({
      data: {
        sessionId: session.id,
        turnIndex: dmTurnIndex,
        role: "dm",
        content: dm.dmMessage,
        metadataJson: safeRollPrompt ? { rollPrompt: safeRollPrompt } : undefined,
      },
    });

    const update = await extractStateUpdate({
      system: session.campaign.system,
      worldSummary: session.campaign.world.summary,
      state: context.state,
      lastPlayerMessage: body.playerMessage.trim(),
      lastDmMessage: dm.dmMessage,
    });

    const nextState = applyStateUpdate(previousState, update, {
      rollResult: body.rollContext
        ? {
            value: body.rollContext.value,
            reason: body.rollContext.reason,
          }
        : undefined,
      resolvedPromptKey: body.rollContext?.promptKey,
      turnNumber: session.turnNumber + 1,
    });

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

      if (sum.memoryFacts.length) {
        await prisma.sessionMemoryFact.createMany({
          data: sum.memoryFacts.map((f) => ({
            sessionId: session.id,
            type: "COMPACT",
            fact: f,
          })),
        });
      }

      if (sum.doNotForget.length) {
        await prisma.sessionMemoryFact.createMany({
          data: sum.doNotForget.map((f) => ({
            sessionId: session.id,
            type: "PINNED",
            fact: f,
          })),
        });
      }
    }

    const events: Array<{ type: any; payloadJson: any }> = [];
    for (const q of update.questStageUpdates) events.push({ type: "QUEST_STAGE_ADVANCED", payloadJson: q });
    for (const rel of update.npcRelationshipDeltas) events.push({ type: "NPC_RELATION_CHANGED", payloadJson: rel });
    for (const item of update.inventoryAdd) events.push({ type: "ITEM_ADDED", payloadJson: { item } });
    for (const item of update.inventoryRemove) events.push({ type: "ITEM_REMOVED", payloadJson: { item } });
    for (const lore of update.discoveredLoreAdditions) events.push({ type: "LORE_DISCOVERED", payloadJson: { lore } });
    for (const fact of update.commitmentFacts) events.push({ type: "COMMITMENT_RECORDED", payloadJson: { fact } });
    if (body.rollContext) events.push({ type: "ROLL_RESOLVED", payloadJson: body.rollContext });

    const txOps: any[] = [
      prisma.session.updateMany({
        where: { id: session.id, snapshotVersion: session.snapshotVersion },
        data: {
          turnNumber: newTurnNumber,
          snapshotVersion: { increment: 1 },
          currentSceneId: nextState.currentSceneId,
          currentObjective: session.currentObjective,
          summary,
        },
      }),
      prisma.stateSnapshot.create({
        data: { sessionId: session.id, turnNumber: newTurnNumber, jsonState: nextState },
      }),
    ];

    if (events.length) {
      txOps.push(
        prisma.sessionEvent.createMany({
          data: events.map((e) => ({
            sessionId: session.id,
            turnNumber: newTurnNumber,
            type: e.type,
            payloadJson: e.payloadJson,
          })),
        }),
      );
    }

    if (update.commitmentFacts.length) {
      txOps.push(
        prisma.sessionMemoryFact.createMany({
          data: update.commitmentFacts.map((fact) => ({
            sessionId: session.id,
            type: "COMMITMENT",
            fact,
          })),
        }),
      );
    }

    const tx = await prisma.$transaction(txOps);
    if (!tx[0] || tx[0].count !== 1) {
      return NextResponse.json({ error: "Session update conflict, please retry." }, { status: 409 });
    }

    const responsePayload = {
      dmMessage: dm.dmMessage,
      state: nextState,
      summary,
      rollPrompt: safeRollPrompt ?? null,
      rollPromptTurnIndex: safeRollPrompt ? dmTurnIndex : null,
    };

    if (body.idempotencyKey) {
      await prisma.processedRequest.create({
        data: {
          sessionId: session.id,
          route: "session.turn",
          idempotencyKey: body.idempotencyKey,
          responseJson: responsePayload,
        },
      });
    }

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 400 });
  }
}

