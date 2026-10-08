import React, { useState } from "react";
import { BsBookmark, BsBookmarkCheckFill, BsShareFill, BsStarFill } from "react-icons/bs";
import useToasts from "@/lib/toast";
import useUserList, { STATUS_META, type ListStatus } from "@/lib/userlist";
import { BlackPill, GhostPill } from "./ui";

interface TrackingPanelProps {
  id: string;
  /** light = for use inside white cards, glass = on the gradient */
  tone?: "light" | "glass";
}

const STATUSES: (ListStatus | null)[] = [null, "watching", "plan", "completed", "hold", "dropped"];

const TrackingPanel: React.FC<TrackingPanelProps> = ({ id, tone = "light" }) => {
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
    if (next) push(`Rated ${next}/10`, "success");
  };

  const share = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText
      ? void navigator.clipboard
          .writeText(url)
          .then(() => push("Link copied", "success"))
          .catch(() => push("Couldn't copy link", "error"))
      : push(url, "info");
  };

  const light = tone === "light";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* status dropdown */}
      <div className="relative">
        {light ? (
          <BlackPill onClick={() => setOpen((o) => !o)}>
            {status ? <BsBookmarkCheckFill size={13} /> : <BsBookmark size={13} />}
            {status ? STATUS_META[status].label : "Add to list"}
          </BlackPill>
        ) : (
          <button
            onClick={() => setOpen((o) => !o)}
            className={`press flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
              status
                ? "bg-white text-[var(--ink)]"
                : "glass text-white/90 hover:bg-white/20"
            }`}
          >
            {status ? <BsBookmarkCheckFill size={13} /> : <BsBookmark size={13} />}
            {status ? STATUS_META[status].label : "Add to list"}
          </button>
        )}

        {open && (
          <div className="card-light rise absolute left-0 top-12 z-30 w-[220px] overflow-hidden rounded-[20px] p-1.5">
            {STATUSES.map((s) => (
              <button
                key={s ?? "remove"}
                onClick={() => onStatus(s)}
                className={`flex w-full items-center justify-between rounded-[14px] px-3 py-2 text-left text-[13px] transition hover:bg-black/[0.05] ${
                  status === s ? "font-semibold text-[var(--accent)]" : "text-[var(--ink)]"
                }`}
              >
                {s ? STATUS_META[s].label : <span className="text-[var(--ink-soft)]">Remove from list</span>}
                {status === s && <span className="text-[var(--accent)]">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 1–10 rating */}
      <div
        className={
          light
            ? "flex items-center gap-0.5 rounded-full bg-black/[0.06] px-2.5 py-1.5"
            : "glass flex items-center gap-0.5 rounded-full px-2.5 py-1.5"
        }
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((r) => (
          <button
            key={r}
            onClick={() => onRate(r)}
            aria-label={`Rate ${r} out of 10`}
            className="press p-0.5"
          >
            <BsStarFill
              size={12}
              className={
                r <= (rating ?? 0)
                  ? light
                    ? "text-amber-400"
                    : "text-amber-300"
                  : light
                    ? "text-black/15"
                    : "text-white/25"
              }
            />
          </button>
        ))}
      </div>

      {light ? (
        <GhostPill onClick={share}>
          <BsShareFill size={11} />
          Share
        </GhostPill>
      ) : (
        <button
          onClick={share}
          className="press glass flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-white/90 transition hover:bg-white/20"
        >
          <BsShareFill size={11} />
          Share
        </button>
      )}
    </div>
  );
};

export default TrackingPanel;
