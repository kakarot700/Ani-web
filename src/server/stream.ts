// ─────────────────────────────────────────────────────────────
//  Otaku "anime server" — streaming layer
//  Multiple player servers (9anime-style), keyed by external IDs:
//    MegaPlay   → MyAnimeList id   (sub + dub)
//    VidSrc     → MyAnimeList id   (sub)
//    VidSrc Pro → MyAnimeList id   (sub + dub)
//    VidSrc Win → MyAnimeList id   (sub + dub)
//    VidFlix    → MyAnimeList id   (sub + dub)
//    VidLink    → MyAnimeList id   (sub + dub)
//    Videasy    → AniList id       (sub)
//
//  Every entry below was probed live and returns a real player page for
//  a known MAL/AniList id. Mirrors of the same backend are deliberately
//  left out so the picker stays honest (e.g. vsembed.ru, vidsrc.bz and
//  player.videasy.com are byte-identical to entries already listed).
// ─────────────────────────────────────────────────────────────

export type StreamLang = "sub" | "dub";

export interface StreamServer {
  id: string;
  label: string;
  langs: StreamLang[];
  build: (ids: { malId: number | null; aniListId: number | null }, ep: number | string, lang: StreamLang) => string | null;
}

export const STREAM_SERVERS: StreamServer[] = [
  {
    id: "megaplay",
    label: "MegaPlay HD",
    langs: ["sub", "dub"],
    // Reference: https://megaplay.buzz/api — /stream/mal/{mal-id}/{ep}/{lang}.
    // Gated on a Referer header, which browsers send for iframes; a bare
    // request gets a soft 200 error page instead.
    build: ({ malId }, ep, lang) =>
      malId ? `https://megaplay.buzz/stream/mal/${malId}/${ep}/${lang}` : null,
  },
  {
    id: "vidsrc",
    label: "VidSrc",
    langs: ["sub"],
    // Legacy slug form; vidsrc.me redirects onto the vidsrc.io player.
    build: ({ malId }, ep) => (malId ? `https://vidsrc.me/embed/anime/${malId}-${ep}` : null),
  },
  {
    id: "vidsrc-io",
    label: "VidSrc Pro",
    langs: ["sub", "dub"],
    build: ({ malId }, ep, lang) =>
      malId ? `https://vidsrc.io/embed/anime/${malId}/${ep}/${lang}` : null,
  },
  {
    id: "vidsrc-win",
    label: "VidSrc Win",
    langs: ["sub", "dub"],
    build: ({ malId }, ep, lang) =>
      malId ? `https://vidsrc.win/embed/anime/${malId}/${ep}/${lang}` : null,
  },
  {
    id: "vidsrc-pm",
    label: "VidFlix",
    langs: ["sub", "dub"],
    build: ({ malId }, ep, lang) =>
      malId ? `https://vidsrc.pm/embed/anime/${malId}/${ep}/${lang}` : null,
  },
  {
    id: "vidlink",
    label: "VidLink",
    langs: ["sub", "dub"],
    build: ({ malId }, ep, lang) =>
      malId ? `https://vidlink.pro/anime/${malId}/${ep}/${lang}` : null,
  },
  {
    id: "videasy",
    label: "Videasy",
    langs: ["sub"],
    build: ({ aniListId, malId }, ep) => {
      const id = aniListId ?? malId;
      return id ? `https://player.videasy.net/anime/${id}/${ep}` : null;
    },
  },
];

export const getServer = (id: string): StreamServer =>
  STREAM_SERVERS.find((s) => s.id === id) ?? STREAM_SERVERS[0];

const SERVER_KEY = "otaku-server";
const AUTONEXT_KEY = "otaku-autonext";

export function getPreferredServer(): string {
  try {
    const saved = localStorage.getItem(SERVER_KEY);
    // A stored id can outlive the server it names (hosts get retired), so
    // only honour it while it is still in the registry — otherwise the
    // picker would highlight nothing.
    if (saved && STREAM_SERVERS.some((s) => s.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return STREAM_SERVERS[0].id;
}

export function savePreferredServer(id: string): void {
  try {
    localStorage.setItem(SERVER_KEY, id);
  } catch {
    /* ignore */
  }
}

export function getAutoNext(): boolean {
  try {
    return localStorage.getItem(AUTONEXT_KEY) !== "0";
  } catch {
    return true;
  }
}

export function saveAutoNext(on: boolean): void {
  try {
    localStorage.setItem(AUTONEXT_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

// ── Server health / latency probing (cross-origin safe) ─────
// Uses an opaque no-cors fetch: it resolves when the host answers
// (we only care that it's reachable + how long it took), and
// rejects on network failure -> lets us order & fail over servers.
export interface ServerHealth {
  id: string;
  latency: number | null; // ms, null = unreachable
  ok: boolean;
}

export function pingServer(
  server: StreamServer,
  ids: { malId: number | null; aniListId: number | null },
  ep: number | string,
  lang: StreamLang,
  timeoutMs = 6000
): Promise<ServerHealth> {
  const url = server.build(ids, ep, lang);
  if (!url) return Promise.resolve({ id: server.id, latency: null, ok: false });
  const started = performance.now();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { mode: "no-cors", signal: controller.signal, cache: "no-store" })
    .then(() => ({
      id: server.id,
      latency: Math.round(performance.now() - started),
      ok: true,
    }))
    .catch(() => ({ id: server.id, latency: null, ok: false }))
    .finally(() => window.clearTimeout(timer));
}

/** Probe all servers that support the language, ordered by latency. */
export async function probeServers(
  ids: { malId: number | null; aniListId: number | null },
  ep: number | string,
  lang: StreamLang
): Promise<ServerHealth[]> {
  const candidates = STREAM_SERVERS.filter((s) => s.langs.includes(lang));
  const results = await Promise.all(candidates.map((s) => pingServer(s, ids, ep, lang)));
  return results.sort((a, b) => {
    if (a.ok !== b.ok) return a.ok ? -1 : 1;
    return (a.latency ?? Infinity) - (b.latency ?? Infinity);
  });
}

// ── Continue watching (client-side persistence) ──────────────

export interface WatchProgress {
  id: string; // allanime _id
  malId: number | null;
  title: string;
  poster: string | null;
  ep: number;
  lang: StreamLang;
  updatedAt: number;
}

const CW_KEY = "otaku-cw";

export function getWatchProgress(): WatchProgress[] {
  try {
    const raw = localStorage.getItem(CW_KEY);
    const list = raw ? (JSON.parse(raw) as WatchProgress[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveWatchProgress(item: Omit<WatchProgress, "updatedAt">): WatchProgress[] {
  const list = getWatchProgress().filter((p) => p.id !== item.id);
  const next: WatchProgress = { ...item, updatedAt: Date.now() };
  list.unshift(next);
  try {
    localStorage.setItem(CW_KEY, JSON.stringify(list.slice(0, 20)));
  } catch {
    /* ignore */
  }
  return list;
}
