import React from "react";
import { Target, Calendar } from "lucide-react";

export default function GoalProgress({ todayReps = 0, weekReps = 0, dailyTarget = 15, weeklyTarget = 60 }) {
  const dailyPct = dailyTarget > 0 ? Math.min(100, Math.round((todayReps / dailyTarget) * 100)) : 0;
  const weeklyPct = weeklyTarget > 0 ? Math.min(100, Math.round((weekReps / weeklyTarget) * 100)) : 0;

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-neutral-700">Today</span>
          <span className="ml-auto text-sm font-bold text-neutral-900 tabular-nums">
            {todayReps}<span className="text-neutral-400 font-normal"> / {dailyTarget} reps</span>
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-neutral-100 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500" style={{ width: `${dailyPct}%` }} />
        </div>
        {dailyPct >= 100 && <p className="text-xs text-emerald-600 font-medium mt-1.5">Daily goal reached!</p>}
      </div>
      <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-sky-600" />
          <span className="text-sm font-semibold text-neutral-700">This Week</span>
          <span className="ml-auto text-sm font-bold text-neutral-900 tabular-nums">
            {weekReps}<span className="text-neutral-400 font-normal"> / {weeklyTarget} reps</span>
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-neutral-100 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600 transition-all duration-500" style={{ width: `${weeklyPct}%` }} />
        </div>
        {weeklyPct >= 100 && <p className="text-xs text-sky-600 font-medium mt-1.5">Weekly goal reached!</p>}
      </div>
    </div>
  );
}