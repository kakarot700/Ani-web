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
  BsLightningChargeFill,
  BsMoonStarsFill,
  BsSunFill,
} from "react-icons/bs";
import AnimeCard from "@/components/AnimeCard";
import Footer from "@/components/Footer";
import SectionHeader from "@/components/SectionHeader";
import ServerPicker from "@/components/ServerPicker";
import { Card, GhostPill, GlassPill, IconBadge, InfoRow, LightSegmented, Segmented } from "@/components/ui";
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
  STREAM_SERVERS,
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
  const [mode, setMode] = useState<string>(getPreferredServer()); // "auto" | server id
  const [autoPick, setAutoPick] = useState<string | null>(null); // auto-pilot's current choice
  const [autoNext, setAutoNext] = useState<boolean>(getAutoNext());
  const [epView, setEpView] = useState<"grid" | "list">("grid");
  const [epRange, setEpRange] = useState(0);
  const [epInfos, setEpInfos] = useState<Map<number, EpisodeInfo>>(new Map());
  const playerWrapRef = useRef<HTMLDivElement>(null);

  // ── auto-pilot state ───────────────────────────────────────
  const healthRef = useRef<ServerHealth[]>([]); // latest ranked probe results
  const attemptedRef = useRef<Set<string>>(new Set()); // servers already failed this episode
  const lastSwitchRef = useRef(0); // guards against stale iframe signals
  const gotSignalRef = useRef(false); // watchdog: player proved it's alive

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

  const ranges = useMemo(() => {
    if (episodeList.length <= 100) return [];
    const chunks: { label: string; from: number; to: number }[] = [];
    for (let i = 0; i < episodeList.length; i += 100) {
      const from = episodeList[i];
      const to = episodeList[Math.min(i + 99, episodeList.length - 1)];
      chunks.push({ label: `${from}–${to}`, from, to });
    }
    return chunks;
  }, [episodeList]);

  useEffect(() => setEpRange(0), [lang, id]);

  const visibleEpisodes = useMemo(() => {
    const r = ranges[epRange];
    if (!r) return episodeList;
    return episodeList.filter((n) => n >= r.from && n <= r.to);
  }, [episodeList, ranges, epRange]);

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
    },
    [setSearchParams]
  );

  const idx = episodeList.indexOf(ep);
  const next = idx >= 0 && idx < episodeList.length - 1 ? episodeList[idx + 1] : null;
  const prev = idx > 0 ? episodeList[idx - 1] : null;

  // Live snapshot of values the player-message listener needs, so the
  // listener never re-attaches and never reads stale state.
  const liveRef = useRef({
    mode,
    autoPick,
    lang,
    ep,
    autoNext,
    next: null as number | null,
  });
  liveRef.current = { mode, autoPick, lang, ep, autoNext, next };

  /** Manual pin: user picked a server — respect it until it errors. */
  const adoptManual = useCallback(
    (sid: string, toastMsg: string | null, kind: "info" | "error" = "info") => {
      const s = getServer(sid);
      attemptedRef.current.clear();
      gotSignalRef.current = true; // manual choice: no watchdog second-guessing
      setMode(sid);
      savePreferredServer(sid);
      lastSwitchRef.current = Date.now();
      if (toastMsg) push(toastMsg, kind);
      if (!s.langs.includes(liveRef.current.lang)) setEp(liveRef.current.ep, "sub");
    },
    [push, setEp]
  );

  /** Auto-pilot: drop the current pick and fall back to the next best. */
  const advanceAuto = useCallback(
    (reason: string | null) => {
      // Ignore stale signals racing in from the iframe we just swapped out
      if (Date.now() - lastSwitchRef.current < 900) return;
      const current = liveRef.current.autoPick;
      if (current) {
        attemptedRef.current.add(current);
        // Demote it in the ranked list too — the picker shows it red
        // and future picks skip it for the rest of this episode.
        const failed = healthRef.current.find((h) => h.id === current);
        if (failed) failed.ok = false;
      }
      const candidates = healthRef.current.filter((h) => h.ok);
      const nextPick = candidates.find((c) => !attemptedRef.current.has(c.id));
      if (!nextPick) {
        if (reason)
          push("Auto-pilot tried every healthy server — pin one manually below", "error");
        return;
      }
      gotSignalRef.current = false;
      lastSwitchRef.current = Date.now();
      setAutoPick(nextPick.id);
      if (reason) push(`${reason} — auto-switched to ${getServer(nextPick.id).label}`, "error");
    },
    [push]
  );

  /** Ranked probe results arrive here from the picker. */
  const onHealth = useCallback(
    (health: ServerHealth[]) => {
      healthRef.current = health;
      if (liveRef.current.mode !== "auto") return; // manual pin stands

      const candidates = health.filter((h) => h.ok);
      const current = liveRef.current.autoPick;

      if (!current) {
        const best = candidates.find((c) => !attemptedRef.current.has(c.id));
        if (best) {
          gotSignalRef.current = false;
          lastSwitchRef.current = Date.now();
          setAutoPick(best.id);
        }
        return;
      }
      if (candidates.some((c) => c.id === current)) return; // still healthy — keep playing
      advanceAuto(`${getServer(current).label} went down`);
    },
    [advanceAuto]
  );

  /** User-facing mode switch: "auto" or a specific server id. */
  const selectMode = useCallback(
    (m: string) => {
      if (m === "auto") {
        attemptedRef.current.clear();
        gotSignalRef.current = false;
        setMode("auto");
        savePreferredServer("auto");
        const best = healthRef.current.find((h) => h.ok);
        if (best) {
          lastSwitchRef.current = Date.now();
          setAutoPick(best.id);
          push(`Auto-pilot on — playing on ${getServer(best.id).label}`, "info");
        } else {
          setAutoPick(null);
          push("Auto-pilot on — scanning servers…", "info");
        }
        return;
      }
      adoptManual(m, `Pinned ${getServer(m).label}`);
    },
    [adoptManual, push]
  );

  // Fresh episode / language → every server gets a clean chance, and
  // auto-pilot re-optimizes onto the currently fastest healthy server.
  useEffect(() => {
    attemptedRef.current.clear();
    const live = liveRef.current;
    if (live.mode === "auto" && live.autoPick) {
      const best = healthRef.current.find((h) => h.ok);
      if (best && best.id !== live.autoPick) setAutoPick(best.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep, lang, id]);

  // Watchdog: players that post events must prove they're alive within
  // 12s of loading, otherwise auto-pilot assumes a silent failure and
  // falls back to the next server. Only for event-posting servers.
  useEffect(() => {
    if (mode !== "auto" || !autoPick) return;
    if (!getServer(autoPick).signals) return;
    const t = window.setTimeout(() => {
      if (!gotSignalRef.current)
        advanceAuto(`${getServer(autoPick).label} gave no response`);
    }, 12000);
    return () => window.clearTimeout(t);
  }, [mode, autoPick, ep, lang, advanceAuto]);

  // One listener for all player messages: any message proves the player
  // is alive (feeds the watchdog), errors trigger failover, and
  // "ended"-family events drive auto-next.
  useEffect(() => {
    const ENDED_EVENTS = new Set(["complete", "ended", "end", "episodeEnd"]);
    const onMessage = (e: MessageEvent) => {
      let data = e.data as any;
      // Some players post JSON strings instead of objects
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data || typeof data !== "object") return;

      const inner = data.type === "PLAYER_EVENT" && data.data ? data.data : data;
      // The event name can arrive as event/type/player, and some providers
      // namespace it — e.g. Anixo posts { type: "aniembed:ended" }.
      const evName = [inner.event, inner.type, inner.player].find(
        (v) => typeof v === "string"
      ) as string | undefined;
      const ev = evName ?? "";
      const isEnded = ENDED_EVENTS.has(ev) || /:(ended|complete|end)$/.test(ev);
      const isError = ev === "error" || ev === "play_error" || ev.endsWith(":error");

      gotSignalRef.current = true; // the player is alive

      const live = liveRef.current;
      if (isError) {
        if (live.mode === "auto") {
          advanceAuto(
            `${live.autoPick ? getServer(live.autoPick).label : "Server"} hit a playback error`
          );
        } else {
          // Manual pin failed → jump to the best healthy backup
          const best = healthRef.current.find((h) => h.ok && h.id !== live.mode);
          if (best)
            adoptManual(
              best.id,
              `${getServer(live.mode).label} hit an error — switched to ${getServer(best.id).label}`,
              "error"
            );
          else push("This server is failing and no healthy backup was found", "error");
        }
        return;
      }
      if (isEnded && live.autoNext && live.next) setEp(live.next, live.lang);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [advanceAuto, adoptManual, setEp]);

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

  useEffect(() => {
    if (!show) return;
    saveWatchProgressIfNew();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, ep, lang]);

  const activeId = mode === "auto" ? autoPick : mode;
  const activeServer = activeId ? getServer(activeId) : null;
  const ids = useMemo(
    () => ({ malId: show?.malId ?? null, aniListId: show?.aniListId ?? null }),
    [show]
  );
  const embedUrl = useMemo(
    () =>
      show && activeServer
        ? activeServer.build(ids, ep, activeServer.langs.includes(lang) ? lang : "sub")
        : null,
    [show, activeServer, ids, ep, lang]
  );
  const serverLabel =
    mode === "auto"
      ? activeServer
        ? `Auto · ${activeServer.label}`
        : "Auto · scanning…"
      : activeServer
        ? activeServer.label
        : "—";

  const floatBtn =
    "press flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white/90 ring-1 ring-white/15 backdrop-blur-xl transition hover:bg-black/75 hover:text-white";

  const renderEpButton = (n: number) => {
    const isWatched = watchedSet.has(n);
    const active = n === ep;
    return (
      <button
        key={n}
        onClick={() => setEp(n, lang)}
        className={`press tnum relative rounded-[12px] py-2.5 text-[12.5px] font-semibold transition ${
          active
            ? "bg-[#16181f] text-white"
            : isWatched
              ? "bg-[var(--accent)]/15 text-[var(--accent)] hover:bg-[var(--accent)]/25"
              : "bg-black/[0.05] text-[var(--ink)] hover:bg-black/10"
        }`}
      >
        {n}
        {isWatched && !active && (
          <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--accent)]" />
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen pb-24">
      {lightsOff && !isFullscreen && (
        <div className="pointer-events-none fixed inset-0 z-20 bg-black/80" aria-hidden="true" />
      )}

      {/* top bar */}
      <nav
        className={`sticky top-0 z-30 items-center gap-3 px-3 py-3 transition-all md:px-5 ${
          theater ? "hidden" : "flex"
        } ${lightsOff ? "" : "glass border-x-0 border-t-0"}`}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="glass press flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/85 transition hover:bg-white/20 hover:text-white"
        >
          <AiOutlineLeft size={18} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold tracking-[-0.015em] text-white">
            {show ? show.name : "Loading…"}
          </p>
          <p className="truncate text-[11.5px] text-white/55">
            Episode {ep} · {lang.toUpperCase()} · {serverLabel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {show && (
            <Segmented
              size="sm"
              className="hidden sm:inline-flex"
              label="Audio"
              segments={[
                { id: "sub" as const, label: "Sub" },
                { id: "dub" as const, label: "Dub" },
              ]}
              value={lang}
              onChange={(l) => (show.episodes[l].length > 0 ? setEp(ep, l) : undefined)}
            />
          )}

          <button
            onClick={() => {
              const v = !autoNext;
              setAutoNext(v);
              saveAutoNext(v);
              push(v ? "Autoplay next episode on" : "Autoplay next episode off", "info");
            }}
            title="Autoplay next episode"
            className={`press hidden items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition sm:flex ${
              autoNext
                ? "bg-[var(--success)]/20 text-white ring-1 ring-[var(--success)]/40"
                : "glass text-white/70 hover:bg-white/20 hover:text-white"
            }`}
          >
            <BsLightningChargeFill size={11} />
            Auto-next
          </button>

          <Link
            to={`/anime/${id}`}
            className="glass press hidden rounded-full px-4 py-2 text-[12.5px] font-semibold text-white/85 transition hover:bg-white/20 hover:text-white md:block"
          >
            Details
          </Link>
        </div>
      </nav>

      <div className={`mx-auto mt-4 max-w-[1400px] px-4 md:px-6 ${lightsOff ? "relative z-30" : ""}`}>
        {/* player */}
        <div
          ref={playerWrapRef}
          data-native-cursor
          className="relative overflow-hidden rounded-[28px] bg-black ring-1 ring-white/12"
        >
          <div className={theater ? "h-[82vh]" : "aspect-video"}>
            {!show && !error && (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <p className="text-[13px] text-white/55">Loading…</p>
              </div>
            )}
            {show && !error && mode === "auto" && !autoPick && (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <p className="text-[13px] text-white/55">
                  Auto-pilot is scanning {STREAM_SERVERS.length} servers…
                </p>
                <p className="text-[11.5px] text-white/35">
                  It will start playing on the fastest healthy one.
                </p>
              </div>
            )}
            {error && (
              <div className="flex h-full items-center justify-center p-8 text-center">
                <div>
                  <p className="text-[14px] text-white/85">Couldn't load this anime.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="press mt-4 rounded-full bg-white px-5 py-2 text-[13px] font-semibold text-[var(--ink)] transition hover:bg-white/90"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            {show && !embedUrl && !(mode === "auto" && !autoPick) && (
              <div className="flex h-full items-center justify-center p-8 text-center">
                <p className="max-w-sm text-[13.5px] text-white/70">
                  {activeServer
                    ? `This title isn't on ${activeServer.label} yet — auto-pilot is trying another server.`
                    : "No playable server found yet — auto-pilot keeps trying."}
                </p>
              </div>
            )}
            {embedUrl && (
              <iframe
                key={`${activeId}-${ep}-${lang}`}
                src={embedUrl}
                title={`${show?.name} - Episode ${ep} (${lang}) [${serverLabel}]`}
                allowFullScreen
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                className="h-full w-full border-0"
              />
            )}

            {embedUrl && (
              <div className="absolute right-3 top-3 z-10 flex gap-2">
                <button onClick={() => setLightsOff((l) => !l)} title="Lights" className={floatBtn}>
                  {lightsOff ? <BsSunFill size={15} /> : <BsMoonStarsFill size={15} />}
                </button>
                <button
                  onClick={() => setTheater((t) => !t)}
                  title="Theater mode"
                  className={floatBtn}
                >
                  {theater ? <AiOutlineFullscreenExit size={16} /> : <AiOutlineFullscreen size={16} />}
                </button>
                <button onClick={toggleFullscreen} title="Fullscreen" className={floatBtn}>
                  {isFullscreen ? <AiOutlineFullscreenExit size={16} /> : <AiOutlineFullscreen size={16} />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* prev / next */}
        {show && episodeList.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <GlassPill disabled={!prev} onClick={() => prev && setEp(prev, lang)}>
                <BsChevronLeft size={11} />
                Previous
              </GlassPill>
              <GlassPill disabled={!next} onClick={() => next && setEp(next, lang)}>
                Next episode
                <BsChevronRight size={11} />
              </GlassPill>
            </div>
            <p className="hidden text-[11.5px] text-white/45 sm:block">
              Auto-pilot is on — it picks the best server, plays it, and falls back on its own.
            </p>
          </div>
        )}

        {/* body */}
        <div className={`mt-6 grid gap-5 ${theater ? "" : "lg:grid-cols-[minmax(0,1fr)_360px]"}`}>
          <div className="space-y-5">
            <Card
              title="Servers"
              meta="Auto-pilot plays on the fastest healthy server — falls back on its own"
              badge={
                <IconBadge tone="accent">
                  <BsLightningChargeFill size={14} />
                </IconBadge>
              }
            >
              {show && (
                <ServerPicker
                  ids={ids}
                  ep={ep}
                  lang={lang}
                  mode={mode}
                  activeId={activeId}
                  onSelect={selectMode}
                  onHealth={onHealth}
                />
              )}
            </Card>

            {show?.description && (
              <Card
                title={show.name}
                meta={`Episode ${ep} · ${lang.toUpperCase()}`}
                badge={
                  <IconBadge tone="ink">
                    <span className="text-[12px] font-bold">EP</span>
                  </IconBadge>
                }
                action={
                  <GhostPill onClick={() => navigate(`/anime/${id}`)}>Series page</GhostPill>
                }
              >
                <p className="line-clamp-3 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
                  {show.description}
                </p>
                <div className="mt-3 border-t border-black/[0.07] pt-3">
                  <InfoRow label="Watched" value={`${watchedSet.size} of ${episodeList.length}`} />
                  <InfoRow label="Quality" value="HD · sub & dub" />
                  <InfoRow label="Server" value={serverLabel} />
                </div>
              </Card>
            )}
          </div>

          {/* episode sidebar */}
          {show && episodeList.length > 0 && !theater && (
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <Card
                title="Episodes"
                meta={`${episodeList.length} available`}
                badge={
                  <IconBadge tone="ink">
                    <span className="text-[12px] font-bold">EP</span>
                  </IconBadge>
                }
                action={
                  <LightSegmented
                    label="Episode layout"
                    segments={[
                      { id: "grid" as const, label: "Grid" },
                      { id: "list" as const, label: "List" },
                    ]}
                    value={epView}
                    onChange={(v) => setEpView(v)}
                  />
                }
              >
                {ranges.length > 0 && (
                  <div className="light-scroll mb-3 flex gap-1.5 overflow-x-auto pb-1">
                    {ranges.map((r, i) => (
                      <button
                        key={r.label}
                        onClick={() => setEpRange(i)}
                        className={`tnum shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition ${
                          i === epRange
                            ? "bg-[#16181f] text-white"
                            : "bg-black/[0.05] text-[var(--ink-soft)] hover:bg-black/10"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}

                {epView === "grid" ? (
                  <div className="light-scroll grid max-h-[420px] grid-cols-5 gap-1.5 overflow-y-auto">
                    {visibleEpisodes.map(renderEpButton)}
                  </div>
                ) : (
                  <div className="light-scroll max-h-[440px] space-y-1.5 overflow-y-auto">
                    {visibleEpisodes.map((n) => {
                      const info = epInfos.get(n);
                      const active = n === ep;
                      const isWatched = watchedSet.has(n);
                      return (
                        <button
                          key={n}
                          onClick={() => setEp(n, lang)}
                          className={`press flex w-full gap-3 rounded-[16px] p-2 text-left transition ${
                            active ? "bg-black/[0.06]" : "hover:bg-black/[0.04]"
                          }`}
                        >
                          <span className="relative h-14 w-24 shrink-0 overflow-hidden rounded-[12px] bg-black/[0.06]">
                            {info?.thumbnail ? (
                              <img
                                src={info.thumbnail}
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full items-center justify-center text-[10px] text-[var(--ink-faint)]">
                                EP {n}
                              </span>
                            )}
                            {isWatched && (
                              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--success)] text-white">
                                <BsCheck2 size={10} />
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block truncate text-[12.5px] font-semibold ${
                                active ? "text-[var(--accent)]" : "text-[var(--ink)]"
                              }`}
                            >
                              {info?.title ?? `Episode ${n}`}
                            </span>
                            <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-[var(--ink-soft)]">
                              {info?.description || "No synopsis available yet."}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {watchedSet.size > 0 && (
                  <p className="mt-3 text-[11.5px] text-[var(--ink-soft)]">
                    <span className="font-semibold text-[var(--ink)]">{watchedSet.size}</span> of{" "}
                    {episodeList.length} watched
                  </p>
                )}
              </Card>
            </aside>
          )}
        </div>

        {related.length > 0 && (
          <div className="mt-14">
            <SectionHeader title="You might also like" />
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
              {related.map(({ relation, show: s }) => (
                <div key={s._id} className="w-36 shrink-0 md:w-44">
                  <AnimeCard show={s} tag={relation.replace(/[_-]/g, " ")} lines={1} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
