import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BsStarFill } from "react-icons/bs";
import AnimeCard from "@/components/AnimeCard";
import Navbar from "@/components/Navbar";
import AZIndex from "@/components/AZIndex";
import Img from "@/components/Img";
import {
  GENRES,
  SORTS,
  STUDIOS,
  TYPES,
  searchShows,
  type ShowSummary,
} from "@/server/allanime";
import { BsSearch } from "react-icons/bs";

const LIMIT = 24;
const YEARS = Array.from({ length: 2026 - 1980 + 1 }, (_, i) => 2026 - i);

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [results, setResults] = useState<ShowSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [qInput, setQInput] = useState(params.get("q") ?? "");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [az, setAz] = useState("");

  const q = params.get("q") ?? "";
  const types = params.get("types") ?? "";
  const genres = params.get("genres") ?? "";
  const season = params.get("season") ?? "";
  const year = params.get("year") ?? "";
  const studio = params.get("studio") ?? "";
  const sort = params.get("sort") ?? "Popular";
  const page = Math.max(1, Number(params.get("page") ?? "1"));
  const [minEps, setMinEps] = useState(0);
  const [status, setStatus] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const patch = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(params);
      for (const [k, v] of Object.entries(updates)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      if (!("page" in updates)) next.delete("page");
      setParams(next, { replace: false });
    },
    [params, setParams]
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (qInput !== q) patch({ q: qInput });
    }, 400);
    return () => window.clearTimeout(t);
  }, [qInput, q, patch]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    searchShows({
      query: q || undefined,
      types: types || undefined,
      genres: genres || undefined,
      season: season ? (season as "Winter" | "Spring" | "Summer" | "Fall") : undefined,
      year: year ? Number(year) : undefined,
      studios: studio || undefined,
      sortBy: sort,
      page,
      limit: LIMIT,
    })
      .then((p) => {
        if (!alive) return;
        setResults(p.shows);
        setTotal(p.total);
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [q, types, genres, season, year, studio, sort, page]);

  const totalPages = useMemo(() => Math.min(100, Math.max(1, Math.ceil(total / LIMIT))), [total]);

  const pageWindow = useMemo(() => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  // A–Z quick filter + episode-count + status over the loaded page
  const filtered = useMemo(() => {
    return results.filter((s) => {
      if (az && !s.name.toUpperCase().startsWith(az)) return false;
      if (minEps > 0 && (s.episodeCount ?? 0) < minEps) return false;
      if (status) {
        const st = (s.status ?? "").toLowerCase();
        if (status === "airing" && !/airing|releasing|currently/i.test(st)) return false;
        if (status === "completed" && !/finish|complete|ended/i.test(st)) return false;
      }
      return true;
    });
  }, [results, az, minEps, status]);

  const toggle = (key: "types" | "genres", value: string, current: string) => {
    const list = current ? current.split(",") : [];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    patch({ [key]: next.join(",") });
  };

  return (
    <>
      <div className="noise-overlay" aria-hidden="true" />
      <Navbar />
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8 px-4 pb-40 pt-24 md:flex-row md:px-8">
        {/* filter sidebar */}
        <aside className="w-full shrink-0 md:w-60 lg:w-64">
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className="mb-4 flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition hover:border-red-600/60 md:hidden"
          >
            <span>
              Filters{" "}
              <span className="font-jp ml-1 text-[10px] tracking-[0.2em] text-zinc-500">絞り込み</span>
            </span>
            <span className="text-red-500">{filtersOpen ? "▲" : "▼"}</span>
          </button>
          <div className={`${filtersOpen ? "block" : "hidden"} space-y-6 md:block`}>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Search
            </label>
            <div className="flex items-center gap-2 rounded-md bg-zinc-800 px-3 py-2 ring-1 ring-zinc-700 focus-within:ring-red-600">
              <BsSearch size={13} className="text-zinc-500" />
              <input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Search anime…"
                className="w-full bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Type</p>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map((t) => {
                const active = types.split(",").includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggle("types", t, types)}
                    className={`rounded px-2 py-1 text-xs font-medium transition ${
                      active
                        ? "bg-red-600 text-white"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Genres</p>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((g) => {
                const active = genres.split(",").includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggle("genres", g, genres)}
                    className={`rounded px-2 py-1 text-[11px] font-medium transition ${
                      active
                        ? "bg-red-600 text-white"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Season
              </label>
              <select
                value={season}
                onChange={(e) => patch({ season: e.target.value })}
                className="w-full rounded-md bg-zinc-800 px-2 py-2 text-sm text-white ring-1 ring-zinc-700 outline-none focus:ring-red-600"
              >
                <option value="">Any</option>
                <option value="Winter">Winter</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
                <option value="Fall">Fall</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => patch({ year: e.target.value })}
                className="w-full rounded-md bg-zinc-800 px-2 py-2 text-sm text-white ring-1 ring-zinc-700 outline-none focus:ring-red-600"
              >
                <option value="">Any</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Studio
            </label>
            <select
              value={studio}
              onChange={(e) => patch({ studio: e.target.value })}
              className="w-full rounded-md bg-zinc-800 px-2 py-2 text-sm text-white ring-1 ring-zinc-700 outline-none focus:ring-red-600"
            >
              <option value="">Any studio</option>
              {STUDIOS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Status
            </label>
            <div className="flex overflow-hidden rounded-md ring-1 ring-zinc-700">
              {[
                { id: "", label: "Any" },
                { id: "airing", label: "Airing" },
                { id: "completed", label: "Done" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStatus(s.id)}
                  className={`flex-1 px-2 py-1.5 text-xs font-bold transition ${
                    status === s.id ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
              <span>Min Episodes</span>
              <span className="tabular-nums text-red-500">{minEps === 0 ? "Any" : `${minEps}+`}</span>
            </label>
            <input
              type="range"
              min={0}
              max={200}
              step={10}
              value={minEps}
              onChange={(e) => setMinEps(Number(e.target.value))}
              className="vol-slider w-full"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Sort By
            </label>
            <select
              value={sort}
              onChange={(e) => patch({ sort: e.target.value })}
              className="w-full rounded-md bg-zinc-800 px-2 py-2 text-sm text-white ring-1 ring-zinc-700 outline-none focus:ring-red-600"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {(q || types || genres || season || year || studio || minEps > 0 || status || sort !== "Popular") && (
            <button
              onClick={() => {
                setMinEps(0);
                setStatus("");
                setAz("");
                setParams(new URLSearchParams(), { replace: false });
              }}
              className="w-full rounded-md bg-zinc-800 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-red-600 hover:text-white"
            >
              Clear all filters
            </button>
          )}
          </div>
        </aside>

        {/* results */}
        <div className="min-w-0 flex-1">
          <div className="mb-4">
            <AZIndex active={az} onSelect={setAz} />
          </div>
          <div className="mb-4 flex items-center gap-3">
            <h1 className="text-xl font-bold text-white md:text-2xl">
              {q ? `Results for “${q}”` : "Browse Anime"}
            </h1>
            {!loading && (
              <span className="text-sm text-zinc-500">{total.toLocaleString()} titles</span>
            )}
            <div className="ml-auto flex overflow-hidden rounded-md ring-1 ring-zinc-700">
              <button
                onClick={() => setView("grid")}
                aria-label="Grid view"
                className={`px-3 py-1.5 text-xs font-bold transition ${
                  view === "grid" ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setView("list")}
                aria-label="List view"
                className={`px-3 py-1.5 text-xs font-bold transition ${
                  view === "list" ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"
                }`}
              >
                List
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {Array.from({ length: 18 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] animate-pulse rounded-lg bg-zinc-800"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-10 text-center">
              <p className="text-zinc-300">Couldn't reach the anime server.</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-400">
              No titles match these filters.
            </div>
          ) : (
            <>
              {filtered.length === 0 && az ? (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-400">
                  No titles starting with “{az}” on this page.
                </div>
              ) : view === "grid" ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {filtered.map((s) => (
                    <AnimeCard key={s._id} show={s} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((s) => (
                    <Link
                      key={s._id}
                      to={`/anime/${s._id}`}
                      className="group flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 transition hover:-translate-y-0.5 hover:border-red-600/60 hover:bg-zinc-900"
                    >
                      <Img
                        src={s.thumbnail}
                        alt={s.name}
                        className="h-32 w-24 shrink-0 rounded-lg ring-1 ring-zinc-800"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold text-white group-hover:text-red-500">
                          {s.name}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                          <span className="rounded-sm bg-red-600/90 px-1.5 py-px font-bold text-white">
                            {s.type ?? "TV"}
                          </span>
                          {typeof s.score === "number" && s.score > 0 && (
                            <span className="flex items-center gap-0.5 text-yellow-400">
                              <BsStarFill size={9} />
                              {s.score.toFixed(1)}
                            </span>
                          )}
                          {s.episodeCount ? <span>{s.episodeCount} episodes</span> : null}
                          {s.status ? <span>{s.status}</span> : null}
                        </p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-red-500/80">
                          {s.rating ?? ""}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
                  <button
                    disabled={page === 1}
                    onClick={() => patch({ page: String(page - 1) })}
                    className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-40"
                  >
                    ‹ Prev
                  </button>
                  {pageWindow.map((p) => (
                    <button
                      key={p}
                      onClick={() => patch({ page: String(p) })}
                      className={`h-9 w-9 rounded-md text-sm font-semibold transition ${
                        p === page
                          ? "bg-red-600 text-white"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={page === totalPages}
                    onClick={() => patch({ page: String(page + 1) })}
                    className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-40"
                  >
                    Next ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
