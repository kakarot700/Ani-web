import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AiOutlineFullscreen,
  AiOutlineFullscreenExit,
} from "react-icons/ai";
import {
  BsArrowCounterclockwise,
  BsArrowClockwise,
  BsFillPauseFill,
  BsFillPlayFill,
  BsVolumeMuteFill,
  BsVolumeUpFill,
} from "react-icons/bs";
import { TbSettings, TbPictureInPictureTop } from "react-icons/tb";
import { HiOutlineChatAlt2 } from "react-icons/hi";

export interface SubtitleTrack {
  label: string;
  lang: string;
  src: string;
}

export interface SkipMarker {
  start: number;
  end: number;
  label: string;
}

interface OtakuPlayerProps {
  src: string;
  poster?: string;
  title: string;
  subtitleTracks?: SubtitleTrack[];
  onEnded?: () => void;
  initialTime?: number;
  onProgress?: (t: number) => void;
  skipMarkers?: SkipMarker[];
}

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

const formatTime = (t: number) => {
  if (!Number.isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

const OtakuPlayer: React.FC<OtakuPlayerProps> = ({
  src,
  poster,
  title,
  subtitleTracks = [],
  onEnded,
  initialTime,
  onProgress,
  skipMarkers = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const clickTimer = useRef<number | undefined>(undefined);
  const seekRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [buffering, setBuffering] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [pip, setPip] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [menu, setMenu] = useState<null | "settings" | "subs">(null);
  const [activeTrack, setActiveTrack] = useState(-1); // -1 = off, 0..n index
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [activeMarker, setActiveMarker] = useState<SkipMarker | null>(null);

  const ccAvailable = subtitleTracks.length > 0;
  const pipSupported =
    typeof document !== "undefined" && "pictureInPictureEnabled" in document;

  // ── control visibility ─────────────────────────────────────
  const poke = useCallback(() => {
    setControlsVisible(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      setControlsVisible(false);
      setMenu(null);
    }, 2600);
  }, []);

  useEffect(() => {
    if (!playing) setControlsVisible(true);
    else poke();
    return () => window.clearTimeout(hideTimer.current);
  }, [playing, poke]);

  // ── fullscreen tracking ────────────────────────────────────
  useEffect(() => {
    const onChange = () =>
      setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ── video element events ───────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      if (!dragRef.current) setCurrent(v.currentTime);
      onProgress?.(v.currentTime);
      try {
        if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
      } catch {
        /* ignore */
      }
      const t = v.currentTime;
      const active =
        skipMarkers.find((m) => t >= m.start && t < Math.min(m.start + 8, m.end)) ?? null;
      setActiveMarker(active);
    };
    const onMeta = () => {
      setDuration(v.duration);
      if (initialTime && initialTime > 0 && initialTime < v.duration - 5) {
        v.currentTime = initialTime;
        setCurrent(initialTime);
      }
    };
    const onWait = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setControlsVisible(true);
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("waiting", onWait);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("waiting", onWait);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
    };
  }, [src]);

  // ── subtitle tracks ────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tracks = v.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = i === activeTrack ? "showing" : "hidden";
    }
  }, [activeTrack, src]);

  // ── actions ────────────────────────────────────────────────
  const flashTimer = useRef<number | undefined>(undefined);
  const showFlash = useCallback((text: string) => {
    setFlash(text);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 700);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  }, []);

  const seekBy = useCallback(
    (delta: number) => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = Math.min(Math.max(0, v.currentTime + delta), v.duration || 0);
      setCurrent(v.currentTime);
      showFlash(`${delta > 0 ? "+" : ""}${delta}s`);
    },
    [showFlash]
  );

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const changeVolume = useCallback((value: number) => {
    const v = videoRef.current;
    if (!v) return;
    const next = Math.min(1, Math.max(0, value));
    v.volume = next;
    v.muted = next === 0;
    setVolume(next);
    setMuted(v.muted);
  }, []);

  const changeRate = useCallback((r: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = r;
    setRate(r);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen();
  }, []);

  const togglePip = useCallback(async () => {
    const v = videoRef.current;
    if (!v || !pipSupported) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else {
        await v.requestPictureInPicture();
        setPip(true);
      }
    } catch {
      /* not allowed */
    }
  }, [pipSupported]);

  const cycleSubtitles = useCallback(() => {
    if (!ccAvailable) return;
    const next = activeTrack >= subtitleTracks.length - 1 ? -1 : activeTrack + 1;
    setActiveTrack(next);
    showFlash(next === -1 ? "Subtitles off" : `CC · ${subtitleTracks[next].label}`);
  }, [activeTrack, subtitleTracks, ccAvailable, showFlash]);

  // ── seek bar pointer handling ──────────────────────────────
  const timeFromEvent = useCallback((clientX: number) => {
    const el = seekRef.current;
    if (!el || !duration) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * duration;
  }, [duration]);

  const onSeekPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragRef.current = true;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      const t = timeFromEvent(e.clientX);
      setCurrent(t);
      if (videoRef.current) videoRef.current.currentTime = t;
    },
    [timeFromEvent]
  );

  const onSeekPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const el = seekRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        setHoverX(e.clientX - rect.left);
      }
      setHoverTime(timeFromEvent(e.clientX));
      if (dragRef.current && videoRef.current) {
        const t = timeFromEvent(e.clientX);
        setCurrent(t);
        videoRef.current.currentTime = t;
      }
    },
    [timeFromEvent]
  );

  const onSeekPointerUp = useCallback(() => {
    dragRef.current = false;
  }, []);

  // ── keyboard shortcuts ─────────────────────────────────────
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowright":
          seekBy(5);
          break;
        case "arrowleft":
          seekBy(-5);
          break;
        case "l":
          seekBy(10);
          break;
        case "j":
          seekBy(-10);
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "c":
          cycleSubtitles();
          break;
        case "arrowup":
          e.preventDefault();
          changeVolume(volume + 0.1);
          break;
        case "arrowdown":
          e.preventDefault();
          changeVolume(volume - 0.1);
          break;
        default:
          break;
      }
      poke();
    },
    [togglePlay, seekBy, toggleMute, toggleFullscreen, cycleSubtitles, changeVolume, volume, poke]
  );

  const progress = duration ? (current / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;

  const cursorClass = controlsVisible ? "cursor-default" : "cursor-none";

  const menuBtn =
    "flex h-9 w-9 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white";

  return (
    <div
      ref={containerRef}
      data-native-cursor
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseMove={poke}
      onMouseLeave={() => playing && setControlsVisible(false)}
      className={`group/player relative w-full overflow-hidden bg-black outline-none ${cursorClass} ${
        fullscreen ? "h-full" : "aspect-video"
      }`}
    >
      <video
        ref={videoRef}
        key={src}
        src={src}
        poster={poster}
        className="h-full w-full"
        playsInline
        onEnded={onEnded}
        onClick={() => {
          window.clearTimeout(clickTimer.current);
          clickTimer.current = window.setTimeout(togglePlay, 200);
        }}
        onDoubleClick={() => {
          window.clearTimeout(clickTimer.current);
          toggleFullscreen();
        }}
      >
        {subtitleTracks.map((t) => (
          <track
            key={t.lang}
            kind="subtitles"
            label={t.label}
            srcLang={t.lang}
            src={t.src}
          />
        ))}
      </video>

      {/* buffering spinner */}
      {buffering && playing && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-white/15 border-t-red-600" />
        </div>
      )}

      {/* action flash */}
      {flash && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-lg bg-black/70 px-5 py-2 text-sm font-bold text-white backdrop-blur">
            {flash}
          </span>
        </div>
      )}

      {/* OP/ED skip marker */}
      {activeMarker && playing && (
        <button
          onClick={() => {
            const v = videoRef.current;
            if (v) {
              v.currentTime = activeMarker.end;
              setCurrent(activeMarker.end);
            }
            setActiveMarker(null);
          }}
          className="absolute bottom-24 right-5 z-20 flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-[0_0_30px_rgba(220,38,38,0.6)] transition hover:-translate-y-0.5 hover:bg-red-500 animate-[fadeup_0.3s_ease]"
        >
          Skip {activeMarker.label}
          <BsArrowClockwise size={15} />
        </button>
      )}

      {/* big center play state */}
      {!playing && !buffering && (
        <button
          onClick={togglePlay}
          aria-label="Play"
          className="press absolute inset-0 m-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-600/90 text-white shadow-[0_0_60px_var(--red-glow)] transition hover:scale-110 hover:bg-red-600"
        >
          <BsFillPlayFill size={38} className="ml-1" />
        </button>
      )}

      {/* top bar (fullscreen) */}
      {fullscreen && (
        <div
          className={`absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-5 py-4 transition-opacity duration-300 ${
            controlsVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="truncate text-sm font-semibold text-white md:text-base">{title}</p>
          <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Otaku Player
          </span>
        </div>
      )}

      {/* bottom controls */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-4 pb-3 pt-10 transition-opacity duration-300 ${
          controlsVisible || !playing ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* seek bar */}
        <div
          ref={seekRef}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.floor(duration)}
          aria-valuenow={Math.floor(current)}
          onPointerDown={onSeekPointerDown}
          onPointerMove={onSeekPointerMove}
          onPointerUp={onSeekPointerUp}
          onPointerLeave={() => setHoverTime(null)}
          className="group/seek relative mb-2 h-4 cursor-pointer touch-none"
        >
          <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/20 transition-all group-hover/seek:h-[5px]">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/30"
              style={{ width: `${bufferedPct}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-red-600"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600 opacity-0 shadow transition-opacity group-hover/seek:opacity-100"
            style={{ left: `${progress}%` }}
          />
          {hoverTime !== null && (
            <div
              className="pointer-events-none absolute bottom-5 -translate-x-1/2 rounded bg-black/90 px-2 py-1 text-[11px] font-bold text-white ring-1 ring-white/10"
              style={{ left: Math.min(Math.max(hoverX, 24), (seekRef.current?.clientWidth ?? 300) - 24) }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={togglePlay} aria-label="Play or pause" className={menuBtn}>
            {playing ? <BsFillPauseFill size={22} /> : <BsFillPlayFill size={22} />}
          </button>
          <button onClick={() => seekBy(-10)} aria-label="Back 10 seconds" className={menuBtn}>
            <BsArrowCounterclockwise size={17} />
          </button>
          <button onClick={() => seekBy(10)} aria-label="Forward 10 seconds" className={menuBtn}>
            <BsArrowClockwise size={17} />
          </button>

          {/* volume */}
          <div className="group/vol flex items-center">
            <button onClick={toggleMute} aria-label="Mute" className={menuBtn}>
              {muted || volume === 0 ? <BsVolumeMuteFill size={19} /> : <BsVolumeUpFill size={19} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              aria-label="Volume"
              className="vol-slider w-0 opacity-0 transition-all duration-300 group-hover/vol:w-20 group-hover/vol:opacity-100"
            />
          </div>

          <span className="ml-1 text-xs font-medium tabular-nums text-white/80">
            {formatTime(current)} <span className="text-white/45">/</span> {formatTime(duration)}
          </span>

          <div className="ml-auto flex items-center gap-1">
            {/* subtitles menu */}
            {ccAvailable && (
              <div className="relative">
                <button
                  onClick={() => setMenu(menu === "subs" ? null : "subs")}
                  aria-label="Subtitles"
                  className={`${menuBtn} ${activeTrack >= 0 ? "text-red-500" : ""}`}
                >
                  <HiOutlineChatAlt2 size={18} />
                </button>
                {menu === "subs" && (
                  <div className="absolute bottom-11 right-0 w-44 overflow-hidden rounded-lg border border-white/15 glass py-1 shadow-2xl backdrop-blur">
                    <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-white/55">
                      Subtitles
                    </p>
                    <button
                      onClick={() => {
                        setActiveTrack(-1);
                        setMenu(null);
                      }}
                      className={`block w-full px-3 py-1.5 text-left text-sm transition hover:bg-white/5 ${
                        activeTrack === -1 ? "font-bold text-[var(--accent)]" : "text-white/80"
                      }`}
                    >
                      Off
                    </button>
                    {subtitleTracks.map((t, i) => (
                      <button
                        key={t.lang}
                        onClick={() => {
                          setActiveTrack(i);
                          setMenu(null);
                        }}
                        className={`block w-full px-3 py-1.5 text-left text-sm transition hover:bg-white/5 ${
                          activeTrack === i ? "font-bold text-[var(--accent)]" : "text-white/80"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* settings (speed) */}
            <div className="relative">
              <button
                onClick={() => setMenu(menu === "settings" ? null : "settings")}
                aria-label="Playback settings"
                className={`${menuBtn} ${rate !== 1 ? "text-red-500" : ""}`}
              >
                <TbSettings size={18} />
              </button>
              {menu === "settings" && (
                <div className="absolute bottom-11 right-0 w-36 overflow-hidden rounded-lg border border-white/15 glass py-1 shadow-2xl backdrop-blur">
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-white/55">
                    Speed
                  </p>
                  {RATES.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        changeRate(r);
                        setMenu(null);
                      }}
                      className={`block w-full px-3 py-1.5 text-left text-sm transition hover:bg-white/5 ${
                        rate === r ? "font-bold text-[var(--accent)]" : "text-white/80"
                      }`}
                    >
                      {r === 1 ? "Normal" : `${r}×`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {pipSupported && (
              <button
                onClick={() => void togglePip()}
                aria-label="Picture in picture"
                className={`${menuBtn} ${pip ? "text-red-500" : ""}`}
              >
                <TbPictureInPictureTop size={18} />
              </button>
            )}

            <button onClick={toggleFullscreen} aria-label="Fullscreen" className={menuBtn}>
              {fullscreen ? (
                <AiOutlineFullscreenExit size={19} />
              ) : (
                <AiOutlineFullscreen size={19} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtakuPlayer;
