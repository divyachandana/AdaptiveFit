import React from "react";
import { PRIORITY_LABELS, PRIORITY_STYLES } from "@/lib/sandbox/scenarios";

// ScenarioPicker: tabbed list of exercise scenarios. Selecting a scenario
// filters the eligible models for benchmarking.
export default function ScenarioPicker({ scenarios, selectedId, onSelect }) {
  return (
    <div className="grid sm:grid-cols-2 gap-2.5">
      {scenarios.map(s => {
        const isActive = s.id === selectedId;
        const isClinician = s.releasePriority === "clinician_configured";
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            disabled={isClinician}
            className={`text-left p-3.5 rounded-lg border transition-all ${
              isActive
                ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900"
                : "border-neutral-200 hover:border-neutral-300 bg-white"
            } ${isClinician ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-sm text-neutral-900">{s.name}</span>
              <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[s.releasePriority]}`}>
                {PRIORITY_LABELS[s.releasePriority]}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1.5 line-clamp-2">{s.userInstruction}</p>
            {isClinician && (
              <p className="text-[11px] text-rose-500 mt-1.5">Requires clinician review — unavailable for ordinary testing</p>
            )}
          </button>
        );
      })}
    </div>
  );
}