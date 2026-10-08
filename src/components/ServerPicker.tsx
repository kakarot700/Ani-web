import React, { useEffect, useRef, useState } from "react";
import { BsArrowRepeat, BsBoxArrowUpRight, BsChevronDown, BsChevronUp, BsStars } from "react-icons/bs";
import { STREAM_SERVERS, getServer, probeServers, type ServerHealth, type StreamLang } from "@/server/stream";

interface ServerPickerProps {
  ids: { malId: number | null; aniListId: number | null };
  ep: number | string;
  lang: StreamLang;
  mode: string; // "auto" or a specific server id
  activeId: string | null; // the server actually in the player right now
  onSelect: (mode: string) => void;
  onHealth: (health: ServerHealth[]) => void;
  /** Why auto-pilot dropped each server this episode (serverId -> reason tag). */
  failReasons?: ReadonlyMap<string, string>;
}

const REASON_LABELS: Record<string, string> = {
  "no-response": "no signal",
  "went-down": "went down",
  error: "playback error",
};

/**
 * Auto-Pilot server picker.
 *
 * Front row: [✦ Auto] plus the two best healthy servers as manual
 * fallbacks. Everything else lives behind the "All servers" expander.
 * Probes all servers live and reports the ranked results upward so the
 * watch page can drive auto-selection and failover.
 */
