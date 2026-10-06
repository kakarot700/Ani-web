import React from "react";
import SectionHeader from "./SectionHeader";
import type { CharacterInfo } from "@/server/allanime";

interface CharacterRailProps {
  characters: CharacterInfo[];
}

const CharacterRail: React.FC<CharacterRailProps> = ({ characters }) => {
  if (characters.length === 0) return null;
  return (
    <div>
      <SectionHeader title="Characters" jp="キャラクター" />
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {characters.map((c) => (
          <div
            key={c.name}
            className="group w-32 shrink-0 overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-zinc-800 transition hover:-translate-y-1 hover:ring-red-600/60 md:w-36"
          >
            <div className="aspect-square overflow-hidden bg-zinc-800">
              {c.image ? (
                <img
                  src={c.image}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                  {c.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="p-2.5">
              <p className="truncate text-xs font-bold text-white">{c.name}</p>
              {c.native && (
                <p className="font-jp mt-0.5 truncate text-[10px] text-zinc-500">{c.native}</p>
              )}
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-red-500">
                {c.role}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterRail;
