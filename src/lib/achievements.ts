// ─────────────────────────────────────────────────────────────
//  Gamified achievement badges — derived from real watch data.
// ─────────────────────────────────────────────────────────────

export interface AchievementDef {
  id: string;
  name: string;
  jp: string;
  desc: string;
  icon: string; // emoji glyph
  unlocked: (ctx: AchievementContext) => boolean;
  progress: (ctx: AchievementContext) => { cur: number; goal: number };
}

export interface AchievementContext {
  totalEpisodes: number;
  totalTitles: number;
  completed: number;
  rated: number;
  events: number[]; // watch timestamps
  episodesInBestDay: number;
}

const dayKey = (ts: number) => new Date(ts).toDateString();

export function buildContext(input: {
  totalEpisodes: number;
  totalTitles: number;
  completed: number;
  rated: number;
  events: number[];
}): AchievementContext {
  const byDay = new Map<string, number>();
  for (const ts of input.events) {
    const k = dayKey(ts);
    byDay.set(k, (byDay.get(k) ?? 0) + 1);
  }
  let best = 0;
  byDay.forEach((v) => (best = Math.max(best, v)));
  return { ...input, episodesInBestDay: best };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-steps",
    name: "First Steps",
    jp: "はじめの一歩",
    desc: "Watch your very first episode.",
    icon: "🌱",
    unlocked: (c) => c.totalEpisodes >= 1,
    progress: (c) => ({ cur: Math.min(c.totalEpisodes, 1), goal: 1 }),
  },
  {
    id: "getting-into-it",
    name: "Getting Into It",
    jp: "夢中",
    desc: "Watch 25 episodes.",
    icon: "🔥",
    unlocked: (c) => c.totalEpisodes >= 25,
    progress: (c) => ({ cur: Math.min(c.totalEpisodes, 25), goal: 25 }),
  },
  {
    id: "binge-watcher",
    name: "Binge Watcher",
    jp: "一気見",
    desc: "Watch 8+ episodes in a single day.",
    icon: "🍿",
    unlocked: (c) => c.episodesInBestDay >= 8,
    progress: (c) => ({ cur: Math.min(c.episodesInBestDay, 8), goal: 8 }),
  },
  {
    id: "marathoner",
    name: "Marathoner",
    jp: "マラソン",
    desc: "Watch 100 episodes overall.",
    icon: "🏃",
    unlocked: (c) => c.totalEpisodes >= 100,
    progress: (c) => ({ cur: Math.min(c.totalEpisodes, 100), goal: 100 }),
  },
  {
    id: "completionist",
    name: "Completionist",
    jp: "完走",
    desc: "Finish 5 anime to the very end.",
    icon: "🏁",
    unlocked: (c) => c.completed >= 5,
    progress: (c) => ({ cur: Math.min(c.completed, 5), goal: 5 }),
  },
  {
    id: "critic",
    name: "Critic",
    jp: "評論家",
    desc: "Rate 10 different anime.",
    icon: "⭐",
    unlocked: (c) => c.rated >= 10,
    progress: (c) => ({ cur: Math.min(c.rated, 10), goal: 10 }),
  },
  {
    id: "collector",
    name: "Collector",
    jp: "コレクター",
    desc: "Track 15 titles in your list.",
    icon: "📚",
    unlocked: (c) => c.totalTitles >= 15,
    progress: (c) => ({ cur: Math.min(c.totalTitles, 15), goal: 15 }),
  },
  {
    id: "otaku-legend",
    name: "Otaku Legend",
    jp: "伝説",
    desc: "Watch 500 episodes. Bow down.",
    icon: "👑",
    unlocked: (c) => c.totalEpisodes >= 500,
    progress: (c) => ({ cur: Math.min(c.totalEpisodes, 500), goal: 500 }),
  },
];

export const computeAchievements = (ctx: AchievementContext) =>
  ACHIEVEMENTS.map((a) => ({ ...a, isUnlocked: a.unlocked(ctx), progress: a.progress(ctx) }));
