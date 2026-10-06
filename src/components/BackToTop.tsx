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
      className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-zinc-200 shadow-2xl ring-1 ring-zinc-700 transition hover:-translate-y-1 hover:bg-red-600 hover:text-white"
    >
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(220,38,38,0.9)" strokeWidth="2.5"
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
