import React from "react";
import { computeAchievements, type AchievementContext } from "@/lib/achievements";
import { IconBadge } from "./ui";

interface AchievementsGridProps {
  ctx: AchievementContext;
}

/** White card of achievement tiles: badge → name → one-line goal → progress. */
const AchievementsGrid: React.FC<AchievementsGridProps> = ({ ctx }) => {
  const achievements = computeAchievements(ctx);
  const unlocked = achievements.filter((a) => a.isUnlocked).length;
  const pct = achievements.length ? Math.round((unlocked / achievements.length) * 100) : 0;

  return (
    <section className="card-light overflow-hidden rounded-[26px]">
      <header className="flex flex-wrap items-center gap-3 px-5 pb-4 pt-5 md:px-6">
        <IconBadge tone={pct > 0 ? "success" : "ink"}>
          <span className="text-[13px] font-bold">✓</span>
        </IconBadge>
        <div className="min-w-0 flex-1">
          <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
            Achievements
          </h2>
          <p className="text-[12.5px] text-[var(--ink-soft)]">
            <span className="tnum font-semibold text-[var(--ink)]">
              {unlocked}/{achievements.length}
            </span>{" "}
            unlocked · {pct}% of the set
          </p>
        </div>
        <div className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-black/[0.07] sm:block">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-px bg-black/[0.07] sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => {
          const progress = Math.min(100, (a.progress.cur / Math.max(1, a.progress.goal)) * 100);
          return (
            <div key={a.id} className="bg-white/70 p-5">
              <div className="flex items-start gap-3">
                <span
                  className={`text-[22px] leading-none ${a.isUnlocked ? "" : "opacity-40 grayscale"}`}
                >
                  {a.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={`truncate text-[13.5px] font-semibold ${
                        a.isUnlocked ? "text-[var(--ink)]" : "text-[var(--ink-soft)]"
                      }`}
                    >
                      {a.name}
                    </p>
                    {a.isUnlocked && (
                      <span className="shrink-0 rounded-full bg-[var(--success)]/15 px-1.5 text-[10px] font-bold text-[var(--success)]">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11.5px] leading-snug text-[var(--ink-faint)]">{a.desc}</p>
                </div>
              </div>

              {!a.isUnlocked && (
                <>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-black/[0.07]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]/70"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="tnum mt-1.5 text-[10.5px] text-[var(--ink-faint)]">
                    {a.progress.cur} / {a.progress.goal}
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AchievementsGrid;
