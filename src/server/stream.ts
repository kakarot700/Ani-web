// ─────────────────────────────────────────────────────────────
//  Otaku "anime server" — streaming layer
//  Embed player servers across independent providers, keyed by
//  external IDs (MAL-keyed first, then AniList-keyed).
//  Re-verified live 2026-10-08 against each provider's own docs:
//    megaplay.buzz · megavid.buzz · ani.megaplay.su · vidhawk.buzz
//    tryembed.us.cc · babastream.top · aniembed.se · vidnest.fun
//    vidy.st · anixo.buzz
//  REMOVED 2026-10-08: zokoanime.video (both routes) — the service
//  is down and 404s every embed route (see ani-cli issue #1954).
//  These providers churn constantly; re-verify before trusting one.
// ─────────────────────────────────────────────────────────────

export type StreamLang = "sub" | "dub";

export interface StreamServer {
  id: string;
  label: string;
  langs: StreamLang[];
  /** True when the player posts postMessage playback events (time/complete/error).
   *  Auto-pilot uses this to detect silently-dead embeds via a watchdog timer. */
  signals: boolean;
  build: (ids: { malId: number | null; aniListId: number | null }, ep: number | string, lang: StreamLang) => string | null;
}

export const STREAM_SERVERS: StreamServer[] = [
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
    label: "MegaVid Mirror",
    langs: ["sub", "dub"],
    signals: true,
    build: ({ malId }, ep, lang) =>
      malId ? `https://ani.megaplay.su/mal/${malId}/${ep}/${lang}` : null,
  },
  {
    id: "anixo",
    label: "Anixo",
    langs: ["sub", "dub"],
    signals: true,
    build: ({ malId }, ep, lang) =>
      malId ? `https://anixo.buzz/embed/mal/${malId}/${ep}?track=${lang}` : null,
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
    id: "megavid-ani",
    label: "MegaVid AniList",
    langs: ["sub", "dub"],
    signals: true,
    build: ({ aniListId }, ep, lang) =>
      aniListId ? `https://megavid.buzz/ani/${aniListId}/${ep}/${lang}` : null,
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
  {
    id: "vidnest-pahe",
    label: "VidNest Pahe",
    langs: ["sub", "dub"],
    signals: false,
    build: ({ aniListId }, ep, lang) =>
      aniListId ? `https://vidnest.fun/animepahe/${aniListId}/${ep}/${lang}` : null,
  },
  {
    id: "anixo-ani",
    label: "Anixo AniList",
    langs: ["sub", "dub"],
    signals: true,
    build: ({ aniListId }, ep, lang) =>
      aniListId ? `https://anixo.buzz/embed/ani/${aniListId}/${ep}?track=${lang}` : null,
  },
  {
    id: "vidy",
    label: "Vidy",
    langs: ["sub"],
    signals: true,
    build: ({ aniListId }, ep) =>
      aniListId ? `https://www.vidy.st/anime/${aniListId}/${ep}?nextEpisode=true` : null,
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
