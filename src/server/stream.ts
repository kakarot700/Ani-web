// ─────────────────────────────────────────────────────────────
//  Otaku "anime server" — streaming layer
//  Multiple player servers (9anime-style), keyed by external IDs.
//
//  Every entry is a drop-in <iframe> player that resolves straight from
//  the ids AllAnime already hands us — no API key, no scraping, nothing
//  of our own to host. Each host below was checked for two things:
//  that the route answers, and that it allows being framed.
//
//    MegaPlay    → MAL id  (also ships its own AniList route)
//    MegaPlay SU → MAL or AniList id
//    VidCloud    → AniList or MAL id (adaptive HLS, auto OP/ED skip)
//    VidNest     → AniList id (own source + an AnimePahe source)
//    SupaPlay    → AniList or MAL id
//    VidSrc      → MAL id (two mirrors; they swap domains often)
//    Videasy     → AniList id
//
//  A title without a MAL id still plays through the AniList routes and
//  vice versa, so nothing is stranded on a single id space.
// ─────────────────────────────────────────────────────────────

export type StreamLang = "sub" | "dub";

export interface StreamIds {
  malId: number | null;
  aniListId: number | null;
}

export interface StreamServer {
  id: string;
  label: string;
  langs: StreamLang[];
  build: (ids: StreamIds, ep: number | string, lang: StreamLang) => string | null;
  /** Short note shown as a tooltip in the server picker. */
  hint?: string;
}

// Accent colour handed to the players that accept one, so their skin matches Otaku.
const ACCENT = "%23dc2626";

export const STREAM_SERVERS: StreamServer[] = [
  {
    id: "megaplay",
    label: "MegaPlay HD",
    langs: ["sub", "dub"],
    hint: "MegaPlay · MyAnimeList id · sub & dub",
    build: ({ malId }, ep, lang) =>
      malId ? `https://megaplay.buzz/stream/mal/${malId}/${ep}/${lang}` : null,
  },
  {
    id: "megaplay-ani",
    label: "MegaPlay · AniList",
    langs: ["sub", "dub"],
    hint: "MegaPlay's AniList route — covers titles that have no MAL id",
    build: ({ aniListId }, ep, lang) =>
      aniListId ? `https://megaplay.buzz/stream/ani/${aniListId}/${ep}/${lang}` : null,
  },
  {
    id: "megaplay-su",
    label: "MegaPlay SU",
    langs: ["sub", "dub"],
    hint: "MegaPlay SU · sub & dub · server-side subtitle tracks",
    build: ({ malId, aniListId }, ep, lang) => {
      if (malId) return `https://ani.megaplay.su/mal/${malId}/${ep}/${lang}?color=${ACCENT}`;
      if (aniListId) return `https://ani.megaplay.su/ani/${aniListId}/${ep}/${lang}?color=${ACCENT}`;
      return null;
    },
  },
  {
    id: "vidcloud",
    label: "VidCloud HD",
    langs: ["sub", "dub"],
    hint: "Adaptive HLS with AniSkip markers — skips OP/ED for you",
    build: ({ aniListId, malId }, ep, lang) => {
      const query = `track=${lang}&autoSkip=1&autoNext=1`;
      if (aniListId) return `https://vidcloud.sbs/embed/ani/${aniListId}/${ep}?${query}`;
      if (malId) return `https://vidcloud.sbs/embed/mal/${malId}/${ep}?${query}`;
      return null;
    },
  },
  {
    id: "vidnest",
    label: "VidNest",
    langs: ["sub", "dub"],
    hint: "VidNest · AniList id · sub & dub",
    build: ({ aniListId }, ep, lang) =>
      aniListId ? `https://vidnest.fun/anime/${aniListId}/${ep}/${lang}` : null,
  },
  {
    id: "vidnest-pahe",
    label: "VidNest · Pahe",
    langs: ["sub", "dub"],
    hint: "VidNest's AnimePahe source — the backup when its main source is down",
    build: ({ aniListId }, ep, lang) =>
      aniListId ? `https://vidnest.fun/animepahe/${aniListId}/${ep}/${lang}` : null,
  },
  {
    id: "supaplay",
    label: "SupaPlay",
    langs: ["sub", "dub"],
    hint: "SupaPlay Ani endpoint · AniList id, falls back to MAL",
    build: ({ aniListId, malId }, ep, lang) => {
      const id = aniListId ?? malId;
      return id ? `https://supaplay.fun/stream/ani/${id}/${ep}/${lang}` : null;
    },
  },
  {
    id: "vidsrc",
    label: "VidSrc",
    langs: ["sub"],
    hint: "VidSrc · MyAnimeList id · sub",
    // vidsrc.me now redirects here; going direct saves a hop per episode.
    build: ({ malId }, ep) => (malId ? `https://vidsrc.sh/embed/anime/${malId}-${ep}` : null),
  },
  {
    id: "vidsrc-pm",
    label: "VidSrc · PM",
    langs: ["sub"],
    hint: "VidSrc mirror — its domains come and go, so this is the backup",
    build: ({ malId }, ep) => (malId ? `https://vidsrc.pm/embed/anime/${malId}-${ep}` : null),
  },
  {
    id: "videasy",
    label: "Videasy",
    langs: ["sub"],
    hint: "Videasy · AniList id, falls back to MAL",
    // player.videasy.net 301s here; skipping it avoids a redirect.
    build: ({ aniListId, malId }, ep) => {
      const id = aniListId ?? malId;
      return id ? `https://player.videasy.to/anime/${id}/${ep}` : null;
    },
  },
];

