// ─────────────────────────────────────────────────────────────
//  Otaku "anime server" — catalog & metadata layer
//  Primary source: AllAnime public GraphQL API (CORS-friendly).
//  Hydrates: relations, characters, voice actors, OP/ED theme
//  songs, trailers, per-episode info (title/thumb/synopsis),
//  sub/dub episode lists, airing timestamps, filters, sorting.
// ─────────────────────────────────────────────────────────────

import useConnectivity from "@/lib/connectivity";
import { stripHtml } from "@/utils/text";

const ENDPOINT = "https://api.allanime.day/api";
export const THUMB_BASE = "https://wp.youtube-anime.com/aln.youtube-anime.com/";

export const resolveAsset = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return THUMB_BASE + path;
};

export interface ShowSummary {
  _id: string;
  name: string;
  malId: number | null;
  aniListId: number | null;
  episodeCount: number | null;
  thumbnail: string | null;
  score: number | null;
  type: string | null;
  rating: string | null;
  status: string | null;
  nextAiringEpisode?: number | null;
}

export interface ShowsPage {
  total: number;
  shows: ShowSummary[];
}

export interface EpisodeDetails {
  sub: string[];
  dub: string[];
  raw: string[];
}

export interface RelatedEntry {
  relation: string;
  showId: string;
}

export interface CharacterInfo {
  name: string;
  native: string | null;
  role: string;
  image: string | null;
  vaIds: number[];
}

export interface VoiceActor {
  aniListId: number;
  name: string;
  native: string | null;
  language: string;
  image: string | null;
}

export interface RelatedShow {
  relation: string;
  show: ShowSummary;
}

export interface ThemeSong {
  type: "Opening" | "Ending" | string;
  title: string;
  audioUrl: string | null;
  cover: string | null;
}

export interface EpisodeInfo {
  num: number;
  title: string;
  description: string;
  thumbnail: string | null;
}

export interface AiringEntry {
  show: ShowSummary;
  episode: number | null;
  airingAt: number; // unix seconds
}

export interface ShowDetail extends ShowSummary {
  englishName: string | null;
  nativeName: string | null;
  description: string | null;
  banner: string | null;
  genres: string[];
  studios: string[];
  season: { season: number | null; year: number | null } | null;
  episodes: EpisodeDetails;
  related: RelatedEntry[];
  characters: CharacterInfo[];
  themes: ThemeSong[];
  trailerId: string | null;
}

export interface SearchParams {
  query?: string;
  types?: string;
  genres?: string;
  season?: "Winter" | "Spring" | "Summer" | "Fall";
  year?: number;
  sortBy?: string;
  sortDirection?: string;
  dateRangeStart?: number;
  studios?: string;
  page?: number;
  limit?: number;
}

// In-flight dedup: identical concurrent requests share one network call
const inflight = new Map<string, Promise<unknown>>();

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const key = query + JSON.stringify(variables ?? {});
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const attempt = async (): Promise<T> => {
    let lastError: unknown = new Error("Request failed");
    for (let i = 0; i < 3; i++) {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 12000);
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, variables }),
          signal: controller.signal,
        });
        window.clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
        if (json.errors?.length) throw new Error(json.errors[0].message);
        if (!json.data) throw new Error("Empty response");
        return json.data;
      } catch (e) {
        window.clearTimeout(timer);
        lastError = e;
        if (i < 2) await new Promise((r) => setTimeout(r, 350 * (i + 1)));
      }
    }
    throw lastError;
  };

  const promise = attempt().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

/** Lightweight reachability probe used by the system-health monitor. */
export function pingCatalog(): Promise<boolean> {
  return gql<{ shows: { pageInfo: { total: number } } }>(
    `query { shows(search: { query: "one piece" }, page: 1, limit: 1) { pageInfo { total } } }`
  )
    .then((d) => (d.shows.pageInfo?.total ?? 0) > 0)
    .catch(() => false);
}

// ── Cache-first persistence ─────────────────────────────────
// Every response is written to localStorage. If the network
// fails (rate limits, outages), the last good response is served
// so the UI keeps working — and the connectivity store is told
// we're in offline/cache mode.
const CACHE_KEY = "otaku-api-cache-v2";
const MAX_ENTRIES = 80;

interface StoreEntry {
  t: number;
  v: unknown;
}

