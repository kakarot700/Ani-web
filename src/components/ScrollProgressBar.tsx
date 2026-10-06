import React, { useEffect, useState } from "react";

const ScrollProgressBar: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = document.documentElement;
        const max = el.scrollHeight - el.clientHeight;
        setProgress(max > 0 ? el.scrollTop / max : 0);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (progress <= 0.001) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-red-700 via-red-500 to-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
};

export default ScrollProgressBar;
