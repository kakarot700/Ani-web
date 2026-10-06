import React, { useEffect, useMemo, useRef, useState } from "react";

const LETTERS = ["O", "T", "A", "K", "U"];

// scattered ambient glyphs behind the wordmark
const GLYPHS = "アニメ漫画動画配信劇場版";

interface BootScreenProps {
  onDone: () => void;
}

const BootScreen: React.FC<BootScreenProps> = ({ onDone }) => {
  const [exiting, setExiting] = useState(false);
  const startedExit = useRef(false);

  // deterministic glyph field
  const glyphs = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        ch: GLYPHS[i % GLYPHS.length],
        left: (i * 37) % 100,
        top: (i * 53) % 100,
        size: 14 + ((i * 13) % 26),
        delay: (i % 7) * 0.3,
      })),
    []
  );

  const beginExit = () => {
    if (startedExit.current) return;
    startedExit.current = true;
    setExiting(true);
    window.setTimeout(onDone, 520);
  };

  useEffect(() => {
    // skip the boot entirely for reduced-motion users
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDone();
      return;
    }
    const hold = window.setTimeout(beginExit, 1650);
    return () => window.clearTimeout(hold);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`boot-overlay ${exiting ? "is-exiting" : ""}`}
      onClick={beginExit}
      role="presentation"
      aria-label="Otaku is loading"
    >
      {/* ambient glyph field */}
      <div className="absolute inset-0" aria-hidden="true">
        {glyphs.map((g, i) => (
          <span
            key={i}
            className="font-jp absolute select-none font-bold text-zinc-500"
            style={{
              left: `${g.left}%`,
              top: `${g.top}%`,
              fontSize: g.size,
              opacity: 0.06,
              animation: `boot-glyph 2.4s ease-in-out ${g.delay}s infinite`,
            }}
          >
            {g.ch}
          </span>
        ))}
      </div>

      {/* projector vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(700px 400px at 50% 50%, rgba(220,38,38,0.10), transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* wordmark */}
      <div className="relative flex flex-col items-center">
        <div className="flex items-end gap-1 md:gap-2">
          {LETTERS.map((l, i) => (
            <span
              key={i}
              className="font-display text-7xl leading-none text-white md:text-9xl"
              style={{
                animation: `boot-letter 0.5s var(--ease-spring) ${0.12 * i}s both`,
              }}
            >
              {l}
            </span>
          ))}
        </div>

        {/* red slash */}
        <span
          className="mt-4 block h-[3px] w-40 origin-left bg-red-600 md:w-64"
          style={{ animation: "boot-slash 0.4s var(--ease-out) 0.75s both" }}
          aria-hidden="true"
        />

        {/* sub line */}
        <p
          className="font-jp mt-5 text-xs tracking-[0.6em] text-zinc-500 md:text-sm"
          style={{ animation: "boot-letter 0.6s var(--ease-out) 1s both" }}
        >
          ストリーム
        </p>

        <p
          className="mt-8 text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-700"
          style={{ animation: "boot-glyph 1.6s ease-in-out 1.2s infinite" }}
        >
          loading your worlds
        </p>
      </div>

      {/* bottom red edge revealed during exit */}
      <span className="absolute inset-x-0 bottom-0 h-1 bg-red-600" aria-hidden="true" />
    </div>
  );
};

export default BootScreen;
