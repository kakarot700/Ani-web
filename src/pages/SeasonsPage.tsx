import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import AnimeCard from "@/components/AnimeCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { searchShows, type ShowSummary } from "@/server/allanime";

const SEASONS = ["Winter", "Spring", "Summer", "Fall"] as const;
const SEASON_JP: Record<string, string> = {
  Winter: "冬",
  Spring: "春",
  Summer: "夏",
  Fall: "秋",
};
const YEARS = Array.from({ length: 2026 - 2015 + 1 }, (_, i) => 2026 - i);
const LIMIT = 24;

const currentSeason = (): (typeof SEASONS)[number] => {
  const m = new Date().getMonth(); // 0-11
  if (m <= 2) return "Winter";
  if (m <= 5) return "Spring";
  if (m <= 8) return "Summer";
  return "Fall";
};

export default function SeasonsPage() {
  const [params, setParams] = useSearchParams();
  const [season, setSeason] = useState<(typeof SEASONS)[number]>(
    (params.get("season") as (typeof SEASONS)[number]) || currentSeason()
  );
  const [year, setYear] = useState<number>(Number(params.get("year")) || 2026);
  const [page, setPage] = useState(1);
  const [shows, setShows] = useState<ShowSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    searchShows({ season, year, sortBy: "Popular", page, limit: LIMIT })
      .then((p) => {
        if (!alive) return;
        setShows(p.shows);
        setTotal(p.total);
      })
      .catch(() => alive && setShows([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [season, year, page]);

  const totalPages = useMemo(
    () => Math.min(20, Math.max(1, Math.ceil(total / LIMIT))),
    [total]
  );

  const pick = (s: (typeof SEASONS)[number], y: number) => {
    setSeason(s);
    setYear(y);
    setPage(1);
    setParams({ season: s, year: String(y) }, { replace: true });
  };

  const shiftSeason = (dir: number) => {
    const idx = SEASONS.indexOf(season);
    let ni = idx + dir;
    let ny = year;
    if (ni < 0) {
      ni = SEASONS.length - 1;
      ny -= 1;
    }
    if (ni >= SEASONS.length) {
      ni = 0;
      ny += 1;
    }
    if (ny < 2015 || ny > 2027) return;
    pick(SEASONS[ni], ny);
  };

  return (
    <>
      <div className="noise-overlay" aria-hidden="true" />
      <Navbar />
      <div className="mx-auto max-w-[1500px] px-4 pb-24 pt-28 md:px-12">
        {/* header */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-red-500">
              Seasonal Archive · <span className="font-jp">シーズン別</span>
            </p>
            <h1 className="font-display mt-2 text-6xl leading-none tracking-wide text-white md:text-8xl">
              {season} <span className="text-red-600">{year}</span>
            </h1>
            <p className="font-jp mt-2 text-sm tracking-[0.4em] text-zinc-500">
              {year}年{SEASON_JP[season]}アニメ
            </p>
          </div>

          {/* season navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => shiftSeason(-1)}
              aria-label="Previous season"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-zinc-300 ring-1 ring-zinc-700 transition hover:bg-red-600 hover:text-white"
            >
              <BsChevronLeft size={16} />
            </button>
            <div className="grid grid-cols-4 gap-1.5">
              {SEASONS.map((s) => (
                <button
                  key={s}
                  onClick={() => pick(s, year)}
                  className={`rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider ring-1 transition ${
                    s === season
                      ? "bg-red-600 text-white ring-red-600 shadow-[0_0_20px_rgba(220,38,38,0.35)]"
                      : "bg-zinc-900 text-zinc-400 ring-zinc-800 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => shiftSeason(1)}
              aria-label="Next season"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-zinc-300 ring-1 ring-zinc-700 transition hover:bg-red-600 hover:text-white"
            >
              <BsChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* year strip */}
        <div className="no-scrollbar mt-8 flex gap-1.5 overflow-x-auto pb-1">
          {YEARS.map((y) => (
            <button
              key={y}
              onClick={() => pick(season, y)}
              className={`shrink-0 rounded-md px-3.5 py-1.5 font-mono text-xs font-bold tabular-nums ring-1 transition ${
                y === year
                  ? "bg-zinc-100 text-zinc-950 ring-zinc-100"
                  : "bg-zinc-900 text-zinc-500 ring-zinc-800 hover:text-white"
              }`}
            >
              {y}
            </button>
          ))}
        </div>

        {/* grid */}
        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-zinc-900" />
              ))}
            </div>
          ) : shows.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-14 text-center">
              <p className="font-display text-3xl tracking-wide text-zinc-300">
                Nothing catalogued for {season} {year}
              </p>
              <p className="mt-2 text-sm text-zinc-500">Try a different season or year.</p>
            </div>
          ) : (
            <Reveal>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {shows.map((s) => (
                  <AnimeCard key={s._id} show={s} />
                ))}
              </div>
            </Reveal>
          )}
        </div>

        {/* pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-1.5">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 ring-1 ring-zinc-800 transition hover:bg-zinc-800 disabled:opacity-40"
            >
              ‹ Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
              .map((p, i, arr) => (
                <span key={p} className="flex items-center gap-1.5">
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="text-zinc-600">…</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`h-9 w-9 rounded-md text-sm font-bold transition ${
                      p === page
                        ? "bg-red-600 text-white"
                        : "bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 ring-1 ring-zinc-800 transition hover:bg-zinc-800 disabled:opacity-40"
            >
              Next ›
            </button>
          </div>
        )}

        {!loading && shows.length > 0 && (
          <p className="mt-6 text-center text-xs text-zinc-600">
            {total.toLocaleString()} titles in {season} {year} · page {page} of {totalPages}
          </p>
        )}
      </div>
      <Footer />
    </>
  );
}
