import React, { useEffect, useMemo, useState } from "react";
import SectionHeader from "./SectionHeader";
import { getVoiceActors, type ShowDetail, type VoiceActor } from "@/server/allanime";

interface VoiceActorsRailProps {
  show: ShowDetail;
}

const VoiceActorsRail: React.FC<VoiceActorsRailProps> = ({ show }) => {
  const [actors, setActors] = useState<Map<number, VoiceActor>>(new Map());

  // aggregate VA ids from main cast characters
  const pairs = useMemo(() => {
    const out: { char: ShowDetail["characters"][number]; vaId: number | null; lang: string }[] = [];
    for (const c of show.characters) {
      if (c.vaIds.length === 0) continue;
      const jaIdx = c.vaIds.findIndex((_, i) => i === 0);
      out.push({ char: c, vaId: c.vaIds[jaIdx] ?? null, lang: "" });
      if (out.length >= 12) break;
    }
    return out;
  }, [show.characters]);

  useEffect(() => {
    let alive = true;
    const ids = [...new Set(pairs.map((p) => p.vaId).filter((v): v is number => v !== null))];
    if (ids.length === 0) return;
    getVoiceActors(ids)
      .then((list) => {
        if (!alive) return;
        const map = new Map<number, VoiceActor>();
        list.forEach((v) => map.set(v.aniListId, v));
        setActors(map);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [pairs]);

  if (pairs.length === 0) return null;

  return (
    <div>
      <SectionHeader title="Cast & Voice Actors" jp="キャスト" />
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {pairs.map(({ char, vaId }) => {
          const va = vaId ? actors.get(vaId) : undefined;
          return (
            <div
              key={char.name}
              className="w-40 shrink-0 overflow-hidden rounded-[22px] glass ring-1 ring-white/12 transition duration-300 hover:-translate-y-1 hover:ring-white/30 md:w-44"
            >
              <div className="flex">
                <div className="aspect-[3/4] w-1/2 overflow-hidden bg-white/10">
                  {char.image ? (
                    <img src={char.image} alt={char.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full" />
                  )}
                </div>
                <div className="aspect-[3/4] w-1/2 overflow-hidden bg-white/10">
                  {va?.image ? (
                    <img src={va.image} alt={va.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-lg text-white/45">🎙</div>
                  )}
                </div>
              </div>
              <div className="p-2.5">
                <p className="truncate text-[11px] font-bold text-white">{char.name}</p>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">{char.role}</p>
                {va && (
                  <p className="mt-1.5 truncate border-t border-white/10 pt-1.5 text-[10px] text-white/70">
                    {va.name}
                    {va.native && <span className="font-jp text-white/45"> · {va.native}</span>}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VoiceActorsRail;
