import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BsFillPlayFill, BsStarFill } from "react-icons/bs";
import { AiOutlineLeft } from "react-icons/ai";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import AnimeCard from "@/components/AnimeCard";
import CharacterRail from "@/components/CharacterRail";
import RelatedRail from "@/components/RelatedRail";
import TrailerSection from "@/components/TrailerSection";
import VoiceActorsRail from "@/components/VoiceActorsRail";
import ThemeSongsSection from "@/components/ThemeSongsSection";
import ReviewsSection from "@/components/ReviewsSection";
import SectionHeader from "@/components/SectionHeader";
import TrackingPanel from "@/components/TrackingPanel";
import {
  BlackPill,
  Card,
  DarkChip,
  GhostPill,
  IconBadge,
  InfoRow,
  LightSegmented,
  SuccessChip,
} from "@/components/ui";
import useUserList from "@/lib/userlist";
import { stripHtml } from "@/utils/text";
import {
  getRecommendations,
  getRelatedShows,
  getShow,
  type RelatedShow,
  type ShowDetail,
  type ShowSummary,
} from "@/server/allanime";
import { getWatchProgress, type StreamLang } from "@/server/stream";

export default function AnimeDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState<ShowDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<StreamLang>("sub");
  const [showAllSynopsis, setShowAllSynopsis] = useState(false);
  const [related, setRelated] = useState<RelatedShow[]>([]);
  const [similar, setSimilar] = useState<ShowSummary[]>([]);
  const [epRange, setEpRange] = useState(0);
  const watchedMap = useUserList((s) => s.watched);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    getShow(id)
      .then((s) => {
        if (!alive) return;
        setShow(s);
        setTab(s.episodes.sub.length > 0 ? "sub" : s.episodes.dub.length > 0 ? "dub" : "sub");
        getRelatedShows(id).then((r) => alive && setRelated(r)).catch(() => undefined);
        if (s.genres[0]) {
          getRecommendations(s.genres[0], id)
            .then((r) => alive && setSimilar(r))
            .catch(() => undefined);
        }
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  const episodeList = useMemo(() => {
    if (!show) return [];
    return [...show.episodes[tab]]
      .map(Number)
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
  }, [show, tab]);

  const watchedSet = useMemo(
    () => new Set(watchedMap[`${id}:${tab}`] ?? []),
    [watchedMap, id, tab]
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

  const visibleEpisodes = useMemo(() => {
    const r = ranges[epRange];
    if (!r) return episodeList;
    return episodeList.filter((n) => n >= r.from && n <= r.to);
  }, [episodeList, ranges, epRange]);

  useEffect(() => setEpRange(0), [tab]);

  const progress = useMemo(
    () => (show ? getWatchProgress().find((p) => p.id === show._id) : undefined),
    [show]
  );

  /** Synopsis as plain text — cached responses may still hold raw HTML. */
  const description = useMemo(() => stripHtml(show?.description), [show]);

  const startWatching = useCallback(
    (ep: number, lang: StreamLang) => {
      navigate(`/watch/${show?._id}/${ep}?lang=${lang}`);
    },
    [navigate, show]
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-[1180px] px-4 pt-28 md:px-6">
          <div className="shimmer h-[280px] rounded-[32px]" />
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="shimmer h-64 rounded-[24px]" />
            <div className="shimmer h-64 rounded-[24px]" />
          </div>
        </div>
      </>
    );
  }

  if (error || !show) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="card-light rounded-[24px] p-10 text-center">
            <p className="text-[17px] font-semibold text-[var(--ink)]">
              Couldn't load this title
            </p>
            <p className="mt-1.5 text-[13px] text-[var(--ink-soft)]">
              The catalog may be rate-limiting. Try again in a moment.
            </p>
            <div className="mt-5 flex justify-center">
              <BlackPill onClick={() => window.location.reload()}>Retry</BlackPill>
            </div>
          </div>
        </div>
      </>
    );
  }

  const epLabel = `${show.episodeCount ?? episodeList.length ?? 0} episodes`;
  const genres = show.genres.slice(0, 4);

  return (
    <>
      <Navbar />

      <main className="page-content-compact mx-auto w-full max-w-[1180px] px-4 md:px-6">
        <button
          onClick={() => navigate(-1)}
          className="glass press mb-4 ml-1 inline-flex h-9 items-center gap-1.5 rounded-full pl-3 pr-4 text-[12.5px] font-medium text-white/80 transition hover:bg-white/20 hover:text-white"
        >
          <AiOutlineLeft size={14} />
          Back
        </button>

        {/* ── hero ─────────────────────────────────────────── */}
        <section className="card-light rise overflow-hidden rounded-[26px] p-5 md:p-7">
          <div className="flex flex-col gap-6 md:flex-row">
            {show.thumbnail && (
              <div className="relative w-full shrink-0 md:w-[232px]">
                <img
                  src={show.thumbnail}
                  alt={show.name}
                  className="h-[210px] w-full rounded-[20px] object-cover shadow-[0_20px_50px_-22px_rgba(10,12,24,0.7)] ring-1 ring-black/10 md:h-[330px]"
                />
                {typeof show.score === "number" && show.score > 0 && (
                  <span className="tnum absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11.5px] font-semibold text-white backdrop-blur-md">
                    <BsStarFill size={9} className="text-amber-300" />
                    {show.score.toFixed(1)}
                  </span>
                )}
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.11em] text-[var(--ink-faint)]">
                {show.type ?? "Series"}
                {show.season?.year ? ` · ${show.season.year}` : ""}
              </p>
              <h1 className="mt-1.5 break-words text-[28px] font-semibold leading-[1.08] tracking-[-0.035em] text-[var(--ink)] md:text-[36px]">
                {show.name}
              </h1>
              {(show.englishName || show.nativeName) && (
                <p className="mt-1.5 truncate text-[13px] text-[var(--ink-soft)]">
                  {[show.englishName, show.nativeName].filter(Boolean).join(" · ")}
                </p>
              )}

              <div className="mt-3.5 flex flex-wrap gap-1.5">
                <span className="chip-dark">{epLabel}</span>
                {show.status && <span className="chip-dark">{show.status}</span>}
                {show.rating && <span className="chip-dark">{show.rating}</span>}
                {genres.map((g) => (
                  <span key={g} className="chip-dark">
                    {g}
                  </span>
                ))}
              </div>

              {description && (
                <p
                  className={`mt-4 whitespace-pre-line break-words text-[13.5px] leading-relaxed text-[var(--ink-soft)] ${
                    showAllSynopsis ? "" : "line-clamp-3"
                  }`}
                >
                  {description}
                </p>
              )}
              {description.length > 260 && (
                <button
                  onClick={() => setShowAllSynopsis((c) => !c)}
                  className="mt-1.5 self-start text-[12.5px] font-semibold text-[var(--accent)] transition hover:underline"
                >
                  {showAllSynopsis ? "Show less" : "Show more"}
                </button>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-2.5 pb-0.5">
                {progress ? (
                  <BlackPill onClick={() => startWatching(progress.ep, progress.lang)}>
                    <BsFillPlayFill size={14} />
                    Resume episode {progress.ep}
                  </BlackPill>
                ) : episodeList.length > 0 ? (
                  <BlackPill onClick={() => startWatching(episodeList[0], tab)}>
                    <BsFillPlayFill size={14} />
                    Watch episode 1
                  </BlackPill>
                ) : null}

                {show.episodes.dub.length > 0 && show.episodes.sub.length > 0 && (
                  <LightSegmented
                    label="Audio"
                    segments={[
                      { id: "sub" as const, label: "Sub" },
                      { id: "dub" as const, label: "Dub" },
                    ]}
                    value={tab}
                    onChange={(t) => setTab(t)}
                  />
                )}

                {show.trailerId && (
                  <GhostPill onClick={() => document.getElementById("trailer")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                    <BsFillPlayFill size={11} />
                    Trailer
                  </GhostPill>
                )}
                {progress && <SuccessChip>Continue where you left off</SuccessChip>}
              </div>
            </div>
          </div>
        </section>

        {/* ── body ─────────────────────────────────────────── */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-5">
            {/* episodes */}
            <Card
              title="Episodes"
              meta={
                watchedSet.size > 0
                  ? `${watchedSet.size} of ${episodeList.length} watched`
                  : `${episodeList.length} available`
              }
              badge={
                <IconBadge tone="ink">
                  <BsFillPlayFill size={14} />
                </IconBadge>
              }
              action={
                show.episodes.dub.length > 0 && show.episodes.sub.length > 0 ? (
                  <LightSegmented
                    segments={[
                      { id: "sub" as const, label: "Sub" },
                      { id: "dub" as const, label: "Dub" },
                    ]}
                    value={tab}
                    onChange={(t) => setTab(t)}
                  />
                ) : undefined
              }
            >
              {episodeList.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-[var(--ink-soft)]">
                  No episodes found on the streaming servers yet.
                </p>
              ) : (
                <>
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

                  <div className="light-scroll grid max-h-[320px] grid-cols-5 gap-1.5 overflow-y-auto sm:grid-cols-8 md:grid-cols-10">
                    {visibleEpisodes.map((ep) => {
                      const isWatched = watchedSet.has(ep);
                      const isCurrent = progress?.ep === ep;
                      return (
                        <button
                          key={ep}
                          onClick={() => startWatching(ep, tab)}
                          className={`press tnum relative rounded-[12px] py-2.5 text-[12.5px] font-semibold transition ${
                            isCurrent
                              ? "bg-[#16181f] text-white"
                              : isWatched
                                ? "bg-[var(--accent)]/15 text-[var(--accent)] hover:bg-[var(--accent)]/25"
                                : "bg-black/[0.05] text-[var(--ink)] hover:bg-black/10"
                          }`}
                        >
                          {ep}
                          {isWatched && !isCurrent && (
                            <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--accent)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>

            {show.trailerId && (
              <Reveal>
                <TrailerSection trailerId={show.trailerId} title={show.name} />
              </Reveal>
            )}

            <Reveal>
              <CharacterRail characters={show.characters} />
            </Reveal>

            <Reveal>
              <VoiceActorsRail show={show} />
            </Reveal>

            {show.themes.length > 0 && (
              <Reveal>
                <ThemeSongsSection themes={show.themes} />
              </Reveal>
            )}

            <Reveal>
              <ReviewsSection animeId={show._id} title={show.name} />
            </Reveal>
          </div>

          {/* ── right column ───────────────────────────────── */}
          <aside className="min-w-0 space-y-5">
            <Card
              title="Your list"
              meta="Saved on this device"
              badge={
                <IconBadge tone="success">
                  <span className="text-[13px] font-bold">✓</span>
                </IconBadge>
              }
            >
              <TrackingPanel id={show._id} tone="light" />
            </Card>

            <Card
              title="Details"
              badge={
                <IconBadge tone="ink">
                  <span className="text-[13px] font-bold">i</span>
                </IconBadge>
              }
            >
              <InfoRow label="Score" value={show.score ? show.score.toFixed(1) : "—"} />
              <InfoRow label="Format" value={show.type ?? "TV"} />
              <InfoRow label="Episodes" value={epLabel} />
              <InfoRow label="Status" value={show.status ?? "—"} />
              <InfoRow label="Season" value={show.season?.year ?? "—"} />
              <InfoRow
                label="Studios"
                value={show.studios.length ? show.studios[0] : "—"}
              />
              <InfoRow
                label="Sub / Dub"
                value={`${show.episodes.sub.length} / ${show.episodes.dub.length}`}
              />
            </Card>

            {genres.length > 0 && (
              <Card title="Genres">
                <div className="flex flex-wrap gap-1.5">
                  {show.genres.map((g) => (
                    <button
                      key={g}
                      onClick={() => navigate(`/browse?genres=${encodeURIComponent(g)}`)}
                      className="press"
                    >
                      <DarkChip>{g}</DarkChip>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            <Card
              title="Jump to"
              badge={
                <IconBadge tone="warm">
                  <BsFillPlayFill size={13} />
                </IconBadge>
              }
            >
              <div className="space-y-2">
                {episodeList.length > 0 && (
                  <GhostPill
                    className="w-full"
                    onClick={() => startWatching(progress?.ep ?? episodeList[0], tab)}
                  >
                    {progress ? `Episode ${progress.ep}` : "Episode 1"}
                  </GhostPill>
                )}
                <GhostPill className="w-full" onClick={() => navigate("/history")}>
                  Watch history
                </GhostPill>
                <GhostPill className="w-full" onClick={() => navigate("/mylist")}>
                  My list
                </GhostPill>
              </div>
            </Card>
          </aside>
        </div>

        {/* ── rails ────────────────────────────────────────── */}
        {related.length > 0 && (
          <div className="mt-14">
            <Reveal>
              <RelatedRail related={related} />
            </Reveal>
          </div>
        )}

        {similar.length > 0 && (
          <div className="mt-14">
            <Reveal>
              <div>
                <SectionHeader title="You may also like" />
                <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                  {similar.map((s) => (
                    <div key={s._id} className="w-36 shrink-0 md:w-44">
                      <AnimeCard show={s} />
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
