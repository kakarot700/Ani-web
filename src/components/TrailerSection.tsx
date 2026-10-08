import React, { useState } from "react";
import { BsFillPlayFill } from "react-icons/bs";
import { GhostPill, IconBadge } from "./ui";

interface TrailerSectionProps {
  trailerId: string;
  title: string;
}

/** Trailer card: white shell, 16:9 well, one white play disc. */
const TrailerSection: React.FC<TrailerSectionProps> = ({ trailerId, title }) => {
  const [playing, setPlaying] = useState(false);

  return (
    <section id="trailer" className="card-light scroll-mt-24 overflow-hidden rounded-[22px]">
      <header className="flex flex-wrap items-center gap-3 px-5 pb-3 pt-5">
        <IconBadge tone="ink">
          <BsFillPlayFill size={14} />
        </IconBadge>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
            Trailer
          </h3>
          <p className="text-[12px] text-[var(--ink-soft)]">Official promotional video</p>
        </div>
        <a
          href={`https://www.youtube.com/watch?v=${trailerId}`}
          target="_blank"
          rel="noreferrer"
          className="shrink-0"
        >
          <GhostPill type="button">Open on YouTube</GhostPill>
        </a>
      </header>

      <div className="px-5 pb-5">
        <div className="relative aspect-video w-full overflow-hidden rounded-[18px] bg-black ring-1 ring-black/10">
          {playing ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailerId}?autoplay=1&rel=0`}
              title={`${title} trailer`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          ) : (
            <button
              onClick={() => setPlaying(true)}
              className="group relative block h-full w-full"
              aria-label={`Play ${title} trailer`}
            >
              <img
                src={`https://i.ytimg.com/vi/${trailerId}/hqdefault.jpg`}
                alt={`${title} trailer thumbnail`}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <span className="absolute inset-0 bg-black/35 transition group-hover:bg-black/20" />
              <span className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--ink)] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.7)] transition group-hover:scale-110">
                <BsFillPlayFill size={24} className="ml-0.5" />
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default TrailerSection;
