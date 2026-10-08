import React from "react";
import { Link } from "react-router-dom";
import { BsFillPlayFill, BsStarFill } from "react-icons/bs";
import Img from "./Img";
import { cn } from "@/utils/cn";

interface AnimeCardProps {
  show: {
    _id: string;
    name: string;
    thumbnail: string | null;
    type?: string | null;
    episodeCount?: number | null;
    score?: number | null;
  };
  className?: string;
  /** small label rendered as a pill above the title (e.g. "Episode 12") */
  tag?: string;
  /** clamp of the title, 1 or 2 lines */
  lines?: 1 | 2;
}

/**
 * Poster tile — soft rounded glass frame on the gradient, with the
 * title on a quiet plate and play affordance on hover.
 */
const AnimeCard: React.FC<AnimeCardProps> = ({ show, className, tag, lines = 2 }) => {
  const eps = show.episodeCount ? `${show.episodeCount} eps` : "";

  return (
    <Link
      to={`/anime/${show._id}`}
      className={cn(
        "group lift relative block aspect-[2/3] w-full overflow-hidden rounded-[22px]",
        "bg-white/10 ring-1 ring-white/12",
        className
      )}
    >
      <Img
        src={show.thumbnail}
        alt={show.name}
        className="absolute inset-0"
        imgClassName="transition duration-[600ms] ease-out group-hover:scale-[1.07]"
      />

      {/* hover veil + play */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 backdrop-blur-[1px] transition duration-300 group-hover:opacity-100">
        <span className="flex h-12 w-12 scale-90 items-center justify-center rounded-full bg-white text-[var(--ink)] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] transition duration-300 group-hover:scale-100">
          <BsFillPlayFill size={20} className="ml-0.5" />
        </span>
      </div>

      {/* top row */}
      <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-1.5">
        {tag ? (
          <span className="chip bg-black/45 backdrop-blur-md">{tag}</span>
        ) : (
          <span />
        )}
        {typeof show.score === "number" && show.score > 0 && (
          <span className="chip bg-black/45 backdrop-blur-md">
            <BsStarFill size={8} />
            {show.score.toFixed(1)}
          </span>
        )}
      </div>

      {/* title plate */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-12">
        <p
          className={cn(
            "text-[12.5px] font-semibold leading-snug tracking-[-0.005em] text-white",
            lines === 1 ? "truncate" : "line-clamp-2"
          )}
        >
          {show.name}
        </p>
        {(show.type || eps) && (
          <p className="mt-0.5 truncate text-[11px] text-white/55">
            {[show.type, eps].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
};

export default AnimeCard;