const ServerPicker: React.FC<ServerPickerProps> = ({
  ids,
  ep,
  lang,
  mode,
  activeId,
  onSelect,
  onHealth,
  failReasons,
}) => {
  const [results, setResults] = useState<ServerHealth[]>([]);
  const [probing, setProbing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [nonce, setNonce] = useState(0); // bump to force a rescan
  const onHealthRef = useRef(onHealth);
  onHealthRef.current = onHealth;

  useEffect(() => {
    let alive = true;
    setProbing(true);
    probeServers(ids, ep, lang)
      .then((r) => {
        if (!alive) return;
        setResults(r);
        onHealthRef.current?.(r);
      })
      .finally(() => alive && setProbing(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.malId, ids.aniListId, ep, lang, nonce]);

  const byId = (id: string) => results.find((r) => r.id === id);
  const healthy = results.filter((r) => r.ok);
  const top2 = healthy.slice(0, 2);
  const autoActive = mode === "auto";

  const autoStatus = probing
    ? "Scanning…"
    : autoActive && activeId
      ? `on ${getServer(activeId).label}`
      : autoActive
        ? "waiting…"
        : "recommended";

  const chip = (active: boolean) =>
    `tnum shrink-0 rounded-full px-1.5 text-[10px] ${
      active ? "bg-white/15 text-white/80" : "bg-black/[0.06] text-[var(--ink-soft)]"
    }`;

  return (
    <div className="space-y-2.5">
      {/* front row: Auto + the two best manual fallbacks */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onSelect("auto")}
          title="Auto-pilot scans every server and always plays on the fastest healthy one. If a server dies mid-play, it falls back automatically."
          className={`press flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-semibold transition ${
            autoActive
              ? "bg-[var(--accent)] text-white shadow-[0_4px_18px_-6px_var(--accent)]"
              : "bg-black/[0.05] text-[var(--ink)] hover:bg-black/10"
          }`}
        >
          <BsStars size={13} />
          Auto
          <span
            className={`max-w-[150px] truncate rounded-full px-1.5 text-[10px] ${
              autoActive ? "bg-white/20 text-white/90" : "bg-black/[0.06] text-[var(--ink-soft)]"
            }`}
          >
            {autoStatus}
          </span>
        </button>

        {top2.map((h, i) => {
          const s = getServer(h.id);
          const isManualActive = mode === h.id;
          const running = autoActive && activeId === h.id;
          return (
            <button
              key={h.id}
              onClick={() => onSelect(h.id)}
              title={`${s.label} — ${i === 0 ? "fastest" : "second-fastest"} healthy server. Click to pin it manually.`}
              className={`press flex min-w-0 items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-semibold transition ${
                isManualActive
                  ? "bg-[#16181f] text-white"
                  : "bg-black/[0.05] text-[var(--ink)] hover:bg-black/10"
              }`}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--success)]" />
              <span className="min-w-0 truncate">{s.label}</span>
              <span className={chip(isManualActive)}>{h.latency}ms</span>
              {running && <span className={chip(isManualActive)}>auto</span>}
            </button>
          );
        })}

        {probing && top2.length === 0 && (
          <span className="flex items-center gap-2 px-1 text-[12px] text-[var(--ink-faint)]">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-black/15 border-t-black/50" />
            Ranking {STREAM_SERVERS.length} servers…
          </span>
        )}
      </div>

      {!probing && healthy.length === 0 && (
        <p className="flex items-center gap-2 text-[12px] text-rose-500">
          No healthy servers responded —{" "}
          <button
            onClick={() => setNonce((n) => n + 1)}
            className="press inline-flex items-center gap-1 rounded-full bg-black/[0.06] px-2.5 py-1 text-[11px] font-semibold text-[var(--ink)] transition hover:bg-black/10"
          >
            <BsArrowRepeat size={11} /> Rescan
          </button>
        </p>
      )}

      {/* expander: full server grid */}
      <div>
        <button
          onClick={() => setShowAll((v) => !v)}
          className="press flex items-center gap-1.5 rounded-full px-1 py-0.5 text-[11.5px] font-semibold text-[var(--ink-soft)] transition hover:text-[var(--ink)]"
        >
          {showAll ? <BsChevronUp size={10} /> : <BsChevronDown size={10} />}
          {showAll ? "Hide" : "All"} servers ({STREAM_SERVERS.length})
        </button>

        {showAll && (
          <div className="light-scroll mt-2 grid max-h-[268px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
            {STREAM_SERVERS.map((s) => {
              const supports = s.langs.includes(lang);
              const h = byId(s.id);
              const isManualActive = mode === s.id;
              const running = autoActive && activeId === s.id;
              const testUrl = supports ? s.build(ids, ep, lang) : null;
              const reason = failReasons?.get(s.id);
              const label = probing
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
                  ? "bg-black/20"
                  : h?.ok
                    ? (h.latency ?? 9999) < 900
                      ? "bg-[var(--success)]"
                      : "bg-amber-400"
                    : "bg-rose-400";

              return (
                <div key={s.id} className="flex min-w-0 items-center gap-1">
                  <button
                    onClick={() => supports && onSelect(s.id)}
                    disabled={!supports}
                    title={s.label}
                    className={`press flex min-w-0 flex-1 items-center gap-2 rounded-full px-3 py-2 text-left text-[12px] font-semibold transition ${
                      isManualActive
                        ? "bg-[#16181f] text-white"
                        : supports
                          ? "bg-black/[0.05] text-[var(--ink)] hover:bg-black/10"
                          : "cursor-not-allowed bg-black/[0.03] text-[var(--ink-faint)]"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot} ${probing ? "animate-pulse" : ""}`}
                    />
                    <span className="min-w-0 flex-1 truncate">{s.label}</span>
                    {running && <span className={chip(isManualActive)}>auto</span>}
                    {reason && (
                      <span className="shrink-0 rounded-full bg-rose-500/15 px-1.5 text-[9px] font-semibold uppercase text-rose-500">
                        {REASON_LABELS[reason] ?? reason}
                      </span>
                    )}
                    <span className={chip(isManualActive)}>{label}</span>
                    {!supports && (
                      <span className="shrink-0 rounded-full bg-black/[0.06] px-1.5 text-[9px] uppercase text-[var(--ink-faint)]">
                        sub
                      </span>
                    )}
                  </button>
                  {testUrl && (
                    <a
                      href={testUrl}
                      target="_blank"
                      rel="noreferrer"
                      title={`Open ${s.label} in a new tab — if this also fails, your network or browser is blocking it`}
                      className="press flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--ink-faint)] transition hover:bg-black/10 hover:text-[var(--ink)]"
                    >
                      <BsBoxArrowUpRight size={11} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!probing && healthy.length > 0 && (
        <p className="text-[11px] text-[var(--ink-faint)]">
          {healthy.length} of {STREAM_SERVERS.length} servers healthy · Auto-pilot plays on the
          fastest one and falls back by itself if it drops.
        </p>
      )}
    </div>
  );
};

export default ServerPicker;
