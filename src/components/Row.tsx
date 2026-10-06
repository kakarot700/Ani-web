import React, { useRef } from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import SectionHeader from "./SectionHeader";

interface RowProps {
  title: string;
  jp: string;
  to?: string;
  children: React.ReactNode;
}

const Row: React.FC<RowProps> = ({ title, jp, to, children }) => {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="rail-perf group/row px-4 md:px-12">
      <SectionHeader title={title} jp={jp} to={to} />
      <div className="relative">
        <div
          ref={ref}
          className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth pb-2"
          style={{
            maskImage: "linear-gradient(to right, black 94%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, black 94%, transparent)",
          }}
        >
          {children}
        </div>
        <button
          onClick={() => scroll(-1)}
          aria-label={`Scroll ${title} left`}
          className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-900/95 text-zinc-300 opacity-0 shadow-xl ring-1 ring-zinc-700 transition hover:bg-red-600 hover:text-white group-hover/row:opacity-100 md:flex"
        >
          <BsChevronLeft size={16} />
        </button>
        <button
          onClick={() => scroll(1)}
          aria-label={`Scroll ${title} right`}
          className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-900/95 text-zinc-300 opacity-0 shadow-xl ring-1 ring-zinc-700 transition hover:bg-red-600 hover:text-white group-hover/row:opacity-100 md:flex"
        >
          <BsChevronRight size={16} />
        </button>
      </div>
    </section>
  );
};

export default Row;
