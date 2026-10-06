import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BsGraphUpArrow } from "react-icons/bs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import AchievementsGrid from "@/components/AchievementsGrid";
import CountUp from "@/components/CountUp";
import { getShow, type ShowSummary } from "@/server/allanime";
import useUserList, { STATUS_META, type ListStatus } from "@/lib/userlist";
import { buildContext } from "@/lib/achievements";

const STATUS_COLORS: Record<ListStatus, string> = {
  watching: "#dc2626",
  plan: "#f59e0b",
  completed: "#10b981",
  hold: "#6366f1",
  dropped: "#71717a",
};

interface EnrichedShow extends ShowSummary {
  genres: string[];
}

export default function StatsPage() {
  const entries = useUserList((s) => s.entries);
  const watched = useUserList((s) => s.watched);
  const events = useUserList((s) => s.events);

  const [shows, setShows] = useState<Map<string, EnrichedShow>>(new Map());

  const listedIds = useMemo(
    () => Object.keys(entries).filter((k) => k.startsWith("al:")).map((k) => k.slice(3)),
    [entries]
  );

  useEffect(() => {
    let alive = true;
    if (listedIds.length === 0) return;
    Promise.all(
      listedIds.map((id) =>
        getShow(id)
          .then(
            (s): EnrichedShow => ({
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
              genres: s.genres,
            })
          )
          .catch(() => null)
      )
    ).then((list) => {
      if (!alive) return;
      const map = new Map<string, EnrichedShow>();
      list.forEach((s) => s && map.set(s._id, s));
      setShows(map);
    });
    return () => {
      alive = false;
    };
  }, [listedIds.join(",")]);

  const stats = useMemo(() => {
    const totalWatchedEps = Object.values(watched).reduce((a, l) => a + l.length, 0);
    const statusCount: Record<ListStatus, number> = {
      watching: 0,
      plan: 0,
      completed: 0,
      hold: 0,
      dropped: 0,
    };
    const ratingBuckets = Array.from({ length: 10 }, () => 0);
    let ratingSum = 0;
    let ratedCount = 0;

    const genreCount = new Map<string, number>();
    const topRated: { show: EnrichedShow; rating: number }[] = [];

    for (const id of listedIds) {
      const entry = entries[`al:${id}`];
      if (!entry || !entry.status) continue;
      statusCount[entry.status] += 1;
      if (typeof entry.rating === "number") {
        ratingBuckets[entry.rating - 1] += 1;
        ratingSum += entry.rating;
        ratedCount += 1;
        const show = shows.get(id);
        if (show) topRated.push({ show, rating: entry.rating });
      }
      const show = shows.get(id);
      show?.genres.slice(0, 3).forEach((g) => genreCount.set(g, (genreCount.get(g) ?? 0) + 1));
    }

    const totalTitles = listedIds.filter((id) => entries[`al:${id}`]?.status).length;
    const genres = [...genreCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxGenre = genres.length ? genres[0][1] : 1;
    const avgRating = ratedCount ? ratingSum / ratedCount : null;
    const maxRating = Math.max(1, ...ratingBuckets);
    const top = topRated.sort((a, b) => b.rating - a.rating).slice(0, 6);
    const hours = Math.round((totalWatchedEps * 24) / 60);

    return {
      totalTitles,
      totalWatchedEps,
      hours,
      statusCount,
      genres,
      maxGenre,
      ratingBuckets,
      maxRating,
      avgRating,
      top,
    };
  }, [entries, listedIds, shows, watched]);

  // 7-day watch activity
  const week = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toDateString();
      const count = events.filter((ts) => new Date(ts).toDateString() === key).length;
      days.push({
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        count,
      });
    }
    return days;
  }, [events]);
  const maxWeek = Math.max(1, ...week.map((d) => d.count));

  const achievementsCtx = useMemo(
    () =>
      buildContext({
        totalEpisodes: stats.totalWatchedEps,
        totalTitles: stats.totalTitles,
        completed: stats.statusCount.completed,
        rated: Object.values(entries).filter((e) => e.rating !== null).length,
        events,
      }),
    [stats, entries, events]
  );

  const donutSegments = useMemo(() => {
    const order: ListStatus[] = ["watching", "completed", "plan", "hold", "dropped"];
    const total = Math.max(1, stats.totalTitles);
    let acc = 0;
    return order
      .filter((k) => stats.statusCount[k] > 0)
      .map((k) => {
        const frac = stats.statusCount[k] / total;
        const seg = { key: k, frac, offset: acc };
        acc += frac;
        return seg;
      });
  }, [stats]);

  const isEmpty = stats.totalTitles === 0;

  return (
    <>
      <div className="noise-overlay" aria-hidden="true" />
      <Navbar />
      <div className="mx-auto max-w-[1500px] px-4 pb-24 pt-28 md:px-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-1 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.25em] text-red-500">
              <BsGraphUpArrow size={13} />
              Your Anime Profile
              <span className="font-jp tracking-[0.3em] text-zinc-500">· 統計</span>
            </p>
            <h1 className="font-display text-5xl tracking-wide text-white md:text-7xl">Stats</h1>
          </div>
          <Link
            to="/mylist"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-bold text-zinc-300 ring-1 ring-zinc-700 transition hover:bg-red-600 hover:text-white"
          >
            Open My List →
          </Link>
        </div>

        {isEmpty ? (
          <div className="mt-16 rounded-xl border border-zinc-800 bg-zinc-900/50 p-14 text-center">
            <p className="font-display text-3xl tracking-wide text-zinc-300">No data yet</p>
            <p className="mt-2 text-sm text-zinc-500">
              Add anime to your list and start watching to build your stats.
            </p>
            <Link
              to="/browse"
              className="mt-6 inline-block rounded-md bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-500"
            >
              Browse anime
            </Link>
          </div>
        ) : (
          <>
            {/* headline numbers */}
            <Reveal className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Titles tracked", value: stats.totalTitles, sub: "in your list" },
                { label: "Episodes watched", value: stats.totalWatchedEps, sub: "and counting" },
                { label: "Hours watched", value: `~${stats.hours}`, sub: "≈ 24 min / ep" },
                {
                  label: "Avg rating",
                  value: stats.avgRating ? stats.avgRating.toFixed(1) : "—",
                  sub: "out of 10",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:-translate-y-1 hover:border-red-600/50"
                >
                  <p className="font-display text-5xl tracking-wide text-white">
                    {typeof s.value === "number" ? (
                      <CountUp value={s.value} />
                    ) : (
                      s.value
                    )}
                    {s.label === "Avg rating" && <span className="text-2xl text-red-500">★</span>}
                  </p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                    {s.label}
                  </p>
                  <p className="text-[11px] text-zinc-600">{s.sub}</p>
                </div>
              ))}
            </Reveal>

            <div className="mt-10 grid gap-8 lg:grid-cols-[380px_1fr]">
              {/* status donut */}
              <Reveal>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">
                    List Status
                  </p>
                  <div className="flex items-center gap-6">
                    <svg viewBox="0 0 42 42" className="h-40 w-40 -rotate-90">
                      <circle cx="21" cy="21" r="15.9" fill="none" stroke="#27272a" strokeWidth="6" />
                      {donutSegments.map((seg) => (
                        <circle
                          key={seg.key}
                          cx="21"
                          cy="21"
                          r="15.9"
                          fill="none"
                          stroke={STATUS_COLORS[seg.key as ListStatus]}
                          strokeWidth="6"
                          strokeDasharray={`${seg.frac * 100} ${100 - seg.frac * 100}`}
                          strokeDashoffset={-seg.offset * 100}
                          className="transition-all duration-700"
                        />
                      ))}
                    </svg>
                    <div className="space-y-2">
                      {(Object.keys(STATUS_META) as ListStatus[]).map((k) =>
                        stats.statusCount[k] > 0 ? (
                          <div key={k} className="flex items-center gap-2 text-xs">
                            <span
                              className="h-2.5 w-2.5 rounded-sm"
                              style={{ background: STATUS_COLORS[k] }}
                            />
                            <span className="text-zinc-300">{STATUS_META[k].label}</span>
                            <span className="ml-auto font-bold tabular-nums text-white">
                              {stats.statusCount[k]}
                            </span>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* genre bars */}
              <Reveal>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">
                    Top Genres
                  </p>
                  {stats.genres.length === 0 ? (
                    <p className="py-10 text-center text-sm text-zinc-500">
                      Add rated titles to see your genre taste.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {stats.genres.map(([genre, count]) => (
                        <div key={genre}>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="font-semibold text-zinc-300">{genre}</span>
                            <span className="tabular-nums text-zinc-500">{count}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-700"
                              style={{ width: `${(count / stats.maxGenre) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Reveal>
            </div>

            {/* rating histogram */}
            <Reveal className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">
                Rating Distribution
              </p>
              <div className="flex h-36 items-end gap-2">
                {stats.ratingBuckets.map((count, i) => (
                  <div key={i} className="group flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold tabular-nums text-zinc-500 opacity-0 transition group-hover:opacity-100">
                      {count}
                    </span>
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-md bg-red-600/80 transition-all duration-500 group-hover:bg-red-500"
                        style={{ height: `${Math.max(3, (count / stats.maxRating) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold tabular-nums text-zinc-600">{i + 1}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* 7-day watch time */}
            <Reveal className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">
                  Last 7 Days · <span className="font-jp text-red-500">今週</span>
                </p>
                <span className="text-xs text-zinc-500">
                  {week.reduce((a, d) => a + d.count, 0)} episodes this week
                </span>
              </div>
              <div className="flex h-32 items-end gap-3">
                {week.map((d, i) => (
                  <div key={i} className="group flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold tabular-nums text-zinc-500 opacity-0 transition group-hover:opacity-100">
                      {d.count}
                    </span>
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          i === week.length - 1 ? "bg-red-500" : "bg-red-600/70 group-hover:bg-red-500"
                        }`}
                        style={{ height: `${Math.max(4, (d.count / maxWeek) * 100)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold ${i === week.length - 1 ? "text-white" : "text-zinc-600"}`}>
                      {d.label}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* achievements */}
            <Reveal className="mt-8">
              <AchievementsGrid ctx={achievementsCtx} />
            </Reveal>

            {/* top rated */}
            {stats.top.length > 0 && (
              <Reveal className="mt-8">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">
                  Your Top Rated
                </p>
                <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                  {stats.top.map(({ show, rating }) => (
                    <Link
                      key={show._id}
                      to={`/anime/${show._id}`}
                      className="group relative aspect-[2/3] overflow-hidden rounded-lg ring-1 ring-zinc-800 transition hover:-translate-y-1 hover:ring-red-600/70"
                    >
                      {show.thumbnail && (
                        <img
                          src={show.thumbnail}
                          alt={show.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                        />
                      )}
                      <span className="absolute right-1.5 top-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400 backdrop-blur">
                        ★ {rating}
                      </span>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-2 pt-6">
                        <p className="line-clamp-1 text-[10px] font-bold text-white">{show.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </Reveal>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
