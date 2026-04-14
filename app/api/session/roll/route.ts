import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOrSetAnonUserId } from "@/lib/auth/anonUser";
import { classifyD20, clampDc } from "@/lib/game/state/rollPolicy";

export const runtime = "nodejs";

function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

export async function POST(req: Request) {
  try {
    const userId = await getOrSetAnonUserId();
    const body = (await req.json()) as {
      sessionId?: string;
      reason?: string;
      promptKey?: string;
      dc?: number;
      idempotencyKey?: string;
    };

    if (!body.sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    if (!body.reason) return NextResponse.json({ error: "Missing reason" }, { status: 400 });
    if (!body.promptKey) return NextResponse.json({ error: "Missing promptKey" }, { status: 400 });

    if (body.idempotencyKey) {
      const cached = await prisma.processedRequest.findFirst({
        where: {
          sessionId: body.sessionId,
          route: "session.roll",
          idempotencyKey: body.idempotencyKey,
        },
      });
      if (cached) return NextResponse.json(cached.responseJson);
    }

    const session = await prisma.session.findFirst({
      where: { id: body.sessionId, campaign: { userId } },
      include: { turns: { orderBy: { turnIndex: "desc" }, take: 1 } },
    });
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const value = rollD20();
    const dc = clampDc(body.dc ?? 10);
    const band = classifyD20(value);
    const payload = {
      rollType: "d20" as const,
      value,
      reason: body.reason,
      promptKey: body.promptKey,
      dc,
      band,
    };

    const nextTurnIndex = (session.turns[0]?.turnIndex ?? 0) + 1;
    await prisma.$transaction([
      prisma.turn.create({
        data: {
          sessionId: session.id,
          turnIndex: nextTurnIndex,
          role: "system",
          content: `Roll (${body.reason}): d20 => ${value}`,
          metadataJson: payload,
        },
      }),
      prisma.sessionEvent.create({
        data: {
          sessionId: session.id,
          turnNumber: session.turnNumber,
          type: "ROLL_RESOLVED",
          payloadJson: payload,
        },
      }),
    ]);

    if (body.idempotencyKey) {
      await prisma.processedRequest.create({
        data: {
          sessionId: session.id,
          route: "session.roll",
          idempotencyKey: body.idempotencyKey,
          responseJson: payload,
        },
      });
    }

    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 400 });
  }
}

