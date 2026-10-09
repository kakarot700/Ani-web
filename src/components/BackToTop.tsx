import React, { useEffect, useState } from "react";
import { BsArrowUp } from "react-icons/bs";

const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setVisible(el.scrollTop > 600);
      setProgress(max > 0 ? el.scrollTop / max : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  const r = 20;
  const c = 2 * Math.PI * r;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="press fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--ink)] shadow-[0_12px_34px_-12px_rgba(0,0,0,0.7)] transition hover:-translate-y-1 hover:bg-white/90 md:bottom-6 md:right-6"
    >
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--accent)" strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
        />
      </svg>
      <BsArrowUp size={16} />
    </button>
  );
};

export default BackToTop;
