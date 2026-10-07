// ─────────────────────────────────────────────────────────────
//  Favorites — stored locally, no account required.
//  Catalog favorites are stored as `al:<allanime _id>`, classic
//  clips as their plain movie id.
// ─────────────────────────────────────────────────────────────
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesStore {
  ids: string[];
  toggle: (id: string) => void;
  clear: () => void;
}

const useFavoriteIds = create<FavoritesStore>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) =>
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((x) => x !== id)
            : [...state.ids, id],
        })),
      clear: () => set({ ids: [] }),
    }),
    { name: "otaku-favorites" }
  )
);

export default useFavoriteIds;
