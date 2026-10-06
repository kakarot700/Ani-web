import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BsFillPlayFill, BsStarFill } from "react-icons/bs";
import { AiOutlineLeft } from "react-icons/ai";
import Navbar from "@/components/Navbar";
import ScrambleText from "@/components/ScrambleText";
import Reveal from "@/components/Reveal";
import AnimeCard from "@/components/AnimeCard";
import CharacterRail from "@/components/CharacterRail";
import RelatedRail from "@/components/RelatedRail";
import TrailerSection from "@/components/TrailerSection";
import VoiceActorsRail from "@/components/VoiceActorsRail";
import ThemeSongsSection from "@/components/ThemeSongsSection";
import ReviewsSection from "@/components/ReviewsSection";
import SectionHeader from "@/components/SectionHeader";
import FavoriteButton from "@/components/FavoriteButton";
import TrackingPanel from "@/components/TrackingPanel";
import useUserList from "@/lib/userlist";
import {
  getRecommendations,
  getRelatedShows,
  getShow,
  type RelatedShow,
  type ShowDetail,
  type ShowSummary,
} from "@/server/allanime";
import { getWatchProgress, type StreamLang } from "@/server/stream";

/** Banner with a gentle scroll-linked parallax. */
const HeroBackdrop = ({ banner }: { banner: string | null }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const p = Math.min(1, Math.max(0, window.scrollY / 500));
        el.style.transform = `translate3d(0, ${p * 18}%, 0) scale(1.08)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="relative overflow-hidden">
      <div ref={ref} className="h-56 w-full will-change-transform md:h-80">
        {banner ? (
          <img src={banner} alt="" className="h-full w-full scale-[1.08] object-cover" />
        ) : (
          <div className="h-full w-full bg-zinc-900" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 to-transparent" />
    </div>
  );
};

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
        // relations + "more like this" load progressively
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
    return [...show.episodes[tab]].map(Number).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  }, [show, tab]);

  const watchedSet = useMemo(
    () => new Set(watchedMap[`${id}:${tab}`] ?? []),
    [watchedMap, id, tab]
  );

  // 100-episode chunks for long-running series (hianime-style range picker)
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

  const visibleEpisodes = useMemo(() => {
    const r = ranges[epRange];
    if (!r) return episodeList;
    return episodeList.filter((n) => n >= r.from && n <= r.to);
  }, [episodeList, ranges, epRange]);

  useEffect(() => {
    setEpRange(0);
  }, [tab]);

  const progress = useMemo(
    () => (show ? getWatchProgress().find((p) => p.id === show._id) : undefined),
    [show]
  );

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
        <div className="mx-auto max-w-6xl px-4 pb-40 pt-28">
          <div className="h-72 animate-pulse rounded-xl bg-zinc-800" />
          <div className="mt-6 h-8 w-2/3 animate-pulse rounded bg-zinc-800" />
          <div className="mt-4 h-40 animate-pulse rounded bg-zinc-800" />
        </div>
      </>
    );
  }

  if (error || !show) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center">
            <p className="text-zinc-300">Couldn't load this title.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  const epLabel = `${show.episodeCount ?? show.episodes[tab].length ?? 0} episodes`;

  return (
    <>
      <div className="noise-overlay" aria-hidden="true" />
      <div className="projector-light" aria-hidden="true" />
      <Navbar />
      {/* hero */}
      <HeroBackdrop banner={show.banner} />

      <div className="mx-auto -mt-24 max-w-6xl px-4 pb-40 md:-mt-36">
        <div className="relative flex flex-col gap-6 md:flex-row">
          <div className="w-40 shrink-0 md:w-56">
            {show.thumbnail ? (
              <img
                src={show.thumbnail}
                alt={show.name}
                className="aspect-[2/3] w-full rounded-lg object-cover shadow-2xl ring-1 ring-zinc-700"
              />
            ) : (
              <div className="aspect-[2/3] w-full rounded-lg bg-zinc-800" />
            )}
          </div>

          <div className="min-w-0 flex-1 pt-2">
            <p className="mb-1 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-500">
              <BsStarFill size={11} className="text-yellow-400" />
              {show.score ? `Score ${show.score.toFixed(1)}` : ""}
              {show.score ? " · " : ""}
              {show.type ?? "TV"}
            </p>
            <h1 className="font-display text-4xl leading-[0.95] tracking-wide text-white md:text-6xl">
              <ScrambleText text={show.name} />
            </h1>
            {(show.englishName || show.nativeName) && (
              <p className="mt-1 text-sm text-zinc-400 md:text-base">
                {[show.englishName, show.nativeName].filter(Boolean).join(" · ")}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              {show.status && (
                <span className="rounded bg-zinc-800 px-2 py-0.5 font-medium text-zinc-300">
                  {show.status}
                </span>
              )}
              {show.rating && (
                <span className="rounded bg-zinc-800 px-2 py-0.5 font-medium text-zinc-300">
                  {show.rating}
                </span>
              )}
              <span className="rounded bg-zinc-800 px-2 py-0.5 font-medium text-zinc-300">
                {epLabel}
              </span>
              {show.season?.year && (
                <span className="rounded bg-zinc-800 px-2 py-0.5 font-medium text-zinc-300">
                  {show.season.year}
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {show.genres.map((g) => (
                <span
                  key={g}
                  className="cursor-pointer rounded-full border border-zinc-600 px-2.5 py-0.5 text-[11px] text-zinc-300 transition hover:border-red-600 hover:text-white"
                >
                  {g}
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {progress ? (
                <button
                  onClick={() => startWatching(progress.ep, progress.lang)}
                  className="flex items-center gap-1.5 rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 md:text-base"
                >
                  <BsFillPlayFill size={20} />
                  Resume Ep {progress.ep}
                </button>
              ) : (
                episodeList.length > 0 && (
                  <button
                    onClick={() => startWatching(episodeList[0], tab)}
                    className="flex items-center gap-1.5 rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 md:text-base"
                  >
                    <BsFillPlayFill size={20} />
                    Watch Now
                  </button>
                )
              )}
              <FavoriteButton movieId={`al:${show._id}`} />
            </div>

            <div className="mt-4">
              <TrackingPanel id={show._id} />
            </div>
          </div>
        </div>

        {/* synopsis */}
        {show.description && (
          <div className="mt-8 max-w-4xl">
            <h2 className="mb-2 text-lg font-semibold text-white">Synopsis</h2>
            <p
              className={`whitespace-pre-line text-sm leading-relaxed text-zinc-300 ${
                showAllSynopsis ? "" : "line-clamp-4"
              }`}
            >
              {show.description}
            </p>
            {show.description.length > 300 && (
              <button
                onClick={() => setShowAllSynopsis((c) => !c)}
                className="mt-2 text-xs font-semibold text-red-500 hover:underline"
              >
                {showAllSynopsis ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {/* episodes */}
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white md:text-xl">Episodes</h2>
            {(show.episodes.dub.length > 0 || show.episodes.sub.length > 0) && (
              <div className="flex overflow-hidden rounded-md ring-1 ring-zinc-700">
                {show.episodes.sub.length > 0 && (
                  <button
                    onClick={() => setTab("sub")}
                    className={`px-4 py-1.5 text-xs font-semibold transition ${
                      tab === "sub" ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    SUB
                  </button>
                )}
                {show.episodes.dub.length > 0 && (
                  <button
                    onClick={() => setTab("dub")}
                    className={`px-4 py-1.5 text-xs font-semibold transition ${
                      tab === "dub" ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    DUB
                  </button>
                )}
              </div>
            )}
          </div>

          {episodeList.length === 0 ? (
            <p className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-400">
              No episodes found on the streaming servers yet.
            </p>
          ) : (
            <>
              {ranges.length > 0 && (
                <div className="no-scrollbar mb-3 flex gap-1.5 overflow-x-auto">
                  {ranges.map((r, i) => (
                    <button
                      key={r.label}
                      onClick={() => setEpRange(i)}
                      className={`shrink-0 rounded-md px-3 py-1.5 text-[11px] font-bold tabular-nums ring-1 transition ${
                        i === epRange
                          ? "bg-red-600 text-white ring-red-600"
                          : "bg-zinc-800 text-zinc-400 ring-zinc-700 hover:text-white"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="thin-scroll max-h-[26rem] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
                  {visibleEpisodes.map((ep) => {
                    const watched = watchedSet.has(ep);
                    return (
                      <button
                        key={ep}
                        onClick={() => startWatching(ep, tab)}
                        className={`relative rounded-md py-2 text-xs font-semibold transition ${
                          progress && progress.ep === ep
                            ? "bg-red-600 text-white"
                            : "bg-zinc-800 text-zinc-300 hover:bg-red-600 hover:text-white"
                        }`}
                      >
                        {ep}
                        {watched && !(progress && progress.ep === ep) && (
                          <span className="absolute bottom-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-red-600/80" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              {watchedSet.size > 0 && (
                <p className="mt-2 text-[11px] text-zinc-500">
                  <span className="font-bold text-red-500">{watchedSet.size}</span> of{" "}
                  {episodeList.length} episodes watched · marked automatically as you stream
                </p>
              )}
            </>
          )}
        </div>

        {/* hianime/9anime-style extended sections */}
        <div className="mt-12 space-y-10">
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

          <Reveal>
            <ThemeSongsSection themes={show.themes} />
          </Reveal>

          <Reveal>
            <RelatedRail related={related} />
          </Reveal>

          <Reveal>
            <ReviewsSection animeId={show._id} title={show.name} />
          </Reveal>

          {similar.length > 0 && (
            <Reveal>
              <div>
                <SectionHeader title="You May Also Like" jp="おすすめ" />
                <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
                  {similar.map((s) => (
                    <div key={s._id} className="w-36 shrink-0 md:w-44">
                      <AnimeCard show={s} />
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </div>

        <button
          onClick={() => navigate(-1)}
          className="mt-10 flex items-center gap-1 text-sm text-zinc-400 transition hover:text-white"
        >
          <AiOutlineLeft size={16} />
          Go back
        </button>
      </div>
    </>
  );
}
