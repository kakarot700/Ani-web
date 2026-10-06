import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AnimeCard from "@/components/AnimeCard";
import Img from "@/components/Img";
import InfoModal from "@/components/InfoModal";
import MovieList from "@/components/MovieList";
import Navbar from "@/components/Navbar";
import Reveal from "@/components/Reveal";
import Row from "@/components/Row";
import {
  GENRES,
  getShow,
  searchShows,
  type SearchParams,
  type ShowDetail,
  type ShowSummary,
} from "@/server/allanime";
import { getWatchProgress } from "@/server/stream";
import { useFavorites, useMoviesList } from "@/hooks/useMovies";
import useCurrentUser from "@/hooks/useCurrentUser";
import useInfoModal from "@/hooks/useInfoModal";
import useConnectivity from "@/lib/connectivity";
import SpotlightCarousel from "@/components/SpotlightCarousel";
import TickerMarquee from "@/components/TickerMarquee";
import FilmStrip from "@/components/FilmStrip";
import Top10 from "@/components/Top10";
import GenreMosaic from "@/components/GenreMosaic";
import ScheduleStrip from "@/components/ScheduleStrip";
import SectionHeader from "@/components/SectionHeader";
import Footer from "@/components/Footer";
import { BsFillPlayFill } from "react-icons/bs";

function useRail(params: SearchParams, limit = 18) {
  const key = JSON.stringify({ ...params, limit });
  const [shows, setShows] = useState<ShowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    searchShows({ ...params, limit })
      .then((p) => alive && setShows(p.shows))
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { shows, loading, error };
}

const RailSkeleton = () => (
  <div className="flex gap-3 overflow-hidden">
    {Array.from({ length: 7 }).map((_, i) => (
      <div
        key={i}
        className="shimmer aspect-[2/3] w-36 shrink-0 rounded-lg md:w-44"
        style={{ animationDelay: `${i * 90}ms` }}
      />
    ))}
  </div>
);

