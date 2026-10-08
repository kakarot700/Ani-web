import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BsChevronLeft, BsChevronRight, BsSliders, BsX } from "react-icons/bs";
import AnimeCard from "@/components/AnimeCard";
import PageShell from "@/components/PageShell";
import { Card, Composer, GhostPill, PosterSkeleton, Segmented } from "@/components/ui";
import {
  GENRES,
  SORTS,
  STUDIOS,
  TYPES,
  searchShows,
  type ShowSummary,
} from "@/server/allanime";

const LIMIT = 24;
const YEARS = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => 2026 - i);

/** a pill that can be toggled on/off, used in the filter panel */
const FilterPill: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: "glass" | "light";
}> = ({ label, active, onClick, tone = "glass" }) => (
  <button
    onClick={onClick}
    className={`press rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
      tone === "glass"
        ? active
          ? "bg-white text-[var(--ink)]"
          : "glass text-white/75 hover:bg-white/20 hover:text-white"
        : active
          ? "bg-[#16181f] text-white"
          : "bg-black/[0.05] text-[var(--ink-soft)] hover:bg-black/10 hover:text-[var(--ink)]"
    }`}
  >
    {label}
  </button>
);

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [results, setResults] = useState<ShowSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [qInput, setQInput] = useState(params.get("q") ?? "");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = params.get("q") ?? "";
  const types = params.get("types") ?? "";
  const genres = params.get("genres") ?? "";
  const season = params.get("season") ?? "";
  const year = params.get("year") ?? "";
  const studio = params.get("studio") ?? "";
  const sort = params.get("sort") ?? "Popular";
  const page = Math.max(1, Number(params.get("page") ?? "1"));

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

  const totalPages = useMemo(
    () => Math.min(100, Math.max(1, Math.ceil(total / LIMIT))),
    [total]
  );

  const pageWindow = useMemo(() => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  const toggle = (key: "types" | "genres", value: string, current: string) => {
    const list = current ? current.split(",") : [];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    patch({ [key]: next.join(",") });
  };

  const activeCount =
    (types ? types.split(",").length : 0) +
    (genres ? genres.split(",").length : 0) +
    (season ? 1 : 0) +
    (year ? 1 : 0) +
    (studio ? 1 : 0);

  const clearAll = () => {
    setQInput("");
    setParams(new URLSearchParams({ sort }), { replace: false });
  };

  const filterPanel = (
    <>
      <div>
        <p className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-white/50">
          Type
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => (
            <FilterPill
              key={t}
              label={t}
              active={types.split(",").includes(t)}
              onClick={() => toggle("types", t, types)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-white/50">
          Genre
        </p>
        <div className="flex flex-wrap gap-1.5">
          {GENRES.map((g) => (
            <FilterPill
              key={g}
              label={g}
              active={genres.split(",").includes(g)}
              onClick={() => toggle("genres", g, genres)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-white/50">
            Season
          </p>
          <div className="flex flex-wrap gap-1.5">
            {["Winter", "Spring", "Summer", "Fall"].map((s) => (
              <FilterPill
                key={s}
                label={s}
                active={season === s}
                onClick={() => patch({ season: season === s ? "" : s })}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-white/50">
            Year
          </p>
          <div className="no-scrollbar flex max-h-[92px] flex-wrap gap-1.5 overflow-y-auto">
            {YEARS.slice(0, 24).map((y) => (
              <FilterPill
                key={y}
                label={String(y)}
                active={year === String(y)}
                onClick={() => patch({ year: year === String(y) ? "" : String(y) })}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-white/50">
          Studio
        </p>
        <div className="no-scrollbar flex max-h-[92px] flex-wrap gap-1.5 overflow-y-auto">
          {STUDIOS.map((s) => (
            <FilterPill
              key={s}
              label={s}
              active={studio === s}
              onClick={() => patch({ studio: studio === s ? "" : s })}
            />
          ))}
        </div>
      </div>
    </>
  );

  return (
    <PageShell
      eyebrow="Catalog"
      title="Browse"
      subtitle={
        loading
          ? "Searching the catalog…"
          : `${total.toLocaleString()} titles${activeCount ? ` · ${activeCount} filters active` : ""}`
      }
      action={
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <GhostPill onClick={clearAll}>
              <BsX size={12} />
              Clear
            </GhostPill>
          )}
          <Segmented
            segments={[
              { id: "grid" as const, label: "Grid" },
              { id: "list" as const, label: "List" },
            ]}
            value={view}
            onChange={setView}
          />
        </div>
      }
    >
      <Composer
        value={qInput}
        onChange={setQInput}
        onSubmit={() => patch({ q: qInput })}
        placeholder="Search by title, or pick filters below"
        className="mb-5 max-w-2xl"
      />

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* filters */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className="glass mb-3 flex w-full items-center justify-between rounded-[20px] px-4 py-3 text-[13px] font-semibold text-white lg:hidden"
          >
            <span className="flex items-center gap-2">
              <BsSliders size={13} />
              Filters
              {activeCount > 0 && <span className="chip">{activeCount}</span>}
            </span>
            <span className="text-white/60">{filtersOpen ? "▲" : "▼"}</span>
          </button>

          <div
            className={`glass space-y-6 rounded-[24px] p-5 ${
              filtersOpen ? "block" : "hidden lg:block"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold text-white">Filters</p>
              {activeCount > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[11.5px] font-medium text-white/55 transition hover:text-white"
                >
                  Reset
                </button>
              )}
            </div>
            {filterPanel}
          </div>
        </aside>

        {/* results */}
        <div className="min-w-0">
          <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto pb-1">
            {SORTS.map((s) => (
              <FilterPill
                key={s.value}
                label={s.label}
                active={sort === s.value}
                onClick={() => patch({ sort: s.value })}
              />
            ))}
          </div>

          {loading ? (
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
                  : "space-y-3"
              }
            >
              {Array.from({ length: 15 }).map((_, i) => (
                <PosterSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <Card>
              <p className="py-10 text-center text-[13.5px] text-[var(--ink-soft)]">
                The catalog didn't respond. It may be rate-limiting — try again shortly.
              </p>
            </Card>
          ) : results.length === 0 ? (
            <Card>
              <p className="py-10 text-center text-[13.5px] text-[var(--ink-soft)]">
                No titles matched. Try loosening a filter.
              </p>
            </Card>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {results.map((s) => (
                <AnimeCard key={s._id} show={s} />
              ))}
            </div>
          ) : (
            <Card flush>
              <div className="px-2 py-2">
                {results.map((s) => (
                  <Link
                    key={s._id}
                    to={`/anime/${s._id}`}
                    className="flex items-center gap-3.5 rounded-[18px] px-3 py-2.5 transition hover:bg-black/[0.04]"
                  >
                    <img
                      src={s.thumbnail ?? undefined}
                      alt=""
                      className="h-[66px] w-[46px] shrink-0 rounded-[12px] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
                        {s.name}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-[var(--ink-soft)]">
                        {[s.type ?? "TV", s.episodeCount ? `${s.episodeCount} eps` : null, s.status]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    {typeof s.score === "number" && s.score > 0 && (
                      <span className="chip-dark shrink-0">★ {s.score.toFixed(1)}</span>
                    )}
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => patch({ page: String(page - 1) })}
                className="glass press flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/20 disabled:opacity-30"
                aria-label="Previous page"
              >
                <BsChevronLeft size={13} />
              </button>
              {pageWindow.map((p) => (
                <button
                  key={p}
                  onClick={() => patch({ page: String(p) })}
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
                onClick={() => patch({ page: String(page + 1) })}
                className="glass press flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/20 disabled:opacity-30"
                aria-label="Next page"
              >
                <BsChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
