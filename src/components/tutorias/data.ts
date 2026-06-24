export type Accent = "gold" | "navy" | "green" | "sky" | "coral";

export interface Topic {
  key: string; emoji: string; title: string; accent: Accent; blurb: string;
}
export interface Mode {
  key: string; title: string; desc: string; emoji: string; accent: Accent; instr: string;
}
export interface CatalogItem {
  id: string; cat: "color" | "hat" | "acc" | "scene"; slot: "color" | "hat" | "face" | "neck" | "bg";
  name: string; price: number; filter?: string; swatch?: string; emoji?: string; bg?: string;
}
export interface Lesson {
  key: string; title: string; emoji: string; accent: Accent; when: string; progress: number; archived?: boolean;
}

export const POOL: [string, string][] = [
  ["Minecraft", "⛏️"], ["Football", "⚽"], ["Anime", "🌸"], ["Music", "🎧"], ["Gaming", "🎮"],
  ["Cooking", "🍳"], ["Movies", "🎬"], ["Science", "🔬"], ["Travel", "✈️"], ["Cars", "🏎️"],
  ["Art", "🎨"], ["Coding", "💻"], ["Basketball", "🏀"], ["Space", "🚀"], ["Animals", "🐾"],
  ["Photography", "📷"], ["Reading", "📚"], ["Dance", "💃"], ["Fashion", "👗"], ["Nature", "🌿"],
];

export const TOPICS: Topic[] = [
  { key: "math", emoji: "📐", title: "Mathematics", accent: "navy", blurb: "Algebra & calculus through your world." },
  { key: "physics", emoji: "🔭", title: "Physics", accent: "sky", blurb: "Forces and motion you can picture." },
  { key: "chemistry", emoji: "⚗️", title: "Chemistry", accent: "green", blurb: "Reactions explained your way." },
  { key: "biology", emoji: "🧬", title: "Biology", accent: "green", blurb: "Life, cells and systems made clear." },
  { key: "worldhistory", emoji: "🏛️", title: "World history", accent: "gold", blurb: "Stories from the past that stick." },
  { key: "geography", emoji: "🌍", title: "Geography", accent: "sky", blurb: "The planet, mapped to you." },
  { key: "programming", emoji: "💻", title: "Programming", accent: "navy", blurb: "Code, step by step at your pace." },
  { key: "english", emoji: "✍️", title: "English writing", accent: "coral", blurb: "Write with clarity and confidence." },
  { key: "economics", emoji: "📈", title: "Economics", accent: "gold", blurb: "Money and markets, demystified." },
  { key: "musictheory", emoji: "🎼", title: "Music theory", accent: "coral", blurb: "Scales and harmony that click." },
  { key: "art", emoji: "🎨", title: "Art & design", accent: "coral", blurb: "Composition, color and craft." },
  { key: "philosophy", emoji: "💭", title: "Philosophy", accent: "navy", blurb: "Big questions, plain language." },
];

export const MODES: Mode[] = [
  { key: "simplified", title: "Simplified", desc: "Plain words, zero jargon", emoji: "💡", accent: "gold", instr: "Explain in the simplest plain language possible, short sentences, no jargon." },
  { key: "story", title: "Story", desc: "Learn it as a narrative", emoji: "📖", accent: "navy", instr: "Teach through a short engaging story or narrative that carries the concept." },
  { key: "challenge", title: "Challenge", desc: "Test yourself", emoji: "⚔️", accent: "coral", instr: "Quiz the student one question at a time, react to their answers and raise difficulty gradually." },
  { key: "visual", title: "Visual", desc: "Pictures & diagrams", emoji: "🎨", accent: "sky", instr: "Explain visually: describe diagrams, mental images and spatial analogies in words." },
  { key: "step", title: "Step-by-step", desc: "One small step at a time", emoji: "🪜", accent: "green", instr: "Break everything into small numbered steps and confirm understanding before the next." },
  { key: "game", title: "Playing", desc: "Points, levels & fun", emoji: "🎮", accent: "gold", instr: "Turn the lesson into a playful game with points, levels and small challenges." },
];

