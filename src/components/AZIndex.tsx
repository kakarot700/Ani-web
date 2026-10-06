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
        className={`shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-bold transition ${
          active === ""
            ? "bg-red-600 text-white"
            : "bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800 hover:text-white"
        }`}
      >
        All
      </button>
      {LETTERS.map((l) => (
        <button
          key={l}
          onClick={() => onSelect(active === l ? "" : l)}
          className={`shrink-0 rounded-md px-2.5 py-1.5 font-mono text-[11px] font-bold transition ${
            active === l
              ? "bg-red-600 text-white shadow-[0_0_14px_rgba(220,38,38,0.4)]"
              : "bg-zinc-900 text-zinc-500 ring-1 ring-zinc-800 hover:text-white"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
};

export default AZIndex;
