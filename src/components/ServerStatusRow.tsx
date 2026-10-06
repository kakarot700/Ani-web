import React, { useEffect, useRef, useState } from "react";
import { BsLightningChargeFill } from "react-icons/bs";
import { STREAM_SERVERS, probeServers, type ServerHealth, type StreamLang } from "@/server/stream";

interface ServerStatusRowProps {
  ids: { malId: number | null; aniListId: number | null };
  ep: number | string;
  lang: StreamLang;
  active: string;
  onSelect: (id: string) => void;
  onHealth?: (health: ServerHealth[]) => void;
}

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
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
        <BsLightningChargeFill size={11} className="text-yellow-400" />
        Servers
      </span>
      {STREAM_SERVERS.map((s) => {
        const supports = s.langs.includes(lang);
        const h = health.get(s.id);
        const isActive = s.id === active;
        const latencyLabel = probing
          ? "…"
          : !supports
            ? "n/a"
            : h
              ? h.ok
                ? `${h.latency}ms`
                : "down"
              : "…";
        const dot =
          probing || !supports
            ? "bg-zinc-600"
            : h?.ok
              ? (h.latency ?? 9999) < 900
                ? "bg-emerald-500"
                : "bg-yellow-500"
              : "bg-red-600";
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            disabled={!supports}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold ring-1 transition ${
              isActive
                ? "bg-red-600 text-white ring-red-600 shadow-[0_0_18px_rgba(220,38,38,0.4)]"
                : supports
                  ? "bg-zinc-900 text-zinc-300 ring-zinc-700 hover:bg-zinc-800 hover:text-white"
                  : "cursor-not-allowed bg-zinc-900/50 text-zinc-600 ring-zinc-800"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${dot} ${probing ? "animate-pulse" : ""}`} />
            {s.label}
            <span
              className={`rounded-sm px-1 font-mono text-[9px] tabular-nums ${
                isActive ? "bg-black/25 text-red-100" : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {latencyLabel}
            </span>
            {!supports && (
              <span className="rounded-sm bg-zinc-800 px-1 text-[8px] uppercase text-zinc-500">sub</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ServerStatusRow;
