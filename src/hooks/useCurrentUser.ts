import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CurrentUser } from "@/lib/auth";

interface CurrentUserStore {
  data: CurrentUser | null;
  mutate: (user: CurrentUser | null) => void;
}

const useCurrentUser = create<CurrentUserStore>()(
  persist(
    (set) => ({
      data: null,
      mutate: (user) => set({ data: user }),
    }),
    { name: "otaku-current-user" }
  )
);

export default useCurrentUser;
