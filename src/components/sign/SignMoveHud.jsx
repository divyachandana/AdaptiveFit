import React from "react";
import { Flame, Star, Target } from "lucide-react";

export default function SignMoveHud({ points, combo, index, total, step }) {
  const cell = "rounded-2xl bg-neutral-100 p-4 text-center";
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className={cell}><Star className="w-4 h-4 mx-auto text-amber-500" /><p className="text-2xl font-bold tabular-nums">{points}</p><p className="text-xs text-neutral-500">Points</p></div>
        <div className={cell}><Flame className="w-4 h-4 mx-auto text-orange-500" /><p className="text-2xl font-bold tabular-nums">x{combo}</p><p className="text-xs text-neutral-500">Combo</p></div>
        <div className={cell}><Target className="w-4 h-4 mx-auto text-emerald-600" /><p className="text-2xl font-bold tabular-nums">{index}/{total}</p><p className="text-xs text-neutral-500">Signs</p></div>
      </div>
      {step && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Works your <span className="font-semibold">{step.fingers.join(", ")}</span>
          {step.focus.length > 0 && <> · targets your limited <span className="font-semibold">{step.focus.join(", ")}</span></>}
        </div>
      )}
    </div>
  );
}