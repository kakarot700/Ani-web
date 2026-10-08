import React, { useRef } from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import SectionHeader from "./SectionHeader";

interface RowProps {
  title: string;
  jp?: string;
  to?: string;
  children: React.ReactNode;
}

/** Horizontal rail that scrolls by page, with soft glass arrows. */
const Row: React.FC<RowProps> = ({ title, to, children }) => {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="rail-perf group/row">
      <SectionHeader title={title} to={to} />
      <div className="relative">
        <div
          ref={ref}
          className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth pb-1"
          style={{
            maskImage: "linear-gradient(to right, black 95%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, black 95%, transparent)",
          }}
        >
          {children}
        </div>

        {[-1, 1].map((dir) => (
          <button
            key={dir}
            onClick={() => scroll(dir)}
            aria-label={`Scroll ${title} ${dir < 0 ? "left" : "right"}`}
            className={`glass absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white opacity-0 transition group-hover/row:opacity-100 hover:bg-white/25 md:flex ${
              dir < 0 ? "-left-4" : "-right-4"
            }`}
          >
            {dir < 0 ? <BsChevronLeft size={15} /> : <BsChevronRight size={15} />}
          </button>
        ))}
      </div>
    </section>
  );
};

export default Row;
