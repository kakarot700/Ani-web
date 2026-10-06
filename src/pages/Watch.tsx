import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AiOutlineLeft } from "react-icons/ai";
import { BsFillPlayFill, BsStarFill } from "react-icons/bs";
import { HiOutlineChatAlt2, HiOutlineLightningBolt } from "react-icons/hi";
import OtakuPlayer, { type SkipMarker } from "@/components/OtakuPlayer";
import { getMovie, movies } from "@/lib/movies";

const MAL_BY_ID: Record<string, number> = {
  "attack-on-titan": 16498,
  "death-note": 1535,
  "demon-slayer": 38000,
  naruto: 20,
  "one-piece": 21,
};

const SHORTCUTS: { key: string; action: string }[] = [
  { key: "Space / K", action: "Play · Pause" },
  { key: "J / L", action: "Back · Forward 10s" },
  { key: "← / →", action: "Seek 5s" },
  { key: "↑ / ↓", action: "Volume" },
  { key: "M", action: "Mute" },
  { key: "C", action: "Cycle subtitles" },
  { key: "F", action: "Fullscreen" },
];

const formatMMSS = (t: number) => {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

const Watch = () => {
  const navigate = useNavigate();
  const { movieId } = useParams();
  const data = getMovie(movieId);
  const [autoNext, setAutoNext] = useState(true);
  const [markers, setMarkers] = useState<SkipMarker[]>([]);
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const [startOffset, setStartOffset] = useState(0);

  const malId = data ? MAL_BY_ID[data.id] ?? data.malId : undefined;
  const progressKey = data ? `otaku-pos-${data.id}` : null;

  // fetch OP/ED skip markers from Aniskip
  useEffect(() => {
    setMarkers([]);
    if (!malId) return;
    let alive = true;
    fetch(
      `https://api.aniskip.com/v2/skip-times/${malId}/1?types=op&types=ed&episodeLength=25`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!alive || !json?.found || !Array.isArray(json.results)) return;
        const m: SkipMarker[] = [];
        for (const r of json.results) {
          const start = r.interval?.startTime;
          const end = r.interval?.endTime;
          if (typeof start === "number" && typeof end === "number" && end > start) {
            m.push({
              start,
              end,
              label: r.skipType === "op" ? "Opening" : r.skipType === "ed" ? "Ending" : "Intro",
            });
          }
        }
        setMarkers(m);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [malId]);

  // resume-at-timestamp prompt
  useEffect(() => {
    setResumeAt(null);
    setStartOffset(0);
    if (!progressKey) return;
    try {
      const saved = Number(localStorage.getItem(progressKey));
      if (Number.isFinite(saved) && saved > 8) setResumeAt(saved);
    } catch {
      /* ignore */
    }
  }, [progressKey]);

  const onProgress = useCallback(
    (t: number) => {
      if (!progressKey) return;
      try {
        // throttle writes to ~1/sec
        if (Math.floor(t) !== Math.floor(Number(localStorage.getItem(progressKey) ?? 0))) {
          localStorage.setItem(progressKey, String(t));
        }
      } catch {
        /* ignore */
      }
    },
    [progressKey]
  );

  const queue = useMemo(() => {
    if (!data) return [];
    const idx = movies.findIndex((m) => m.id === data.id);
    return [...movies.slice(idx + 1), ...movies.slice(0, idx)];
  }, [data]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [movieId]);

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-zinc-300">Clip not found.</p>
        <button
          onClick={() => navigate("/")}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Back to home
        </button>
      </div>
    );
  }

  const next = queue[0];

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      <nav className="sticky top-0 z-20 flex items-center gap-4 border-b border-zinc-800/80 bg-zinc-950/90 px-4 py-3 backdrop-blur md:px-12">
        <button
          onClick={() => navigate("/")}
          className="text-zinc-300 transition hover:text-white"
          aria-label="Back to home"
        >
          <AiOutlineLeft size={28} />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">
            Now Playing · Otaku Classics
          </p>
          <p className="truncate text-base font-bold text-white md:text-xl">{data.title}</p>
        </div>
        <button
          onClick={() => setAutoNext((c) => !c)}
          className={`ml-auto hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ring-1 transition sm:flex ${
            autoNext
              ? "bg-red-600/15 text-red-400 ring-red-600/50 hover:bg-red-600/25"
              : "bg-zinc-900 text-zinc-400 ring-zinc-700 hover:text-white"
          }`}
        >
          <HiOutlineLightningBolt size={14} />
          Autoplay next {autoNext ? "on" : "off"}
        </button>
      </nav>

      <div className="mx-auto mt-6 grid max-w-[1500px] gap-8 px-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-xl shadow-[0_20px_80px_-20px_rgba(0,0,0,0.9)] ring-1 ring-zinc-800">
            <OtakuPlayer
              key={`${data.id}-${startOffset}`}
              src={data.videoUrl}
              poster={data.thumbnailUrl}
              title={data.title}
              subtitleTracks={data.subtitles}
              initialTime={startOffset}
              onProgress={onProgress}
              skipMarkers={markers}
              onEnded={() => autoNext && next && navigate(`/play/${next.id}`)}
            />

            {/* resume prompt */}
            {resumeAt !== null && startOffset === 0 && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-6 text-center shadow-2xl animate-[fadeup_0.3s_ease]">
                  <p className="text-sm font-semibold text-zinc-300">You left off at</p>
                  <p className="font-display mt-1 text-4xl tracking-wide text-white">
                    {formatMMSS(resumeAt)}
                  </p>
                  <div className="mt-4 flex justify-center gap-3">
                    <button
                      onClick={() => setStartOffset(resumeAt)}
                      className="flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-500"
                    >
                      <BsFillPlayFill size={16} />
                      Resume
                    </button>
                    <button
                      onClick={() => {
                        setResumeAt(null);
                        setStartOffset(0.01);
                      }}
                      className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:bg-zinc-700"
                    >
                      Start over
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl tracking-wide text-white md:text-4xl">{data.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <span className="flex items-center gap-1 font-semibold text-yellow-400">
                    <BsStarFill size={10} /> 8.{(data.title.length % 9) + 1}
                  </span>
                  <span className="text-zinc-700">•</span>
                  <span>{data.year}</span>
                  <span className="text-zinc-700">•</span>
                  <span className="rounded border border-zinc-600 px-1.5 py-px">{data.rating}</span>
                  <span className="text-zinc-700">•</span>
                  <span>{data.duration} Episodes</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.genre.split(" · ").map((g) => (
                  <span key={g} className="rounded-full border border-zinc-600 px-2.5 py-0.5 text-[11px] text-zinc-300">
                    {g}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-300">{data.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-zinc-500">
              <span className="flex items-center gap-2">
                <HiOutlineChatAlt2 size={14} className="text-red-500" />
                CC in English & 日本語 — press C to cycle.
              </span>
              {markers.length > 0 && (
                <span className="flex items-center gap-2">
                  <HiOutlineLightningBolt size={14} className="text-yellow-400" />
                  OP/ED skip markers loaded from AniSkip.
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Keyboard shortcuts</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
              {SHORTCUTS.map((s) => (
                <div key={s.key} className="flex items-center gap-2">
                  <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                    {s.key}
                  </kbd>
                  <span className="text-xs text-zinc-400">{s.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Up next {autoNext && <span className="text-red-500">· auto</span>}
          </p>
          <div className="space-y-3">
            {queue.map((m) => (
              <button
                key={m.id}
                onClick={() => navigate(`/play/${m.id}`)}
                className="group flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5 text-left transition hover:border-red-600/60 hover:bg-zinc-900"
              >
                <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={m.thumbnailUrl}
                    alt={m.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                    <BsFillPlayFill size={18} className="text-white" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{m.title}</p>
                  <p className="truncate text-[11px] text-zinc-500">{m.genre}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-600">
                    {m.duration} eps · {m.year}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Watch;
