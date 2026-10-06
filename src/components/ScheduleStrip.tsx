import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BsClock } from "react-icons/bs";
import SectionHeader from "./SectionHeader";
import Img from "./Img";
import { getAiringSchedule, type AiringEntry } from "@/server/allanime";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const formatCountdown = (targetSec: number) => {
  const diff = targetSec * 1000 - Date.now();
  if (diff <= 0) return "Airing now";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
};

const ScheduleStrip: React.FC = () => {
  const [entries, setEntries] = useState<AiringEntry[]>([]);
  const [activeDay, setActiveDay] = useState<number>(() => (new Date().getDay() + 6) % 7);
  const [, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    getAiringSchedule()
      .then((e) => alive && setEntries(e))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  // tick countdown every second
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<number, AiringEntry[]>();
    for (const e of entries) {
      const d = (new Date(e.airingAt * 1000).getDay() + 6) % 7; // Mon=0
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(e);
    }
    return map;
  }, [entries]);

  const todayCount = byDay.get((new Date().getDay() + 6) % 7)?.length ?? 0;

  if (entries.length === 0) return null;

  const dayEntries = byDay.get(activeDay) ?? [];

  return (
    <section className="px-4 md:px-12">
      <SectionHeader title="Airing Schedule" jp="放送予定" />

      {/* weekday strip */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {DAY_NAMES.map((name, i) => {
          const count = byDay.get(i)?.length ?? 0;
          const isToday = i === (new Date().getDay() + 6) % 7;
          const isActive = i === activeDay;
          return (
            <button
              key={name}
              onClick={() => setActiveDay(i)}
              className={`relative flex min-w-[70px] flex-col items-center rounded-lg px-4 py-2.5 ring-1 transition ${
                isActive
                  ? "bg-red-600 text-white ring-red-600 shadow-[0_0_20px_rgba(220,38,38,0.35)]"
                  : "bg-zinc-900 text-zinc-400 ring-zinc-800 hover:text-white"
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wider">{name}</span>
              <span className={`text-[10px] ${isActive ? "text-red-100" : "text-zinc-600"}`}>
                {count > 0 ? `${count} ep` : "—"}
              </span>
              {isToday && (
                <span className="absolute -top-1.5 rounded-full bg-zinc-950 px-1.5 text-[8px] font-bold uppercase tracking-wider text-red-500 ring-1 ring-red-600">
                  today
                </span>
              )}
            </button>
          );
        })}
      </div>

      {dayEntries.length === 0 ? (
        <p className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center text-sm text-zinc-500">
          Nothing scheduled for {DAY_NAMES[activeDay]} yet — check back soon.
        </p>
      ) : (
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {dayEntries.map((e) => (
            <Link
              key={`${e.show._id}-${e.airingAt}`}
              to={`/anime/${e.show._id}`}
              className="group relative w-56 shrink-0 overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-zinc-800 transition hover:-translate-y-1 hover:ring-red-600/70"
            >
              <div className="relative h-28 overflow-hidden">
                <Img
                  src={e.show.thumbnail}
                  alt={e.show.name}
                  className="absolute inset-0"
                  imgClassName="object-top transition duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-bold text-red-400 backdrop-blur">
                  <BsClock size={10} />
                  {formatCountdown(e.airingAt)}
                </span>
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-bold text-white group-hover:text-red-500">
                  {e.show.name}
                </p>
                <p className="mt-1 text-[10px] text-zinc-500">
                  {e.episode ? `Episode ${e.episode}` : "New episode"} ·{" "}
                  {new Date(e.airingAt * 1000).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
      {todayCount > 0 && (
        <p className="mt-2 text-[11px] text-zinc-600">
          {todayCount} episode{todayCount > 1 ? "s" : ""} airing today · countdowns update live
        </p>
      )}
    </section>
  );
};

export default ScheduleStrip;
