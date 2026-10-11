import React from "react";
import { CheckCircle2, AlertCircle, Radio, Sparkles, Eye } from "lucide-react";

// CoachPanel: the on-screen coaching surface during the live session.
function ConfidenceDot({ value }) {
  const level = value > 0.55 ? "good" : value > 0.3 ? "ok" : "low";
  const color = level === "good" ? "bg-emerald-500" : level === "ok" ? "bg-amber-500" : "bg-neutral-400";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      Vision {level === "good" ? "locked on" : level === "ok" ? "partial" : "searching"}
    </span>
  );
}

export default function CoachPanel({
  exercise,
  repCount,
  targetReps,
  correction,
  confidence,
  index,
  total,
  rhythmRep,
  onNext,
  onFinish
}) {
  const pct = targetReps > 0 ? Math.min(100, Math.round((repCount / targetReps) * 100)) : 0;
  const source = correction?.source;

  return (
    <div className="w-full bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
            Exercise {index + 1} of {total}
          </div>
          <h2 className="text-2xl font-bold text-neutral-900">{exercise?.name}</h2>
        </div>
        <ConfidenceDot value={confidence} />
      </div>

      <p className="text-neutral-600 mb-4">{exercise?.focus}</p>

      <div className="mb-4">
        <div className="flex items-end justify-between mb-1">
          <span className="text-sm font-medium text-neutral-500">Reps</span>
          <span className="text-2xl font-bold text-neutral-900 tabular-nums">
            {repCount || rhythmRep || 0}<span className="text-base text-neutral-400"> / {targetReps}</span>
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div
        className={`rounded-xl p-4 min-h-[88px] flex items-start gap-3 transition-colors duration-300 ${
          correction
            ? source === "reasoning"
              ? "bg-sky-50 ring-1 ring-sky-200"
              : "bg-emerald-50 ring-1 ring-emerald-200"
            : "bg-neutral-50 ring-1 ring-neutral-100"
        }`}
      >
        {correction ? (
          source === "reasoning" ? (
            <Sparkles className="w-5 h-5 text-sky-600 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          )
        ) : (
          <Eye className="w-5 h-5 text-neutral-400 mt-0.5 shrink-0" />
        )}
        <div>
          {correction ? (
            <>
              <p className="text-neutral-900 font-medium leading-snug">{correction.message}</p>
              <p className="text-xs text-neutral-400 mt-1">
                {source === "reasoning" ? "Reasoning model" : "Vision fast-path"} · spoken aloud
              </p>
            </>
          ) : (
            <p className="text-neutral-500 leading-snug">Watching your form. Keep going at your own pace.</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-5">
        <button
          onClick={onNext}
          className="flex-1 rounded-xl bg-neutral-900 text-white py-3 font-semibold hover:bg-neutral-800 transition-colors"
        >
          {index + 1 < total ? "Next exercise" : "Finish session"}
        </button>
        <button
          onClick={onFinish}
          className="rounded-xl ring-1 ring-neutral-300 text-neutral-700 px-5 py-3 font-medium hover:bg-neutral-50 transition-colors"
        >
          End
        </button>
      </div>
    </div>
  );
}