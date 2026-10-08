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
import ServerStatusRow from "@/components/ServerStatusRow";
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

  const changeServer = useCallback(
    (sid: string) => {
      setServerId(sid);
      savePreferredServer(sid);
      const s = getServer(sid);
      push(`Switched to ${s.label}`, "info");
      failedOverRef.current = true;
      if (!s.langs.includes(lang)) setEp(ep, "sub");
    },
    [push, lang, ep, setEp]
  );

  const onHealth = useCallback(
    (health: ServerHealth[]) => {
      if (failedOverRef.current) return;
      const active = health.find((h) => h.id === serverId);
      if (active && active.ok) return;
      const best = health.find((h) => h.ok);
      if (best && best.id !== serverId) {
        setServerId(best.id);
        savePreferredServer(best.id);
        push(`${getServer(serverId).label} is down — switched to ${getServer(best.id).label}`, "error");
      }
    },
    [serverId, push]
  );

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

  const server = getServer(serverId);
  const ids = useMemo(
    () => ({ malId: show?.malId ?? null, aniListId: show?.aniListId ?? null }),
    [show]
  );
  const embedUrl = useMemo(
    () => (show ? server.build(ids, ep, server.langs.includes(lang) ? lang : "sub") : null),
    [show, server, ids, ep, lang]
  );

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
            Episode {ep} · {lang.toUpperCase()} · {server.label}
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
                <p className="text-[13px] text-white/55">Contacting {server.label}…</p>
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
            {show && !embedUrl && (
              <div className="flex h-full items-center justify-center p-8 text-center">
                <p className="max-w-sm text-[13.5px] text-white/70">
                  This title isn't on {server.label} yet — auto-failover is trying another server.
                </p>
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
              Auto-failover is on — if a server drops you're moved to the fastest healthy one.
            </p>
          </div>
        )}

        {/* body */}
        <div className={`mt-6 grid gap-5 ${theater ? "" : "lg:grid-cols-[minmax(0,1fr)_360px]"}`}>
          <div className="space-y-5">
            <Card
              title="Servers"
              meta="Pick a source — latency is measured live"
              badge={
                <IconBadge tone="accent">
                  <BsLightningChargeFill size={14} />
                </IconBadge>
              }
            >
              {show && (
                <ServerStatusRow
                  ids={ids}
                  ep={ep}
                  lang={server.langs.includes(lang) ? lang : "sub"}
                  active={serverId}
                  onSelect={changeServer}
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
                  <InfoRow label="Server" value={server.label} />
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
