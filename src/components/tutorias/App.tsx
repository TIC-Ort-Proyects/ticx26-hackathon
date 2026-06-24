"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Button, IconButton, Card, Input, Badge, Switch, ProgressBar,
  InterestChip, ModeCard, StreakChip, SqueakyBubble, Icon,
} from "./ui";
import {
  POOL, TOPICS, MODES, QBANK, EMOJI_CHOICES, THIS_OR_THAT, SURVEY,
  TOUR, ACCENTS, CUSTOM_ACCENTS, CATALOG, CAT_TABS, MASCOT,
  type Topic, type Lesson, type CatalogItem, type Deck, type GkOption,
} from "./data";
import { useI18n, type Lang } from "./i18n";
import { saveAllAction, sendChatAction } from "@/app/actions/data";
import { loginAction, signupAction, logoutAction } from "@/app/actions/auth";
import type { AppData } from "@/lib/appdata";

/* ---------------- types ---------------- */
interface ChatMsg { id: string; fromUser: boolean; text: string; }
interface Custom { label: string; emoji: string; }
type Game =
  | { type: "quiz"; order: number[]; i: number; score: number; picked: number | null; revealed: boolean; done: boolean }
  | { type: "cards"; i: number; flipped: boolean }
  | { type: "getknow"; deck: "tot" | "survey"; i: number; picks: GkOption[]; done: boolean }
  | null;

interface Equipped { color: string; bg: string; hat: string | null; face: string | null; neck: string | null; }
interface Streak { days: number; last: string; dates: string[]; }

interface State {
  screen: "welcome" | "login" | "auth" | "about" | "interests" | "app";
  nav: "home" | "play" | "squeaky" | "history" | "settings";
  topicKey: string | null;
  email: string; password: string; name: string; age: string;
  interests: Record<string, boolean>;
  custom: Custom[]; customDraft: string;
  draft: string; sending: boolean;
  chats: Record<string, ChatMsg[]>;
  topicMode: Record<string, string>;
  materials: Record<string, { name: string; text: string }>;
  titleOverrides: Record<string, string>;
  preferredMode: string;
  attachOpen: boolean; materialDraft: string; materialName: string;
  renameOpen: boolean; renameDraft: string;
  editProfileOpen: boolean; editName: string; editAge: string; editEmail: string;
  photo: string; editPhoto: string;
  changePwOpen: boolean; pwCurrent: string; pwNew: string; pwConfirm: string; pwError: string;
  lessonMenuKey: string | null; historyTab: "active" | "archived";
  tokens: number; owned: string[]; equipped: Equipped; squeakyCat: "color" | "hat" | "acc" | "scene";
  customTopics: Topic[];
  addTopicOpen: boolean; topicDraft: string; topicEmojiDraft: string;
  modePickerOpen: boolean; pickerKey: string | null;
  tourIdx: number;
  game: Game;
  streak: Streak;
  prefs: { nudge: boolean; sounds: boolean; checkins: boolean };
  lessons: Lesson[];
  authed: boolean;
  authError: string;
}

const ymd = (d: Date) =>
  d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

const initialState: State = {
  screen: "welcome", nav: "home", topicKey: null,
  email: "", password: "", name: "", age: "",
  interests: { Minecraft: true, Football: true, Music: true, Gaming: false, Anime: false, Science: true, Coding: false, Movies: false, Cooking: false, Travel: false, Cars: false, Art: false, Basketball: false, Space: false, Animals: false, Photography: false, Reading: false, Dance: false, Fashion: false, Nature: false },
  custom: [], customDraft: "", draft: "", sending: false,
  chats: {}, topicMode: {}, materials: {}, titleOverrides: {}, preferredMode: "simplified",
  attachOpen: false, materialDraft: "", materialName: "",
  renameOpen: false, renameDraft: "",
  editProfileOpen: false, editName: "", editAge: "", editEmail: "",
  photo: "", editPhoto: "",
  changePwOpen: false, pwCurrent: "", pwNew: "", pwConfirm: "", pwError: "",
  lessonMenuKey: null, historyTab: "active",
  tokens: 150, owned: ["c_classic", "b_cream"],
  equipped: { color: "c_classic", bg: "b_cream", hat: null, face: null, neck: null },
  squeakyCat: "color",
  customTopics: [], addTopicOpen: false, topicDraft: "", topicEmojiDraft: "📚",
  modePickerOpen: false, pickerKey: null,
  tourIdx: -1, game: null,
  streak: { days: 0, last: "", dates: [] },
  prefs: { nudge: true, sounds: true, checkins: true },
  lessons: [
    { key: "physics", title: "Physics", emoji: "🔭", accent: "sky", when: "Yesterday", progress: 62 },
    { key: "english", title: "English writing", emoji: "✍️", accent: "coral", when: "2 days ago", progress: 40 },
    { key: "math", title: "Mathematics", emoji: "📐", accent: "navy", when: "Last week", progress: 78 },
  ],
  authed: false,
  authError: "",
};

const tileBg = (accent: string) => ACCENTS[accent] || ACCENTS.gold;
const BUILTIN_KEYS = new Set(TOPICS.map((t) => t.key));

/* Map persisted server data into client state fields. */
function mergeData(d: AppData): Partial<State> {
  return {
    name: d.name, age: d.age, email: d.email, photo: d.photo, preferredMode: d.preferredMode,
    prefs: d.prefs, tokens: d.tokens, owned: d.owned, equipped: d.equipped,
    interests: d.interests, custom: d.custom, streak: d.streak,
    titleOverrides: d.titleOverrides, topicMode: d.topicMode, materials: d.materials,
    customTopics: d.customTopics.map((tp) => ({ ...tp, accent: tp.accent as Topic["accent"], blurb: "" })),
    lessons: d.lessons.map((l) => ({ ...l, accent: l.accent as Lesson["accent"] })),
    chats: d.chats,
  };
}

/* Build the persistable snapshot from client state. */
function stateToData(s: State, language: string): AppData {
  return {
    name: s.name, age: s.age, email: s.email, photo: s.photo, language, preferredMode: s.preferredMode,
    prefs: s.prefs, tokens: s.tokens, owned: s.owned, equipped: s.equipped,
    interests: s.interests, custom: s.custom, streak: s.streak,
    titleOverrides: s.titleOverrides, topicMode: s.topicMode, materials: s.materials,
    customTopics: s.customTopics.map((tp) => ({ key: tp.key, title: tp.title, emoji: tp.emoji, accent: tp.accent })),
    lessons: s.lessons.map((l) => ({ key: l.key, title: l.title, emoji: l.emoji, accent: l.accent, when: l.when, progress: l.progress, archived: !!l.archived })),
    chats: s.chats,
  };
}

