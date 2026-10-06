// ─────────────────────────────────────────────────────────────
//  Community reviews — stored locally, seeded deterministically
//  per title so every page feels alive from the first visit.
// ─────────────────────────────────────────────────────────────
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Review {
  id: string;
  user: string;
  stars: number; // 1–5
  text: string;
  likes: number;
  likedByMe: boolean;
  createdAt: number;
  seeded?: boolean;
}

export type ReviewSort = "newest" | "top" | "liked";

interface ReviewsStore {
  byAnime: Record<string, Review[]>;
  add: (animeId: string, review: Omit<Review, "id" | "createdAt" | "likes" | "likedByMe">) => void;
  toggleLike: (animeId: string, reviewId: string) => void;
  seed: (animeId: string, title: string) => Review[];
  list: (animeId: string) => Review[];
}

const SEED_USERS = ["SakuraWatch", "NakamaForever", "KaijuKing", "MoonlitOtaku", "SenpaiNotice"];
const SEED_LINES = [
  "The animation in the fight scenes is absolutely unreal. Every frame is a wallpaper.",
  "I binged this in two days. The pacing never lets up and the soundtrack is iconic.",
  "A masterclass in tension. The way it builds dread before every reveal is brilliant.",
  "Characters feel genuinely written — you root for them, you hurt with them.",
  "The opening theme alone deserves an award. Instant classic.",
  "Some filler mid-way, but the payoff in the final arc makes it all worth it.",
  "Visually stunning with a story that actually respects your intelligence.",
  "The dub is surprisingly good, but the sub with the original VA work is the way.",
];

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

function makeSeeds(animeId: string): Review[] {
  const h = hash(animeId);
  const count = 3 + (h % 3); // 3–5 reviews
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const u = SEED_USERS[(h + i) % SEED_USERS.length];
    const line = SEED_LINES[(h + i * 3) % SEED_LINES.length];
    return {
      id: `seed-${animeId}-${i}`,
      user: u,
      stars: 3 + ((h + i * 7) % 3), // 3–5
      text: line,
      likes: (h + i * 13) % 97,
      likedByMe: false,
      createdAt: now - ((h + i * 11) % 90) * 86400000,
      seeded: true,
    };
  });
}

const useReviews = create<ReviewsStore>()(
  persist(
    (set, get) => ({
      byAnime: {},
      seed: (animeId) => {
        const existing = get().byAnime[animeId];
        if (existing && existing.length) return existing;
        const seeds = makeSeeds(animeId);
        set((state) => ({ byAnime: { ...state.byAnime, [animeId]: seeds } }));
        return seeds;
      },
      list: (animeId) => get().byAnime[animeId] ?? [],
      add: (animeId, review) =>
        set((state) => {
          const prev = state.byAnime[animeId] ?? [];
          const next: Review = {
            ...review,
            id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            likes: 0,
            likedByMe: false,
            createdAt: Date.now(),
          };
          return { byAnime: { ...state.byAnime, [animeId]: [next, ...prev] } };
        }),
      toggleLike: (animeId, reviewId) =>
        set((state) => {
          const prev = state.byAnime[animeId] ?? [];
          return {
            byAnime: {
              ...state.byAnime,
              [animeId]: prev.map((r) =>
                r.id === reviewId
                  ? { ...r, likedByMe: !r.likedByMe, likes: r.likes + (r.likedByMe ? -1 : 1) }
                  : r
              ),
            },
          };
        }),
    }),
    { name: "otaku-reviews" }
  )
);

export const sortReviews = (reviews: Review[], sort: ReviewSort): Review[] => {
  const copy = [...reviews];
  if (sort === "newest") copy.sort((a, b) => b.createdAt - a.createdAt);
  if (sort === "top") copy.sort((a, b) => b.stars - a.stars || b.createdAt - a.createdAt);
  if (sort === "liked") copy.sort((a, b) => b.likes - a.likes);
  return copy;
};

export default useReviews;
