import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import AnimeCard from "@/components/AnimeCard";
import PageShell from "@/components/PageShell";
import { Card, PosterSkeleton, Segmented } from "@/components/ui";
import { searchShows, type ShowSummary } from "@/server/allanime";

const SEASONS = ["Winter", "Spring", "Summer", "Fall"] as const;
type Season = (typeof SEASONS)[number];

const YEARS = Array.from({ length: 2026 - 2015 + 1 }, (_, i) => 2026 - i);
const LIMIT = 24;

const currentSeason = (): Season => {
  const m = new Date().getMonth();
  if (m <= 2) return "Winter";
  if (m <= 5) return "Spring";
  if (m <= 8) return "Summer";
  return "Fall";
};

export default function SeasonsPage() {
  const [params, setParams] = useSearchParams();
  const [season, setSeason] = useState<Season>(
    (params.get("season") as Season) || currentSeason()
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

  const pick = (s: Season, y: number) => {
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
    <PageShell
      eyebrow="Seasonal archive"
      title={
        <>
          {season} <span className="text-white/45">{year}</span>
        </>
      }
      subtitle={loading ? "Loading the season…" : `${total.toLocaleString()} titles in this season`}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftSeason(-1)}
            aria-label="Previous season"
            className="glass press flex h-10 w-10 items-center justify-center rounded-full text-white/85 transition hover:bg-white/20 hover:text-white"
          >
            <BsChevronLeft size={14} />
          </button>
          <button
            onClick={() => shiftSeason(1)}
            aria-label="Next season"
            className="glass press flex h-10 w-10 items-center justify-center rounded-full text-white/85 transition hover:bg-white/20 hover:text-white"
          >
            <BsChevronRight size={14} />
          </button>
        </div>
      }
    >
      <div className="mb-6 space-y-3">
        <Segmented
          segments={SEASONS.map((s) => ({ id: s, label: s }))}
          value={season}
          onChange={(s) => pick(s, year)}
        />

        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {YEARS.map((y) => (
            <button
              key={y}
              onClick={() => pick(season, y)}
              className={`press tnum shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition ${
                y === year
                  ? "bg-white text-[var(--ink)]"
                  : "glass text-white/70 hover:bg-white/20 hover:text-white"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <PosterSkeleton key={i} />
          ))}
        </div>
      ) : shows.length === 0 ? (
        <Card>
          <p className="py-12 text-center text-[14px] font-semibold text-[var(--ink)]">
            Nothing catalogued for {season} {year}
          </p>
          <p className="mt-1 text-center text-[13px] text-[var(--ink-soft)]">
            Try a different season or year.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {shows.map((s) => (
            <AnimeCard key={s._id} show={s} />
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-1.5">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="glass press flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/20 disabled:opacity-30"
            aria-label="Previous page"
          >
            <BsChevronLeft size={13} />
          </button>
          {page > 3 && (
            <span className="px-1 text-[13px] text-white/40">…</span>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
            .map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`press tnum flex h-9 w-9 items-center justify-center rounded-full text-[12.5px] font-semibold transition ${
                  p === page
                    ? "bg-white text-[var(--ink)]"
                    : "glass text-white/70 hover:bg-white/20 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="glass press flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/20 disabled:opacity-30"
            aria-label="Next page"
          >
            <BsChevronRight size={13} />
          </button>
        </div>
      )}
    </PageShell>
  );
}
