import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BsStarFill } from "react-icons/bs";
import { searchShows, type ShowSummary } from "@/server/allanime";

const TickerMarquee: React.FC = () => {
  const [items, setItems] = useState<ShowSummary[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let alive = true;
    searchShows({ sortBy: "Trending", dateRangeStart: 1, limit: 14 })
      .then((p) => alive && setItems(p.shows.filter((s) => s.thumbnail)))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  if (items.length === 0) return null;

  const strip = (suffix: string) =>
    items.map((s) => (
      <Link
        key={`${s._id}${suffix}`}
        to={`/anime/${s._id}`}
        className="group flex shrink-0 items-center gap-2 px-5 text-xs font-semibold text-zinc-400 transition hover:text-white"
      >
        <BsStarFill size={9} className="text-yellow-400" />
        <span className="max-w-[180px] truncate group-hover:text-red-500">{s.name}</span>
        {typeof s.score === "number" && s.score > 0 && (
          <span className="tabular-nums text-zinc-600">{s.score.toFixed(1)}</span>
        )}
      </Link>
    ));

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative z-20 mt-[60px] flex items-center overflow-hidden border-b border-zinc-800/70 bg-zinc-950/90 backdrop-blur md:mt-[78px]"
    >
      <div className="flex shrink-0 items-center gap-2 border-r border-zinc-800/70 bg-red-600 px-4 py-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white">
          Trending
        </span>
        <span className="font-jp text-[9px] tracking-[0.2em] text-red-100">話題</span>
      </div>
      <div
        className={`flex w-full items-center ${paused ? "[animation-play-state:paused]" : ""}`}
        style={{
          animation: "marquee 46s linear infinite",
          width: "max-content",
        }}
      >
        <div className="flex items-center">{strip("a")}</div>
        <div className="flex items-center" aria-hidden="true">
          {strip("b")}
        </div>
      </div>
    </div>
  );
};

export default TickerMarquee;