export const QBANK = [
  { q: "In football, how many players from each team are on the pitch?", opts: ["9", "11", "13", "7"], correct: 1, note: "Eleven a side — the classic starting XI." },
  { q: "What is 15% of 200?", opts: ["15", "20", "30", "45"], correct: 2, note: "10% is 20, half of that is 10, so 30." },
  { q: "Which planet is known as the Red Planet?", opts: ["Venus", "Mars", "Jupiter", "Mercury"], correct: 1, note: "Mars — rusty iron dust gives it that colour." },
  { q: "In a 4/4 time signature, how many beats are in a bar?", opts: ["2", "3", "4", "6"], correct: 2, note: "Four quarter-note beats per bar." },
  { q: "What does CPU stand for?", opts: ["Central Process Unit", "Central Processing Unit", "Core Power Unit", "Computer Personal Unit"], correct: 1, note: "Central Processing Unit — the computer’s brain." },
  { q: "Which gas do plants absorb to grow?", opts: ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"], correct: 2, note: "CO₂ in, oxygen out — photosynthesis." },
  { q: "A right angle measures how many degrees?", opts: ["45", "60", "90", "180"], correct: 2, note: "Exactly 90 degrees — a perfect corner." },
  { q: "Who wrote Romeo and Juliet?", opts: ["Dickens", "Shakespeare", "Austen", "Tolkien"], correct: 1, note: "William Shakespeare, around 1595." },
];

export const CARDS = [
  { front: "Derivative of x²", back: "2x" },
  { front: "Capital of Japan", back: "Tokyo" },
  { front: "H₂O is…", back: "Water" },
  { front: "7 × 8", back: "56" },
  { front: "Speed = ?", back: "Distance ÷ Time" },
  { front: "Past tense of “go”", back: "went" },
];

export const EMOJI_CHOICES = ["📚", "🧪", "🎼", "🪐", "🧠", "💰", "🗺️", "🎮", "♟️", "🎸"];

export interface GkOption { label: string; emoji: string; interest?: string; mode?: string; }
export interface Deck { title: string; intro: string; rounds: { q?: string; opts: GkOption[] }[]; }

export const THIS_OR_THAT: Deck = {
  title: "This or That", intro: "Tap the one that’s more you.", rounds: [
    { opts: [{ label: "Movies", emoji: "🎬", interest: "Movies" }, { label: "Series", emoji: "📺", interest: "Anime" }] },
    { opts: [{ label: "Team sports", emoji: "⚽", interest: "Football" }, { label: "Solo sports", emoji: "🏃", interest: "Nature" }] },
    { opts: [{ label: "Video games", emoji: "🎮", interest: "Gaming" }, { label: "Board games", emoji: "♟️", interest: "Reading" }] },
    { opts: [{ label: "Music", emoji: "🎧", interest: "Music" }, { label: "Podcasts", emoji: "🎙️", interest: "Science" }] },
    { opts: [{ label: "Space", emoji: "🚀", interest: "Space" }, { label: "Ocean", emoji: "🌊", interest: "Animals" }] },
    { opts: [{ label: "Cooking", emoji: "🍳", interest: "Cooking" }, { label: "Travel", emoji: "✈️", interest: "Travel" }] },
  ],
};

export const SURVEY: Deck = {
  title: "All about you", intro: "A few quick taps so I can teach you better.", rounds: [
    { q: "Pick a dream skill", opts: [{ label: "Make music", emoji: "🎧", interest: "Music" }, { label: "Build games", emoji: "🎮", interest: "Gaming" }, { label: "Explore space", emoji: "🚀", interest: "Space" }, { label: "Speak a language", emoji: "🗣️", interest: "Travel" }] },
    { q: "How do you like to learn?", opts: [{ label: "By playing", emoji: "🎮", mode: "game" }, { label: "As a story", emoji: "📖", mode: "story" }, { label: "Step by step", emoji: "🪜", mode: "step" }, { label: "Keep it simple", emoji: "💡", mode: "simplified" }] },
    { q: "Your ideal weekend?", opts: [{ label: "Outdoors", emoji: "🌿", interest: "Nature" }, { label: "Gaming", emoji: "🎮", interest: "Gaming" }, { label: "Cooking", emoji: "🍳", interest: "Cooking" }, { label: "Reading", emoji: "📚", interest: "Reading" }] },
    { q: "A topic you secretly want to ace?", opts: [{ label: "Science", emoji: "🔬", interest: "Science" }, { label: "Art", emoji: "🎨", interest: "Art" }, { label: "Coding", emoji: "💻", interest: "Coding" }, { label: "History", emoji: "🏛️", interest: "Reading" }] },
  ],
};

export const TOUR = [
  { title: "Welcome to TutorIAs!", body: "I’m Squeaky, your tutor. Every topic here is its own AI mentor that teaches through the things you love." },
  { title: "Add anything", body: "Can’t find your topic? Tap “Add a topic” and I’ll tutor literally anything — guitar, chess, astrophysics, you name it." },
  { title: "Learn your way", body: "When you open a topic you choose HOW to learn: by playing, as a story, step-by-step, and more. Switch the mode anytime." },
  { title: "Play to learn", body: "The Play tab has daily quizzes and flashcard games — a fun 2-minute way to keep your streak alive." },
  { title: "Keep your streak", body: "Study a little every day and your streak grows. I’ll cheer you on the whole way. Ready? Let’s go!" },
];

export const ACCENTS: Record<string, string> = {
  gold: "var(--gold-100)", navy: "var(--navy-50)", green: "var(--green-100)", sky: "var(--sky-100)", coral: "var(--coral-100)",
};
export const CUSTOM_ACCENTS: Accent[] = ["gold", "navy", "green", "sky", "coral"];

export const CATALOG: CatalogItem[] = [
  { id: "c_classic", cat: "color", slot: "color", name: "Classic", price: 0, filter: "none", swatch: "#F2B01C" },
  { id: "c_rosy", cat: "color", slot: "color", name: "Rosy", price: 70, filter: "hue-rotate(285deg) saturate(1.15)", swatch: "#F25C9A" },
  { id: "c_mint", cat: "color", slot: "color", name: "Minty", price: 70, filter: "hue-rotate(75deg)", swatch: "#3FBF8F" },
  { id: "c_sky", cat: "color", slot: "color", name: "Sky", price: 90, filter: "hue-rotate(150deg)", swatch: "#46A6E0" },
  { id: "c_berry", cat: "color", slot: "color", name: "Berry", price: 110, filter: "hue-rotate(220deg) saturate(1.15)", swatch: "#9A6BE0" },
  { id: "c_ghost", cat: "color", slot: "color", name: "Ghost", price: 130, filter: "saturate(0.12) brightness(1.12)", swatch: "#E6E2D8" },
  { id: "h_grad", cat: "hat", slot: "hat", name: "Grad cap", price: 50, emoji: "🎓" },
  { id: "h_cap", cat: "hat", slot: "hat", name: "Cap", price: 40, emoji: "🧢" },
  { id: "h_top", cat: "hat", slot: "hat", name: "Top hat", price: 90, emoji: "🎩" },
  { id: "h_crown", cat: "hat", slot: "hat", name: "Crown", price: 170, emoji: "👑" },
  { id: "h_flower", cat: "hat", slot: "hat", name: "Flower", price: 55, emoji: "🌸" },
  { id: "f_shades", cat: "acc", slot: "face", name: "Shades", price: 80, emoji: "🕶️" },
  { id: "f_glasses", cat: "acc", slot: "face", name: "Glasses", price: 50, emoji: "👓" },
  { id: "n_bow", cat: "acc", slot: "neck", name: "Bow tie", price: 45, emoji: "🎀" },
  { id: "n_scarf", cat: "acc", slot: "neck", name: "Scarf", price: 75, emoji: "🧣" },
  { id: "n_medal", cat: "acc", slot: "neck", name: "Medal", price: 150, emoji: "🏅" },
  { id: "b_cream", cat: "scene", slot: "bg", name: "Cream", price: 0, bg: "radial-gradient(circle at 50% 34%, var(--gold-100), var(--cream-100))" },
  { id: "b_sunset", cat: "scene", slot: "bg", name: "Sunset", price: 60, bg: "linear-gradient(165deg, #FFD27A, #F2826B)" },
  { id: "b_ocean", cat: "scene", slot: "bg", name: "Ocean", price: 80, bg: "linear-gradient(165deg, #A6E4F2, #2E6FB0)" },
  { id: "b_forest", cat: "scene", slot: "bg", name: "Forest", price: 80, bg: "linear-gradient(165deg, #BDE8C4, #2E8B57)" },
  { id: "b_galaxy", cat: "scene", slot: "bg", name: "Galaxy", price: 140, bg: "linear-gradient(165deg, #4A3C86, #15112B)" },
];
export const CAT_TABS: ["color" | "hat" | "acc" | "scene", string][] = [
  ["color", "Colors"], ["hat", "Hats"], ["acc", "Extras"], ["scene", "Scenes"],
];

export const MASCOT = {
  happy: "/squeaky/squeaky-happy.gif",
  idle: "/squeaky/squeaky-idle.gif",
  sad: "/squeaky/squeaky-sad.gif",
  think: "/squeaky/squeaky-think.gif",
  wave: "/squeaky/squeaky-wave.gif",
  chat: "/squeaky/squeaky-chat.png",
};
