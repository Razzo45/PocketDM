import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const cookieName = "pocketdm_anon_user_id";

export async function getOrSetAnonUserId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(cookieName)?.value;
  if (existing) return existing;

  const id = randomUUID();
  store.set(cookieName, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  return id;
}

