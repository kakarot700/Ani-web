import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsChevronLeft, BsChevronRight, BsFillPlayFill, BsStarFill } from "react-icons/bs";
import { AiOutlineInfoCircle } from "react-icons/ai";
import ScrambleText from "./ScrambleText";
import Magnetic from "./Magnetic";
import type { ShowDetail } from "@/server/allanime";

const SLIDE_MS = 7000;

interface SpotlightCarouselProps {
  slides: ShowDetail[];
  loading: boolean;
}

const SpotlightCarousel: React.FC<SpotlightCarouselProps> = ({ slides, loading }) => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const frame = useRef<number>(0);
  const startRef = useRef<number>(performance.now());
  const bgRef = useRef<HTMLDivElement>(null);
  const count = slides.length;

  // scroll-linked parallax on the backdrop (skipped for reduced motion)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = bgRef.current;
        if (!el) return;
        const p = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));
        el.style.transform = `translate3d(0, ${p * 8}%, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
      setProgress(0);
      startRef.current = performance.now();
    },
    [count]
  );

  useEffect(() => {
    if (count === 0 || paused) return;
    startRef.current = performance.now() - progress * SLIDE_MS;
    const tick = (now: number) => {
      const p = Math.min(1, (now - startRef.current) / SLIDE_MS);
      setProgress(p);
      if (p >= 1) {
        setIndex((i) => (i + 1) % count);
        setProgress(0);
        startRef.current = now;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, paused, index]);

  if (loading) {
    return (
      <div className="relative flex h-[62vw] max-h-[80vh] min-h-[420px] items-center justify-center overflow-hidden bg-zinc-950">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(700px 400px at 50% 60%, rgba(220,38,38,0.10), transparent 70%)",
          }}
        />
        <p className="font-display animate-pulse text-7xl tracking-[0.15em] text-zinc-800 md:text-9xl">
          OTAKU<span className="text-red-600/50">.</span>
        </p>
        <p className="font-jp absolute bottom-8 text-[10px] tracking-[0.5em] text-zinc-600">
          読込中 · LOADING
        </p>
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-zinc-950 to-transparent" />
      </div>
    );
  }

  if (count === 0) return null;

  const slide = slides[index];
  const episodeCount = slide ? slide.episodes.sub.length || slide.episodeCount || 0 : 0;

  return (
    <div
      className="relative h-[80vw] min-h-[460px] w-full max-h-[94vh] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") goTo(index + 1);
        if (e.key === "ArrowLeft") goTo(index - 1);
      }}
      tabIndex={0}
    >
      {/* crossfading backgrounds with scroll parallax */}
      <div
        ref={bgRef}
        className="absolute inset-x-0"
        style={{ top: "-10%", bottom: "-10%", willChange: "transform" }}
        aria-hidden="true"
      >
        {slides.map((s, i) => (
          <div
            key={s._id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            {(s.banner ?? s.thumbnail) ? (
              <img
                src={s.banner ?? s.thumbnail ?? undefined}
                alt=""
                className={`h-full w-full object-cover object-top ${i === index ? "kenburns" : ""}`}
              />
            ) : (
              <div className="h-full w-full bg-zinc-950" />
            )}
          </div>
        ))}
      </div>

      {/* layered grading */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/75 to-zinc-950/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/40" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(640px 340px at 22% 64%, rgba(220,38,38,0.20), transparent 70%)",
        }}
      />

      {/* katakana watermark */}
      <p
        className="font-jp pointer-events-none absolute right-6 top-24 hidden text-4xl font-bold tracking-[0.5em] text-white/10 select-none lg:block"
        style={{ writingMode: "vertical-rl" }}
      >
        注目の作品
      </p>

      {/* slide copy */}
      {slide && (
        <div key={slide._id} className="absolute left-4 top-[18%] max-w-2xl animate-[fadeup_0.6s_ease] md:left-16">
          <p className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.25em] text-red-500 md:text-xs">
            <span className="font-display text-2xl leading-none text-white md:text-3xl">
              #{index + 1}
            </span>
            Spotlight
            <span className="font-jp tracking-[0.3em] text-zinc-400">· スポットライト</span>
          </p>

          <h1 className="font-display text-5xl leading-[0.95] tracking-wide text-white drop-shadow-2xl md:text-8xl">
            <ScrambleText text={slide.name} />
          </h1>
          {slide.englishName && slide.englishName !== slide.name && (
            <p className="mt-2 text-sm font-medium text-zinc-300 md:text-lg">{slide.englishName}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold md:text-xs">
            {typeof slide.score === "number" && slide.score > 0 && (
              <span className="flex items-center gap-1 rounded-md bg-yellow-400/15 px-2 py-1 text-yellow-400 ring-1 ring-yellow-400/30">
                <BsStarFill size={10} />
                {slide.score.toFixed(1)}
              </span>
            )}
            <span className="rounded-md bg-white/10 px-2 py-1 text-white ring-1 ring-white/15 backdrop-blur">
              {slide.type ?? "TV"}
            </span>
            <span className="rounded-md bg-white/10 px-2 py-1 text-white ring-1 ring-white/15 backdrop-blur">
              HD
            </span>
            {episodeCount > 0 && (
              <span className="rounded-md bg-white/10 px-2 py-1 text-white ring-1 ring-white/15 backdrop-blur">
                {episodeCount} eps
              </span>
            )}
            {slide.season?.year && (
              <span className="rounded-md bg-white/10 px-2 py-1 text-white ring-1 ring-white/15 backdrop-blur">
                {slide.season.year}
              </span>
            )}
            {slide.rating && (
              <span className="rounded-md border border-zinc-500/50 px-2 py-1 text-zinc-300">
                {slide.rating}
              </span>
            )}
          </div>

          <p className="mt-4 line-clamp-3 w-[94%] text-xs leading-relaxed text-zinc-300 md:w-[78%] md:text-[15px]">
            {slide.description}
          </p>

          <div className="mt-6 flex items-center gap-3">
            {episodeCount > 0 && (
              <Magnetic strength={10}>
                <button
                  onClick={() => navigate(`/watch/${slide._id}/1`)}
                  className="press flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_30px_-6px_var(--red-glow)] transition hover:bg-red-500 md:px-7 md:py-3 md:text-base"
                >
                  <BsFillPlayFill size={20} />
                  Watch Now
                </button>
              </Magnetic>
            )}
            <button
              onClick={() => navigate(`/anime/${slide._id}`)}
              className="press flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-bold text-white ring-1 ring-white/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20 md:px-7 md:py-3 md:text-base"
            >
              <AiOutlineInfoCircle size={18} />
              Detail
            </button>
          </div>
        </div>
      )}

      {/* arrows */}
      <button
        onClick={() => goTo(index - 1)}
        aria-label="Previous spotlight"
        className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-950/60 text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-red-600 md:left-5"
      >
        <BsChevronLeft size={18} />
      </button>
      <button
        onClick={() => goTo(index + 1)}
        aria-label="Next spotlight"
        className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-950/60 text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-red-600 md:right-5"
      >
        <BsChevronRight size={18} />
      </button>

      {/* indicators + counter */}
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 md:left-16 md:translate-x-0">
        <span className="text-xs font-bold tabular-nums text-white">
          {String(index + 1).padStart(2, "0")}
          <span className="text-zinc-500"> / {String(count).padStart(2, "0")}</span>
        </span>
        <div className="flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s._id}
              onClick={() => goTo(i)}
              aria-label={`Go to spotlight ${i + 1}`}
              className="group/ind relative h-1.5 overflow-hidden rounded-full bg-white/20 transition-all"
              style={{ width: i === index ? 44 : 18 }}
            >
              {i < index && <span className="absolute inset-0 bg-white/70" />}
              {i === index && (
                <span
                  className="absolute inset-y-0 left-0 bg-red-600"
                  style={{ width: `${progress * 100}%` }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpotlightCarousel;
