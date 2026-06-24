"use server";

import { eq, asc } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/db";
import { profiles, topics, lessons, messages } from "@/db/schema";
import { getSessionUser, newId, dbConfigured } from "@/lib/auth";
import { defaultProfileRow, type AppData } from "@/lib/appdata";

/* ---------------- load ---------------- */
export async function loadStateForUser(userId: string): Promise<AppData> {
  let prof = (await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1))[0];
  if (!prof) {
    await db.insert(profiles).values(defaultProfileRow(userId));
    prof = (await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1))[0];
  }
  const topicRows = await db.select().from(topics).where(eq(topics.userId, userId)).orderBy(asc(topics.createdAt));
  const lessonRows = await db.select().from(lessons).where(eq(lessons.userId, userId)).orderBy(asc(lessons.position));
  const msgRows = await db.select().from(messages).where(eq(messages.userId, userId)).orderBy(asc(messages.position));

  const chats: AppData["chats"] = {};
  for (const m of msgRows) {
    (chats[m.topicKey] ||= []).push({ id: m.id, fromUser: m.fromUser, text: m.text });
  }

  return {
    name: prof.name, age: prof.age, email: prof.email, photo: prof.photo,
    language: prof.language, preferredMode: prof.preferredMode,
    prefs: { nudge: prof.prefNudge, sounds: prof.prefSounds, checkins: prof.prefCheckins },
    tokens: prof.tokens, owned: prof.owned, equipped: prof.equipped,
    interests: prof.interests, custom: prof.customInterests, streak: prof.streak,
    titleOverrides: prof.titleOverrides, topicMode: prof.topicMode, materials: prof.materials,
    customTopics: topicRows.map((t) => ({ key: t.key, title: t.title, emoji: t.emoji, accent: t.accent })),
    lessons: lessonRows.map((l) => ({ key: l.key, title: l.title, emoji: l.emoji, accent: l.accent, when: l.when, progress: l.progress, archived: l.archived })),
    chats,
  };
}

export async function loadState(): Promise<AppData | null> {
  const u = await getSessionUser();
  if (!u) return null;
  return loadStateForUser(u.id);
}

/* ---------------- persist everything ---------------- */
export async function saveAllAction(data: AppData): Promise<{ ok: boolean }> {
  const u = await getSessionUser();
  if (!u) return { ok: false };
  const userId = u.id;
  try {
    await db.update(profiles).set({
      name: data.name, age: data.age, email: data.email, photo: data.photo,
      language: data.language, preferredMode: data.preferredMode,
      prefNudge: data.prefs.nudge, prefSounds: data.prefs.sounds, prefCheckins: data.prefs.checkins,
      tokens: data.tokens, interests: data.interests, customInterests: data.custom,
      owned: data.owned, equipped: data.equipped, streak: data.streak,
      titleOverrides: data.titleOverrides, topicMode: data.topicMode, materials: data.materials,
      updatedAt: new Date(),
    }).where(eq(profiles.userId, userId));

    // Replace child collections (small per-user sets — simple & correct).
    await db.delete(topics).where(eq(topics.userId, userId));
    if (data.customTopics.length) {
      await db.insert(topics).values(data.customTopics.map((t) => ({ id: newId(), userId, key: t.key, title: t.title, emoji: t.emoji, accent: t.accent })));
    }

    await db.delete(lessons).where(eq(lessons.userId, userId));
    if (data.lessons.length) {
      await db.insert(lessons).values(data.lessons.map((l, i) => ({ id: newId(), userId, key: l.key, title: l.title, emoji: l.emoji, accent: l.accent, when: l.when, progress: l.progress, archived: l.archived, position: i })));
    }

    await db.delete(messages).where(eq(messages.userId, userId));
    const rows: (typeof messages.$inferInsert)[] = [];
    let pos = 0;
    for (const key of Object.keys(data.chats)) {
      for (const m of data.chats[key]) {
        rows.push({ id: m.id || newId(), userId, topicKey: key, fromUser: m.fromUser, text: m.text, position: pos++ });
      }
    }
    if (rows.length) await db.insert(messages).values(rows);

    return { ok: true };
  } catch (e) {
    console.error("[saveAll]", e);
    return { ok: false };
  }
}

/* ---------------- AI chat ---------------- */
const MODE_INSTRUCTIONS: Record<string, string> = {
  simplified: "Explain in the simplest plain language possible, short sentences, no jargon.",
  story: "Teach through a short engaging story or narrative that carries the concept.",
  challenge: "Quiz the student one question at a time, react to their answers and raise difficulty gradually.",
  visual: "Explain visually: describe diagrams, mental images and spatial analogies in words.",
  step: "Break everything into small numbered steps and confirm understanding before the next.",
  game: "Turn the lesson into a playful game with points, levels and small challenges.",
};

export interface ChatInput {
  topic: string; mode: string; interests: string[]; name?: string; age?: string;
  history: { role: "user" | "assistant"; content: string }[]; text: string;
  material?: { name: string; text: string } | null; lang?: "en" | "es";
}

/** Generate a personalized tutor reply. Returns null on any failure so the
    client can fall back to a built-in canned reply. */
export async function sendChatAction(input: ChatInput): Promise<{ reply: string | null }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.includes("reemplazar")) return { reply: null };

  const ints = input.interests?.length ? input.interests.join(", ") : "general topics";
  const who = input.name || "a student";
  const ageStr = input.age ? `, age ${input.age}` : "";
  const modeInstr = MODE_INSTRUCTIONS[input.mode] ? ` Current teaching mode: ${input.mode}. ${MODE_INSTRUCTIONS[input.mode]}` : "";
  const langInstr = input.lang === "es" ? " Reply in Spanish (Rioplatense, friendly and natural)." : " Reply in English.";
  const matBlock = input.material?.text
    ? `\n\nThe student attached study material titled "${input.material.name}". Treat it as the main source — explain from it and ask them questions about it:\n"""\n${String(input.material.text).slice(0, 4000)}\n"""`
    : "";
  const system = `You are Squeaky, a warm, encouraging AI tutor in the TutorIAs learning app. You are teaching ${input.topic} to ${who}${ageStr}. Personalize every explanation through their interests: ${ints}. Use concrete analogies from those interests whenever it helps.${modeInstr} Keep replies short (2-4 sentences), warm, plain-language and in the second person. If the student seems stuck or bored, simplify, give a fresh example, or break the idea into steps. Avoid emoji spam.${langInstr}${matBlock}`;

  const contents = [
    ...(input.history || []).map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    { role: "user", parts: [{ text: input.text }] },
  ];

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const response = await ai.models.generateContent({ model, contents, config: { systemInstruction: system, temperature: 0.8 } });
    return { reply: response.text?.trim() || null };
  } catch (e) {
    console.error("[sendChat]", e);
    return { reply: null };
  }
}

export async function dbStatusAction(): Promise<{ db: boolean }> {
  return { db: dbConfigured() };
}
