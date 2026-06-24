"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, profiles } from "@/db/schema";
import {
  hashPassword, verifyPassword, createSession, destroySession,
  getSessionUser, newId, dbConfigured,
} from "@/lib/auth";
import { loadStateForUser } from "./data";
import { defaultProfileRow, type AppData } from "@/lib/appdata";

export interface AuthResult { ok: boolean; error?: string; data?: AppData | null; }

const DEFAULT_INTERESTS: Record<string, boolean> = {
  Minecraft: true, Football: true, Music: true, Science: true,
};

/** Sign up with the data collected during onboarding. */
export async function signupAction(input: {
  email: string; password: string; name?: string; age?: string;
  interests?: Record<string, boolean>; custom?: { label: string; emoji: string }[];
  language?: string;
}): Promise<AuthResult> {
  if (!dbConfigured()) return { ok: false, error: "no-db" };
  const email = input.email.trim().toLowerCase();
  if (!/.+@.+\..+/.test(email)) return { ok: false, error: "Invalid email." };
  if (input.password.length < 4) return { ok: false, error: "Password too short." };
  try {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing[0]) return { ok: false, error: "exists" };

    const id = newId();
    await db.insert(users).values({ id, email, passwordHash: await hashPassword(input.password) });
    await db.insert(profiles).values({
      ...defaultProfileRow(id),
      name: input.name || "",
      age: input.age || "",
      email,
      language: input.language || "en",
      interests: { ...DEFAULT_INTERESTS, ...(input.interests || {}) },
      customInterests: input.custom || [],
    });
    await createSession(id);
    return { ok: true, data: await loadStateForUser(id) };
  } catch (e) {
    console.error("[signup]", e);
    return { ok: false, error: "server" };
  }
}

export async function loginAction(input: { email: string; password: string }): Promise<AuthResult> {
  if (!dbConfigured()) return { ok: false, error: "no-db" };
  const email = input.email.trim().toLowerCase();
  try {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const u = rows[0];
    if (!u || !(await verifyPassword(input.password, u.passwordHash))) {
      return { ok: false, error: "invalid" };
    }
    await createSession(u.id);
    return { ok: true, data: await loadStateForUser(u.id) };
  } catch (e) {
    console.error("[login]", e);
    return { ok: false, error: "server" };
  }
}

export async function logoutAction(): Promise<void> {
  await destroySession();
}

export async function currentUserAction() {
  return getSessionUser();
}
