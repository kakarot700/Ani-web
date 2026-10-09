// ─────────────────────────────────────────────────────────────
//  Otaku "anime server" — streaming layer
//  15 embed player servers across independent providers, keyed
//  by external IDs. Every entry verified against the provider's
//  own docs. MAL-keyed servers listed first, then AniList-keyed.
// ─────────────────────────────────────────────────────────────

export type StreamLang = "sub" | "dub";

export interface StreamServer {
  id: string;
  label: string;
  langs: StreamLang[];
  /** True when the player posts postMessage playback events (time/complete/error).
   *  Auto-pilot uses this to detect silently-dead embeds via a watchdog timer. */
  signals: boolean;
  /** Auto-pilot ranking: lower is tried first. Trusted ad-free providers are 0;
   *  everything else is 1. Within the same priority the fastest probe wins. */
  priority?: number;
  /** Query param this provider accepts to start playback at N seconds.
   *  Lets the watch page carry the playback position across server and
   *  sub/dub switches (verified in each provider's docs). */
  resumeKey?: string;
  build: (ids: { malId: number | null; aniListId: number | null }, ep: number | string, lang: StreamLang) => string | null;
}

/** Append the provider's resume-at-time param to an embed URL. */
export function appendResume(
  server: StreamServer,
  url: string,
  seconds: number
): string {
  if (!server.resumeKey || !Number.isFinite(seconds) || seconds < 5) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${server.resumeKey}=${Math.floor(seconds)}`;
}

export const STREAM_SERVERS: StreamServer[] = [
  // ── Trusted: ad-free / clean embeds (auto-pilot tries these first) ──
  // Note: NO iframe sandbox is applied to any provider — several embed
  // players detect sandboxed frames and refuse to play. Ad protection
  // comes from ranking these trusted servers first instead.
  {
    id: "anixo",
    label: "Anixo",
    langs: ["sub", "dub"],
    signals: true,
    priority: 0,
    build: ({ aniListId }, ep, lang) =>
      aniListId ? `https://anixo.buzz/embed/ani/${aniListId}/${ep}?track=${lang}` : null,
  },
  {
    id: "anixo-mal",
    label: "Anixo MAL",
    langs: ["sub", "dub"],
    signals: true,
    priority: 0,
    build: ({ malId }, ep, lang) =>
      malId ? `https://anixo.buzz/embed/mal/${malId}/${ep}?track=${lang}` : null,
  },
  {
    id: "vidlink",
    label: "VidLink",
    langs: ["sub", "dub"],
    signals: true, // posts PLAYER_EVENT { play | pause | ended | timeupdate }
    priority: 0,
    resumeKey: "startAt", // per docs: startAt=<seconds>
    build: ({ malId }, ep, lang) =>
      malId ? `https://vidlink.pro/anime/${malId}/${ep}/${lang}?fallback=true` : null,
  },
  {
    id: "vidplus",
    label: "VidPlus",
    langs: ["sub", "dub"],
    signals: false,
    priority: 0,
    resumeKey: "progress", // per docs: progress=<seconds>
    build: ({ aniListId }, ep, lang) =>
      aniListId
        ? `https://player.vidplus.to/embed/anime/${aniListId}/${ep}${lang === "dub" ? "?dub=true" : ""}`
        : null,
  },
  {
    id: "vidy",
    label: "Vidy",
    langs: ["sub"],
    signals: true, // posts PLAYER_EVENT { timeupdate | play | pause | ended }
    priority: 0,
    resumeKey: "progress", // per docs: progress=<seconds>
    build: ({ aniListId }, ep) =>
      aniListId ? `https://www.vidy.st/anime/${aniListId}/${ep}?nextEpisode=true` : null,
  },

  // ── AniList-keyed servers ──────────────────────────────────
  {
    id: "megaplay-ani",
    label: "MegaPlay AniList",
    langs: ["sub", "dub"],
    signals: true,
    build: ({ aniListId }, ep, lang) =>
      aniListId ? `https://megaplay.buzz/stream/ani/${aniListId}/${ep}/${lang}` : null,
  },
  {
    id: "tryembed",
    label: "TryEmbed",
    langs: ["sub", "dub"],
    signals: true,
    build: ({ aniListId }, ep, lang) =>
      aniListId
        ? `https://tryembed.us.cc/embed/anime/${aniListId}/${ep}/${lang}?autoNext=false`
        : null,
  },
  {
    id: "megavid-ani",
    label: "MegaVid AniList",
    langs: ["sub", "dub"],
    signals: true,
    build: ({ aniListId }, ep, lang) =>
      aniListId ? `https://megavid.buzz/ani/${aniListId}/${ep}/${lang}` : null,
  },
  {
    id: "zoko-ani",
    label: "Zoko AniList",
    langs: ["sub", "dub"],
    signals: true,
    build: ({ aniListId }, ep, lang) =>
      aniListId
        ? `https://zokoanime.video/stream/anilist/${aniListId}/${ep}/${lang}?autoplay=0`
        : null,
  },
  {
    id: "vidhawk-ani",
    label: "VidHawk Zuri",
    langs: ["sub", "dub"],
    signals: true,
    build: ({ aniListId }, ep, lang) =>
      aniListId
        ? `https://vidhawk.buzz/embed/ani/${aniListId}/${ep}/${lang}?server=zuri`
        : null,
  },
  {
    id: "aniembed",
    label: "AniEmbed",
    langs: ["sub", "dub"],
    signals: false,
    build: ({ aniListId }, ep, lang) =>
      aniListId ? `https://aniembed.se/e/${aniListId}/${ep}?lang=${lang}` : null,
  },
  {
    id: "vidnest",
    label: "VidNest",
    langs: ["sub", "dub"],
    signals: false,
    build: ({ aniListId }, ep, lang) =>
      aniListId ? `https://vidnest.fun/anime/${aniListId}/${ep}/${lang}` : null,
  },

  // ── MAL-keyed servers ──────────────────────────────────────
  {
    id: "megaplay",
    label: "MegaPlay HD",
    langs: ["sub", "dub"],
    signals: true,
    build: ({ malId }, ep, lang) =>
      malId ? `https://megaplay.buzz/stream/mal/${malId}/${ep}/${lang}` : null,
  },
  {
    id: "megavid",
    label: "MegaVid",
    langs: ["sub", "dub"],
    signals: true,
    build: ({ malId }, ep, lang) =>
      malId ? `https://megavid.buzz/mal/${malId}/${ep}/${lang}` : null,
  },
  {
    id: "megaplay-mirror",
    label: "MegaPlay Mirror",
    langs: ["sub", "dub"],
    signals: true,
    build: ({ malId }, ep, lang) =>
      malId ? `https://ani.megaplay.su/mal/${malId}/${ep}/${lang}` : null,
  },
  {
    id: "zoko",
    label: "Zokoanime",
    langs: ["sub", "dub"],
    signals: true,
    build: ({ malId }, ep, lang) =>
      malId ? `https://zokoanime.video/stream/mal/${malId}/${ep}/${lang}?autoplay=0` : null,
  },
  {
    id: "vidhawk",
    label: "VidHawk Flow",
    langs: ["sub", "dub"],
    signals: true,
    build: ({ malId }, ep, lang) =>
      malId ? `https://vidhawk.buzz/embed/mal/${malId}/${ep}/${lang}?server=flow` : null,
  },
  {
    id: "tryembed-mal",
    label: "TryEmbed MAL",
    langs: ["sub", "dub"],
    signals: true,
    build: ({ malId }, ep, lang) =>
      malId
        ? `https://tryembed.us.cc/embed/anime/mal/${malId}/${ep}/${lang}?autoNext=false`
        : null,
  },
  {
    id: "babastream",
    label: "BabaStream",
    langs: ["sub", "dub"],
    signals: false,
    build: ({ malId }, ep, lang) =>
      malId ? `https://babastream.top/embed/${malId}/${ep}/${lang}` : null,
  },
];

