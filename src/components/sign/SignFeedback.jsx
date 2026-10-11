import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function SignFeedback({ sign, result, hold, mastered }) {
  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-neutral-900 text-white p-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Sign the letter</p>
        <p className="text-8xl font-bold leading-none mt-3">{sign.letter}</p>
        <p className="text-sm text-white/70 mt-5 max-w-sm mx-auto">{sign.tip}</p>
      </div>
      <div>
        <div className="flex justify-between text-xs text-neutral-500 mb-1.5"><span>Hold steady</span><span>{Math.round(hold * 100)}%</span></div>
        <div className="h-3 rounded-full bg-neutral-100 overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-150" style={{ width: `${hold * 100}%` }} />
        </div>
      </div>
      {mastered ? (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 text-emerald-800 p-4 text-lg font-medium"><CheckCircle2 className="w-6 h-6" />Correct! Moving on…</div>
      ) : result.correct ? (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 text-emerald-800 p-4 text-lg font-medium"><CheckCircle2 className="w-6 h-6" />Great placement, hold it</div>
      ) : (
        <ul className="space-y-2">
          {(result.issues.length ? result.issues : ["Show your hand to the camera"]).map((t) => (
            <li key={t} className="flex items-center gap-3 rounded-2xl bg-amber-50 text-amber-900 p-4 text-base"><AlertCircle className="w-5 h-5 shrink-0" />{t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}