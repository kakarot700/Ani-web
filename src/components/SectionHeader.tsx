import React from "react";
import { Link } from "react-router-dom";
import { BsArrowRight } from "react-icons/bs";

interface SectionHeaderProps {
  title: string;
  jp: string;
  to?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, jp, to }) => {
  return (
    <div className="group/head mb-3 flex items-end justify-between">
      <div className="flex items-end gap-3">
        <span className="mb-1 h-7 w-1 rounded-full bg-red-600 transition-all duration-300 group-hover/head:h-9 group-hover/head:w-2 md:mb-1.5 md:h-8" />
        <div>
          <h2 className="font-display text-2xl leading-none tracking-wide text-white transition-colors duration-300 group-hover/head:text-red-500 md:text-4xl">
            {title}
          </h2>
          <p className="font-jp mt-1 text-[10px] tracking-[0.35em] text-zinc-500">{jp}</p>
        </div>
      </div>
      {to && (
        <Link
          to={to}
          className="group flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition hover:text-red-500"
        >
          View all
          <BsArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
