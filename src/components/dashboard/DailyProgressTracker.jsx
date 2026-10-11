import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const pct = (reps, target) => (target > 0 ? Math.round((reps / target) * 100) : 0);

export default function DailyProgressTracker({ last7, dailyTarget }) {
  const days = last7.map((d) => ({ ...d, pct: pct(d.reps, dailyTarget) }));
  const today = days[days.length - 1]?.pct || 0;
  const prev = days.slice(0, -1);
  const avg = prev.length ? Math.round(prev.reduce((s, d) => s + d.pct, 0) / prev.length) : 0;
  const diff = today - avg;
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;

  return (
    <section className="rounded-2xl border-2 border-neutral-950 bg-white p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Daily target completed</h2>
          <p className="text-6xl font-bold tabular-nums mt-2">{today}%</p>
          <p className="text-neutral-700 mt-1">of {dailyTarget} reps today</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-3 font-semibold">
          <Icon className="w-5 h-5" />
          {diff === 0 ? "Same as" : `${Math.abs(diff)}% ${diff > 0 ? "above" : "below"}`} your 6-day average ({avg}%)
        </div>
      </div>
      <div className="h-4 rounded-full bg-neutral-200 overflow-hidden mt-5">
        <div className="h-full bg-emerald-600 transition-all" style={{ width: `${Math.min(today, 100)}%` }} />
      </div>
      <div className="grid grid-cols-7 gap-2 mt-6">
        {days.map((d, i) => (
          <div key={i} className="text-center">
            <div className="h-24 rounded-lg bg-neutral-100 flex items-end overflow-hidden">
              <div className={`w-full ${d.pct >= 100 ? "bg-emerald-600" : "bg-neutral-800"}`} style={{ height: `${Math.min(d.pct, 100)}%` }} />
            </div>
            <p className="text-sm font-semibold mt-1 tabular-nums">{d.pct}%</p>
            <p className="text-xs text-neutral-600">{d.day}</p>
          </div>
        ))}
      </div>
    </section>
  );
}