import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AiOutlineLeft } from "react-icons/ai";
import { BsFillPlayFill, BsLightningChargeFill, BsStarFill } from "react-icons/bs";
import OtakuPlayer, { type SkipMarker } from "@/components/OtakuPlayer";
import Footer from "@/components/Footer";
import { BlackPill, Card, Chip, IconBadge, InfoRow, SuccessChip } from "@/components/ui";
import { getMovie, movies } from "@/lib/movies";

const MAL_BY_ID: Record<string, number> = {
  "attack-on-titan": 16498,
  "death-note": 1535,
  "demon-slayer": 38000,
  naruto: 20,
  "one-piece": 21,
};

const SHORTCUTS: { key: string; action: string }[] = [
  { key: "Space / K", action: "Play · pause" },
  { key: "J / L", action: "Back · forward 10s" },
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

  useEffect(() => {
    setMarkers([]);
    if (!malId) return;
    let alive = true;
    fetch(`https://api.aniskip.com/v2/skip-times/${malId}/1?types=op&types=ed&episodeLength=25`)
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
      <>
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="card-light rounded-[24px] p-10 text-center">
            <p className="text-[17px] font-semibold text-[var(--ink)]">Clip not found</p>
            <p className="mt-1.5 text-[13px] text-[var(--ink-soft)]">
              That classic clip isn't in the collection.
            </p>
            <div className="mt-5 flex justify-center">
              <BlackPill onClick={() => navigate("/")}>Back home</BlackPill>
            </div>
          </div>
        </div>
      </>
    );
  }

  const next = queue[0];

  return (
    <div className="min-h-screen pb-24">
      {/* top bar */}
      <nav className="glass sticky top-0 z-30 flex items-center gap-3 border-x-0 border-t-0 px-3 py-3 md:px-5">
        <button
          onClick={() => navigate("/")}
          aria-label="Back to home"
          className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/85 transition hover:bg-white/20 hover:text-white"
        >
          <AiOutlineLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold tracking-[-0.015em] text-white">
            {data.title}
          </p>
          <p className="truncate text-[11.5px] text-white/55">
            Classic clip · {data.duration} episodes · {data.year}
          </p>
        </div>
        <button
          onClick={() => setAutoNext((c) => !c)}
          className={`press hidden items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition sm:flex ${
            autoNext
              ? "bg-[var(--success)]/20 text-white ring-1 ring-[var(--success)]/40"
              : "bg-white/10 text-white/70 ring-1 ring-white/15 hover:bg-white/20 hover:text-white"
          }`}
        >
          <BsLightningChargeFill size={11} />
          Autoplay {autoNext ? "on" : "off"}
        </button>
      </nav>

      <main className="mx-auto mt-4 grid max-w-[1400px] gap-5 px-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-[28px] bg-black ring-1 ring-white/12">
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

            {resumeAt !== null && startOffset === 0 && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-md">
                <div className="card-light rise w-[300px] rounded-[24px] p-6 text-center">
                  <p className="text-[12.5px] font-medium text-[var(--ink-soft)]">You left off at</p>
                  <p className="tnum mt-1 text-[34px] font-semibold tracking-[-0.03em] text-[var(--ink)]">
                    {formatMMSS(resumeAt)}
                  </p>
                  <div className="mt-5 flex justify-center gap-2">
                    <BlackPill onClick={() => setStartOffset(resumeAt)}>
                      <BsFillPlayFill size={13} />
                      Resume
                    </BlackPill>
                    <button
                      onClick={() => {
                        setResumeAt(null);
                        setStartOffset(0.01);
                      }}
                      className="press rounded-full bg-black/[0.06] px-4 py-2 text-[13px] font-semibold text-[var(--ink)] transition hover:bg-black/10"
                    >
                      Start over
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Card
            title={data.title}
            meta={`${data.year} · ${data.rating} · ${data.duration} episodes`}
            badge={
              <IconBadge tone="warm">
                <BsFillPlayFill size={13} />
              </IconBadge>
            }
            action={
              <Chip className="bg-black/[0.06] text-[var(--ink)]">
                <BsStarFill size={8} className="text-amber-400" />
                8.{(data.title.length % 9) + 1}
              </Chip>
            }
          >
            <p className="text-[13.5px] leading-relaxed text-[var(--ink-soft)]">{data.description}</p>
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {data.genre.split(" · ").map((g) => (
                <span key={g} className="chip-dark">
                  {g}
                </span>
              ))}
            </div>
            <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-black/[0.07] pt-3.5">
              <SuccessChip>CC in English & 日本語 · press C</SuccessChip>
              {markers.length > 0 && <SuccessChip>OP/ED markers loaded</SuccessChip>}
            </div>
          </Card>

          <Card
            title="Keyboard shortcuts"
            meta="Works whenever the player is focused"
            badge={
              <IconBadge tone="ink">
                <span className="text-[13px] font-bold">⌘</span>
              </IconBadge>
            }
          >
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
              {SHORTCUTS.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-2 py-1">
                  <span className="truncate text-[12.5px] text-[var(--ink-soft)]">{s.action}</span>
                  <kbd className="shrink-0 rounded-md bg-black/[0.07] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--ink)]">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card
            title="Up next"
            meta={autoNext ? "Autoplay is on" : "Autoplay is off"}
            badge={
              <IconBadge tone="accent">
                <BsFillPlayFill size={13} />
              </IconBadge>
            }
            flush
          >
            <div className="px-2 pb-2">
              {queue.map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate(`/play/${m.id}`)}
                  className="flex w-full items-center gap-3 rounded-[18px] px-3 py-2.5 text-left transition hover:bg-black/[0.04]"
                >
                  <span className="relative aspect-video w-[86px] shrink-0 overflow-hidden rounded-[12px]">
                    <img src={m.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition hover:opacity-100">
                      <BsFillPlayFill size={16} className="text-white" />
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-[var(--ink)]">
                      {m.title}
                    </span>
                    <span className="block truncate text-[11.5px] text-[var(--ink-soft)]">
                      {m.genre}
                    </span>
                    <span className="block text-[11px] text-[var(--ink-faint)]">
                      {m.duration} eps · {m.year}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <Card title="Playback" meta="This clip">
            <InfoRow label="Subtitles" value="English · 日本語" />
            <InfoRow label="Skip markers" value={markers.length ? `${markers.length} loaded` : "none"} />
            <InfoRow label="Autoplay next" value={autoNext ? "On" : "Off"} />
          </Card>
        </aside>
      </main>

      <Footer />
    </div>
  );
};

export default Watch;
