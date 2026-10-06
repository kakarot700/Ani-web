import React from "react";
import { AiOutlineClose } from "react-icons/ai";
import useFocusTrap from "@/hooks/useFocusTrap";

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const GROUPS: { label: string; keys: { key: string; action: string }[] }[] = [
  {
    label: "Player",
    keys: [
      { key: "Space / K", action: "Play · Pause" },
      { key: "J / L", action: "Back · Forward 10s" },
      { key: "← / →", action: "Seek 5s" },
      { key: "↑ / ↓", action: "Volume" },
      { key: "M", action: "Mute" },
      { key: "C", action: "Cycle subtitles" },
      { key: "F", action: "Fullscreen" },
    ],
  },
  {
    label: "Site",
    keys: [
      { key: "/", action: "Focus search" },
      { key: "?", action: "Toggle this panel" },
      { key: "Esc", action: "Close overlays" },
    ],
  },
];

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ open, onClose }) => {
  const trapRef = useFocusTrap<HTMLDivElement>(open);
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl animate-[fadeup_0.25s_ease] outline-none"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <p className="font-display text-2xl tracking-wide text-white">Keyboard Shortcuts</p>
            <p className="font-jp text-[10px] tracking-[0.3em] text-zinc-500">ショートカット</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <AiOutlineClose size={18} />
          </button>
        </div>
        <div className="space-y-6 px-5 py-5">
          {GROUPS.map((g) => (
            <div key={g.label}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-red-500">
                {g.label}
              </p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {g.keys.map((k) => (
                  <div key={k.key} className="flex items-center justify-between rounded-md bg-zinc-800/60 px-3 py-2">
                    <span className="text-xs text-zinc-400">{k.action}</span>
                    <kbd className="rounded border border-zinc-600 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-200">
                      {k.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;
