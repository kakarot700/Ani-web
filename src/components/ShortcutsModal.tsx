import React from "react";
import { AiOutlineClose } from "react-icons/ai";
import useFocusTrap from "@/hooks/useFocusTrap";
import { DarkChip, IconBadge } from "./ui";

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const GROUPS: { label: string; keys: { key: string; action: string }[] }[] = [
  {
    label: "Player",
    keys: [
      { key: "Space / K", action: "Play · pause" },
      { key: "J / L", action: "Back · forward 10s" },
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
      { key: "⌘K", action: "Command palette" },
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
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-md"
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="card-light rise w-full max-w-xl overflow-hidden rounded-[28px] outline-none"
      >
        <header className="flex items-center gap-3 px-6 pb-4 pt-6">
          <IconBadge tone="ink">
            <span className="text-[13px] font-bold">⌘</span>
          </IconBadge>
          <div className="min-w-0 flex-1">
            <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
              Keyboard shortcuts
            </h2>
            <p className="text-[12.5px] text-[var(--ink-soft)]">
              Everything is reachable without a mouse
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="press flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.06] text-[var(--ink-soft)] transition hover:bg-black/10 hover:text-[var(--ink)]"
          >
            <AiOutlineClose size={16} />
          </button>
        </header>

        <div className="grid gap-5 px-6 pb-6 sm:grid-cols-2">
          {GROUPS.map((g) => (
            <section key={g.label}>
              <p className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                {g.label}
              </p>
              <div className="space-y-1">
                {g.keys.map((k) => (
                  <div
                    key={k.key}
                    className="flex items-center justify-between gap-3 border-t border-black/[0.07] py-2 first:border-t-0"
                  >
                    <span className="truncate text-[12.5px] text-[var(--ink-soft)]">
                      {k.action}
                    </span>
                    <DarkChip>{k.key}</DarkChip>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;
