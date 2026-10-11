import React from "react";
import { Sparkles, Target, RotateCcw } from "lucide-react";
import GoalProgress from "@/components/af/GoalProgress";

export default function SummaryScreen({ summary, highlight, focusNext, stats, onRestart, saving, goal, goalProgress }) {
  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <div className="flex items-center gap-2 text-sky-600 mb-3">
        <Sparkles className="w-5 h-5" />
        <span className="text-sm font-semibold tracking-wide uppercase">Session complete</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 leading-tight">
        {saving ? "Summarizing your session…" : "Here's how you moved today."}
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
        <Stat label="Reps" value={stats?.reps ?? 0} />
        <Stat label="Exercises" value={stats?.exerciseCount ?? 0} />
        <Stat label="Corrections" value={stats?.corrections ?? 0} />
        <Stat label="Seconds" value={stats?.duration ?? 0} />
      </div>

      <div className="mt-6 space-y-4">
        <Card icon={<Sparkles className="w-5 h-5 text-sky-600" />} title="Your coach says">
          <p className="text-neutral-700 leading-relaxed">{summary || "Great effort today."}</p>
          {highlight && <p className="text-neutral-500 mt-2 text-sm">{highlight}</p>}
        </Card>
        <Card icon={<Target className="w-5 h-5 text-emerald-600" />} title="Focus for next time">
          <p className="text-neutral-700 leading-relaxed">{focusNext || "Keep showing up."}</p>
        </Card>
      </div>

      {goal && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">Goal Progress</h3>
          <GoalProgress
            todayReps={goalProgress?.todayReps || 0}
            weekReps={goalProgress?.weekReps || 0}
            dailyTarget={goal.daily_reps_target}
            weeklyTarget={goal.weekly_reps_target}
          />
        </div>
      )}

      <button
        onClick={onRestart}
        className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-neutral-900 text-white px-6 py-3.5 font-semibold hover:bg-neutral-800 transition-colors"
      >
        <RotateCcw className="w-5 h-5" />
        Start another session
      </button>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-4 text-center">
      <div className="text-2xl sm:text-3xl font-bold text-neutral-900 tabular-nums">{value}</div>
      <div className="text-xs font-medium text-neutral-400 uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}

function Card({ icon, title, children }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="font-semibold text-neutral-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}