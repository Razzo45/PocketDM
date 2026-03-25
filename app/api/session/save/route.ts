import { NextResponse } from "next/server";

export const runtime = "nodejs";

// MVP: session state is saved automatically on /session/turn.
// This route exists as a future extension point.
export async function POST() {
  return NextResponse.json({ ok: true });
}