export const getServer = (id: string): StreamServer =>
  STREAM_SERVERS.find((s) => s.id === id) ?? STREAM_SERVERS[0];

const SERVER_KEY = "otaku-server";
const AUTONEXT_KEY = "otaku-autonext";

export function getPreferredServer(): string {
  try {
    return localStorage.getItem(SERVER_KEY) ?? "auto";
  } catch {
    return "auto";
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

/** Probe all servers that support the language, ordered by trust then latency.
 *  Trusted (priority 0) providers always outrank the rest, so auto-pilot only
 *  lands on the ad-heavy embeds when every clean one is down. */
export async function probeServers(
  ids: { malId: number | null; aniListId: number | null },
  ep: number | string,
  lang: StreamLang
): Promise<ServerHealth[]> {
  const candidates = STREAM_SERVERS.filter((s) => s.langs.includes(lang));
  const results = await Promise.all(candidates.map((s) => pingServer(s, ids, ep, lang)));
  const priorityOf = (id: string) =>
    STREAM_SERVERS.find((s) => s.id === id)?.priority ?? 1;
  return results.sort((a, b) => {
    if (a.ok !== b.ok) return a.ok ? -1 : 1;
    const pa = priorityOf(a.id);
    const pb = priorityOf(b.id);
    if (pa !== pb) return pa - pb;
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
