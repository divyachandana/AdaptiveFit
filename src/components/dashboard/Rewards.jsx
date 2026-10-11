import React from "react";
import { Flame, Trophy, Lock } from "lucide-react";
import { buildBadges, levelFor } from "@/lib/af/dashboardStats";

export default function Rewards({ stats }) {
  const badges = buildBadges(stats);
  const lvl = levelFor(stats.totalReps);
  return (
    <div className="rounded-3xl border-2 border-neutral-950 bg-yellow-300 p-6">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <Flame className="w-10 h-10 text-neutral-950" />
          <div><p className="text-4xl font-bold tabular-nums">{stats.streak}</p><p className="text-sm font-semibold">day streak</p></div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="font-bold text-lg">Level {lvl.level}</p>
          <div className="h-4 rounded-full bg-neutral-950/15 mt-1 overflow-hidden">
            <div className="h-full bg-neutral-950 rounded-full transition-all duration-700" style={{ width: `${(lvl.xp / lvl.next) * 100}%` }} />
          </div>
          <p className="text-sm mt-1">{lvl.next - lvl.xp} reps to level {lvl.level + 1}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
        {badges.map(b => (
          <div key={b.id} className={`rounded-2xl p-4 border-2 border-neutral-950 ${b.earned ? "bg-neutral-950 text-white" : "bg-white/60 text-neutral-500"}`}>
            {b.earned ? <Trophy className="w-6 h-6 text-yellow-300" /> : <Lock className="w-6 h-6" />}
            <p className="font-bold mt-2">{b.label}</p>
            <p className="text-xs">{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}