import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BsCheckLg, BsClock, BsFillPlayFill, BsGraphUpArrow, BsStarFill, BsTagsFill } from "react-icons/bs";
import AchievementsGrid from "@/components/AchievementsGrid";
import CountUp from "@/components/CountUp";
import PageShell from "@/components/PageShell";
import { Card, EmptyState, IconBadge, InfoRow, Panel } from "@/components/ui";
import { getShow, type ShowSummary } from "@/server/allanime";
import useUserList, { STATUS_META, type ListStatus } from "@/lib/userlist";
import { buildContext } from "@/lib/achievements";

const STATUS_COLORS: Record<ListStatus, string> = {
  watching: "#7f8ef9",
  plan: "#f0b429",
  completed: "#34c759",
  hold: "#a78bfa",
  dropped: "#94a3b8",
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
    let ratingSum = 0;
    let ratedCount = 0;
    const genreCount = new Map<string, number>();
    const topRated: { show: EnrichedShow; rating: number }[] = [];

    for (const id of listedIds) {
      const entry = entries[`al:${id}`];
      if (!entry || !entry.status) continue;
      statusCount[entry.status] += 1;
      if (typeof entry.rating === "number") {
        ratingSum += entry.rating;
        ratedCount += 1;
        const show = shows.get(id);
        if (show) topRated.push({ show, rating: entry.rating });
      }
      const show = shows.get(id);
      show?.genres.slice(0, 3).forEach((g) => genreCount.set(g, (genreCount.get(g) ?? 0) + 1));
    }

    const totalTitles = listedIds.filter((id) => entries[`al:${id}`]?.status).length;
    const genres = [...genreCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxGenre = genres.length ? genres[0][1] : 1;

    return {
      totalTitles,
      totalWatchedEps,
      hours: Math.round((totalWatchedEps * 24) / 60),
      statusCount,
      genres,
      maxGenre,
      avgRating: ratedCount ? ratingSum / ratedCount : null,
      top: topRated.sort((a, b) => b.rating - a.rating).slice(0, 6),
    };
  }, [entries, listedIds, shows, watched]);

  const week = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toDateString();
      const count = events.filter((ts) => new Date(ts).toDateString() === key).length;
      days.push({ label: d.toLocaleDateString(undefined, { weekday: "narrow" }), count });
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

  const donut = useMemo(() => {
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
    <PageShell
      eyebrow="Your anime profile"
      title="Stats"
      subtitle="Charts and achievements built from your watch history on this device."
      width="wide"
      action={
        <Link
          to="/mylist"
          className="glass press inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white/90 transition hover:bg-white/20"
        >
          Open My List
        </Link>
      }
    >
      {isEmpty ? (
        <EmptyState
          title="No data yet"
          description="Add a few titles to your list and start watching — your stats, charts and achievements build themselves from there."
          action={
            <Link
              to="/browse"
              className="press inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-[var(--ink)] transition hover:bg-white/90"
            >
              Browse anime
            </Link>
          }
        />
      ) : (
        <>
          <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Panel
              icon={<BsGraphUpArrow size={13} />}
              label="Tracked"
              value={<CountUp value={stats.totalTitles} />}
              meta="Titles in your list"
            />
            <Panel
              icon={<BsFillPlayFill size={13} />}
              label="Episodes"
              value={<CountUp value={stats.totalWatchedEps} />}
              meta="Watched on this device"
            />
            <Panel
              icon={<BsClock size={13} />}
              label="Time"
              value={`~${stats.hours}h`}
              meta="≈ 24 min per episode"
            />
            <Panel
              icon={<BsStarFill size={13} />}
              label="Avg rating"
              value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"}
              meta="Across rated titles"
            />
          </section>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-5">
              <AchievementsGrid ctx={achievementsCtx} />

              <Card
                title="Watch activity"
                meta="Last 7 days"
                badge={<IconBadge tone="accent"><BsGraphUpArrow size={13} /></IconBadge>}
              >
                <div className="flex h-32 items-end gap-2 pt-2">
                  {week.map((d, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                      <span className="tnum text-[10.5px] font-semibold text-[var(--ink-soft)]">
                        {d.count || ""}
                      </span>
                      <div
                        className="w-full rounded-t-[8px] bg-gradient-to-t from-[var(--accent)]/45 to-[var(--accent)] transition-all"
                        style={{ height: `${Math.max(4, (d.count / maxWeek) * 92)}px` }}
                      />
                      <span className="text-[10.5px] text-[var(--ink-faint)]">{d.label}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {stats.top.length > 0 && (
                <Card
                  title="Your top rated"
                  meta="Highest scores you've given"
                  badge={<IconBadge tone="warm"><BsStarFill size={12} /></IconBadge>}
                >
                  <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                    {stats.top.map(({ show, rating }) => (
                      <Link
                        key={show._id}
                        to={`/anime/${show._id}`}
                        className="group relative aspect-[2/3] overflow-hidden rounded-[16px] ring-1 ring-black/10 transition hover:-translate-y-1"
                      >
                        {show.thumbnail && (
                          <img
                            src={show.thumbnail}
                            alt={show.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        )}
                        <span className="absolute right-1.5 top-1.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 backdrop-blur">
                          ★ {rating}
                        </span>
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2 pt-6">
                          <span className="line-clamp-1 text-[10.5px] font-medium text-white">
                            {show.name}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            <aside className="space-y-5">
              <Card
                title="List status"
                meta={`${stats.totalTitles} titles`}
                badge={<IconBadge tone="ink"><BsCheckLg size={13} /></IconBadge>}
              >
                <div className="flex items-center gap-5">
                  <svg viewBox="0 0 42 42" className="h-36 w-36 shrink-0 -rotate-90">
                    <circle cx="21" cy="21" r="15.9" fill="none" stroke="#00000012" strokeWidth="5.5" />
                    {donut.map((seg) => (
                      <circle
                        key={seg.key}
                        cx="21"
                        cy="21"
                        r="15.9"
                        fill="none"
                        stroke={STATUS_COLORS[seg.key as ListStatus]}
                        strokeWidth="5.5"
                        strokeLinecap="round"
                        strokeDasharray={`${seg.frac * 100} ${100 - seg.frac * 100}`}
                        strokeDashoffset={-seg.offset * 100}
                        className="transition-all duration-700"
                      />
                    ))}
                  </svg>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {(Object.keys(STATUS_META) as ListStatus[]).map((k) =>
                      stats.statusCount[k] > 0 ? (
                        <div key={k} className="flex items-center gap-2 text-[12.5px]">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ background: STATUS_COLORS[k] }}
                          />
                          <span className="min-w-0 flex-1 truncate text-[var(--ink-soft)]">
                            {STATUS_META[k].label}
                          </span>
                          <span className="tnum font-semibold text-[var(--ink)]">
                            {stats.statusCount[k]}
                          </span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              </Card>

              {stats.genres.length > 0 && (
                <Card
                  title="Top genres"
                  meta="From titles you've tracked"
                  badge={<IconBadge tone="accent"><BsTagsFill size={13} /></IconBadge>}
                >
                  {stats.genres.map(([g, count]) => (
                    <div key={g} className="border-t border-black/[0.07] py-2 first:border-t-0">
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="text-[var(--ink)]">{g}</span>
                        <span className="tnum text-[var(--ink-soft)]">{count}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                        <div
                          className="h-full rounded-full bg-[var(--accent)]"
                          style={{ width: `${(count / stats.maxGenre) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </Card>
              )}

              <Card title="Breakdown" meta="Everything at a glance">
                <InfoRow label="Titles tracked" value={stats.totalTitles} />
                <InfoRow label="Episodes watched" value={stats.totalWatchedEps} />
                <InfoRow label="Time watched" value={`~${stats.hours}h`} />
                <InfoRow
                  label="Average rating"
                  value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"}
                />
                <InfoRow label="Watch events" value={events.length} />
              </Card>
            </aside>
          </div>
        </>
      )}
    </PageShell>
  );
}
