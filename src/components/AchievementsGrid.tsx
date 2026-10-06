import React from "react";
import { computeAchievements, type AchievementContext } from "@/lib/achievements";

interface AchievementsGridProps {
  ctx: AchievementContext;
}

const AchievementsGrid: React.FC<AchievementsGridProps> = ({ ctx }) => {
  const achievements = computeAchievements(ctx);
  const unlocked = achievements.filter((a) => a.isUnlocked).length;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">
          Achievements · <span className="font-jp text-red-500">実績</span>
        </p>
        <span className="text-xs font-bold text-zinc-500">
          <span className="text-red-500">{unlocked}</span>/{achievements.length} unlocked
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {achievements.map((a) => (
          <div
            key={a.id}
            className={`relative overflow-hidden rounded-lg border p-3 transition ${
              a.isUnlocked
                ? "border-red-600/50 bg-red-600/10"
                : "border-zinc-800 bg-zinc-900/40 opacity-60 grayscale"
            }`}
          >
            <div className="text-2xl">{a.icon}</div>
            <p className={`mt-1.5 text-xs font-bold ${a.isUnlocked ? "text-white" : "text-zinc-400"}`}>
              {a.name}
            </p>
            <p className="font-jp text-[9px] tracking-widest text-zinc-500">{a.jp}</p>
            <p className="mt-1 text-[10px] leading-snug text-zinc-500">{a.desc}</p>
            {!a.isUnlocked && (
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-red-600/70"
                  style={{ width: `${Math.min(100, (a.progress.cur / a.progress.goal) * 100)}%` }}
                />
              </div>
            )}
            {a.isUnlocked && (
              <span className="absolute right-2 top-2 text-[9px] font-bold uppercase tracking-wider text-red-500">
                ✓ got it
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementsGrid;
