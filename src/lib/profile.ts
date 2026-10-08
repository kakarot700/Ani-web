// ─────────────────────────────────────────────────────────────
//  Local profile — Otaku has no accounts and no login.
//  Everything the app needs (favourites, list, history, stats)
//  lives in localStorage under a single always-present profile.
// ─────────────────────────────────────────────────────────────

export interface CurrentUser {
  name: string;
  email: string;
  image?: string;
  favoriteIds: string[];
}

/** Every visitor gets this profile the moment they open the site. */
export const GUEST_USER: CurrentUser = {
  name: "Otaku",
  email: "",
  favoriteIds: [],
};
