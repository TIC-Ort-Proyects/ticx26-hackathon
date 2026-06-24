import { pgTable, text, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";

/* ============================================================
   TutorIAs — database schema (Drizzle / PostgreSQL)
   Purpose-built for the TutorIAs app. Auth is handled in-app
   (email + password), with DB-backed sessions.
   ============================================================ */

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
}, (t) => ({ userIdx: index("sessions_user_idx").on(t.userId) }));

export interface Equipped { color: string; bg: string; hat: string | null; face: string | null; neck: string | null; }
export interface CustomInterest { label: string; emoji: string; }
export interface StreakData { days: number; last: string; dates: string[]; }

/* One profile per user — the learner model the AI personalizes from,
   plus gamification state. Small collections are stored as jsonb. */
export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").default("").notNull(),
  age: text("age").default("").notNull(),
  email: text("email").default("").notNull(),
  photo: text("photo").default("").notNull(),
  language: text("language").default("en").notNull(),
  preferredMode: text("preferred_mode").default("simplified").notNull(),
  prefNudge: boolean("pref_nudge").default(true).notNull(),
  prefSounds: boolean("pref_sounds").default(true).notNull(),
  prefCheckins: boolean("pref_checkins").default(true).notNull(),
  tokens: integer("tokens").default(150).notNull(),
  interests: jsonb("interests").$type<Record<string, boolean>>().default({}).notNull(),
  customInterests: jsonb("custom_interests").$type<CustomInterest[]>().default([]).notNull(),
  owned: jsonb("owned").$type<string[]>().default([]).notNull(),
  equipped: jsonb("equipped").$type<Equipped>().notNull(),
  streak: jsonb("streak").$type<StreakData>().notNull(),
  titleOverrides: jsonb("title_overrides").$type<Record<string, string>>().default({}).notNull(),
  topicMode: jsonb("topic_mode").$type<Record<string, string>>().default({}).notNull(),
  materials: jsonb("materials").$type<Record<string, { name: string; text: string }>>().default({}).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

/* Custom topics the learner created ("Add a topic"). */
export const topics = pgTable("topics", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  title: text("title").notNull(),
  emoji: text("emoji").notNull(),
  accent: text("accent").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
}, (t) => ({ userIdx: index("topics_user_idx").on(t.userId) }));

/* A studied topic with progress (the History tab). */
export const lessons = pgTable("lessons", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  title: text("title").notNull(),
  emoji: text("emoji").notNull(),
  accent: text("accent").notNull(),
  when: text("when").default("Just now").notNull(),
  progress: integer("progress").default(0).notNull(),
  archived: boolean("archived").default(false).notNull(),
  position: integer("position").default(0).notNull(),
}, (t) => ({ userIdx: index("lessons_user_idx").on(t.userId) }));

/* Chat history per topic. */
export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  topicKey: text("topic_key").notNull(),
  fromUser: boolean("from_user").notNull(),
  text: text("text").notNull(),
  position: integer("position").default(0).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
}, (t) => ({ userTopicIdx: index("messages_user_topic_idx").on(t.userId, t.topicKey) }));

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Message = typeof messages.$inferSelect;