// Personalized rail — same genre as the last thing you watched
function BecauseYouWatched() {
  const [items, setItems] = useState<ShowSummary[] | null>(null);
  const [sourceTitle, setSourceTitle] = useState("");

  useEffect(() => {
    let alive = true;
    const cw = getWatchProgress();
    const last = cw[0];
    if (!last) {
      setItems(null);
      return;
    }
    getShow(last.id)
      .then((d) => {
        const genre = d.genres[0];
        if (!genre) {
          if (alive) setItems(null);
          return;
        }
        setSourceTitle(`${d.name} · ${genre}`);
        return searchShows({ genres: genre, types: "TV", sortBy: "Popular", limit: 18 }).then(
          (p) =>
            alive &&
            setItems(p.shows.filter((s) => s._id !== last.id && s.thumbnail))
        );
      })
      .catch(() => alive && setItems(null));
    return () => {
      alive = false;
    };
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section className="px-4 md:px-12">
      <div className="mb-3 flex items-end justify-between">
        <div className="flex items-end gap-3">
          <span className="mb-1 h-7 w-1 rounded-full bg-yellow-400 md:mb-1.5 md:h-8" />
          <div>
            <h2 className="font-display text-2xl leading-none tracking-wide text-white md:text-4xl">
              Because You Watched
            </h2>
            <p className="mt-1 text-[10px] tracking-[0.25em] text-zinc-500">
              <span className="text-yellow-400/90">{sourceTitle}</span>
            </p>
          </div>
        </div>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {items.map((s) => (
          <div key={s._id} className="w-36 shrink-0 md:w-44">
            <AnimeCard show={s} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Rail({
  title,
  jp,
  to,
  params,
  limit,
}: {
  title: string;
  jp: string;
  to?: string;
  params: SearchParams;
  limit?: number;
}) {
  const { shows, loading, error } = useRail(params, limit);
  if (error && shows.length === 0) return null;
  return (
    <Reveal>
      <Row title={title} jp={jp} to={to}>
        {loading && shows.length === 0 ? (
          <RailSkeleton />
        ) : (
          shows
            .filter((s) => s.thumbnail)
            .slice(0, limit ?? 18)
            .map((s) => (
              <div key={s._id} className="w-36 shrink-0 md:w-44">
                <AnimeCard show={s} />
              </div>
            ))
        )}
      </Row>
    </Reveal>
  );
}

// Latest Episodes with SUB/DUB release tags (hianime-style)
function LatestEpisodesRail() {
  const [items, setItems] = useState<
    { show: ShowSummary; sub: number; dub: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    searchShows({ sortBy: "Latest_Update", types: "TV", limit: 10 })
      .then((page) =>
        Promise.all(
          page.shows.slice(0, 10).map((s) =>
            getShow(s._id)
              .then((d) => ({
                show: s,
                sub: d.episodes.sub.length,
                dub: d.episodes.dub.length,
              }))
              .catch(() => null)
          )
        )
      )
      .then((list) =>
        alive && setItems((list.filter(Boolean) as { show: ShowSummary; sub: number; dub: number }[]))
      )
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="px-4 md:px-12">
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-64 w-44 shrink-0 animate-pulse rounded-lg bg-zinc-800" />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="px-4 md:px-12">
      <SectionHeader title="Latest Episodes" jp="最新話" to="/browse?sort=Latest_Update" />
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {items.map(({ show, sub, dub }) => {
          const latest = Math.max(sub, dub);
          return (
            <Link
              key={show._id}
              to={`/anime/${show._id}`}
              className="group relative w-44 shrink-0 overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-zinc-800 transition hover:-translate-y-1 hover:ring-red-600/70"
            >
              <div className="aspect-[2/3] overflow-hidden">
                <Img
                  src={show.thumbnail}
                  alt={show.name}
                  className="absolute inset-0"
                  imgClassName="transition duration-500 group-hover:scale-110"
                />
              </div>
              {latest > 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow">
                  EP {latest}
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent p-2.5 pt-10">
                <p className="line-clamp-1 text-[11px] font-bold text-white group-hover:text-red-500">
                  {show.name}
                </p>
                <div className="mt-1 flex gap-1">
                  {sub > 0 && (
                    <span className="rounded-sm bg-emerald-500/90 px-1.5 py-px text-[8px] font-extrabold uppercase text-white">
                      SUB
                    </span>
                  )}
                  {dub > 0 && (
                    <span className="rounded-sm bg-sky-500/90 px-1.5 py-px text-[8px] font-extrabold uppercase text-white">
                      DUB
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function Home() {
  const { data: movies = [] } = useMoviesList();
  const { data: favorites = [] } = useFavorites();
  const { isOpen, closeModal } = useInfoModal();
  const [slides, setSlides] = useState<ShowDetail[]>([]);
  const [spotlightLoading, setSpotlightLoading] = useState(true);
  const [catalogOk, setCatalogOk] = useState<boolean | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [continueWatching] = useState(getWatchProgress);
  const offline = useConnectivity((s) => s.offline);
  const servedFromCache = useConnectivity((s) => s.servedFromCache);
  const offlineRibbon = offline && servedFromCache;

  // hianime-style spotlight: resolve the top trending titles into full slides
  useEffect(() => {
    let alive = true;
    setSpotlightLoading(true);
    searchShows({ sortBy: "Trending", dateRangeStart: 1, limit: 6 })
      .then((page) =>
        Promise.all(
          page.shows.slice(0, 6).map((s) => getShow(s._id).catch(() => null))
        )
      )
      .then((details) => {
        if (!alive) return;
        const ok = details.filter(Boolean) as ShowDetail[];
        setSlides(ok);
        setCatalogOk(ok.length > 0);
      })
      .catch(() => {
        if (!alive) return;
        setSlides([]);
        setCatalogOk(false);
      })
      .finally(() => alive && setSpotlightLoading(false));
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  // favorites saved from the full catalog (ids prefixed "al:")
  const { data: user } = useCurrentUser();
  const favIdsKey = (user?.favoriteIds ?? [])
    .filter((f) => f.startsWith("al:"))
    .map((f) => f.slice(3))
    .join(",");
  const [myList, setMyList] = useState<ShowSummary[]>([]);

  useEffect(() => {
    if (!favIdsKey) {
      setMyList([]);
      return;
    }
    let alive = true;
    Promise.all(
      favIdsKey.split(",").map((id) =>
        getShow(id)
          .then((s): ShowSummary => ({
            _id: s._id,
            name: s.name,
            malId: s.malId,
            aniListId: s.aniListId,
            episodeCount: s.episodeCount,
            thumbnail: s.thumbnail,
            score: s.score,
            type: s.type,
            rating: s.rating,
            status: s.status,
          }))
          .catch(() => null)
      )
    ).then((list) => alive && setMyList(list.filter(Boolean) as ShowSummary[]));
    return () => {
      alive = false;
    };
  }, [favIdsKey]);

  return (
    <>
      <div className="noise-overlay" aria-hidden="true" />
      <div className="projector-light" aria-hidden="true" />
      <InfoModal visable={isOpen} onClose={closeModal} />
      <Navbar />
      <TickerMarquee />
      <SpotlightCarousel slides={slides} loading={spotlightLoading} />

      {catalogOk !== false && offlineRibbon && (
        <div className="px-4 pt-5 md:px-12">
          <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2.5">
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-yellow-400" />
            <p className="text-xs font-semibold text-yellow-200/90">
              The anime server is unreachable right now — showing your cached library. Retry from
              the footer status pill.
            </p>
          </div>
        </div>
      )}

      {catalogOk === false && (
        <div className="px-4 pt-6 md:px-12">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-xl border border-red-600/40 bg-red-600/10 px-6 py-8 text-center">
            <p className="font-jp text-xs tracking-[0.4em] text-red-500">接続エラー</p>
            <p className="font-display text-3xl tracking-wide text-white">
              Can't reach the anime server
            </p>
            <p className="max-w-md text-sm leading-relaxed text-zinc-400">
              The catalog API didn't respond. It may be rate-limiting or briefly down. Your saved
              list, history and the classic clips below still work — retry in a moment.
            </p>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="rounded-md bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-red-500"
            >
              Retry now
            </button>
          </div>
        </div>
      )}

      {/* genre quick strip */}
      <div className="no-scrollbar -mt-1 flex gap-2 overflow-x-auto px-4 py-2 md:px-12">
        {GENRES.slice(0, 16).map((g) => (
          <Link
            key={g}
            to={`/browse?genres=${encodeURIComponent(g)}`}
            className="shrink-0 rounded-full border border-zinc-700 bg-zinc-900/80 px-3.5 py-1.5 text-[11px] font-semibold text-zinc-300 transition hover:-translate-y-0.5 hover:border-red-600 hover:text-white"
          >
            {g}
          </Link>
        ))}
      </div>

      <div className="pt-2">
        <FilmStrip label="今期のラインナップ" />
      </div>

      <div className="relative z-10 space-y-8 pb-40 pt-4">
        {continueWatching.length > 0 && (
          <Row title="Continue Watching" jp="視聴を続ける">
            {continueWatching.map((p) => (
              <Link
                key={p.id}
                to={`/watch/${p.id}/${p.ep}?lang=${p.lang}`}
                className="group relative aspect-[2/3] w-36 shrink-0 overflow-hidden rounded-lg bg-zinc-800 md:w-44"
              >
                <Img
                  src={p.poster}
                  alt={p.title}
                  className="absolute inset-0 opacity-80"
                  imgClassName="transition group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 transition group-hover:bg-black/20" />
                <div className="absolute inset-x-0 bottom-0 p-2.5">
                  <p className="line-clamp-2 text-[11px] font-semibold text-white">{p.title}</p>
                  <p className="mt-1 text-[10px] text-zinc-300">
                    Episode {p.ep} · {p.lang.toUpperCase()}
                  </p>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded bg-white/30">
                    <div className="h-full w-1/3 bg-red-600" />
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                    <BsFillPlayFill size={20} />
                  </span>
                </div>
              </Link>
            ))}
          </Row>
        )}

        {myList.length > 0 && (
          <Reveal>
            <Row title="My List" jp="マイリスト">
              {myList.map((s) => (
                <div key={s._id} className="w-36 shrink-0 md:w-44">
                  <AnimeCard show={s} />
                </div>
              ))}
            </Row>
          </Reveal>
        )}

        <Reveal>
          <BecauseYouWatched />
        </Reveal>

        <Rail
          title="Trending Now"
          jp="トレンド"
          to="/browse?sort=Trending"
          params={{ sortBy: "Trending", dateRangeStart: 1 }}
        />
        <Rail title="Recently Updated" jp="最近更新" params={{ sortBy: "Latest_Update" }} />

        <Reveal>
          <LatestEpisodesRail />
        </Reveal>

        <Reveal>
          <ScheduleStrip />
        </Reveal>

        <Rail
          title="This Season · Summer 2026"
          jp="今期アニメ"
          params={{ season: "Summer", year: 2026, sortBy: "Popular" }}
        />

        <Reveal>
          <Top10 />
        </Reveal>

        <Rail
          title="Up Next · Fall 2026"
          jp="来期アニメ"
          params={{ season: "Fall", year: 2026, sortBy: "Popular" }}
        />

        <Rail title="New Releases" jp="新着" to="/browse?sort=Recent" params={{ sortBy: "Recent" }} />
        <Rail title="Most Popular" jp="人気作品" to="/browse" params={{ sortBy: "Popular" }} />
        <Rail
          title="Top Movies"
          jp="映画"
          to="/browse?types=Movie"
          params={{ types: "Movie", sortBy: "Popular" }}
        />
        <Rail
          title="Top TV Series"
          jp="テレビアニメ"
          to="/browse?types=TV"
          params={{ types: "TV", sortBy: "Top" }}
        />

        <Reveal>
          <GenreMosaic />
        </Reveal>

        <Reveal>
          <MovieList title="Otaku Classic Clips" jp="名場面クリップ" data={movies} />
        </Reveal>
        <Reveal>
          <MovieList title="Favorites" jp="お気に入り" data={favorites} />
        </Reveal>
      </div>
      <Footer />
    </>
  );
}
