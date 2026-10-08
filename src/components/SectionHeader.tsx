import React from "react";
import { Link } from "react-router-dom";
import { BsArrowRight } from "react-icons/bs";

interface SectionHeaderProps {
  title: string;
  /** kept for call-site compatibility; the label is no longer rendered */
  jp?: string;
  to?: string;
  action?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, to, action }) => {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <h2 className="text-[19px] font-semibold tracking-[-0.01em] text-white md:text-[21px]">
        {title}
      </h2>
      <div className="flex items-center gap-2">
        {action}
        {to && (
          <Link
            to={to}
            className="glass group inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            View all
            <BsArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default SectionHeader;
