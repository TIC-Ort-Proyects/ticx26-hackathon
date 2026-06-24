import type { Equipped, CustomInterest, StreakData } from "@/db/schema";

/* The full per-user application state exchanged between client and server. */
export interface AppData {
  name: string;
  age: string;
  email: string;
  photo: string;
  language: string;
  preferredMode: string;
  prefs: { nudge: boolean; sounds: boolean; checkins: boolean };
  tokens: number;
  owned: string[];
  equipped: Equipped;
  interests: Record<string, boolean>;
  custom: CustomInterest[];
  streak: StreakData;
  titleOverrides: Record<string, string>;
  topicMode: Record<string, string>;
  materials: Record<string, { name: string; text: string }>;
  customTopics: { key: string; title: string; emoji: string; accent: string }[];
  lessons: { key: string; title: string; emoji: string; accent: string; when: string; progress: number; archived: boolean }[];
  chats: Record<string, { id: string; fromUser: boolean; text: string }[]>;
}

export const DEFAULT_EQUIPPED: Equipped = { color: "c_classic", bg: "b_cream", hat: null, face: null, neck: null };

function seedStreak(): StreakData {
  // No client time on the server; start with an empty streak that the
  // client reconciles with the local date on first study.
  return { days: 0, last: "", dates: [] };
}

/** Default row values for a freshly created profile. */
export function defaultProfileRow(userId: string) {
  return {
    userId,
    name: "",
    age: "",
    email: "",
    photo: "",
    language: "en",
    preferredMode: "simplified",
    prefNudge: true,
    prefSounds: true,
    prefCheckins: true,
    tokens: 150,
    interests: {} as Record<string, boolean>,
    customInterests: [] as CustomInterest[],
    owned: ["c_classic", "b_cream"],
    equipped: DEFAULT_EQUIPPED,
    streak: seedStreak(),
    titleOverrides: {} as Record<string, string>,
    topicMode: {} as Record<string, string>,
    materials: {} as Record<string, { name: string; text: string }>,
  };
}
