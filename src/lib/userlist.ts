// ─────────────────────────────────────────────────────────────
//  My List — hianime/9anime/MAL-style tracking, stored locally.
//  Statuses, ratings and per-episode watch progress.
// ─────────────────────────────────────────────────────────────
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ListStatus = "watching" | "plan" | "completed" | "dropped" | "hold";

export const STATUS_META: Record<ListStatus, { label: string; jp: string }> = {
  watching: { label: "Watching", jp: "視聴中" },
  plan: { label: "Plan to Watch", jp: "見る予定" },
  completed: { label: "Completed", jp: "見終わった" },
  hold: { label: "On Hold", jp: "保留中" },
  dropped: { label: "Dropped", jp: "中断" },
};

export interface ListEntry {
  status: ListStatus | null;
  rating: number | null; // 1–10
  addedAt: number;
}

interface UserListStore {
  entries: Record<string, ListEntry>;
  watched: Record<string, number[]>; // key `${id}:${lang}` -> watched ep numbers
  events: number[]; // timestamps of watch events (for stats/achievements)
  setStatus: (id: string, status: ListStatus | null) => void;
  setRating: (id: string, rating: number | null) => void;
  markWatched: (id: string, lang: string, ep: number) => void;
  clearWatched: (id: string) => void;
}

const useUserList = create<UserListStore>()(
  persist(
    (set) => ({
      entries: {},
      watched: {},
      events: [],
      setStatus: (id, status) =>
        set((state) => {
          const entries = { ...state.entries };
          if (status === null) {
            const prev = entries[id];
            if (prev && prev.rating !== null) {
              entries[id] = { ...prev, status: null };
            } else {
              delete entries[id];
            }
          } else {
            entries[id] = {
              status,
              rating: entries[id]?.rating ?? null,
              addedAt: entries[id]?.addedAt ?? Date.now(),
            };
          }
          return { entries };
        }),
      setRating: (id, rating) =>
        set((state) => {
          const entries = { ...state.entries };
          entries[id] = {
            status: entries[id]?.status ?? "watching",
            rating,
            addedAt: entries[id]?.addedAt ?? Date.now(),
          };
          return { entries };
        }),
      markWatched: (id, lang, ep) =>
        set((state) => {
          const key = `${id}:${lang}`;
          const list = state.watched[key] ?? [];
          if (list.includes(ep)) return state;
          return {
            watched: { ...state.watched, [key]: [...list, ep] },
            events: [...state.events.slice(-499), Date.now()],
          };
        }),
      clearWatched: (id) =>
        set((state) => {
          const watched: Record<string, number[]> = {};
          for (const [key, value] of Object.entries(state.watched)) {
            if (!key.startsWith(`${id}:`)) watched[key] = value;
          }
          return { watched };
        }),
    }),
    { name: "otaku-userlist" }
  )
);

export default useUserList;