function readStore(): Record<string, StoreEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, StoreEntry>) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, StoreEntry>): void {
  try {
    const keys = Object.keys(store);
    if (keys.length > MAX_ENTRIES) {
      const sorted = keys.sort((a, b) => store[a].t - store[b].t);
      sorted.slice(0, Math.floor(MAX_ENTRIES / 2)).forEach((k) => delete store[k]);
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    /* quota exceeded — drop the whole cache and retry once */
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.setItem(CACHE_KEY, JSON.stringify(store));
    } catch {
      /* give up silently */
    }
  }
}

const memCache = new Map<string, unknown>();

function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const mem = memCache.get(key) as T | undefined;
  if (mem !== undefined) return Promise.resolve(mem);

  return loader()
    .then((value) => {
      memCache.set(key, value);
      const store = readStore();
      store[key] = { t: Date.now(), v: value };
      writeStore(store);
      useConnectivity.getState().setOffline(false, false);
      return value;
    })
    .catch((err) => {
      const hit = readStore()[key];
      if (hit && hit.v !== undefined) {
        memCache.set(key, hit.v as T);
        useConnectivity.getState().setOffline(true, true);
        return hit.v as T;
      }
      useConnectivity.getState().setOffline(true, false);
      throw err;
    });
}

function parseObjectScalar(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

const SHOW_FIELDS = `
  _id name malId aniListId episodeCount thumbnail score type rating status nextAiringEpisode
`;

const SEARCH_QUERY = `
  query($s: SearchInput, $page: Int, $limit: Int) {
    shows(search: $s, page: $page, limit: $limit, translationType: sub, countryOrigin: JP) {
      pageInfo { total }
      edges { ${SHOW_FIELDS} }
    }
  }
`;

function normalizeSummary(raw: Record<string, any>): ShowSummary {
  const nae = parseObjectScalar(raw.nextAiringEpisode) as Record<string, unknown> | null;
  let nextAiring: number | null = null;
  if (nae && typeof nae === "object") {
    const t = (nae.airingAt ?? nae.timestamp ?? nae.unixTime ?? nae.time) as unknown;
    if (typeof t === "number") nextAiring = t;
    else if (typeof t === "string" && !Number.isNaN(Number(t))) nextAiring = Number(t);
  }
  return {
    _id: String(raw._id ?? ""),
    name: String(raw.name ?? ""),
    malId: raw.malId != null ? Number(raw.malId) || null : null,
    aniListId: raw.aniListId != null ? Number(raw.aniListId) || null : null,
    episodeCount: Number(raw.episodeCount) || null,
    thumbnail: (raw.thumbnail as string) ?? null,
    score: Number(raw.score) || null,
    type: (raw.type as string) ?? null,
    rating: (raw.rating as string) ?? null,
    status: (raw.status as string) ?? null,
    nextAiringEpisode: nextAiring,
  };
}

export function searchShows(params: SearchParams): Promise<ShowsPage> {
  const search: Record<string, unknown> = { denyEcchi: true };
  if (params.query) search.query = params.query;
  if (params.types) search.types = params.types;
  if (params.genres) search.genres = params.genres;
  if (params.season) search.season = params.season;
  if (params.year) search.year = params.year;
  if (params.sortBy) search.sortBy = params.sortBy;
  if (params.sortDirection) search.sortDirection = params.sortDirection;
  if (params.dateRangeStart) search.dateRangeStart = params.dateRangeStart;
  if (params.studios) search.studios = params.studios;

  const key = `search:${JSON.stringify(search)}:${params.page ?? 1}:${params.limit ?? 24}`;
  return cached(key, () =>
    gql<{ shows: { pageInfo: { total: number }; edges: Record<string, any>[] } }>(SEARCH_QUERY, {
      s: search,
      page: params.page ?? 1,
      limit: params.limit ?? 24,
    }).then((d) => ({
      total: d.shows.pageInfo?.total ?? 0,
      shows: (d.shows.edges ?? []).filter((e) => e?._id).map(normalizeSummary),
    }))
  );
}

const DETAIL_QUERY = `
  query($id: String!) {
    show(_id: $id) {
      _id name englishName nativeName malId aniListId episodeCount thumbnail banner score type rating status
      nextAiringEpisode description genres studios season availableEpisodesDetail relatedShows characters prevideos musics
    }
  }
`;

function asEpisodeDetails(value: unknown): EpisodeDetails {
  const parsed = parseObjectScalar(value);
  const arr = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
  if (parsed && typeof parsed === "object") {
    const o = parsed as Record<string, unknown>;
    return { sub: arr(o.sub), dub: arr(o.dub), raw: arr(o.raw) };
  }
  return { sub: [], dub: [], raw: [] };
}

function asSeason(value: unknown): ShowDetail["season"] {
  const parsed = parseObjectScalar(value);
  if (parsed && typeof parsed === "object") {
    const o = parsed as Record<string, unknown>;
    return {
      season: typeof o.season === "number" ? o.season : null,
      year: typeof o.year === "number" ? o.year : null,
    };
  }
  return null;
}

function asRelated(value: unknown): RelatedEntry[] {
  const parsed = parseObjectScalar(value);
  if (!Array.isArray(parsed)) return [];
  return (parsed as Record<string, unknown>[])
    .filter((r) => r && typeof r.showId === "string")
    .map((r) => ({
      relation: typeof r.relation === "string" ? r.relation : "other",
      showId: r.showId as string,
    }));
}

function asCharacters(value: unknown): CharacterInfo[] {
  const parsed = parseObjectScalar(value);
  if (!Array.isArray(parsed)) return [];
  return (parsed as Record<string, any>[])
    .filter((c) => c && c.name?.full)
    .map((c) => ({
      name: String(c.name.full),
      native: typeof c.name.native === "string" ? c.name.native : null,
      role: typeof c.role === "string" ? c.role : "",
      image: c.image?.large ?? c.image?.medium ?? null,
      vaIds: Array.isArray(c.voiceActors)
        ? c.voiceActors.map((v: any) => Number(v.aniListId)).filter((n: number) => n > 0)
        : [],
    }))
    .slice(0, 18);
}

function asThemes(value: unknown): ThemeSong[] {
  const parsed = parseObjectScalar(value);
  if (!Array.isArray(parsed)) return [];
  return (parsed as Record<string, any>[])
    .filter((m) => m && m.title)
    .map((m) => ({
      type: String(m.type ?? "Song"),
      title: String(m.title),
      audioUrl: resolveAsset(m.url as string | null),
      cover: resolveAsset(m.cover as string | null),
    }))
    .slice(0, 12);
}

export function getShow(id: string): Promise<ShowDetail> {
  return cached(`show:${id}`, () =>
    gql<{ show: Record<string, unknown> | null }>(DETAIL_QUERY, { id }).then((d) => {
      if (!d.show) throw new Error("Show not found");
      const s = d.show as Record<string, any>;
      const trailerRaw =
        Array.isArray(s.prevideos) && s.prevideos.length ? String(s.prevideos[0]) : null;
      const base = normalizeSummary(s);
      return {
        ...base,
        englishName: (s.englishName as string) ?? null,
        nativeName: (s.nativeName as string) ?? null,
        description: stripHtml(s.description as string) || null,
        banner: (s.banner as string) ?? null,
        genres: Array.isArray(s.genres) ? (s.genres as string[]) : [],
        studios: Array.isArray(s.studios) ? (s.studios as string[]) : [],
        season: asSeason(s.season),
        episodes: asEpisodeDetails(s.availableEpisodesDetail),
        related: asRelated(s.relatedShows),
        characters: asCharacters(s.characters),
        themes: asThemes(s.musics),
        trailerId: trailerRaw,
      };
    })
  );
}

const BATCH_QUERY = `
  query($ids: [String!]!) {
    showsWithIds(ids: $ids, search: { denyEcchi: true }) {
      ${SHOW_FIELDS}
    }
  }
`;

export function getRelatedShows(id: string): Promise<RelatedShow[]> {
  return cached(`related:${id}`, () =>
    getShow(id).then((detail) => {
      if (detail.related.length === 0) return [];
      const relationById = new Map<string, string>();
      detail.related.forEach((r) => {
        if (!relationById.has(r.showId)) relationById.set(r.showId, r.relation);
      });
      return gql<{ showsWithIds: (Record<string, any> | null)[] }>(BATCH_QUERY, {
        ids: [...relationById.keys()],
      }).then((d) =>
        (d.showsWithIds ?? [])
          .filter((s): s is Record<string, any> => !!s && !!s._id)
          .map((s) => ({ relation: relationById.get(String(s._id)) ?? "other", show: normalizeSummary(s) }))
      );
    })
  );
}

// ── Per-episode rich info (title / thumbnail / synopsis) ─────
const EPISODE_INFO_QUERY = `
  query($showId: String!, $from: Int!, $to: Int!) {
    episodeInfos(showId: $showId, episodeNumStart: $from, episodeNumEnd: $to) {
      episodeIdNum notes description thumbnails
    }
  }
`;

export function getEpisodeInfos(
  showId: string,
  from: number,
  to: number
): Promise<EpisodeInfo[]> {
  const key = `epinfo:${showId}:${from}:${to}`;
  return cached(key, () =>
    gql<{ episodeInfos: Record<string, any>[] | null }>(EPISODE_INFO_QUERY, {
      showId,
      from,
      to,
    }).then((d) => {
      const list = Array.isArray(d.episodeInfos) ? d.episodeInfos : [];
      return list
        .filter((e) => e && e.episodeIdNum != null)
        .map((e) => ({
          num: Number(e.episodeIdNum),
          title: typeof e.notes === "string" && e.notes ? e.notes : `Episode ${Number(e.episodeIdNum)}`,
          description: stripHtml(typeof e.description === "string" ? e.description : ""),
          thumbnail: resolveAsset(Array.isArray(e.thumbnails) ? (e.thumbnails[0] as string) : null),
        }));
    })
  );
}

// ── Voice actors (stuffs) ────────────────────────────────────
const STUFFS_QUERY = `
  query($ids: [Int!]!) {
    stuffs(staffAniListIds: $ids) {
      aniListId name image
    }
  }
`;

export function getVoiceActors(ids: number[]): Promise<VoiceActor[]> {
  if (ids.length === 0) return Promise.resolve([]);
  const key = `va:${ids.join(",")}`;
  return cached(key, () =>
    gql<{ stuffs: Record<string, any>[] | null }>(STUFFS_QUERY, { ids }).then((d) => {
      const list = Array.isArray(d.stuffs) ? d.stuffs : [];
      return list
        .filter((s) => s && s.aniListId != null)
        .map((s) => ({
          aniListId: Number(s.aniListId),
          name: s.name?.full ?? "Unknown",
          native: typeof s.name?.native === "string" ? s.name.native : null,
          language: "",
          image: s.image?.large ?? s.image?.medium ?? null,
        }));
    })
  );
}

export function getRecommendations(genre: string, excludeId: string): Promise<ShowSummary[]> {
  return searchShows({ genres: genre, types: "TV", sortBy: "Popular", limit: 14 }).then(
    (page) => page.shows.filter((s) => s._id !== excludeId).slice(0, 12)
  );
}

// ── Estimated airing schedule ────────────────────────────────
// Built from currently-airing shows' nextAiringEpisode timestamps.
export function getAiringSchedule(): Promise<AiringEntry[]> {
  return cached("airing-schedule", () =>
    searchShows({ sortBy: "Latest_Update", types: "TV", limit: 40 }).then((page) => {
      const now = Date.now() / 1000;
      return page.shows
        .filter((s) => s.nextAiringEpisode && s.nextAiringEpisode > now)
        .map((s) => ({
          show: s,
          episode: s.episodeCount ? s.episodeCount + 1 : null,
          airingAt: s.nextAiringEpisode as number,
        }))
        .sort((a, b) => a.airingAt - b.airingAt)
        .slice(0, 42);
    })
  );
}

export const relationLabel = (relation: string): string =>
  relation
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Romance",
  "Sci-Fi", "Slice of Life", "Sports", "Thriller", "Horror", "Mystery",
  "Supernatural", "Ecchi", "Isekai", "School", "Shounen", "Seinen",
  "Shoujo", "Josei", "Music", "Psychological", "Mecha", "Magic",
  "Military", "Historical", "Martial Arts", "Parody", "Samurai", "Super Power",
] as const;

export const TYPES = ["TV", "Movie", "OVA", "ONA", "Special"] as const;

export const STUDIOS = [
  "MAPPA", "ufotable", "Wit Studio", "Studio Ghibli", "Madhouse", "A-1 Pictures",
  "Toei Animation", "Bones", "Kyoto Animation", "Sunrise", "Trigger", "Shaft",
  "Production I.G", "Pierrot", "White Fox", "CloverWorks", "David Production", "TMS Entertainment",
] as const;

export const SORTS: { value: string; label: string }[] = [
  { value: "Trending", label: "Trending" },
  { value: "Popular", label: "Most Popular" },
  { value: "Recent", label: "Recently Released" },
  { value: "Latest_Update", label: "Recently Updated" },
  { value: "Top", label: "Top Rated" },
  { value: "Release_Year", label: "Newest First" },
  { value: "Name_ASC", label: "Title A-Z" },
  { value: "Name_DESC", label: "Title Z-A" },
];
