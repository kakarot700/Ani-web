import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BsClockHistory, BsFillPlayFill, BsTrashFill } from "react-icons/bs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import useToasts from "@/lib/toast";
import { getWatchProgress, type WatchProgress } from "@/server/stream";

const timeAgo = (ts: number) => {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
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

  const totalEps = useMemo(() => items.length, [items]);

  return (
    <>
      <div className="noise-overlay" aria-hidden="true" />
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-28 md:px-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-1 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.25em] text-red-500">
              <BsClockHistory size={13} />
              Keep Watching
              <span className="font-jp tracking-[0.3em] text-zinc-500">· 履歴</span>
            </p>
            <h1 className="font-display text-5xl tracking-wide text-white md:text-7xl">History</h1>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-bold text-zinc-300 ring-1 ring-zinc-700 transition hover:bg-red-600 hover:text-white"
            >
              <BsTrashFill size={13} />
              Clear all ({totalEps})
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-16 rounded-xl border border-zinc-800 bg-zinc-900/50 p-14 text-center">
            <p className="font-display text-3xl tracking-wide text-zinc-300">Nothing watched yet</p>
            <p className="mt-2 text-sm text-zinc-500">
              Episodes you watch will show up here so you can pick up right where you left off.
            </p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-md bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-500"
            >
              Start watching
            </Link>
          </div>
        ) : (
          <Reveal className="mt-10 space-y-3">
            {items.map((p) => (
              <div
                key={`${p.id}-${p.ep}-${p.lang}`}
                className="group flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 transition hover:-translate-y-0.5 hover:border-red-600/60"
              >
                <Link
                  to={`/watch/${p.id}/${p.ep}?lang=${p.lang}`}
                  className="relative block h-20 w-32 shrink-0 overflow-hidden rounded-lg"
                >
                  {p.poster ? (
                    <img
                      src={p.poster}
                      alt={p.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="h-full w-full bg-zinc-800" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                    <BsFillPlayFill size={22} className="text-white" />
                  </span>
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/anime/${p.id}`}
                    className="block truncate text-base font-bold text-white transition hover:text-red-500"
                  >
                    {p.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Episode {p.ep} · {p.lang.toUpperCase()}
                  </p>
                  <div className="mt-2 h-1 w-40 max-w-full overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full w-1/3 rounded-full bg-red-600" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[11px] font-semibold text-zinc-500">{timeAgo(p.updatedAt)}</span>
                  <Link
                    to={`/watch/${p.id}/${p.ep}?lang=${p.lang}`}
                    className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-500"
                  >
                    <BsFillPlayFill size={12} />
                    Resume
                  </Link>
                </div>
              </div>
            ))}
          </Reveal>
        )}
      </div>
      <Footer />
    </>
  );
}
