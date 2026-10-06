import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AiOutlineFullscreen,
  AiOutlineFullscreenExit,
  AiOutlineLeft,
} from "react-icons/ai";
import {
  BsCheck2,
  BsChevronLeft,
  BsChevronRight,
  BsFillPlayFill,
  BsGrid3X3GapFill,
  BsListUl,
  BsMoonStarsFill,
  BsSunFill,
} from "react-icons/bs";
import { TbLayoutNavbarCollapse, TbLayoutNavbarExpand } from "react-icons/tb";
import AnimeCard from "@/components/AnimeCard";
import SectionHeader from "@/components/SectionHeader";
import ServerStatusRow from "@/components/ServerStatusRow";
import useToasts from "@/lib/toast";
import useUserList from "@/lib/userlist";
import {
  getEpisodeInfos,
  getRelatedShows,
  getShow,
  type EpisodeInfo,
  type RelatedShow,
  type ShowDetail,
} from "@/server/allanime";
import {
  getAutoNext,
  getPreferredServer,
  getServer,
  saveAutoNext,
  savePreferredServer,
  type ServerHealth,
  type StreamLang,
} from "@/server/stream";

export default function WatchAnime() {
  const { id = "", ep: epRoute } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const push = useToasts((s) => s.push);
  const markWatched = useUserList((s) => s.markWatched);
  const watchedMap = useUserList((s) => s.watched);

  const [show, setShow] = useState<ShowDetail | null>(null);
  const [error, setError] = useState(false);
  const [theater, setTheater] = useState(false);
  const [lightsOff, setLightsOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [related, setRelated] = useState<RelatedShow[]>([]);
  const [serverId, setServerId] = useState<string>(getPreferredServer());
  const [autoNext, setAutoNext] = useState<boolean>(getAutoNext());
  const [epView, setEpView] = useState<"grid" | "list">("grid");
  const [epRange, setEpRange] = useState(0);
  const [epInfos, setEpInfos] = useState<Map<number, EpisodeInfo>>(new Map());
  const playerWrapRef = useRef<HTMLDivElement>(null);
  const failedOverRef = useRef(false);

  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(document.fullscreenElement === playerWrapRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = playerWrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen();
  }, []);

  const epParam = Number(searchParams.get("ep") ?? epRoute ?? "1");
  const ep = Number.isFinite(epParam) ? epParam : 1;
  const requestedLang = (searchParams.get("lang") ?? "sub") as StreamLang;
  const [lang, setLang] = useState<StreamLang>("sub");

  useEffect(() => {
    let alive = true;
    getShow(id)
      .then((s) => {
        if (!alive) return;
        setShow(s);
        getRelatedShows(id).then((r) => alive && setRelated(r)).catch(() => undefined);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [id]);

  const episodeList = useMemo(() => {
    if (!show) return [];
    return [...show.episodes[lang]]
      .map(Number)
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
  }, [show, lang]);

  const watchedSet = useMemo(
    () => new Set(watchedMap[`${id}:${lang}`] ?? []),
    [watchedMap, id, lang]
  );

  // episode range chunks (1–100, 101–200, …)
  const ranges = useMemo(() => {
    if (episodeList.length <= 100) return [];
    const chunks: { label: string; from: number; to: number }[] = [];
    for (let i = 0; i < episodeList.length; i += 100) {
      const from = episodeList[i];
      const to = episodeList[Math.min(i + 99, episodeList.length - 1)];
      chunks.push({ label: `${from}-${to}`, from, to });
    }
    return chunks;
  }, [episodeList]);

  useEffect(() => {
    setEpRange(0);
  }, [lang, id]);

  const visibleEpisodes = useMemo(() => {
    const r = ranges[epRange];
    if (!r) return episodeList;
    return episodeList.filter((n) => n >= r.from && n <= r.to);
  }, [episodeList, ranges, epRange]);

  // load rich episode info for the detailed list view
  useEffect(() => {
    if (epView !== "list" || !show) return;
    let alive = true;
    const r = ranges[epRange];
    const from = r ? r.from : Math.min(...(episodeList.length ? episodeList : [1]));
    const to = r ? r.to : Math.max(...(episodeList.length ? episodeList : [1]));
    getEpisodeInfos(show._id, from, to)
      .then((infos) => {
        if (!alive) return;
        setEpInfos((prev) => {
          const map = new Map(prev);
          infos.forEach((i) => map.set(i.num, i));
          return map;
        });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [epView, epRange, show, ranges, episodeList]);

  useEffect(() => {
    if (!show) return;
    const has = (l: StreamLang) => show.episodes[l].length > 0;
    if (requestedLang === "dub" && has("dub")) setLang("dub");
    else if (requestedLang === "sub" && has("sub")) setLang("sub");
    else if (has("sub")) setLang("sub");
    else if (has("dub")) setLang("dub");
    else setLang("sub");
  }, [show, requestedLang]);

  const setEp = useCallback(
    (next: number, l: StreamLang) => {
      setSearchParams({ ep: String(next), lang: l });
      window.scrollTo({ top: 0, behavior: "smooth" });
      push(`Streaming episode ${next} · ${getServer(serverId).label}`, "success");
    },
    [setSearchParams, push, serverId]
  );

  const idx = episodeList.indexOf(ep);
  const next = idx >= 0 && idx < episodeList.length - 1 ? episodeList[idx + 1] : null;
  const prev = idx > 0 ? episodeList[idx - 1] : null;

  const changeServer = useCallback(
    (sid: string) => {
      setServerId(sid);
      savePreferredServer(sid);
      const s = getServer(sid);
      push(`Switched to ${s.label}`, "info");
      failedOverRef.current = true; // user picked; don't auto-override
      if (!s.langs.includes(lang)) setEp(ep, "sub");
    },
    [push, lang, ep, setEp]
  );

  // automatic failover: if the active server probes down, hop to the best healthy one
  const onHealth = useCallback(
    (health: ServerHealth[]) => {
      if (failedOverRef.current) return;
      const active = health.find((h) => h.id === serverId);
      if (active && active.ok) return; // current server is fine
      const best = health.find((h) => h.ok);
      if (best && best.id !== serverId) {
        setServerId(best.id);
        savePreferredServer(best.id);
        push(`${getServer(serverId).label} is down — switched to ${getServer(best.id).label}`, "error");
      }
    },
    [serverId, push]
  );

  // cross-origin "ended" events (Videasy posts player events) -> auto-next
  useEffect(() => {
    if (!autoNext || !next) return;
    const onMessage = (e: MessageEvent) => {
      const data = e.data as any;
      const ended =
        (data && (data.event === "ended" || data.type === "ended" || data === "ended")) ||
        (data && data.event === "player" && data.player === "ended");
      if (ended) setEp(next, lang);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [autoNext, next, lang, setEp]);

  useEffect(() => {
    if (!show) return;
    saveWatchProgressIfNew();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, ep, lang]);

  const saveWatchProgressIfNew = useCallback(() => {
    if (!show) return;
    markWatched(show._id, lang, ep);
    try {
      const raw = localStorage.getItem("otaku-cw");
      const list = raw ? JSON.parse(raw) : [];
      const rest = (Array.isArray(list) ? list : []).filter((p: any) => p.id !== show._id);
      rest.unshift({
        id: show._id,
        malId: show.malId,
        title: show.name,
        poster: show.thumbnail,
        ep,
        lang,
        updatedAt: Date.now(),
      });
      localStorage.setItem("otaku-cw", JSON.stringify(rest.slice(0, 20)));
    } catch {
      /* ignore */
    }
  }, [show, ep, lang, markWatched]);

  const server = getServer(serverId);
  const ids = useMemo(
    () => ({ malId: show?.malId ?? null, aniListId: show?.aniListId ?? null }),
    [show]
  );
  const embedUrl = useMemo(
    () => (show ? server.build(ids, ep, server.langs.includes(lang) ? lang : "sub") : null),
    [show, server, ids, ep, lang]
  );

  const externalUrl = useMemo(
    () => (show?.malId ? `https://myanimelist.net/anime/${show.malId}` : null),
    [show]
  );

  const floatBtn =
    "flex h-9 w-9 items-center justify-center rounded-md bg-black/70 text-zinc-200 ring-1 ring-white/10 backdrop-blur transition hover:bg-black/90 hover:text-white";

  const renderEpButton = (n: number) => {
    const watched = watchedSet.has(n);
    return (
      <button
        key={n}
        onClick={() => setEp(n, lang)}
        className={`relative flex items-center justify-center gap-1 overflow-hidden rounded-md py-2 text-xs font-semibold transition ${
          n === ep
            ? "bg-red-600 text-white shadow-[0_0_16px_rgba(220,38,38,0.45)]"
            : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
        }`}
      >
        {n}
        {watched && n !== ep && <BsCheck2 size={11} className="absolute right-1 top-0.5 text-emerald-400" />}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {lightsOff && !isFullscreen && (
        <div className="pointer-events-none fixed inset-0 z-20 bg-black/85" aria-hidden="true" />
      )}

      {/* top bar */}
      <nav
        className={`sticky top-0 z-30 items-center gap-x-4 gap-y-2 border-b border-zinc-800 bg-zinc-950/95 px-4 py-2.5 backdrop-blur md:px-8 ${
          theater ? "hidden" : "flex"
        }`}
      >
        <button onClick={() => navigate(-1)} className="text-zinc-300 transition hover:text-white" aria-label="Go back">
          <AiOutlineLeft size={26} />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white md:text-base">{show ? show.name : "Loading…"}</p>
          <p className="text-xs text-zinc-500">
            Episode {ep} · {lang.toUpperCase()} · {server.label}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md ring-1 ring-zinc-700">
            {(["sub", "dub"] as StreamLang[]).map((l) => {
              const available = show ? show.episodes[l].length > 0 : false;
              return (
                <button
                  key={l}
                  disabled={!available}
                  onClick={() => setEp(ep, l)}
                  className={`px-3.5 py-1.5 text-xs font-bold uppercase transition ${
                    lang === l ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-30"
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>

          {episodeList.length > 1 && (
            <select
              value={ep}
              onChange={(e) => setEp(Number(e.target.value), lang)}
              className="max-w-36 rounded-md bg-zinc-900 px-2 py-1.5 text-xs text-white ring-1 ring-zinc-700 outline-none focus:ring-red-600"
            >
              {episodeList.map((n) => (
                <option key={n} value={n}>
                  Episode {n}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => {
              const v = !autoNext;
              setAutoNext(v);
              saveAutoNext(v);
              push(v ? "Auto-play next episode on" : "Auto-play next episode off", "info");
            }}
            title="Auto-play next episode"
            className={`hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold ring-1 transition sm:flex ${
              autoNext
                ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/40"
                : "bg-zinc-900 text-zinc-400 ring-zinc-700 hover:text-white"
            }`}
          >
            <BsFillPlayFill size={11} />
            Auto-next
          </button>

          <button
            onClick={() => setLightsOff((l) => !l)}
            title={lightsOff ? "Turn on the lights" : "Turn off the lights"}
            className={`hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold ring-1 transition sm:flex ${
              lightsOff
                ? "bg-yellow-400/15 text-yellow-300 ring-yellow-400/40"
                : "bg-zinc-900 text-zinc-400 ring-zinc-700 hover:text-white"
            }`}
          >
            {lightsOff ? <BsSunFill size={13} /> : <BsMoonStarsFill size={13} />}
            Lights
          </button>

          <Link
            to={`/anime/${id}`}
            className="hidden rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 ring-1 ring-zinc-700 transition hover:text-white md:block"
          >
            Details
          </Link>
        </div>
      </nav>

      <div className={`mx-auto mt-4 max-w-[1600px] px-4 md:px-8 ${lightsOff ? "relative z-30" : ""}`}>
        <div className={`grid gap-6 ${theater ? "" : "lg:grid-cols-[minmax(0,1fr)_360px]"}`}>
          {/* player column */}
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <ServerStatusRow
                ids={ids}
                ep={ep}
                lang={server.langs.includes(lang) ? lang : "sub"}
                active={serverId}
                onSelect={changeServer}
                onHealth={onHealth}
              />
              {externalUrl && (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener"
                  className="rounded-md px-3 py-1.5 text-xs font-semibold text-zinc-500 ring-1 ring-zinc-800 transition hover:text-red-500 hover:ring-red-600/60"
                >
                  MyAnimeList ↗
                </a>
              )}
            </div>

            <div
              ref={playerWrapRef}
              data-native-cursor
              className={`relative overflow-hidden rounded-xl bg-black ring-1 ring-zinc-800 ${
                theater ? "" : "shadow-[0_20px_80px_-30px_rgba(0,0,0,0.9)]"
              }`}
            >
              <div className={theater ? "h-[80vh]" : "aspect-video"}>
                {!show && !error && (
                  <div className="flex h-full flex-col items-center justify-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-red-600" />
                    <p className="text-sm text-zinc-500">Contacting {server.label}…</p>
                  </div>
                )}
                {error && (
                  <div className="flex h-full items-center justify-center p-8 text-center">
                    <div>
                      <p className="text-zinc-300">Couldn't load this anime.</p>
                      <button onClick={() => window.location.reload()} className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                        Retry
                      </button>
                    </div>
                  </div>
                )}
                {show && !embedUrl && (
                  <div className="flex h-full items-center justify-center p-8 text-center">
                    <div>
                      <p className="text-zinc-300">This title isn't available on {server.label} yet — the auto-failover is trying another server.</p>
                    </div>
                  </div>
                )}
                {embedUrl && (
                  <iframe
                    key={`${serverId}-${ep}-${lang}`}
                    src={embedUrl}
                    title={`${show?.name} - Episode ${ep} (${lang}) [${server.label}]`}
                    allowFullScreen
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    className="h-full w-full border-0"
                  />
                )}

                {embedUrl && (
                  <div className="absolute right-3 top-3 z-10 flex gap-2">
                    <button onClick={() => setLightsOff((l) => !l)} title="Lights" className={floatBtn}>
                      {lightsOff ? <BsSunFill size={16} /> : <BsMoonStarsFill size={16} />}
                    </button>
                    <button onClick={() => setTheater((t) => !t)} title="Theater mode" className={floatBtn}>
                      {theater ? <TbLayoutNavbarExpand size={18} /> : <TbLayoutNavbarCollapse size={18} />}
                    </button>
                    <button onClick={toggleFullscreen} title="Fullscreen" className={floatBtn}>
                      {isFullscreen ? <AiOutlineFullscreenExit size={18} /> : <AiOutlineFullscreen size={18} />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {show && episodeList.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <button
                    disabled={!prev}
                    onClick={() => prev && setEp(prev, lang)}
                    className="flex items-center gap-1 rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-700 hover:text-white disabled:opacity-30"
                  >
                    <BsChevronLeft size={12} />
                    Prev
                  </button>
                  <button
                    disabled={!next}
                    onClick={() => next && setEp(next, lang)}
                    className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-30"
                  >
                    Next Episode
                    <BsChevronRight size={12} />
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Auto-failover is on — if a server drops, you're moved to the fastest healthy one.
                </p>
              </div>
            )}

            {show?.description && (
              <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-zinc-400">{show.description}</p>
            )}
          </div>

          {/* episode sidebar */}
          {show && episodeList.length > 0 && !theater && (
            <aside className="lg:sticky lg:top-20 lg:self-start">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Episodes · {episodeList.length}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex overflow-hidden rounded-md ring-1 ring-zinc-700">
                    <button
                      onClick={() => setEpView("grid")}
                      aria-label="Grid view"
                      className={`px-2.5 py-1 text-xs transition ${epView === "grid" ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"}`}
                    >
                      <BsGrid3X3GapFill size={13} />
                    </button>
                    <button
                      onClick={() => setEpView("list")}
                      aria-label="List view"
                      className={`px-2.5 py-1 text-xs transition ${epView === "list" ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"}`}
                    >
                      <BsListUl size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {ranges.length > 0 && (
                <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
                  {ranges.map((r, i) => (
                    <button
                      key={r.label}
                      onClick={() => setEpRange(i)}
                      className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-bold tabular-nums ring-1 transition ${
                        i === epRange ? "bg-red-600 text-white ring-red-600" : "bg-zinc-900 text-zinc-500 ring-zinc-800 hover:text-white"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}

              {epView === "grid" ? (
                <div className="thin-scroll mt-3 grid max-h-[24rem] grid-cols-5 gap-1.5 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 sm:grid-cols-8 lg:grid-cols-5 xl:grid-cols-6">
                  {visibleEpisodes.map(renderEpButton)}
                </div>
              ) : (
                <div className="thin-scroll mt-3 max-h-[26rem] space-y-2 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5">
                  {visibleEpisodes.map((n) => {
                    const info = epInfos.get(n);
                    const active = n === ep;
                    const watched = watchedSet.has(n);
                    return (
                      <button
                        key={n}
                        onClick={() => setEp(n, lang)}
                        className={`flex w-full gap-3 rounded-lg p-2 text-left transition ${
                          active ? "bg-red-600/15 ring-1 ring-red-600" : "hover:bg-zinc-800"
                        }`}
                      >
                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                          {info?.thumbnail ? (
                            <img src={info.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-zinc-600">EP {n}</div>
                          )}
                          {watched && (
                            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-black">
                              <BsCheck2 size={11} />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-xs font-bold ${active ? "text-red-500" : "text-white"}`}>
                            {info?.title ?? `Episode ${n}`}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-zinc-500">
                            {info?.description || "No synopsis available for this episode yet."}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {watchedSet.size > 0 && (
                <p className="mt-2 text-[11px] text-zinc-500">
                  <span className="font-bold text-emerald-400">{watchedSet.size}</span> of {episodeList.length} watched
                </p>
              )}
            </aside>
          )}
        </div>

        {related.length > 0 && (
          <div className="mt-12">
            <SectionHeader title="You Might Also Like" jp="関連作品" />
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
              {related.map(({ relation, show: s }) => (
                <div key={s._id} className="w-36 shrink-0 md:w-44">
                  <AnimeCard show={s} />
                  <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-wider text-red-500">{relation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
