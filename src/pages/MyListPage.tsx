import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AnimeCard from "@/components/AnimeCard";
import PageShell from "@/components/PageShell";
import { BlackPill, Card, EmptyState, IconBadge, Panel, PosterSkeleton, Segmented } from "@/components/ui";
import { BsBookmarkHeartFill, BsCheckLg, BsClock, BsFillPlayFill, BsGraphUpArrow } from "react-icons/bs";
import { getShow, type ShowSummary } from "@/server/allanime";
import useUserList, { STATUS_META, type ListStatus } from "@/lib/userlist";

type Tab = "all" | ListStatus;

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "watching", label: "Watching" },
  { id: "plan", label: "Plan" },
  { id: "completed", label: "Done" },
  { id: "hold", label: "Hold" },
  { id: "dropped", label: "Dropped" },
];

export default function MyListPage() {
  const entries = useUserList((s) => s.entries);
  const watched = useUserList((s) => s.watched);
  const [tab, setTab] = useState<Tab>("all");
  const [shows, setShows] = useState<Map<string, ShowSummary>>(new Map());

  const listedIds = useMemo(
    () => Object.keys(entries).filter((id) => id.startsWith("al:")).map((id) => id.slice(3)),
    [entries]
  );

  useEffect(() => {
    let alive = true;
    if (listedIds.length === 0) return;
    Promise.all(
      listedIds.map((id) =>
        getShow(id)
          .then(
            (s): ShowSummary => ({
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
            })
          )
          .catch(() => null)
      )
    ).then((list) => {
      if (!alive) return;
      const map = new Map<string, ShowSummary>();
      list.forEach((s) => s && map.set(s._id, s));
      setShows(map);
    });
    return () => {
      alive = false;
    };
  }, [listedIds.join(",")]);

  const filtered = useMemo(
    () =>
      listedIds.filter((id) => {
        const status = entries[`al:${id}`]?.status ?? null;
        return tab === "all" ? status !== null : status === tab;
      }),
    [listedIds, entries, tab]
  );

  const totalWatchedEps = useMemo(
    () => Object.values(watched).reduce((acc, list) => acc + list.length, 0),
    [watched]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: listedIds.length };
    for (const id of listedIds) {
      const s = entries[`al:${id}`]?.status;
      if (s) c[s] = (c[s] ?? 0) + 1;
    }
    return c;
  }, [listedIds, entries]);

  return (
    <PageShell
      eyebrow="Your library"
      title="My List"
      subtitle="Everything you've saved, kept on this device."
      width="wide"
    >
      {/* summary panels */}
      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Panel
          icon={<BsBookmarkHeartFill size={13} />}
          label="Titles"
          value={listedIds.length}
          meta="Saved to your list"
        />
        <Panel
          icon={<BsFillPlayFill size={13} />}
          label="Episodes"
          value={totalWatchedEps}
          meta="Watched on this device"
        />
        <Panel
          icon={<BsCheckLg size={13} />}
          label="Finished"
          value={counts.completed ?? 0}
          meta="Completed titles"
        />
        <Panel
          icon={<BsGraphUpArrow size={13} />}
          label="In progress"
          value={counts.watching ?? 0}
          meta="Currently watching"
        />
      </section>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="no-scrollbar min-w-0 max-w-full overflow-x-auto">
          <Segmented
            className="w-max"
            segments={TABS}
            value={tab}
            onChange={setTab}
          />
        </div>
        <span className="text-[12.5px] text-white/50">
          {counts[tab] ?? 0} title{(counts[tab] ?? 0) === 1 ? "" : "s"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={tab === "all" ? "Nothing here yet" : `No ${tab} titles`}
          description="Open any anime and tap “Add to list” to start tracking it. Ratings, progress and status are saved in this browser."
          action={
            <Link to="/browse">
              <BlackPill className="bg-white text-[var(--ink)] hover:bg-white/90">
                Browse anime
              </BlackPill>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((id) => {
            const s = shows.get(id);
            const entry = entries[`al:${id}`];
            if (!s) return <PosterSkeleton key={id} />;
            return (
              <div key={id} className="relative">
                <AnimeCard show={s} />
                {entry?.status && (
                  <span className="glass-strong absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white">
                    {STATUS_META[entry.status].label}
                  </span>
                )}
                {typeof entry?.rating === "number" && (
                  <span className="glass-strong absolute bottom-16 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white">
                    ★ {entry.rating}/10
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {listedIds.length > 0 && (
        <Card
          className="mt-8"
          title="Keep going"
          meta="Jump back into the series you were watching"
          badge={<IconBadge tone="ink"><BsClock size={13} /></IconBadge>}
        >
          <div className="flex flex-wrap gap-2">
            {listedIds.slice(0, 8).map((id) => (
              <Link key={id} to={`/anime/${id}`} className="press">
                <span className="chip-dark">{shows.get(id)?.name ?? "Loading…"}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </PageShell>
  );
}
