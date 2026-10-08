import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GUEST_USER, type CurrentUser } from "@/lib/profile";

interface CurrentUserStore {
  /** Never null — there is no signed-out state, only a local profile. */
  data: CurrentUser;
  mutate: (user: CurrentUser) => void;
  setFavorites: (favoriteIds: string[]) => void;
}

const useCurrentUser = create<CurrentUserStore>()(
  persist(
    (set) => ({
      data: GUEST_USER,
      mutate: (user) => set({ data: { ...GUEST_USER, ...user } }),
      setFavorites: (favoriteIds) => set((s) => ({ data: { ...s.data, favoriteIds } })),
    }),
    {
      name: "otaku-current-user",
      // Older sessions may have stored a signed-out (null) user; coerce it back
      // into a valid profile so favourites and My List never break.
      merge: (persisted, current) => {
        const saved = (persisted as { data?: Partial<CurrentUser> } | undefined)?.data;
        return { ...current, data: { ...GUEST_USER, ...(saved ?? {}) } };
      },
    }
  )
);

export default useCurrentUser;
