import React from "react";
import { Brain } from "lucide-react";

// Shows why the coach chose this letter and how it adapted (explainable decisions).
export default function LearnerInsight({ reason, adapt }) {
  if (!reason && !adapt?.struggling && !adapt?.focus) return null;
  return (
    <div className="rounded-2xl bg-violet-50 ring-1 ring-violet-100 p-4 text-sm text-violet-900 space-y-1">
      <div className="flex items-center gap-2 font-semibold"><Brain className="w-4 h-4" /> Your coach adapted</div>
      {reason && <p>{reason}</p>}
      {adapt?.struggling && <p>Slower voice and fewer interruptions for this letter.</p>}
      {adapt?.focus && <p>Watch out for: {adapt.focus.toLowerCase()}.</p>}
    </div>
  );
}