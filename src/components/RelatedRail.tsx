import React from "react";
import { Link } from "react-router-dom";
import { BsFillPlayFill } from "react-icons/bs";
import SectionHeader from "./SectionHeader";
import { relationLabel, type RelatedShow } from "@/server/allanime";

interface RelatedRailProps {
  related: RelatedShow[];
}

const RelatedRail: React.FC<RelatedRailProps> = ({ related }) => {
  if (related.length === 0) return null;
  return (
    <div>
      <SectionHeader title="Relations" jp="関連作品" />
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {related.map(({ relation, show }) => (
          <Link
            key={show._id}
            to={`/anime/${show._id}`}
            className="group relative w-36 shrink-0 overflow-hidden rounded-[22px] glass ring-1 ring-white/12 transition duration-300 hover:-translate-y-1 hover:ring-white/30 md:w-44"
          >
            <div className="aspect-[2/3] overflow-hidden">
              {show.thumbnail ? (
                <img
                  src={show.thumbnail}
                  alt={show.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-2 text-center text-[11px] text-white/55">
                  {show.name}
                </div>
              )}
            </div>
            <span className="absolute left-2 top-2 rounded-full bg-[#16181f] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-white">
              {relationLabel(relation)}
            </span>
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 backdrop-blur-[2px] transition group-hover:opacity-100">
              <span className="flex h-11 w-11 scale-75 items-center justify-center rounded-full bg-white text-[var(--ink)] shadow-lg transition duration-300 group-hover:scale-100">
                <BsFillPlayFill size={20} className="ml-0.5" />
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent p-2.5 pt-8">
              <p className="line-clamp-1 text-[11px] font-bold text-white">{show.name}</p>
              <p className="mt-0.5 text-[10px] text-white/70">
                {show.type ?? "TV"}
                {show.episodeCount ? ` · ${show.episodeCount} eps` : ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedRail;
