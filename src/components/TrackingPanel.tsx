import React, { useState } from "react";
import { BsBookmarkCheckFill, BsShareFill, BsStarFill } from "react-icons/bs";
import useToasts from "@/lib/toast";
import useUserList, { STATUS_META, type ListStatus } from "@/lib/userlist";

interface TrackingPanelProps {
  id: string;
}

const STATUSES: (ListStatus | null)[] = [null, "watching", "plan", "completed", "hold", "dropped"];

const TrackingPanel: React.FC<TrackingPanelProps> = ({ id }) => {
  const push = useToasts((s) => s.push);
  const entries = useUserList((s) => s.entries);
  const setStatus = useUserList((s) => s.setStatus);
  const setRating = useUserList((s) => s.setRating);
  const [open, setOpen] = useState(false);

  const entry = entries[id];
  const status = entry?.status ?? null;
  const rating = entry?.rating ?? null;

  const onStatus = (next: ListStatus | null) => {
    setStatus(id, next);
    setOpen(false);
    if (next) push(`${STATUS_META[next].label} — saved to My List`, "success");
    else push("Removed from My List", "info");
  };

  const onRate = (r: number) => {
    const next = r === rating ? null : r;
    setRating(id, next);
    if (next) push(`Rated ${next}/10 ★`, "success");
  };

  const share = () => {
    const url = window.location.href;
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard
        .writeText(url)
        .then(() => push("Link copied to clipboard", "success"))
        .catch(() => push("Couldn't copy link", "error"));
    } else {
      push(url, "info");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* status dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold ring-1 transition ${
            status
              ? "bg-red-600 text-white ring-red-600 shadow-[0_6px_24px_-6px_rgba(220,38,38,0.5)]"
              : "bg-zinc-800 text-zinc-200 ring-zinc-700 hover:bg-zinc-700"
          }`}
        >
          <BsBookmarkCheckFill size={15} />
          {status ? STATUS_META[status].label : "Add to List"}
          <span className="text-[9px] opacity-70">▾</span>
        </button>
        {open && (
          <div className="absolute left-0 top-12 z-30 w-52 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900/95 py-1 shadow-2xl backdrop-blur">
            {STATUSES.map((s) => (
              <button
                key={s ?? "remove"}
                onClick={() => onStatus(s)}
                className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm transition hover:bg-white/5 ${
                  status === s ? "font-bold text-red-500" : "text-zinc-200"
                }`}
              >
                {s ? (
                  <>
                    {STATUS_META[s].label}
                    <span className="font-jp text-[10px] text-zinc-500">{STATUS_META[s].jp}</span>
                  </>
                ) : (
                  <span className="text-zinc-400">Remove from list</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 1–10 rating */}
      <div className="flex items-center gap-0.5 rounded-md bg-zinc-800 px-2.5 py-1.5 ring-1 ring-zinc-700">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((r) => (
          <button
            key={r}
            onClick={() => onRate(r)}
            aria-label={`Rate ${r} out of 10`}
            className="p-0.5 transition hover:scale-125"
          >
            <BsStarFill
              size={13}
              className={r <= (rating ?? 0) ? "text-yellow-400" : "text-zinc-600"}
            />
          </button>
        ))}
      </div>

      <button
        onClick={share}
        className="flex items-center gap-2 rounded-md bg-zinc-800 px-4 py-2.5 text-sm font-bold text-zinc-200 ring-1 ring-zinc-700 transition hover:bg-zinc-700"
      >
        <BsShareFill size={14} />
        Share
      </button>
    </div>
  );
};

export default TrackingPanel;
