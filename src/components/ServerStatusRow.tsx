import React, { useEffect, useRef, useState } from "react";
import { STREAM_SERVERS, probeServers, type ServerHealth, type StreamLang } from "@/server/stream";

interface ServerStatusRowProps {
  ids: { malId: number | null; aniListId: number | null };
  ep: number | string;
  lang: StreamLang;
  active: string;
  onSelect: (id: string) => void;
  onHealth?: (health: ServerHealth[]) => void;
}

/**
 * Server picker with live latency. Rendered inside a white card, so it
 * uses the light pill vocabulary: selected = ink, unselected = quiet grey.
 */
const ServerStatusRow: React.FC<ServerStatusRowProps> = ({
  ids,
  ep,
  lang,
  active,
  onSelect,
  onHealth,
}) => {
  const [health, setHealth] = useState<Map<string, ServerHealth>>(new Map());
  const [probing, setProbing] = useState(false);
  const onHealthRef = useRef(onHealth);
  onHealthRef.current = onHealth;

  useEffect(() => {
    let alive = true;
    setProbing(true);
    probeServers(ids, ep, lang)
      .then((results) => {
        if (!alive) return;
        const map = new Map<string, ServerHealth>();
        results.forEach((r) => map.set(r.id, r));
        setHealth(map);
        onHealthRef.current?.(results);
      })
      .finally(() => alive && setProbing(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.malId, ids.aniListId, ep, lang]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {STREAM_SERVERS.map((s) => {
        const supports = s.langs.includes(lang);
        const h = health.get(s.id);
        const isActive = s.id === active;
        const label = probing
          ? "…"
          : !supports
            ? "n/a"
            : h
              ? h.ok
                ? `${h.latency}ms`
                : "down"
              : "…";
        const dot = probing || !supports
          ? "bg-black/20"
          : h?.ok
            ? (h.latency ?? 9999) < 900
              ? "bg-[var(--success)]"
              : "bg-amber-400"
            : "bg-rose-400";

        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            disabled={!supports}
            className={`press flex items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition ${
              isActive
                ? "bg-[#16181f] text-white"
                : supports
                  ? "bg-black/[0.05] text-[var(--ink)] hover:bg-black/10"
                  : "cursor-not-allowed bg-black/[0.03] text-[var(--ink-faint)]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot} ${
                probing ? "animate-pulse" : ""
              }`}
            />
            {s.label}
            <span
              className={`tnum rounded-full px-1.5 text-[10px] ${
                isActive ? "bg-white/15 text-white/80" : "bg-black/[0.06] text-[var(--ink-soft)]"
              }`}
            >
              {label}
            </span>
            {!supports && (
              <span className="rounded-full bg-black/[0.06] px-1.5 text-[9px] uppercase text-[var(--ink-faint)]">
                sub
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ServerStatusRow;
