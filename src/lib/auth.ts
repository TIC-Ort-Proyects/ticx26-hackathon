import { scrypt, randomBytes, timingSafeEqual, randomUUID } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";

const scryptAsync = promisify(scrypt);
const COOKIE = "tutorias_session";
const SESSION_DAYS = 30;

/** True when a database connection string is configured. */
export function dbConfigured(): boolean {
  const url = process.env.DATABASE_URL || "";
  return !!url && !url.includes("user:password");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${buf.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  const keyBuf = Buffer.from(key, "hex");
  return keyBuf.length === buf.length && timingSafeEqual(keyBuf, buf);
}

export function newId(): string {
  return randomUUID();
}

/** Create a session row and set the httpOnly cookie. */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.insert(sessions).values({ token, userId, expiresAt });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    try { await db.delete(sessions).where(eq(sessions.token, token)); } catch {}
  }
  jar.delete(COOKIE);
}

export interface SessionUser { id: string; email: string; }

/** Resolve the current user from the session cookie, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!dbConfigured()) return null;
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const rows = await db
      .select({ id: users.id, email: users.email, expiresAt: sessions.expiresAt })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    if (new Date(row.expiresAt).getTime() < Date.now()) {
      try { await db.delete(sessions).where(eq(sessions.token, token)); } catch {}
      return null;
    }
    return { id: row.id, email: row.email };
  } catch {
    return null;
  }
}
