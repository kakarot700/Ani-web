import React, { useState } from "react";
import { BsFillPlayFill } from "react-icons/bs";
import SectionHeader from "./SectionHeader";

interface TrailerSectionProps {
  trailerId: string;
  title: string;
}

const TrailerSection: React.FC<TrailerSectionProps> = ({ trailerId, title }) => {
  const [playing, setPlaying] = useState(false);

  return (
    <div>
      <SectionHeader title="Promotional Video" jp="プロモーションビデオ" />
      <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-xl ring-1 ring-zinc-800">
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
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-black/40 transition group-hover:bg-black/25" />
            <span className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_40px_rgba(220,38,38,0.6)] transition group-hover:scale-110">
              <BsFillPlayFill size={28} className="ml-1" />
            </span>
            <span className="absolute bottom-3 left-4 text-sm font-bold text-white drop-shadow">
              Official Trailer
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TrailerSection;
