import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BsStarFill } from "react-icons/bs";
import SectionHeader from "./SectionHeader";
import Img from "./Img";
import { searchShows, type SearchParams, type ShowSummary } from "@/server/allanime";

const TABS: { id: string; label: string; params: SearchParams }[] = [
  { id: "day", label: "Day", params: { sortBy: "Trending", dateRangeStart: 1, limit: 10 } },
  { id: "week", label: "Week", params: { sortBy: "Latest_Update", limit: 10 } },
  { id: "month", label: "Month", params: { sortBy: "Popular", limit: 10 } },
];

const Top10: React.FC = () => {
  const [tab, setTab] = useState("day");
  const [shows, setShows] = useState<ShowSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const current = TABS.find((t) => t.id === tab) ?? TABS[0];
    searchShows(current.params)
      .then((p) => alive && setShows(p.shows.filter((s) => s.thumbnail)))
      .catch(() => alive && setShows([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [tab]);

  return (
    <section className="px-4 md:px-12">
      <div className="flex items-end justify-between">
        <SectionHeader title="Top 10" jp="トップテン" />
        <div className="mb-3 flex overflow-hidden rounded-lg ring-1 ring-zinc-700">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                tab === t.id
                  ? "bg-red-600 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
        {loading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex h-16 animate-pulse items-center gap-3 rounded-lg bg-zinc-900" />
            ))
          : shows.map((s, i) => (
              <Link
                key={s._id}
                to={`/anime/${s._id}`}
                className="group flex items-center gap-3 rounded-lg p-2 transition hover:bg-zinc-900"
              >
                <span className="relative w-10 shrink-0 text-center">
                  <span
                    className={`font-display block text-4xl leading-none tracking-wide ${
                      i < 3 ? "text-red-600" : "text-zinc-700"
                    } transition group-hover:text-red-500`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {i < 3 && (
                    <span
                      className={`mx-auto mt-0.5 block h-1 w-6 rounded-full ${
                        i === 0 ? "bg-yellow-400" : i === 1 ? "bg-zinc-300" : "bg-amber-700"
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </span>
                <Img
                  src={s.thumbnail}
                  alt={s.name}
                  className="h-16 w-12 shrink-0 rounded-md ring-1 ring-zinc-800"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white group-hover:text-red-500">
                    {s.name}
                  </p>
                  <p className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500">
                    <span className="rounded-sm bg-zinc-800 px-1 py-px font-bold text-zinc-300">
                      {s.type ?? "TV"}
                    </span>
                    {typeof s.score === "number" && s.score > 0 && (
                      <span className="flex items-center gap-0.5 text-yellow-400">
                        <BsStarFill size={8} />
                        {s.score.toFixed(1)}
                      </span>
                    )}
                    {s.episodeCount ? <span>{s.episodeCount} eps</span> : null}
                  </p>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
};

export default Top10;
