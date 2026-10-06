import React, { useEffect, useRef, useState } from "react";

const GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789#%&<>/*";

interface ScrambleTextProps {
  text: string;
  className?: string;
  duration?: number;
}

/** Decodes text from katakana/static noise into the final string. */
const ScrambleText: React.FC<ScrambleTextProps> = ({ text, className = "", duration = 650 }) => {
  const [display, setDisplay] = useState(text);
  const frame = useRef<number>(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(text);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // how many chars are "resolved"
      const resolved = Math.floor(p * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        if (i < resolved || text[i] === " ") out += text[i];
        else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      setDisplay(out);
      if (p < 1) frame.current = requestAnimationFrame(tick);
      else setDisplay(text);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [text, duration]);

  return <span className={className}>{display}</span>;
};

export default ScrambleText;
