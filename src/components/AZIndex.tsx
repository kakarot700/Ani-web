import React from "react";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface AZIndexProps {
  active: string;
  onSelect: (letter: string) => void;
}

const AZIndex: React.FC<AZIndexProps> = ({ active, onSelect }) => {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto pb-1">
      <button
        onClick={() => onSelect("")}
        className={`press shrink-0 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition ${
          active === ""
            ? "bg-white text-[var(--ink)]"
            : "glass text-white/70 hover:text-white"
        }`}
      >
        All
      </button>
      {LETTERS.map((l) => (
        <button
          key={l}
          onClick={() => onSelect(active === l ? "" : l)}
          className={`press tnum shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition ${
            active === l ? "bg-white text-[var(--ink)]" : "glass text-white/60 hover:text-white"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
};

export default AZIndex;
