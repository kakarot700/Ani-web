import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsBookmarkHeartFill } from "react-icons/bs";
import AnimeCard from "@/components/AnimeCard";
import Navbar from "@/components/Navbar";
import Reveal from "@/components/Reveal";
import { getShow, type ShowSummary } from "@/server/allanime";
import useUserList, { STATUS_META, type ListStatus } from "@/lib/userlist";

type Tab = "all" | ListStatus;

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "watching", label: "Watching" },
  { id: "plan", label: "Plan to Watch" },
  { id: "completed", label: "Completed" },
  { id: "hold", label: "On Hold" },
  { id: "dropped", label: "Dropped" },
];

export default function MyListPage() {
  const navigate = useNavigate();
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

  const filtered = useMemo(() => {
    return listedIds.filter((id) => {
      const status = entries[`al:${id}`]?.status ?? null;
      return tab === "all" ? status !== null : status === tab;
    });
  }, [listedIds, entries, tab]);

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
    <>
      <div className="noise-overlay" aria-hidden="true" />
      <Navbar />
      <div className="mx-auto max-w-[1500px] px-4 pb-40 pt-28 md:px-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-1 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.25em] text-red-500">
              <BsBookmarkHeartFill size={13} />
              Your Library
              <span className="font-jp tracking-[0.3em] text-zinc-500">· マイリスト</span>
            </p>
            <h1 className="font-display text-5xl tracking-wide text-white md:text-7xl">My List</h1>
          </div>
          <div className="flex gap-8">
            <div>
              <p className="font-display text-4xl text-red-500">{listedIds.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Titles</p>
            </div>
            <div>
              <p className="font-display text-4xl text-red-500">{totalWatchedEps}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Episodes watched
              </p>
            </div>
          </div>
        </div>

        <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider ring-1 transition ${
                tab === t.id
                  ? "bg-red-600 text-white ring-red-600 shadow-[0_0_20px_rgba(220,38,38,0.35)]"
                  : "bg-zinc-900 text-zinc-400 ring-zinc-800 hover:text-white"
              }`}
            >
              {t.label}
              <span className="ml-2 rounded bg-black/25 px-1.5 py-px text-[10px] tabular-nums">
                {counts[t.id] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-16 rounded-xl border border-zinc-800 bg-zinc-900/50 p-14 text-center">
            <p className="font-display text-3xl tracking-wide text-zinc-300">
              {tab === "all" ? "Nothing here yet" : `No ${TABS.find((t) => t.id === tab)?.label.toLowerCase()} titles`}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Open any anime and hit “Add to List” to start tracking.
            </p>
            <button
              onClick={() => navigate("/browse")}
              className="mt-6 rounded-md bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-500"
            >
              Browse anime
            </button>
          </div>
        ) : (
          <Reveal className="mt-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filtered.map((id) => {
                const s = shows.get(id);
                const entry = entries[`al:${id}`];
                if (!s) {
                  return (
                    <div key={id} className="aspect-[2/3] animate-pulse rounded-lg bg-zinc-900" />
                  );
                }
                return (
                  <div key={id} className="relative">
                    <AnimeCard show={s} />
                    {entry?.status && (
                      <span className="absolute left-1.5 top-1.5 z-10 rounded-sm bg-black/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-400 backdrop-blur">
                        {STATUS_META[entry.status].label}
                      </span>
                    )}
                    {typeof entry?.rating === "number" && (
                      <span className="absolute bottom-14 left-1.5 z-10 rounded-sm bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-yellow-400 backdrop-blur">
                        ★ {entry.rating}/10
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Reveal>
        )}
      </div>
    </>
  );
}
