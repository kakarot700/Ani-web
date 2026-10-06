import React from "react";

/**
 * A thin cinematic divider — film perforations with a katakana label,
 * used to separate major blocks the way a reel changes.
 */
const FilmStrip: React.FC<{ label?: string }> = ({ label = "上映中" }) => {
  return (
    <div className="flex items-center gap-3 px-4 md:px-12" aria-hidden="true">
      {/* perforations */}
      <div className="flex flex-1 items-center gap-1.5">
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} className="h-1.5 w-2.5 shrink-0 rounded-[2px] bg-zinc-800" />
        ))}
      </div>
      <span className="font-jp shrink-0 text-[9px] font-bold tracking-[0.5em] text-red-600/70">
        {label}
      </span>
      <div className="flex flex-1 items-center gap-1.5">
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} className="h-1.5 w-2.5 shrink-0 rounded-[2px] bg-zinc-800" />
        ))}
      </div>
    </div>
  );
};

export default FilmStrip;
