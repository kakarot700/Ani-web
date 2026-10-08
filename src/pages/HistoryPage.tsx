import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BsClockHistory, BsFillPlayFill, BsTrash } from "react-icons/bs";
import PageShell from "@/components/PageShell";
import { BlackPill, Card, EmptyState, GhostPill, IconBadge } from "@/components/ui";
import useToasts from "@/lib/toast";
import { getWatchProgress, type WatchProgress } from "@/server/stream";

const timeAgo = (ts: number) => {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
};

const dayLabel = (ts: number) => {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
};

export default function HistoryPage() {
  const push = useToasts((s) => s.push);
  const [items, setItems] = useState<WatchProgress[]>(() => getWatchProgress());

  const clearAll = () => {
    try {
      localStorage.removeItem("otaku-cw");
    } catch {
      /* ignore */
    }
    setItems([]);
    push("Watch history cleared", "info");
  };

  const groups = useMemo(() => {
    const map = new Map<string, WatchProgress[]>();
    for (const item of items) {
      const key = dayLabel(item.updatedAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return [...map.entries()];
  }, [items]);

  return (
    <PageShell
      eyebrow="Keep watching"
      title="History"
      subtitle="Every episode you've opened, most recent first. Stored in this browser only."
      width="narrow"
      action={
        items.length > 0 ? (
          <GhostPill onClick={clearAll}>
            <BsTrash size={11} />
            Clear all
          </GhostPill>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <EmptyState
          title="Nothing watched yet"
          description="Episodes you open will show up here so you can pick up right where you left off."
          action={
            <Link to="/">
              <BlackPill className="bg-white text-[var(--ink)] hover:bg-white/90">
                <BsFillPlayFill size={13} />
                Start watching
              </BlackPill>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map(([label, list]) => (
            <div key={label}>
              <div className="mb-2.5 flex items-center gap-2 px-1">
                <span className="label-pill">{label}</span>
                <span className="text-[11.5px] text-white/40">
                  {list.length} episode{list.length > 1 ? "s" : ""}
                </span>
              </div>
              <Card flush>
                <div className="px-2 py-2">
                  {list.map((p) => (
                    <div
                      key={`${p.id}-${p.ep}-${p.lang}`}
                      className="flex items-center gap-3.5 rounded-[18px] px-3 py-2.5 transition hover:bg-black/[0.04]"
                    >
                      <Link to={`/anime/${p.id}`} className="shrink-0">
                        <img
                          src={p.poster ?? undefined}
                          alt=""
                          className="h-[62px] w-[43px] rounded-[12px] object-cover"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/anime/${p.id}`}
                          className="block truncate text-[13.5px] font-semibold tracking-[-0.01em] text-[var(--ink)] transition hover:text-[var(--accent)]"
                        >
                          {p.title}
                        </Link>
                        <p className="mt-0.5 text-[12px] text-[var(--ink-soft)]">
                          Episode {p.ep} · {p.lang.toUpperCase()}
                        </p>
                        <div className="mt-1.5 h-1 w-32 max-w-full overflow-hidden rounded-full bg-black/[0.07]">
                          <div className="h-full w-2/5 rounded-full bg-[var(--accent)]" />
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="text-[11px] text-[var(--ink-faint)]">
                          {timeAgo(p.updatedAt)}
                        </span>
                        <Link to={`/watch/${p.id}/${p.ep}?lang=${p.lang}`}>
                          <BlackPill>
                            <BsFillPlayFill size={11} />
                            Resume
                          </BlackPill>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <Card
          className="mt-6"
          title="About your history"
          meta="Everything here is local to this browser"
          badge={
            <IconBadge tone="ink">
              <BsClockHistory size={13} />
            </IconBadge>
          }
        >
          <p className="text-[13px] leading-relaxed text-[var(--ink-soft)]">
            Otaku keeps no account and no server-side profile. Your history, list, ratings and
            achievements live in this browser's local storage — clearing site data will remove
            them.
          </p>
        </Card>
      )}
    </PageShell>
  );
}