export const getServer = (id: string): StreamServer =>
  STREAM_SERVERS.find((s) => s.id === id) ?? STREAM_SERVERS[0];

const SERVER_KEY = "otaku-server";
const AUTONEXT_KEY = "otaku-autonext";

export function getPreferredServer(): string {
  try {
    return localStorage.getItem(SERVER_KEY) ?? "megaplay";
  } catch {
    return "megaplay";
  }
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

// A host's reachability doesn't change from episode to episode, so results are
// reused for a short window: with ten servers wired up that stops every episode
// skip from firing ten fresh probes. Failures are remembered for less time than
// successes, so a recovered host is picked up again quickly.
const PROBE_TTL_OK = 60_000;
const PROBE_TTL_FAIL = 25_000;
const PROBE_CACHE_MAX = 240;

interface ProbeEntry {
  at: number;
  ttl: number;
  health: ServerHealth;
}

const probeCache = new Map<string, ProbeEntry>();

function cacheProbe(key: string, health: ServerHealth): void {
  probeCache.set(key, {
    at: Date.now(),
    ttl: health.ok ? PROBE_TTL_OK : PROBE_TTL_FAIL,
    health,
  });
  while (probeCache.size > PROBE_CACHE_MAX) {
    const oldest = probeCache.keys().next().value;
    if (oldest === undefined) break;
    probeCache.delete(oldest);
  }
}

/** Forget cached latencies (used by the system-status re-check). */
export function clearProbeCache(): void {
  probeCache.clear();
}

export function pingServer(
  server: StreamServer,
  ids: StreamIds,
  ep: number | string,
  lang: StreamLang,
  timeoutMs = 6000
): Promise<ServerHealth> {
  const cacheKey = `${server.id}:${ids.malId ?? "-"}:${ids.aniListId ?? "-"}:${lang}`;
  const hit = probeCache.get(cacheKey);
  if (hit && Date.now() - hit.at < hit.ttl) return Promise.resolve(hit.health);

  const url = server.build(ids, ep, lang);
  if (!url) {
    // this server can't be built from the ids we have — there is nothing to probe
    const miss: ServerHealth = { id: server.id, latency: null, ok: false };
    cacheProbe(cacheKey, miss);
    return Promise.resolve(miss);
  }

  const started = performance.now();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { mode: "no-cors", signal: controller.signal, cache: "no-store" })
    .then(() => {
      const health: ServerHealth = {
        id: server.id,
        latency: Math.round(performance.now() - started),
        ok: true,
      };
      cacheProbe(cacheKey, health);
      return health;
    })
    .catch(() => {
      const health: ServerHealth = { id: server.id, latency: null, ok: false };
      cacheProbe(cacheKey, health);
      return health;
    })
    .finally(() => window.clearTimeout(timer));
}

/** Probe every server that supports the language, ordered by latency. */
export async function probeServers(
  ids: StreamIds,
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
