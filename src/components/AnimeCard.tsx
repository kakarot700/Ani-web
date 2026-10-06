import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { BsFillPlayFill, BsStarFill } from "react-icons/bs";
import Img from "./Img";
import type { ShowSummary } from "@/server/allanime";

interface AnimeCardProps {
  show: ShowSummary;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ show }) => {
  const eps = show.episodeCount ? `${show.episodeCount} eps` : show.status;
  const tiltRef = useRef<HTMLAnchorElement>(null);

  // pointer tilt only where hover exists (never on touch devices)
  const canTilt =
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onMove = (e: React.MouseEvent) => {
    if (!canTilt) return;
    const el = tiltRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translateY(-6px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(
      px * 6
    ).toFixed(2)}deg)`;
  };

  const onLeave = () => {
    const el = tiltRef.current;
    if (el) el.style.transform = "";
  };

  return (
    <Link
      ref={tiltRef}
      to={`/anime/${show._id}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`card-shine group relative block aspect-[2/3] w-full overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-zinc-800 transition-shadow duration-300 hover:shadow-[0_18px_50px_-12px_var(--red-glow)] hover:ring-red-600/70 ${
        canTilt ? "tilt-card" : "transition-all duration-300 hover:-translate-y-1.5"
      }`}
      style={canTilt ? { transformStyle: "preserve-3d" } : undefined}
    >
      <Img
        src={show.thumbnail}
        alt={show.name}
        className="absolute inset-0"
        imgClassName="transition duration-500 group-hover:scale-110"
      />

      {/* hover play */}
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/50 opacity-0 transition duration-300 group-hover:opacity-100">
        <span className="flex h-12 w-12 scale-50 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.6)] transition duration-300 group-hover:scale-100">
          <BsFillPlayFill size={22} className="ml-0.5" />
        </span>
      </div>

      {/* info strip */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent p-2.5 pt-8">
        <p className="line-clamp-1 text-[11px] font-bold leading-tight text-white">
          {show.name}
        </p>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-zinc-400">
          <span className="rounded-sm bg-red-600/90 px-1 py-px font-bold text-white">
            {show.type ?? "TV"}
          </span>
          {eps && <span className="truncate">{eps}</span>}
        </div>
      </div>

      {typeof show.score === "number" && show.score > 0 && (
        <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400 backdrop-blur">
          <BsStarFill size={8} />
          {show.score.toFixed(1)}
        </span>
      )}
    </Link>
  );
};

export default AnimeCard;