export default function App({ initialData = null, initialAuthed = false }: { initialData?: AppData | null; initialAuthed?: boolean }) {
  const { t, raw, lang, setLang } = useI18n();
  const [st, setSt] = useState<State>(() =>
    initialAuthed && initialData
      ? { ...initialState, ...mergeData(initialData), authed: true, screen: "app", nav: "home" }
      : initialState
  );
  const chatRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef(st);
  stateRef.current = st;
  const langRef = useRef(lang);
  langRef.current = lang;
  const firstSave = useRef(true);

  const update = useCallback((patch: Partial<State> | ((s: State) => Partial<State>)) => {
    setSt((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  }, []);

  /* ---------- localization helpers for content ---------- */
  const topicTitle = useCallback((key: string, fallback?: string) => {
    if (st.titleOverrides[key]) return st.titleOverrides[key];
    if (BUILTIN_KEYS.has(key)) return t(`topics.${key}.title`);
    return fallback ?? key;
  }, [st.titleOverrides, t]);
  const topicBlurb = (key: string, fallback?: string) =>
    BUILTIN_KEYS.has(key) ? t(`topics.${key}.blurb`) : (fallback ?? t("customBlurb"));
  const interestLabel = (key: string) => (raw<Record<string, string>>("interests")[key] ?? key);
  const modeTitle = (key: string) => t(`modes.${key}.title`);
  const catalogName = (id: string) => t(`catalog.${id}`);

  const localDeck = useCallback((k: "tot" | "survey"): Deck => {
    if (k === "survey") {
      const qs = raw<string[]>("survey.questions");
      const labels = raw<string[][]>("survey.labels");
      return {
        title: t("survey.title"), intro: t("survey.intro"),
        rounds: SURVEY.rounds.map((r, ri) => ({ q: qs[ri], opts: r.opts.map((o, oi) => ({ ...o, label: labels[ri][oi] })) })),
      };
    }
    const labels = raw<string[][]>("tot.labels");
    return {
      title: t("tot.title"), intro: t("tot.intro"),
      rounds: THIS_OR_THAT.rounds.map((r, ri) => ({ opts: r.opts.map((o, oi) => ({ ...o, label: labels[ri][oi] })) })),
    };
  }, [t, raw]);

  /* ---------- mount ---------- */
  useEffect(() => {
    // Authenticated users get their state from the server (props); set language.
    if (initialAuthed && initialData) {
      if (initialData.language) setLang(initialData.language as Lang);
      return;
    }
    let streak: Streak | null = null;
    try { streak = JSON.parse(localStorage.getItem("tutorias_streak") || "null"); } catch { streak = null; }
    if (!streak) {
      const dates: string[] = [];
      for (let i = 4; i >= 1; i--) dates.push(ymd(new Date(Date.now() - i * 86400000)));
      streak = { days: 4, last: dates[dates.length - 1], dates };
    }
    const next: Partial<State> = { streak };
    let sq: { tokens?: number; owned?: string[]; equipped?: Partial<Equipped> } | null = null;
    try { sq = JSON.parse(localStorage.getItem("tutorias_squeaky") || "null"); } catch { sq = null; }
    if (sq) {
      if (typeof sq.tokens === "number") next.tokens = sq.tokens;
      if (Array.isArray(sq.owned)) next.owned = sq.owned;
      if (sq.equipped) next.equipped = { color: "c_classic", bg: "b_cream", hat: null, face: null, neck: null, ...sq.equipped };
    }
    update(next);
  }, [update]);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; });

  /* ---------- persist to backend (debounced) when authenticated ---------- */
  const persistSig = st.authed ? JSON.stringify(stateToData(st, lang)) : "";
  useEffect(() => {
    if (!st.authed || !persistSig) return;
    if (firstSave.current) { firstSave.current = false; return; }
    const h = setTimeout(() => { saveAllAction(JSON.parse(persistSig) as AppData).catch(() => {}); }, 700);
    return () => clearTimeout(h);
  }, [persistSig, st.authed]);

  const saveSqueaky = (s: State) => {
    try { localStorage.setItem("tutorias_squeaky", JSON.stringify({ tokens: s.tokens, owned: s.owned, equipped: s.equipped })); } catch {}
  };

  const buyOrEquip = (item: CatalogItem) => {
    setSt((s) => {
      const owned = s.owned.includes(item.id);
      let next: State;
      if (!owned) {
        if (s.tokens < item.price) return s;
        next = { ...s, tokens: s.tokens - item.price, owned: [...s.owned, item.id], equipped: { ...s.equipped, [item.slot]: item.id } };
      } else {
        const cur = s.equipped[item.slot];
        const val = item.slot === "color" || item.slot === "bg" ? item.id : cur === item.id ? null : item.id;
        next = { ...s, equipped: { ...s.equipped, [item.slot]: val } };
      }
      saveSqueaky(next);
      return next;
    });
  };

  const markStudied = () => {
    setSt((s) => {
      const today = ymd(new Date());
      if (s.streak.last === today) return s;
      const yest = ymd(new Date(Date.now() - 86400000));
      const days = s.streak.last === yest ? s.streak.days + 1 : 1;
      const dates = (s.streak.dates || []).includes(today) ? s.streak.dates : [...(s.streak.dates || []), today];
      const streak = { days, last: today, dates };
      const reward = 30 + Math.min(days * 3, 30);
      try { localStorage.setItem("tutorias_streak", JSON.stringify(streak)); } catch {}
      const next = { ...s, streak, tokens: s.tokens + reward };
      saveSqueaky(next);
      return next;
    });
  };

  /* ---------- derived helpers ---------- */
  const allTopics = (): Topic[] => TOPICS.concat(st.customTopics).map((tp) => ({
    ...tp, title: topicTitle(tp.key, tp.title), blurb: topicBlurb(tp.key, tp.blurb),
  }));
  const findTopic = (key: string | null): Topic | null => {
    if (!key) return null;
    const t0 = TOPICS.concat(st.customTopics).find((x) => x.key === key);
    if (!t0) return null;
    return { ...t0, title: topicTitle(key, t0.title), blurb: topicBlurb(key, t0.blurb) };
  };
  const selectedInterests = (): Custom[] => {
    const base = POOL.filter(([l]) => st.interests[l]).map(([l, e]) => ({ label: l, emoji: e }));
    return base.concat(st.custom);
  };

  const setField = (k: keyof State) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    update({ [k]: e.target.value } as Partial<State>);

  const addCustom = () => {
    const v = st.customDraft.trim();
    if (!v) return;
    const dup = st.custom.some((c) => c.label.toLowerCase() === v.toLowerCase()) || POOL.some(([l]) => l.toLowerCase() === v.toLowerCase());
    if (dup) { update({ customDraft: "" }); return; }
    update((s) => ({ custom: [...s.custom, { label: v, emoji: "✨" }], customDraft: "" }));
  };

  const introMessage = (tp: Topic, modeKey: string): ChatMsg => {
    const ints = selectedInterests().slice(0, 3).map((i) => interestLabel(i.label));
    const list = ints.length ? ints.join(", ") : t("home.there");
    const nm = st.name ? st.name.split(" ")[0] : t("home.there");
    const tail = MODES.find((m) => m.key === modeKey) ? t("chat.introTail", { mode: modeTitle(modeKey).toLowerCase() }) : "";
    return { id: "intro-" + tp.key + "-" + Date.now(), fromUser: false, text: t("chat.intro", { name: nm, topic: tp.title.toLowerCase(), interests: list, tail }) };
  };

  const startTopic = (key: string, modeKey?: string) => {
    const tp = findTopic(key);
    if (!tp) return;
    setSt((s) => {
      const mode = modeKey || s.topicMode[key] || s.preferredMode || "simplified";
      const topicMode = { ...s.topicMode, [key]: mode };
      const chats = { ...s.chats };
      if (!chats[key]) chats[key] = [introMessage(tp, mode)];
      const prev = s.lessons.find((l) => l.key === key);
      const rest = s.lessons.filter((l) => l.key !== key);
      const lessons: Lesson[] = [{ key, title: tp.title, emoji: tp.emoji, accent: tp.accent, when: "Just now", progress: prev ? Math.min(100, prev.progress + 6) : 8 }, ...rest];
      return { ...s, topicKey: key, nav: "home", chats, lessons, topicMode, modePickerOpen: false, pickerKey: null, game: null };
    });
    markStudied();
  };

  const createTopic = () => {
    const title = st.topicDraft.trim();
    if (!title) return;
    const key = "c-" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36);
    const accent = CUSTOM_ACCENTS[st.customTopics.length % CUSTOM_ACCENTS.length];
    const topic: Topic = { key, title, emoji: st.topicEmojiDraft, accent, blurb: t("customBlurb") };
    update((s) => ({ customTopics: [...s.customTopics, topic], addTopicOpen: false, topicDraft: "", topicEmojiDraft: "📚", modePickerOpen: true, pickerKey: key }));
  };

  const askSqueaky = async (tp: Topic, text: string): Promise<string | null> => {
    const s = stateRef.current;
    const mode = MODES.find((m) => m.key === (s.topicMode[tp.key] || "simplified"));
    const history = (s.chats[tp.key] || []).slice(-8).map((m) => ({ role: m.fromUser ? "user" : "assistant", content: m.text }));
    const material = s.materials[tp.key] || null;
    try {
      const res = await sendChatAction({
        topic: tp.title, mode: mode?.key || "simplified",
        interests: selectedInterests().map((i) => interestLabel(i.label)),
        name: s.name, age: s.age, history: history as { role: "user" | "assistant"; content: string }[],
        text, material, lang: langRef.current,
      });
      return (res && typeof res.reply === "string" && res.reply.trim()) || null;
    } catch { return null; }
  };

  const send = async (preset?: string) => {
    const s = stateRef.current;
    const text = (preset ?? s.draft).trim();
    const key = s.topicKey;
    if (!text || s.sending || !key) return;
    const tp = findTopic(key);
    if (!tp) return;
    const um: ChatMsg = { id: "u" + Date.now(), fromUser: true, text };
    update((cur) => ({ chats: { ...cur.chats, [key]: [...(cur.chats[key] || []), um] }, draft: "", sending: true }));
    markStudied();
    let reply: string | null = null;
    try { reply = await askSqueaky(tp, text); } catch { reply = null; }
    if (!reply) {
      const i = (selectedInterests()[0] || { label: "" }).label;
      reply = t("chat.fallback", { interest: i ? interestLabel(i) : t("home.there") });
    }
    const sm: ChatMsg = { id: "s" + Date.now(), fromUser: false, text: reply };
    update((cur) => ({ chats: { ...cur.chats, [key]: [...(cur.chats[key] || []), sm] }, sending: false }));
  };

  const onMaterialFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => update({ materialDraft: String(reader.result || "").slice(0, 8000), materialName: f.name });
    reader.readAsText(f);
  };
  const attachMaterial = () => {
    const key = st.topicKey;
    const text = st.materialDraft.trim();
    if (!key || !text) return;
    const name = st.materialName || t("modal.attachTitle");
    const ack: ChatMsg = { id: "mat" + Date.now(), fromUser: false, text: t("chat.ack", { name }) };
    update((s) => ({ materials: { ...s.materials, [key]: { name, text } }, attachOpen: false, materialDraft: "", materialName: "", chats: { ...s.chats, [key]: [...(s.chats[key] || []), ack] } }));
  };
  const removeMaterial = () => {
    const key = st.topicKey;
    if (!key) return;
    update((s) => { const m = { ...s.materials }; delete m[key]; return { materials: m }; });
  };

  const saveRename = () => {
    const key = st.topicKey; const v = st.renameDraft.trim();
    if (!key || !v) return;
    update((s) => ({ titleOverrides: { ...s.titleOverrides, [key]: v }, lessons: s.lessons.map((l) => (l.key === key ? { ...l, title: v } : l)), renameOpen: false }));
  };
  const saveProfile = () => {
    const nm = st.editName.trim(); if (!nm) return;
    update({ name: nm, age: st.editAge, email: st.editEmail, photo: st.editPhoto, editProfileOpen: false });
  };
  const onPhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => update({ editPhoto: String(reader.result || "") });
    reader.readAsDataURL(f);
  };
  const submitChangePw = () => {
    const { pwCurrent, pwNew, pwConfirm, password } = st;
    if (pwCurrent !== password) { update({ pwError: t("profile.pwWrong") }); return; }
    if (pwNew.length < 4) { update({ pwError: t("profile.pwShort") }); return; }
    if (pwNew !== pwConfirm) { update({ pwError: t("profile.pwMismatch") }); return; }
    update({ password: pwNew, changePwOpen: false, pwCurrent: "", pwNew: "", pwConfirm: "", pwError: "" });
  };
  const archiveLesson = (key: string | null) => { if (!key) return; update((s) => ({ lessons: s.lessons.map((l) => (l.key === key ? { ...l, archived: !l.archived } : l)), lessonMenuKey: null })); };
  const deleteLesson = (key: string | null) => { if (!key) return; update((s) => ({ lessons: s.lessons.filter((l) => l.key !== key), lessonMenuKey: null })); };

  const startThisOrThat = () => update({ nav: "play", topicKey: null, game: { type: "getknow", deck: "tot", i: 0, picks: [], done: false } });
  const startSurvey = () => update({ nav: "play", topicKey: null, game: { type: "getknow", deck: "survey", i: 0, picks: [], done: false } });
  const applyGetknow = (picks: GkOption[]) => {
    update((s) => {
      const interests = { ...s.interests };
      const custom = [...s.custom];
      let preferredMode = s.preferredMode;
      picks.forEach((p) => {
        if (p.interest) {
          if (POOL.some(([l]) => l === p.interest)) interests[p.interest] = true;
          else if (!custom.some((c) => c.label === p.interest)) custom.push({ label: p.interest, emoji: "✨" });
        }
        if (p.mode) preferredMode = p.mode;
      });
      return { interests, custom, preferredMode };
    });
  };
  const pickGetknow = (idx: number) => {
    const g0 = st.game;
    if (!g0 || g0.type !== "getknow" || g0.done) return;
    const deck = localDeck(g0.deck);
    const opt = deck.rounds[g0.i].opts[idx];
    const picks = [...g0.picks, opt];
    if (g0.i + 1 >= deck.rounds.length) { applyGetknow(picks); update({ game: { ...g0, picks, done: true } }); markStudied(); }
    else update({ game: { ...g0, i: g0.i + 1, picks } });
  };
  const startQuiz = () => {
    const order = QBANK.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, 5);
    update({ nav: "play", topicKey: null, game: { type: "quiz", order, i: 0, score: 0, picked: null, revealed: false, done: false } });
  };
  const pickAnswer = (idx: number) => {
    const g0 = st.game;
    if (!g0 || g0.type !== "quiz" || g0.revealed) return;
    const correct = QBANK[g0.order[g0.i]].correct;
    update({ game: { ...g0, picked: idx, revealed: true, score: g0.score + (idx === correct ? 1 : 0) } });
  };
  const nextQ = () => {
    const g0 = st.game;
    if (!g0 || g0.type !== "quiz") return;
    if (g0.i + 1 >= g0.order.length) { update({ game: { ...g0, done: true } }); markStudied(); }
    else update({ game: { ...g0, i: g0.i + 1, picked: null, revealed: false } });
  };
  const startCards = () => update({ nav: "play", topicKey: null, game: { type: "cards", i: 0, flipped: false } });
  const flipCard = () => { const g0 = st.game; if (g0?.type === "cards") update({ game: { ...g0, flipped: !g0.flipped } }); };
  const nextCard = () => { const g0 = st.game; if (g0?.type === "cards") update({ game: { ...g0, i: (g0.i + 1) % raw<unknown[]>("cards").length, flipped: false } }); };
  const prevCard = () => { const g0 = st.game; if (g0?.type === "cards") { const n = raw<unknown[]>("cards").length; update({ game: { ...g0, i: (g0.i - 1 + n) % n, flipped: false } }); } };
  const exitGame = () => update({ game: null });

  /* ===================== derived ===================== */
  const nameDisplay = st.name ? st.name.split(" ")[0] : t("home.there");
  const selectedCount = selectedInterests().length;
  const emailOk = /.+@.+\..+/.test(st.email);
  const authDisabled = !(emailOk && st.password.length >= 4);
  const aboutDisabled = !(st.name.trim() && Number(st.age) > 0);
  const finishDisabled = selectedCount === 0;

  const findItem = (id: string | null) => CATALOG.find((i) => i.id === id);
  const colorItem = findItem(st.equipped.color) || CATALOG[0];
  const bgItem = findItem(st.equipped.bg) || findItem("b_cream")!;
  const hatItem = st.equipped.hat ? findItem(st.equipped.hat) : null;
  const faceItem = st.equipped.face ? findItem(st.equipped.face) : null;
  const neckItem = st.equipped.neck ? findItem(st.equipped.neck) : null;
  const mascotFilter = colorItem.filter || "none";

  const topic = findTopic(st.topicKey);
  const messages = (topic ? st.chats[st.topicKey!] || [] : []).map((m) => ({ ...m, fromSqueaky: !m.fromUser }));
  const curMode = MODES.find((m) => m.key === (st.topicMode[st.topicKey || ""] || "simplified")) || MODES[0];
  const pickerTopic = findTopic(st.pickerKey);

  const lessonTitle = (l: Lesson) => st.titleOverrides[l.key] || (BUILTIN_KEYS.has(l.key) ? t(`topics.${l.key}.title`) : l.title);
  const allLessons = st.lessons.map((l) => ({ ...l, displayTitle: lessonTitle(l), tileBg: tileBg(l.accent) }));
  const lessons = allLessons.filter((l) => !l.archived);
  const archivedLessons = allLessons.filter((l) => l.archived);
  const historyLessons = st.historyTab === "archived" ? archivedLessons : lessons;
  const menuLesson = st.lessonMenuKey ? allLessons.find((l) => l.key === st.lessonMenuKey) : null;
  const pInitials = (st.name || "").trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const eInitials = (st.editName || "").trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? t("home.greetMorning") : hour < 18 ? t("home.greetAfternoon") : t("home.greetEvening");
  const dow = (now.getDay() + 6) % 7;
  const monday = new Date(now); monday.setDate(now.getDate() - dow);
  const datesSet = new Set(st.streak.dates || []);
  const todayStr = ymd(now);
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const k = ymd(d); const done = datesSet.has(k); const isToday = k === todayStr;
    return {
      label: labels[i], mark: done ? "✓" : isToday ? "·" : "",
      bg: done ? "var(--gold-500)" : isToday ? "var(--gold-100)" : "var(--cream-100)",
      color: done ? "#fff" : "var(--text-muted)",
      border: done ? "var(--gold-500)" : isToday ? "var(--gold-400)" : "var(--border-subtle)",
    };
  });
  const streakDays = st.streak.days;
  const streakDoneToday = st.streak.last === todayStr;
  const streakMsg = streakDoneToday ? t("play.streakAwake") : t("play.streakAsleep");

  const tourOpen = st.tourIdx >= 0;
  const tourSteps = raw<{ title: string; body: string }[]>("tour");
  const tStep = tourSteps[st.tourIdx] || tourSteps[0];
  const tourIsLast = st.tourIdx >= tourSteps.length - 1;

  const g = st.game;
  const gameQuizPlay = g?.type === "quiz" && !g.done;
  const gameQuizDone = g?.type === "quiz" && g.done;
  const gameCards = g?.type === "cards";
  const gk = g?.type === "getknow" ? g : null;

  const homeActive = st.nav === "home" && !st.topicKey;
  const sqActive = st.nav === "squeaky" && !st.topicKey;
  const navCol = (a: boolean) => (a ? "var(--gold-700)" : "var(--gray-500)");
  const iconCol = (a: boolean) => (a ? "var(--gold-600)" : "var(--gray-400)");
  const goNav = (nav: State["nav"]) => () => update({ nav, topicKey: null, game: null });
  const mascotSrc = streakDoneToday ? MASCOT.happy : MASCOT.idle;

  const showApp = st.screen === "app";
  const showHome = showApp && st.nav === "home" && !st.topicKey;
  const showPlay = showApp && st.nav === "play" && !st.topicKey;
  const showSqueaky = showApp && st.nav === "squeaky" && !st.topicKey;
  const showChat = showApp && !!st.topicKey;
  const showHistory = showApp && st.nav === "history" && !st.topicKey;
  const showSettings = showApp && st.nav === "settings" && !st.topicKey;

  /* ---------- auth flows (server actions, with guest fallback) ---------- */
  const guestName = () => {
    const local = (st.email.split("@")[0] || "there").replace(/[^a-zA-Z]/g, " ").trim();
    return st.name || (local ? local.charAt(0).toUpperCase() + local.slice(1) : "there");
  };
  const doLogin = async () => {
    if (authDisabled) return;
    const res = await loginAction({ email: st.email, password: st.password });
    if (res.ok && res.data) {
      const d = res.data;
      if (d.language) setLang(d.language as Lang);
      setSt((s) => ({ ...s, ...mergeData(d), authed: true, screen: "app", nav: "home", tourIdx: -1, authError: "" }));
      return;
    }
    if (res.error === "invalid") { update({ authError: t("auth.loginFailed") }); return; }
    update({ screen: "app", nav: "home", name: guestName(), tourIdx: -1, authError: "" }); // guest / no-db
  };
  const doFinish = async () => {
    if (finishDisabled) return;
    const res = await signupAction({ email: st.email, password: st.password, name: st.name, age: st.age, interests: st.interests, custom: st.custom, language: lang });
    if (res.ok && res.data) {
      setSt((s) => ({ ...s, ...mergeData(res.data!), authed: true, screen: "app", nav: "home", tourIdx: 0, authError: "" }));
      return;
    }
    if (res.error === "exists") { update({ screen: "login", authError: t("auth.emailExists") }); return; }
    update({ screen: "app", nav: "home", tourIdx: 0, authError: "" }); // guest / no-db
  };
  const doLogout = () => { logoutAction().catch(() => {}); update({ screen: "welcome", nav: "home", topicKey: null, authed: false, authError: "" }); };

  const langToggle = (
    <button onClick={() => setLang(lang === "en" ? "es" : "en")} title="Language" style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1.5px solid var(--border-subtle)", background: "var(--surface-card)", borderRadius: 999, padding: "6px 12px", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--navy-700)" }}>
      🌐 {lang.toUpperCase()}
    </button>
  );

  return (
    <div className="tia-root">
      <div className="tia-shell" style={{ ["--mascot-filter" as string]: mascotFilter }}>

        {/* main */}
        <div style={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }}>

          {/* ---------------- HOME ---------------- */}
          {showHome && (
            <div style={scrollArea}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={kicker}>{greeting}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 27, letterSpacing: "-0.03em", color: "var(--navy-700)", lineHeight: 1.05 }}>{nameDisplay}</div>
                </div>
                <StreakChip days={streakDays} />
              </div>

              <button onClick={() => update({ tourIdx: 0, modePickerOpen: false, addTopicOpen: false })} style={{ width: "100%", border: "none", cursor: "pointer", textAlign: "left", borderRadius: 24, padding: 18, marginBottom: 14, background: "radial-gradient(120% 130% at 28% 22%, var(--gold-100), var(--cream-100) 62%, var(--cream-50))", boxShadow: "var(--shadow-sm)", display: "flex", alignItems: "center", gap: 14, position: "relative", overflow: "hidden" }}>
                <div style={{ width: 96, height: 96, flex: "none", borderRadius: "50%", background: "radial-gradient(circle at 50% 40%, var(--gold-200), var(--gold-100) 70%)", display: "flex", alignItems: "center", justifyContent: "center", animation: "tia-ring 2.4s ease-out infinite" }}>
                  <div style={{ position: "relative", width: "86%" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img data-mascot="" src={mascotSrc} alt="Squeaky" style={{ width: "100%", display: "block", animation: streakDoneToday ? "tia-float 3.2s ease-in-out infinite" : undefined }} />
                    <MascotAcc hatItem={hatItem} faceItem={faceItem} neckItem={neckItem} sizes={{ hat: 23, face: 19, neck: 16 }} />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, letterSpacing: "-0.02em", color: "var(--navy-700)", lineHeight: 1.1 }}>{t("home.heroName")}</div>
                  <div style={{ fontSize: 13.5, color: "var(--text-body)", lineHeight: 1.4, marginTop: 3 }}>{t("home.heroBody")}</div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 9, fontSize: 12, fontWeight: 700, color: "var(--gold-700)", background: "var(--surface-card)", border: "1.5px solid var(--gold-300)", borderRadius: 999, padding: "5px 11px" }}>
                    <Icon n="play" s={14} color="var(--gold-700)" /> {t("home.startTour")}
                  </span>
                </div>
              </button>

              <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: 20, padding: "14px 16px", marginBottom: 18, boxShadow: "var(--shadow-xs)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--navy-700)" }}>{t("home.thisWeek")}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gold-700)", fontWeight: 700 }}>{t("home.streakLabel", { n: streakDays })}</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {weekDays.map((d, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: 1 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, background: d.bg, color: d.color, border: `2px solid ${d.border}` }}>{d.mark}</div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-subtle)" }}>{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: 15, color: "var(--text-body)", lineHeight: 1.45, marginBottom: 14 }}>{t("home.prompt")}</div>
              <div style={topicGrid}>
                {allTopics().map((tp) => (
                  <Card key={tp.key} interactive padding="sm" onClick={() => update({ modePickerOpen: true, pickerKey: tp.key })}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: tileBg(tp.accent) }}>{tp.emoji}</div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--navy-700)", letterSpacing: "-0.01em", lineHeight: 1.12 }}>{tp.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.35 }}>{tp.blurb}</div>
                    </div>
                  </Card>
                ))}
                <button onClick={() => update({ addTopicOpen: true, topicDraft: "", topicEmojiDraft: "📚" })} style={{ cursor: "pointer", background: "var(--cream-100)", border: "2px dashed var(--gold-300)", borderRadius: "var(--radius-xl)", padding: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 128, textAlign: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--gold-100)", color: "var(--gold-700)" }}><Icon n="plus" s={22} color="var(--gold-700)" /></div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--navy-700)" }}>{t("home.addTopic")}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.3 }}>{t("home.addTopicSub")}</div>
                </button>
              </div>
            </div>
          )}

          {/* ---------------- PLAY ---------------- */}
          {showPlay && (
            <div style={scrollArea}>
              {!st.game && (
                <div>
                  <div style={pageTitle}>{t("play.title")}</div>
                  <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 18 }}>{t("play.sub")}</div>

                  <button onClick={startQuiz} style={{ width: "100%", cursor: "pointer", border: "none", textAlign: "left", borderRadius: 22, padding: 18, marginBottom: 12, background: "linear-gradient(135deg, var(--navy-700), var(--navy-600))", boxShadow: "var(--shadow-md)", display: "flex", alignItems: "center", gap: 14, color: "#fff" }}>
                    <div style={{ width: 52, height: 52, flex: "none", borderRadius: 15, background: "rgba(255,255,255,.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🧠</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "inline-block", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".08em", background: "var(--gold-500)", color: "var(--navy-700)", fontWeight: 800, padding: "2px 7px", borderRadius: 6, marginBottom: 6 }}>{t("play.dailyChallenge")}</div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em" }}>{t("play.quizName")}</div>
                      <div style={{ fontSize: 12.5, opacity: 0.82, marginTop: 2 }}>{t("play.quizSub")}</div>
                    </div>
                  </button>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <button onClick={startCards} style={{ cursor: "pointer", border: "1.5px solid var(--border-subtle)", textAlign: "left", background: "var(--surface-card)", borderRadius: 20, padding: 16, boxShadow: "var(--shadow-xs)", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 13, background: "var(--coral-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🃏</div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--navy-700)" }}>{t("play.cardsName")}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.3 }}>{t("play.cardsSub")}</div>
                    </button>
                    <button onClick={startThisOrThat} style={{ cursor: "pointer", border: "1.5px solid var(--border-subtle)", textAlign: "left", background: "var(--surface-card)", borderRadius: 20, padding: 16, boxShadow: "var(--shadow-xs)", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 13, background: "var(--green-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🤔</div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--navy-700)" }}>{t("play.totName")}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.3 }}>{t("play.totSub")}</div>
                    </button>
                  </div>

                  <button onClick={startSurvey} style={{ width: "100%", cursor: "pointer", border: "1.5px solid var(--coral-500)", textAlign: "left", background: "linear-gradient(135deg, var(--coral-100), var(--cream-50))", borderRadius: 20, padding: "15px 16px", boxShadow: "var(--shadow-xs)", display: "flex", alignItems: "center", gap: 13, marginBottom: 12 }}>
                    <div style={{ width: 48, height: 48, flex: "none", borderRadius: 14, background: "var(--surface-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🌟</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "var(--navy-700)", letterSpacing: "-0.01em" }}>{t("play.surveyName")}</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-body)", lineHeight: 1.35 }}>{t("play.surveySub")}</div>
                    </div>
                  </button>

                  <div style={{ background: "var(--gold-100)", border: "1.5px solid var(--gold-300)", borderRadius: 20, padding: "13px 16px", display: "flex", alignItems: "center", gap: 13 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img data-mascot="" src={mascotSrc} alt="" style={{ width: 48, flex: "none" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "var(--navy-700)" }}>{t("play.streakN", { n: streakDays })}</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-body)", lineHeight: 1.35 }}>{streakMsg}</div>
                    </div>
                  </div>
                </div>
              )}

              {gameQuizPlay && g?.type === "quiz" && <QuizPlay g={g} onPick={pickAnswer} onNext={nextQ} onExit={exitGame} />}
              {gameQuizDone && g?.type === "quiz" && <QuizDone g={g} streakDays={streakDays} onExit={exitGame} onAgain={startQuiz} />}
              {gameCards && g?.type === "cards" && <CardsPlay g={g} onFlip={flipCard} onNext={nextCard} onPrev={prevCard} onExit={exitGame} />}
              {gk && !gk.done && <GetknowPlay g={gk} deck={localDeck(gk.deck)} onPick={pickGetknow} onExit={exitGame} />}
              {gk && gk.done && <GetknowDone g={gk} onExit={exitGame} onAgain={() => update({ game: { type: "getknow", deck: gk.deck, i: 0, picks: [], done: false } })} />}
            </div>
          )}

          {/* ---------------- CHAT ---------------- */}
          {showChat && topic && (
            <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 11, padding: "12px 16px", borderBottom: "1.5px solid var(--border-subtle)", background: "var(--surface-card)" }}>
                <button onClick={() => update({ topicKey: null, nav: "home" })} style={{ border: "none", background: "var(--cream-100)", width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "none" }}><Icon n="arrow-left" s={22} color="var(--navy-700)" /></button>
                <div style={{ width: 40, height: 40, flex: "none", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: tileBg(topic.accent) }}>{topic.emoji}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <button onClick={() => update({ renameOpen: true, renameDraft: topic.title })} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, maxWidth: "100%" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "var(--navy-700)", letterSpacing: "-0.01em", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topic.title}</span>
                    <span style={{ flex: "none", display: "flex" }}><Icon n="pencil" s={15} color="var(--text-subtle)" /></span>
                  </button>
                  <div style={{ fontSize: 12, color: "var(--green-600)", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green-500)" }} />{t("chat.here")}</div>
                </div>
                <button onClick={() => update({ modePickerOpen: true, pickerKey: st.topicKey })} style={{ flex: "none", cursor: "pointer", border: "1.5px solid var(--gold-300)", background: "var(--gold-100)", borderRadius: 999, padding: "6px 11px", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--gold-700)", fontFamily: "var(--font-sans)" }}><span style={{ fontSize: 14 }}>{curMode.emoji}</span>{modeTitle(curMode.key)}</button>
              </div>

              <div ref={chatRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "18px 16px", background: "var(--cream-50)" }}>
                {messages.map((m) => m.fromSqueaky ? (
                  <div key={m.id} style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 14 }}>
                    <div style={chatAvatar}>{/* eslint-disable-next-line @next/next/no-img-element */}<img data-mascot="" src={MASCOT.chat} alt="Squeaky" style={{ width: "80%" }} /></div>
                    <div style={{ maxWidth: "78%", background: "var(--surface-card)", border: "1.5px solid var(--border-subtle)", borderRadius: "18px 18px 18px 6px", padding: "11px 14px", fontSize: 14.5, lineHeight: 1.5, color: "var(--navy-700)", boxShadow: "var(--shadow-xs)", whiteSpace: "pre-wrap" }}>{m.text}</div>
                  </div>
                ) : (
                  <div key={m.id} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                    <div style={{ maxWidth: "78%", background: "var(--gold-500)", borderRadius: "18px 18px 6px 18px", padding: "11px 14px", fontSize: 14.5, lineHeight: 1.5, color: "var(--navy-700)", fontWeight: 600, whiteSpace: "pre-wrap" }}>{m.text}</div>
                  </div>
                ))}
                {st.sending && (
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 14 }}>
                    <div style={chatAvatar}>{/* eslint-disable-next-line @next/next/no-img-element */}<img data-mascot="" src={MASCOT.chat} alt="Squeaky" style={{ width: "80%" }} /></div>
                    <div style={{ background: "var(--surface-card)", border: "1.5px solid var(--border-subtle)", borderRadius: "18px 18px 18px 6px", padding: "14px 16px", display: "flex", gap: 5 }}>
                      {[0, 0.15, 0.3].map((d, i) => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--gold-500)", animation: `tia-dot 1s infinite ${d}s` }} />)}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ flex: "none", borderTop: "1.5px solid var(--border-subtle)", background: "var(--surface-card)", padding: "10px 14px" }}>
                {st.topicKey && st.materials[st.topicKey] && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9, background: "var(--sky-100)", border: "1.5px solid var(--sky-500)", borderRadius: 12, padding: "8px 11px" }}>
                      <span style={{ flex: "none", display: "flex" }}><Icon n="file-text" s={18} color="var(--sky-600)" /></span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: "var(--navy-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{st.materials[st.topicKey].name}</span>
                      <button onClick={removeMaterial} style={{ flex: "none", border: "none", background: "none", cursor: "pointer", display: "flex" }}><Icon n="x" s={16} color="var(--text-muted)" /></button>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 9 }}>
                      <button onClick={() => send(t("chat.explainPreset"))} style={chipBtn}>{t("chat.explain")}</button>
                      <button onClick={() => send(t("chat.quizPreset"))} style={chipBtn}>{t("chat.quizMe")}</button>
                    </div>
                  </>
                )}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => update({ attachOpen: true })} title={t("modal.attachTitle")} style={{ flex: "none", width: 42, height: 42, borderRadius: "50%", border: "1.5px solid var(--border-default)", background: "var(--cream-50)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon n="paperclip" s={20} color="var(--navy-600)" /></button>
                  <input value={st.draft} onChange={setField("draft")} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={t("chat.placeholder")} style={{ flex: 1, minWidth: 0, border: "1.5px solid var(--border-default)", borderRadius: 999, padding: "11px 16px", fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--navy-700)", outline: "none", background: "var(--cream-50)" }} />
                  <IconButton variant="primary" round label="Send" onClick={() => send()}><Icon n="arrow-up" s={20} color="var(--navy-700)" /></IconButton>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- SQUEAKY ---------------- */}
          {showSqueaky && (
            <div style={scrollArea}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={kicker}>{t("squeaky.buddy")}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, letterSpacing: "-0.03em", color: "var(--navy-700)", lineHeight: 1 }}>Squeaky</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--gold-100)", border: "1.5px solid var(--gold-300)", borderRadius: 999, padding: "7px 13px", flex: "none" }}>
                  <span style={{ fontSize: 15 }}>🪙</span>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "var(--navy-700)" }}>{st.tokens}</span>
                </div>
              </div>

              <div style={{ borderRadius: 24, background: bgItem.bg, padding: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "14px 0 16px", boxShadow: "var(--shadow-sm)", minHeight: 226, overflow: "hidden" }}>
                <div style={{ position: "relative", width: 210 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img data-mascot="" src={MASCOT.happy} alt="Squeaky" style={{ width: "100%", display: "block", filter: mascotFilter }} />
                  <MascotAcc hatItem={hatItem} faceItem={faceItem} neckItem={neckItem} sizes={{ hat: 54, face: 44, neck: 38 }} />
                </div>
              </div>

              <div style={{ background: "var(--gold-100)", border: "1.5px solid var(--gold-300)", borderRadius: 14, padding: "10px 13px", fontSize: 12.5, color: "var(--navy-700)", lineHeight: 1.4, marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 16, flex: "none" }}>🪙</span><span>{t("squeaky.coinsTip")}</span>
              </div>

              <div style={{ display: "flex", gap: 5, background: "var(--cream-100)", borderRadius: 14, padding: 4, marginBottom: 16 }}>
                {CAT_TABS.map(([k]) => (
                  <button key={k} onClick={() => update({ squeakyCat: k })} style={{ flex: 1, cursor: "pointer", border: "none", borderRadius: 11, padding: "9px 0", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, background: st.squeakyCat === k ? "var(--surface-card)" : "transparent", color: st.squeakyCat === k ? "var(--navy-700)" : "var(--text-muted)" }}>{t(`squeaky.cats.${k}`)}</button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {CATALOG.filter((i) => i.cat === st.squeakyCat).map((i) => {
                  const owned = st.owned.includes(i.id);
                  const equipped = st.equipped[i.slot] === i.id;
                  const afford = st.tokens >= i.price;
                  return (
                    <button key={i.id} onClick={() => buyOrEquip(i)} style={{ border: `2px solid ${equipped ? "var(--gold-500)" : "var(--border-subtle)"}`, background: equipped ? "var(--gold-100)" : "var(--surface-card)", borderRadius: 16, padding: "11px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, opacity: !owned && !afford ? 0.5 : 1, boxShadow: "var(--shadow-xs)" }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cream-100)", overflow: "hidden" }}>
                        {i.emoji ? <span style={{ fontSize: 26, lineHeight: 1 }}>{i.emoji}</span>
                          : i.cat === "color" ? <span style={{ width: 30, height: 30, borderRadius: "50%", background: i.swatch, border: "2px solid #fff", boxShadow: "var(--shadow-xs)" }} />
                          : <span style={{ width: "100%", height: "100%", background: i.bg }} />}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--navy-700)", textAlign: "center", lineHeight: 1.1 }}>{catalogName(i.id)}</div>
                      {owned ? (
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold-700)" }}>{equipped ? t("squeaky.wearing") : t("squeaky.tapWear")}</div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11.5, fontWeight: 700, color: "var(--navy-700)" }}><span style={{ fontSize: 12 }}>🪙</span>{i.price === 0 ? t("squeaky.free") : i.price}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---------------- HISTORY ---------------- */}
          {showHistory && (
            <div style={scrollArea}>
              <div style={pageTitle}>{t("history.title")}</div>
              <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 16 }}>{t("history.sub")}</div>
              <div style={{ display: "flex", gap: 5, background: "var(--cream-100)", borderRadius: 14, padding: 4, marginBottom: 16 }}>
                <button onClick={() => update({ historyTab: "active" })} style={tabStyle(st.historyTab === "active")}>{t("history.active")} · {lessons.length}</button>
                <button onClick={() => update({ historyTab: "archived" })} style={tabStyle(st.historyTab === "archived")}>{t("history.archived")} · {archivedLessons.length}</button>
              </div>
              {historyLessons.length === 0 && (
                <div style={{ textAlign: "center", padding: "38px 20px" }}>
                  <div style={{ width: 90, height: 90, margin: "0 auto 12px", borderRadius: "50%", background: "radial-gradient(circle at 50% 42%, var(--gold-100), var(--cream-100))", display: "flex", alignItems: "center", justifyContent: "center" }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img data-mascot="" src={MASCOT.chat} alt="" style={{ width: "78%", opacity: 0.85 }} /></div>
                  <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5, maxWidth: 230, margin: "0 auto" }}>{st.historyTab === "archived" ? t("history.emptyArchived") : t("history.emptyActive")}</div>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {historyLessons.map((l) => (
                  <div key={l.key} style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-xl)", padding: "13px 14px", boxShadow: "var(--shadow-xs)", display: "flex", alignItems: "center", gap: 11 }}>
                    <button onClick={() => startTopic(l.key)} style={{ flex: 1, minWidth: 0, border: "none", background: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 13, padding: 0 }}>
                      <div style={{ width: 46, height: 46, flex: "none", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: l.tileBg }}>{l.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--navy-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.displayTitle}</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-subtle)", whiteSpace: "nowrap", flex: "none" }}>{l.when}</div>
                        </div>
                        <div style={{ marginTop: 9 }}><ProgressBar value={l.progress} size="sm" /></div>
                      </div>
                    </button>
                    <button onClick={() => update({ lessonMenuKey: l.key })} title="Options" style={{ flex: "none", width: 34, height: 34, borderRadius: 10, border: "none", background: "var(--cream-100)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon n="ellipsis-vertical" s={20} color="var(--text-muted)" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- SETTINGS ---------------- */}
          {showSettings && (
            <div style={scrollArea}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", color: "var(--navy-700)" }}>{t("settings.title")}</div>
                {langToggle}
              </div>
              <Card padding="md">
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ flex: "none" }}>
                    {st.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={st.photo} alt="Profile" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", boxShadow: "0 0 0 3px var(--surface-card), 0 0 0 5px var(--gold-500)" }} />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--navy-600)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, boxShadow: "0 0 0 3px var(--surface-card), 0 0 0 5px var(--gold-500)" }}>{pInitials || "🙂"}</div>
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--navy-700)", letterSpacing: "-0.01em" }}>{nameDisplay}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>{st.email}</div>
                    {st.age && <div style={{ marginTop: 6 }}><Badge variant="gold">{t("settings.age")} {st.age}</Badge></div>}
                  </div>
                  <button onClick={() => update({ editProfileOpen: true, editName: st.name, editAge: st.age, editEmail: st.email, editPhoto: st.photo })} style={{ flex: "none", border: "1.5px solid var(--border-subtle)", background: "var(--cream-50)", borderRadius: 12, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "var(--navy-700)", fontFamily: "var(--font-sans)" }}><Icon n="pencil" s={15} color="var(--text-subtle)" /> {t("common.edit")}</button>
                </div>
              </Card>

              <div style={sectionLabel}>{t("settings.interests")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                {POOL.map(([label, emoji]) => (
                  <InterestChip key={label} label={interestLabel(label)} emoji={emoji} selected={!!st.interests[label]} onClick={() => update((s) => ({ interests: { ...s.interests, [label]: !s.interests[label] } }))} />
                ))}
                {st.custom.map((c, idx) => (
                  <InterestChip key={c.label} label={c.label} emoji={c.emoji} selected removable onRemove={() => update((s) => ({ custom: s.custom.filter((_, i) => i !== idx) }))} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
                <input value={st.customDraft} onChange={setField("customDraft")} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }} placeholder={t("settings.addOwnPh")} style={pillInput} />
                <IconButton variant="primary" round label="Add interest" onClick={addCustom}><Icon n="plus" s={22} color="var(--navy-700)" /></IconButton>
              </div>

              <div style={sectionLabel}>{t("settings.preferences")}</div>
              <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-xl)", padding: "4px 16px" }}>
                <PrefRow title={t("settings.nudge")} desc={t("settings.nudgeDesc")} checked={st.prefs.nudge} onChange={(v) => update((s) => ({ prefs: { ...s.prefs, nudge: v } }))} border />
                <PrefRow title={t("settings.sounds")} desc={t("settings.soundsDesc")} checked={st.prefs.sounds} onChange={(v) => update((s) => ({ prefs: { ...s.prefs, sounds: v } }))} border />
                <PrefRow title={t("settings.checkins")} desc={t("settings.checkinsDesc")} checked={st.prefs.checkins} onChange={(v) => update((s) => ({ prefs: { ...s.prefs, checkins: v } }))} border />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 0" }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--navy-700)" }}>{t("settings.language")}</div>
                  <div style={{ display: "flex", gap: 6, background: "var(--cream-100)", borderRadius: 999, padding: 3 }}>
                    {(["en", "es"] as const).map((l) => (
                      <button key={l} onClick={() => setLang(l)} style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "6px 14px", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, background: lang === l ? "var(--surface-card)" : "transparent", color: lang === l ? "var(--navy-700)" : "var(--text-muted)", boxShadow: lang === l ? "var(--shadow-xs)" : "none" }}>{l.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 20 }}><Button variant="ghost" fullWidth onClick={doLogout}>{t("common.logout")}</Button></div>
            </div>
          )}

          {/* ---------------- OVERLAYS ---------------- */}
          {st.modePickerOpen && (
            <Overlay align="end" onClose={() => update({ modePickerOpen: false, pickerKey: null })}>
              <div style={{ width: "100%", maxHeight: "90%", overflowY: "auto", background: "var(--cream-50)", borderRadius: "26px 26px 0 0", boxShadow: "var(--shadow-xl)", padding: "20px 18px 24px", animation: "tia-pop .28s ease-out both" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                  <h2 style={modalTitle}>{t("modal.modeTitle", { topic: pickerTopic ? pickerTopic.title : "" })}</h2>
                  <button onClick={() => update({ modePickerOpen: false, pickerKey: null })} style={closeBtn}><Icon n="x" s={20} color="var(--navy-700)" /></button>
                </div>
                <p style={modalSub}>{t("modal.modeSub")}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
                  {MODES.map((m) => (
                    <ModeCard key={m.key} title={modeTitle(m.key)} description={t(`modes.${m.key}.desc`)} icon={<span style={{ fontSize: 22 }}>{m.emoji}</span>} accent={m.accent} selected={pickerTopic ? (st.topicMode[pickerTopic.key] || "simplified") === m.key : false} onClick={() => startTopic(st.pickerKey!, m.key)} />
                  ))}
                </div>
              </div>
            </Overlay>
          )}

          {st.addTopicOpen && (
            <Overlay align="center" onClose={() => update({ addTopicOpen: false })}>
              <div style={dialogBox}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                  <h2 style={modalTitle}>{t("modal.addTitle")}</h2>
                  <button onClick={() => update({ addTopicOpen: false })} style={closeBtn}><Icon n="x" s={20} color="var(--navy-700)" /></button>
                </div>
                <p style={modalSub}>{t("modal.addSub")}</p>
                <input value={st.topicDraft} onChange={setField("topicDraft")} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); createTopic(); } }} placeholder={t("modal.addPh")} style={{ ...textInput, marginBottom: 14 }} />
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-subtle)", marginBottom: 8 }}>{t("modal.pickIcon")}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                  {EMOJI_CHOICES.map((e) => (
                    <button key={e} onClick={() => update({ topicEmojiDraft: e })} style={{ cursor: "pointer", width: 42, height: 42, borderRadius: 12, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", background: e === st.topicEmojiDraft ? "var(--gold-100)" : "var(--surface-card)", border: `2px solid ${e === st.topicEmojiDraft ? "var(--gold-500)" : "var(--border-subtle)"}` }}>{e}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Button variant="ghost" onClick={() => update({ addTopicOpen: false })}>{t("common.cancel")}</Button>
                  <Button fullWidth disabled={!st.topicDraft.trim()} onClick={createTopic}>{t("modal.createStudy")}</Button>
                </div>
              </div>
            </Overlay>
          )}

          {st.attachOpen && (
            <Overlay align="center" onClose={() => update({ attachOpen: false })}>
              <div style={dialogBox}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                  <h2 style={modalTitle}>{t("modal.attachTitle")}</h2>
                  <button onClick={() => update({ attachOpen: false })} style={closeBtn}><Icon n="x" s={20} color="var(--navy-700)" /></button>
                </div>
                <p style={modalSub}>{t("modal.attachSub")}</p>
                <textarea value={st.materialDraft} onChange={setField("materialDraft")} placeholder={t("modal.attachPh")} style={{ width: "100%", height: 118, resize: "none", border: "1.5px solid var(--border-default)", borderRadius: 14, padding: "12px 14px", fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.5, color: "var(--navy-700)", outline: "none", background: "var(--surface-card)" }} />
                <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, cursor: "pointer", border: "1.5px dashed var(--border-default)", borderRadius: 14, padding: 12, fontSize: 13.5, fontWeight: 600, color: "var(--navy-600)" }}>
                  <Icon n="upload" s={18} color="var(--navy-600)" /> <span>{t("modal.uploadTxt")}</span>
                  <input type="file" accept=".txt,.md,text/plain" onChange={onMaterialFile} style={{ display: "none" }} />
                </label>
                {st.materialName && <div style={{ marginTop: 9, fontSize: 12.5, color: "var(--green-600)", fontWeight: 600 }}>{t("modal.loaded", { name: st.materialName })}</div>}
                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <Button variant="ghost" onClick={() => update({ attachOpen: false })}>{t("common.cancel")}</Button>
                  <Button fullWidth disabled={!st.materialDraft.trim()} onClick={attachMaterial}>{t("modal.giveSqueaky")}</Button>
                </div>
              </div>
            </Overlay>
          )}

          {st.renameOpen && (
            <Overlay align="center" onClose={() => update({ renameOpen: false })}>
              <div style={dialogBox}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
                  <h2 style={modalTitle}>{t("modal.renameTitle")}</h2>
                  <button onClick={() => update({ renameOpen: false })} style={closeBtn}><Icon n="x" s={20} color="var(--navy-700)" /></button>
                </div>
                <input value={st.renameDraft} onChange={setField("renameDraft")} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveRename(); } }} placeholder={t("modal.renamePh")} style={{ ...textInput, marginBottom: 18 }} />
                <div style={{ display: "flex", gap: 10 }}>
                  <Button variant="ghost" onClick={() => update({ renameOpen: false })}>{t("common.cancel")}</Button>
                  <Button fullWidth disabled={!st.renameDraft.trim()} onClick={saveRename}>{t("common.save")}</Button>
                </div>
              </div>
            </Overlay>
          )}

          {st.editProfileOpen && (
            <Overlay align="center" onClose={() => update({ editProfileOpen: false })}>
              <div style={{ ...dialogBox, maxHeight: "94%", overflowY: "auto" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
                  <h2 style={modalTitle}>{t("profile.editTitle")}</h2>
                  <button onClick={() => update({ editProfileOpen: false })} style={closeBtn}><Icon n="x" s={20} color="var(--navy-700)" /></button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 18 }}>
                  <div style={{ position: "relative", width: 92, height: 92 }}>
                    {st.editPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={st.editPhoto} alt="Profile" style={{ width: 92, height: 92, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--gold-300)" }} />
                    ) : (
                      <div style={{ width: 92, height: 92, borderRadius: "50%", background: "radial-gradient(circle at 50% 38%, var(--gold-200), var(--gold-100))", border: "3px solid var(--gold-300)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34, color: "var(--navy-700)" }}>{eInitials || "🙂"}</div>
                    )}
                    <label style={{ position: "absolute", right: -2, bottom: -2, width: 32, height: 32, borderRadius: "50%", background: "var(--gold-500)", border: "2.5px solid var(--cream-50)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "var(--shadow-sm)" }}>
                      <Icon n="camera" s={16} color="#fff" />
                      <input type="file" accept="image/*" onChange={onPhotoFile} style={{ display: "none" }} />
                    </label>
                  </div>
                  {st.editPhoto && <button onClick={() => update({ editPhoto: "" })} style={{ marginTop: 9, border: "none", background: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, color: "var(--coral-600)" }}>{t("profile.removePhoto")}</button>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  <Input label={t("profile.name")} placeholder={t("profile.namePh")} value={st.editName} onChange={setField("editName")} />
                  <Input label={t("profile.age")} type="number" placeholder={t("profile.agePh")} value={st.editAge} onChange={setField("editAge")} />
                  <Input label={t("profile.email")} type="email" placeholder={t("profile.emailPh")} value={st.editEmail} onChange={setField("editEmail")} />
                </div>
                <button onClick={() => update({ changePwOpen: true, pwCurrent: "", pwNew: "", pwConfirm: "", pwError: "" })} style={{ width: "100%", marginTop: 14, cursor: "pointer", border: "1.5px solid var(--border-subtle)", background: "var(--surface-card)", borderRadius: 14, padding: "13px 15px", display: "flex", alignItems: "center", gap: 11 }}>
                  <span style={{ flex: "none", display: "flex" }}><Icon n="lock" s={16} color="var(--navy-700)" /></span>
                  <span style={{ flex: 1, textAlign: "left", fontFamily: "var(--font-sans)", fontSize: 14.5, fontWeight: 600, color: "var(--navy-700)" }}>{t("profile.changePw")}</span>
                  <span style={{ flex: "none", display: "flex" }}><Icon n="chevron-right" s={18} color="var(--text-muted)" /></span>
                </button>
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <Button variant="ghost" onClick={() => update({ editProfileOpen: false })}>{t("common.cancel")}</Button>
                  <Button fullWidth disabled={!st.editName.trim()} onClick={saveProfile}>{t("profile.saveChanges")}</Button>
                </div>
              </div>
            </Overlay>
          )}

          {st.changePwOpen && (
            <Overlay align="center" z={44} onClose={() => update({ changePwOpen: false })}>
              <div style={dialogBox}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
                  <h2 style={modalTitle}>{t("profile.pwTitle")}</h2>
                  <button onClick={() => update({ changePwOpen: false })} style={closeBtn}><Icon n="x" s={20} color="var(--navy-700)" /></button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  <Input label={t("profile.pwCurrent")} type="password" placeholder={t("profile.pwCurrentPh")} value={st.pwCurrent} onChange={setField("pwCurrent")} />
                  <Input label={t("profile.pwNew")} type="password" placeholder={t("profile.pwNewPh")} value={st.pwNew} onChange={setField("pwNew")} />
                  <Input label={t("profile.pwConfirm")} type="password" placeholder={t("profile.pwConfirmPh")} value={st.pwConfirm} onChange={setField("pwConfirm")} />
                </div>
                {st.pwError && <div style={{ marginTop: 12, background: "var(--coral-100)", border: "1.5px solid var(--coral-500)", borderRadius: 12, padding: "10px 13px", fontSize: 13, color: "var(--coral-600)", fontWeight: 600 }}>{st.pwError}</div>}
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <Button variant="ghost" onClick={() => update({ changePwOpen: false })}>{t("common.cancel")}</Button>
                  <Button fullWidth onClick={submitChangePw}>{t("profile.updatePw")}</Button>
                </div>
              </div>
            </Overlay>
          )}

          {menuLesson && (
            <Overlay align="end" z={44} onClose={() => update({ lessonMenuKey: null })}>
              <div style={{ width: "100%", background: "var(--cream-50)", borderRadius: "24px 24px 0 0", boxShadow: "var(--shadow-xl)", padding: "16px 16px 22px", animation: "tia-pop .26s ease-out both" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 4px 14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: 8 }}>
                  <div style={{ width: 42, height: 42, flex: "none", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, background: menuLesson.tileBg }}>{menuLesson.emoji}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "var(--navy-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{menuLesson.displayTitle}</div>
                </div>
                <button onClick={() => { const k = st.lessonMenuKey; update({ lessonMenuKey: null }); if (k) startTopic(k); }} style={menuItem}><Icon n="book-open" s={18} color="var(--navy-700)" /> {t("history.openLesson")}</button>
                <button onClick={() => archiveLesson(st.lessonMenuKey)} style={menuItem}><Icon n={menuLesson.archived ? "archive-restore" : "archive"} s={18} color="var(--navy-700)" /> {menuLesson.archived ? t("history.unarchive") : t("history.archive")}</button>
                <button onClick={() => deleteLesson(st.lessonMenuKey)} style={{ ...menuItem, color: "var(--coral-600)" }}><Icon n="trash-2" s={18} color="var(--coral-600)" /> {t("history.deleteLesson")}</button>
                <div style={{ marginTop: 8 }}><Button variant="ghost" fullWidth onClick={() => update({ lessonMenuKey: null })}>{t("common.cancel")}</Button></div>
              </div>
            </Overlay>
          )}

          {tourOpen && (
            <div style={{ position: "absolute", inset: 0, zIndex: 48, background: "rgba(12,22,38,.62)", display: "flex", alignItems: "flex-end", padding: 16 }}>
              <div style={{ width: "100%", background: "var(--surface-card)", border: "1.5px solid var(--border-subtle)", borderRadius: 24, boxShadow: "var(--shadow-xl)", padding: 18, animation: "tia-pop .3s ease-out both" }}>
                <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                  <div style={{ width: 60, height: 60, flex: "none", borderRadius: 18, background: "radial-gradient(circle at 50% 42%, var(--gold-100), var(--cream-100))", display: "flex", alignItems: "center", justifyContent: "center" }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img data-mascot="" src={MASCOT.happy} alt="Squeaky" style={{ width: "86%" }} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, letterSpacing: "-0.01em", color: "var(--navy-700)" }}>{tStep.title}</div>
                    <div style={{ fontSize: 13.5, color: "var(--text-body)", lineHeight: 1.5, marginTop: 4 }}>{tStep.body}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {tourSteps.map((_, i) => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i === st.tourIdx ? "var(--gold-500)" : "var(--gray-200)" }} />)}
                  </div>
                  <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                    <button onClick={() => update({ tourIdx: -1 })} style={{ border: "none", background: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>{t("common.skip")}</button>
                    <Button size="sm" onClick={() => update((s) => ({ tourIdx: tourIsLast ? -1 : s.tourIdx + 1 }))}>{tourIsLast ? t("common.startLearning") : t("common.next")}</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* bottom nav */}
        {showApp && (
          <div style={{ flex: "none", display: "flex", borderTop: "1.5px solid var(--border-subtle)", background: "var(--surface-card)", padding: "8px 6px max(10px, env(safe-area-inset-bottom))" }}>
            {([
              { key: "home", label: t("nav.home"), icon: <Icon n="house" s={23} color={iconCol(homeActive)} sw={2.2} />, active: homeActive, go: goNav("home") },
              { key: "play", label: t("nav.play"), icon: <Icon n="gamepad-2" s={23} color={iconCol(st.nav === "play" && !st.topicKey)} sw={2.2} />, active: st.nav === "play" && !st.topicKey, go: goNav("play") },
              { key: "squeaky", label: t("nav.squeaky"), icon: <img src={MASCOT.chat} alt="" style={{ width: 27, height: 27, objectFit: "contain", filter: (sqActive ? "" : "grayscale(0.5) ") + (mascotFilter === "none" ? "" : mascotFilter), opacity: sqActive ? 1 : 0.6 }} />, active: sqActive, go: goNav("squeaky") },
              { key: "history", label: t("nav.history"), icon: <Icon n="clock" s={23} color={iconCol(st.nav === "history" && !st.topicKey)} sw={2.2} />, active: st.nav === "history" && !st.topicKey, go: goNav("history") },
              { key: "settings", label: t("nav.settings"), icon: <Icon n="settings" s={23} color={iconCol(st.nav === "settings" && !st.topicKey)} sw={2.2} />, active: st.nav === "settings" && !st.topicKey, go: goNav("settings") },
            ]).map((n) => (
              <button key={n.key} onClick={n.go} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 0" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {n.icon}
                <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--font-sans)", color: navCol(n.active) }}>{n.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ---------------- WELCOME ---------------- */}
        {st.screen === "welcome" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 47, overflowY: "auto", background: "radial-gradient(125% 70% at 50% -4%, var(--gold-100), var(--cream-50) 52%)", display: "flex", flexDirection: "column", padding: "max(28px, env(safe-area-inset-top)) 26px 28px" }}>
            <div style={{ alignSelf: "flex-end", marginBottom: 6 }}>{langToggle}</div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <div style={{ width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle at 50% 40%, var(--gold-200), var(--gold-100) 72%)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22, boxShadow: "var(--shadow-lg)" }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img data-mascot="" src={MASCOT.happy} alt="Squeaky" style={{ width: "84%", animation: "tia-float 3.2s ease-in-out infinite" }} /></div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 40, letterSpacing: "-0.04em", color: "var(--navy-700)", lineHeight: 1 }}>Tutor<span style={{ color: "var(--gold-500)" }}>IA</span>s</div>
              <div style={{ fontSize: 16, color: "var(--text-body)", lineHeight: 1.5, maxWidth: 286, marginTop: 10 }}>{t("welcome.tagline")}</div>
            </div>
            <div style={{ flex: "none", background: "var(--surface-card)", border: "1.5px solid var(--border-subtle)", borderRadius: 22, padding: "6px 16px", boxShadow: "var(--shadow-sm)", marginBottom: 18 }}>
              {raw<{ emoji: string; title: string; body: string }[]>("welcome.features").map((f, i, arr) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <div style={{ width: 42, height: 42, flex: "none", borderRadius: 13, background: ["var(--navy-50)", "var(--coral-100)", "var(--gold-100)"][i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21 }}>{f.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14.5, color: "var(--navy-700)", letterSpacing: "-0.01em" }}>{f.title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.35 }}>{f.body}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ flex: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              <Button size="lg" fullWidth onClick={() => update({ screen: "auth" })} iconRight={<Icon n="arrow-right" s={18} color="var(--navy-700)" />}>{t("welcome.create")}</Button>
              <Button variant="ghost" fullWidth onClick={() => update({ screen: "login" })}>{t("welcome.have")}</Button>
            </div>
          </div>
        )}

        {/* ---------------- LOGIN ---------------- */}
        {st.screen === "login" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 47, overflowY: "auto", background: "var(--cream-50)", display: "flex", flexDirection: "column", padding: "max(28px, env(safe-area-inset-top)) 26px 28px" }}>
            <button onClick={() => update({ screen: "welcome" })} style={{ flex: "none", alignSelf: "flex-start", border: "none", background: "var(--cream-100)", width: 40, height: 40, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 18 }}><Icon n="arrow-left" s={22} color="var(--navy-700)" /></button>
            <div style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 26 }}>
              <div style={{ width: 84, height: 84, borderRadius: "50%", background: "radial-gradient(circle at 50% 40%, var(--gold-100), var(--cream-100))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img data-mascot="" src={MASCOT.chat} alt="Squeaky" style={{ width: "80%" }} /></div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, letterSpacing: "-0.03em", color: "var(--navy-700)", margin: 0 }}>{t("login.title")}</h2>
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.45 }}>{t("login.sub")}</p>
            </div>
            <div style={{ flex: "none", display: "flex", flexDirection: "column", gap: 14 }}>
              <Input label={t("login.email")} type="email" placeholder={t("login.emailPh")} value={st.email} onChange={setField("email")} />
              <Input label={t("login.password")} type="password" placeholder={t("login.passwordPh")} value={st.password} onChange={setField("password")} />
            </div>
            {st.authError && <div style={{ marginTop: 16, background: "var(--coral-100)", border: "1.5px solid var(--coral-500)", borderRadius: 12, padding: "10px 13px", fontSize: 13, color: "var(--coral-600)", fontWeight: 600, textAlign: "center" }}>{st.authError}</div>}
            <div style={{ marginTop: 22 }}>
              <Button size="lg" fullWidth disabled={authDisabled} onClick={doLogin}>{t("common.login")}</Button>
            </div>
            <div style={{ textAlign: "center", marginTop: 14, fontSize: 13.5, color: "var(--text-muted)" }}>{t("login.newHere")} <span onClick={() => update({ screen: "auth", authError: "" })} style={{ color: "var(--text-link)", fontWeight: 700, cursor: "pointer" }}>{t("login.createOne")}</span></div>
          </div>
        )}

        {/* ---------------- ONBOARDING ---------------- */}
        {(st.screen === "auth" || st.screen === "about" || st.screen === "interests") && (
          <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(12,22,38,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ width: "100%", maxHeight: "96%", overflowY: "auto", background: "var(--cream-50)", borderRadius: 26, boxShadow: "var(--shadow-xl)", padding: "22px 20px 24px", animation: "tia-pop .3s ease-out both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img data-mascot="" src={MASCOT.chat} alt="" style={{ height: 30 }} />
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em", color: "var(--navy-700)" }}>Tutor<span style={{ color: "var(--gold-500)" }}>IA</span>s</span>
                <div style={{ flex: 1 }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>{t("onboarding.step", { n: st.screen === "auth" ? 1 : st.screen === "about" ? 2 : 3 })}</span>
              </div>
              <div style={{ marginBottom: 20 }}><ProgressBar value={st.screen === "auth" ? 33 : st.screen === "about" ? 66 : 100} /></div>

              {st.screen === "auth" && (
                <div>
                  <h2 style={onbTitle}>{t("onboarding.authTitle")}</h2>
                  <p style={onbSub}>{t("onboarding.authSub")}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <Input label={t("login.email")} type="email" placeholder={t("login.emailPh")} value={st.email} onChange={setField("email")} />
                    <Input label={t("login.password")} type="password" placeholder={t("onboarding.passwordPh")} value={st.password} onChange={setField("password")} />
                  </div>
                  <div style={{ marginTop: 20 }}><Button size="lg" fullWidth disabled={authDisabled} onClick={() => { if (!authDisabled) update({ screen: "about" }); }} iconRight={<Icon n="arrow-right" s={18} color="var(--navy-700)" />}>{t("common.continue")}</Button></div>
                  <div style={{ textAlign: "center", marginTop: 13, fontSize: 13, color: "var(--text-muted)" }}>{t("onboarding.already")} <span onClick={() => update({ screen: "login" })} style={{ color: "var(--text-link)", fontWeight: 600, cursor: "pointer" }}>{t("common.login")}</span></div>
                </div>
              )}

              {st.screen === "about" && (
                <div>
                  <h2 style={onbTitle}>{t("onboarding.aboutTitle")}</h2>
                  <p style={onbSub}>{t("onboarding.aboutSub")}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <Input label={t("onboarding.name")} placeholder={t("onboarding.namePh")} value={st.name} onChange={setField("name")} />
                    <Input label={t("onboarding.age")} type="number" placeholder={t("onboarding.agePh")} value={st.age} onChange={setField("age")} />
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    <Button variant="ghost" onClick={() => update({ screen: "auth" })}>{t("common.back")}</Button>
                    <Button fullWidth disabled={aboutDisabled} onClick={() => { if (!aboutDisabled) update({ screen: "interests" }); }} iconRight={<Icon n="arrow-right" s={18} color="var(--navy-700)" />}>{t("common.continue")}</Button>
                  </div>
                </div>
              )}

              {st.screen === "interests" && (
                <div>
                  <SqueakyBubble size="sm" message={t("onboarding.bubble")} />
                  <h2 style={{ ...onbTitle, margin: "18px 0 4px" }}>{t("onboarding.interestsTitle")}</h2>
                  <p style={{ ...onbSub, marginBottom: 4 }}>{t("onboarding.interestsSub")}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 9, margin: "16px 0" }}>
                    {POOL.map(([label, emoji]) => (
                      <InterestChip key={label} label={interestLabel(label)} emoji={emoji} selected={!!st.interests[label]} onClick={() => update((s) => ({ interests: { ...s.interests, [label]: !s.interests[label] } }))} />
                    ))}
                    {st.custom.map((c, idx) => (
                      <InterestChip key={c.label} label={c.label} emoji={c.emoji} selected removable onRemove={() => update((s) => ({ custom: s.custom.filter((_, i) => i !== idx) }))} />
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input value={st.customDraft} onChange={setField("customDraft")} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }} placeholder={t("onboarding.addOwnPh")} style={pillInput} />
                    <IconButton variant="primary" round label="Add interest" onClick={addCustom}><Icon n="plus" s={22} color="var(--navy-700)" /></IconButton>
                  </div>
                  <div style={{ marginTop: 14, fontSize: 13, color: "var(--text-muted)" }}>{t("onboarding.selected", { n: selectedCount })}</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <Button variant="ghost" onClick={() => update({ screen: "about" })}>{t("common.back")}</Button>
                    <Button variant="success" fullWidth disabled={finishDisabled} onClick={doFinish} iconRight={<Icon n="arrow-right" s={18} color="#fff" />}>{t("common.startLearning")}</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ===================== sub-components ===================== */
function MascotAcc({ hatItem, faceItem, neckItem, sizes }: {
  hatItem?: CatalogItem | null; faceItem?: CatalogItem | null; neckItem?: CatalogItem | null;
  sizes: { hat: number; face: number; neck: number };
}) {
  return (
    <>
      {hatItem && <div style={{ position: "absolute", left: "35%", top: "-7%", transform: "translateX(-50%)", fontSize: sizes.hat, lineHeight: 1 }}>{hatItem.emoji}</div>}
      {faceItem && <div style={{ position: "absolute", left: "32%", top: "21%", transform: "translateX(-50%)", fontSize: sizes.face, lineHeight: 1 }}>{faceItem.emoji}</div>}
      {neckItem && <div style={{ position: "absolute", left: "31%", top: "45%", transform: "translateX(-50%)", fontSize: sizes.neck, lineHeight: 1 }}>{neckItem.emoji}</div>}
    </>
  );
}

function Overlay({ children, align, z = 40, onClose }: { children: React.ReactNode; align: "center" | "end"; z?: number; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: z, background: "rgba(12,22,38,.55)", display: "flex", alignItems: align === "end" ? "flex-end" : "center", justifyContent: "center", padding: align === "center" ? 18 : 0 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", display: "contents" }}>{children}</div>
    </div>
  );
}

function PrefRow({ title, desc, checked, onChange, border }: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void; border?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 0", borderBottom: border ? "1px solid var(--border-subtle)" : "none" }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--navy-700)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{desc}</div>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

function QuizPlay({ g, onPick, onNext, onExit }: { g: Extract<Game, { type: "quiz" }>; onPick: (i: number) => void; onNext: () => void; onExit: () => void }) {
  const { t, raw } = useI18n();
  const items = raw<{ q: string; opts: string[]; note: string }[]>("quiz");
  const q = items[g.order[g.i]];
  const correct = QBANK[g.order[g.i]].correct;
  const isCorrect = g.revealed && g.picked === correct;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={onExit} style={backSquare}><Icon n="arrow-left" s={22} color="var(--navy-700)" /></button>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{t("play.question", { i: g.i + 1, n: g.order.length })}</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: "var(--gold-700)" }}>{t("play.pts", { n: g.score })}</div>
      </div>
      <div style={{ marginBottom: 18 }}><ProgressBar value={Math.round((g.i + (g.revealed ? 1 : 0)) / g.order.length * 100)} /></div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, lineHeight: 1.25, letterSpacing: "-0.02em", color: "var(--navy-700)", marginBottom: 18 }}>{q.q}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {q.opts.map((label, idx) => {
          let bg = "var(--surface-card)", fg = "var(--navy-700)", border = "var(--border-default)", mark: React.ReactNode = null;
          if (g.revealed) {
            if (idx === correct) { bg = "var(--green-100)"; fg = "var(--green-600)"; border = "var(--green-500)"; mark = <Icon n="check" s={18} color="var(--green-600)" />; }
            else if (idx === g.picked) { bg = "var(--coral-100)"; fg = "var(--coral-600)"; border = "var(--coral-500)"; mark = <Icon n="x" s={18} color="var(--coral-500)" />; }
            else { bg = "var(--cream-50)"; fg = "var(--text-muted)"; border = "var(--border-subtle)"; }
          }
          return (
            <button key={idx} onClick={() => onPick(idx)} style={{ cursor: "pointer", textAlign: "left", borderRadius: 16, padding: "15px 16px", fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600, background: bg, color: fg, border: `2px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <span>{label}</span>{mark}
            </button>
          );
        })}
      </div>
      {g.revealed && (
        <>
          <div style={{ marginTop: 16, background: "var(--cream-100)", border: "1.5px solid var(--border-subtle)", borderRadius: 16, padding: "13px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img data-mascot="" src={MASCOT.chat} alt="" style={{ width: 30, flex: "none" }} />
            <div style={{ fontSize: 13.5, color: "var(--navy-700)", lineHeight: 1.45 }}>{(isCorrect ? t("play.nice") : t("play.notQuite")) + q.note}</div>
          </div>
          <div style={{ marginTop: 14 }}><Button fullWidth onClick={onNext} iconRight={<Icon n="arrow-right" s={18} color="var(--navy-700)" />}>{g.i + 1 >= g.order.length ? t("play.seeResult") : t("play.nextQuestion")}</Button></div>
        </>
      )}
    </div>
  );
}

function QuizDone({ g, streakDays, onExit, onAgain }: { g: Extract<Game, { type: "quiz" }>; streakDays: number; onExit: () => void; onAgain: () => void }) {
  const { t } = useI18n();
  const total = g.order.length;
  const pct = g.score / total;
  const low = pct < 0.5;
  const title = pct >= 0.8 ? t("play.resBrilliant") : pct >= 0.5 ? t("play.resNice") : t("play.resGood");
  const msg = (pct >= 0.8 ? t("play.resMsgHigh") : pct >= 0.5 ? t("play.resMsgMid") : t("play.resMsgLow")) + t("play.resTail", { n: streakDays });
  return (
    <div style={{ textAlign: "center", paddingTop: 18 }}>
      <div style={{ width: 120, height: 120, margin: "0 auto 14px", borderRadius: "50%", background: "radial-gradient(circle at 50% 40%, var(--gold-200), var(--gold-100))", display: "flex", alignItems: "center", justifyContent: "center" }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img data-mascot="" src={low ? MASCOT.sad : MASCOT.happy} alt="Squeaky" style={{ width: "84%" }} /></div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, letterSpacing: "-0.03em", color: "var(--navy-700)" }}>{title}</div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 44, color: "var(--gold-600)", margin: "6px 0 2px" }}>{g.score} / {total}</div>
      <div style={{ fontSize: 14, color: "var(--text-body)", lineHeight: 1.5, maxWidth: 280, margin: "8px auto 0" }}>{msg}</div>
      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <Button variant="ghost" fullWidth onClick={onExit}>{t("common.done")}</Button>
        <Button fullWidth onClick={onAgain}>{t("play.playAgain")}</Button>
      </div>
    </div>
  );
}

function CardsPlay({ g, onFlip, onNext, onPrev, onExit }: { g: Extract<Game, { type: "cards" }>; onFlip: () => void; onNext: () => void; onPrev: () => void; onExit: () => void }) {
  const { t, raw } = useI18n();
  const cards = raw<{ front: string; back: string }[]>("cards");
  const c = cards[g.i];
  const flip = g.flipped;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={onExit} style={backSquare}><Icon n="arrow-left" s={22} color="var(--navy-700)" /></button>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "var(--navy-700)" }}>{t("play.cardsName")}</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{g.i + 1} / {cards.length}</div>
      </div>
      <button onClick={onFlip} style={{ width: "100%", cursor: "pointer", border: `2px solid ${flip ? "var(--navy-700)" : "var(--gold-300)"}`, background: flip ? "var(--navy-700)" : "var(--surface-card)", borderRadius: 24, padding: "34px 22px", minHeight: 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, boxShadow: "var(--shadow-md)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: flip ? "var(--gold-300)" : "var(--gold-700)" }}>{flip ? t("play.answer") : t("play.term")}</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, letterSpacing: "-0.02em", color: flip ? "#fff" : "var(--navy-700)", textAlign: "center", lineHeight: 1.25 }}>{flip ? c.back : c.front}</div>
        <div style={{ fontSize: 12, color: flip ? "rgba(255,255,255,.6)" : "var(--text-subtle)", marginTop: 6 }}>{t("play.tapFlip")}</div>
      </button>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <Button variant="ghost" fullWidth onClick={onPrev}>{t("common.back")}</Button>
        <Button fullWidth onClick={onNext}>{g.i + 1 >= cards.length ? t("play.startOver") : t("play.nextCard")}</Button>
      </div>
    </div>
  );
}

function GetknowPlay({ g, deck, onPick, onExit }: { g: Extract<Game, { type: "getknow" }>; deck: Deck; onPick: (i: number) => void; onExit: () => void }) {
  const round = deck.rounds[g.i];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={onExit} style={backSquare}><Icon n="arrow-left" s={22} color="var(--navy-700)" /></button>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "var(--navy-700)" }}>{deck.title}</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{g.i + 1} / {deck.rounds.length}</div>
      </div>
      <div style={{ marginBottom: 18 }}><ProgressBar value={Math.round(g.i / deck.rounds.length * 100)} color="green" /></div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img data-mascot="" src={MASCOT.think} alt="" style={{ width: 40, flex: "none" }} />
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 21, lineHeight: 1.2, letterSpacing: "-0.02em", color: "var(--navy-700)" }}>{round.q || deck.intro}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {round.opts.map((o, idx) => (
          <button key={idx} onClick={() => onPick(idx)} style={{ cursor: "pointer", textAlign: "left", border: "2px solid var(--border-subtle)", background: "var(--surface-card)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 13, boxShadow: "var(--shadow-xs)" }}>
            <span style={{ fontSize: 26, flex: "none" }}>{o.emoji}</span>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--navy-700)" }}>{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function GetknowDone({ g, onExit, onAgain }: { g: Extract<Game, { type: "getknow" }>; onExit: () => void; onAgain: () => void }) {
  const { t } = useI18n();
  const ints = [...new Set(g.picks.filter((p) => p.interest).map((p) => p.interest as string))];
  const mp = g.picks.filter((p) => p.mode).slice(-1)[0];
  const modeLabel = mp ? t(`modes.${mp.mode}.title`) : "";
  return (
    <div style={{ textAlign: "center", paddingTop: 14 }}>
      <div style={{ width: 120, height: 120, margin: "0 auto 14px", borderRadius: "50%", background: "radial-gradient(circle at 50% 40%, var(--gold-200), var(--gold-100))", display: "flex", alignItems: "center", justifyContent: "center" }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img data-mascot="" src={MASCOT.wave} alt="Squeaky" style={{ width: "88%" }} /></div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 25, letterSpacing: "-0.03em", color: "var(--navy-700)" }}>{t("play.gotToKnow")}</div>
      <div style={{ fontSize: 14, color: "var(--text-body)", lineHeight: 1.5, maxWidth: 290, margin: "8px auto 0" }}>{t("play.gkBody")}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", margin: "18px 0 4px" }}>
        {ints.map((l) => <span key={l} style={{ background: "var(--gold-100)", border: "1.5px solid var(--gold-300)", borderRadius: 999, padding: "7px 13px", fontSize: 13, fontWeight: 700, color: "var(--navy-700)" }}>{l}</span>)}
      </div>
      {modeLabel && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 10 }} dangerouslySetInnerHTML={{ __html: t("play.gkMode", { mode: `<b style="color:var(--navy-700)">${modeLabel}</b>` }) }} />}
      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <Button variant="ghost" fullWidth onClick={onExit}>{t("common.done")}</Button>
        <Button fullWidth onClick={onAgain}>{t("play.again")}</Button>
      </div>
    </div>
  );
}

/* ===================== shared styles ===================== */
const scrollArea: React.CSSProperties = { height: "100%", overflowY: "auto", padding: "16px 18px 24px" };
const kicker: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 2 };
const pageTitle: React.CSSProperties = { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", color: "var(--navy-700)", marginBottom: 3 };
const topicGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 };
const chipBtn: React.CSSProperties = { cursor: "pointer", border: "1.5px solid var(--border-subtle)", background: "var(--cream-50)", borderRadius: 999, padding: "7px 13px", fontSize: 12.5, fontWeight: 600, color: "var(--navy-700)", fontFamily: "var(--font-sans)" };
const chatAvatar: React.CSSProperties = { width: 34, height: 34, flex: "none", borderRadius: 13, background: "radial-gradient(circle at 50% 42%, var(--gold-100), var(--cream-100))", display: "flex", alignItems: "center", justifyContent: "center" };
const sectionLabel: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-subtle)", margin: "22px 0 10px" };
const modalTitle: React.CSSProperties = { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 21, letterSpacing: "-0.03em", color: "var(--navy-700)", margin: 0 };
const modalSub: React.CSSProperties = { fontSize: 13.5, color: "var(--text-muted)", margin: "0 0 16px", lineHeight: 1.45 };
const onbTitle: React.CSSProperties = { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 25, letterSpacing: "-0.03em", color: "var(--navy-700)", margin: "0 0 4px" };
const onbSub: React.CSSProperties = { fontSize: 14, color: "var(--text-muted)", margin: "0 0 18px", lineHeight: 1.45 };
const closeBtn: React.CSSProperties = { flex: "none", border: "none", background: "var(--cream-100)", width: 34, height: 34, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
const dialogBox: React.CSSProperties = { width: "100%", background: "var(--cream-50)", borderRadius: 24, boxShadow: "var(--shadow-xl)", padding: 20, animation: "tia-pop .28s ease-out both" };
const textInput: React.CSSProperties = { width: "100%", border: "1.5px solid var(--border-default)", borderRadius: 14, padding: "12px 15px", fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--navy-700)", outline: "none", background: "var(--surface-card)" };
const pillInput: React.CSSProperties = { flex: 1, minWidth: 0, border: "1.5px solid var(--border-default)", borderRadius: 999, padding: "10px 15px", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--navy-700)", outline: "none", background: "var(--surface-card)" };
const backSquare: React.CSSProperties = { border: "none", background: "var(--cream-100)", width: 36, height: 36, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
const menuItem: React.CSSProperties = { width: "100%", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 13, padding: "14px 8px", fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600, color: "var(--navy-700)", textAlign: "left" };
function tabStyle(active: boolean): React.CSSProperties {
  return { flex: 1, cursor: "pointer", border: "none", borderRadius: 11, padding: "9px 0", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 700, background: active ? "var(--surface-card)" : "transparent", color: active ? "var(--navy-700)" : "var(--text-muted)" };
}
