import React, { useState } from "react";
import { Check, AlertCircle } from "lucide-react";

// SummaryPanel: cross-model summary with candidate configuration selection.
// Lets a team member choose a candidate setup for further validation.
// Does NOT change the deployed exercise experience.
export default function SummaryPanel({ results, scenario, routing, models }) {
  const [candidate, setCandidate] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const modelIds = Object.keys(results).filter(id => results[id]?.frameCount > 0);
  if (!modelIds.length) return null;

  const recommended = routing?.recommendation;

  function selectCandidate(id) {
    setCandidate(id);
    setConfirmed(false);
  }

  function confirmCandidate() {
    setConfirmed(true);
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-neutral-900">Candidate Configuration</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Select a setup for further validation. This does not change the deployed app.
          </p>
        </div>
        {scenario && (
          <span className="text-xs text-neutral-400 bg-neutral-50 px-2.5 py-1 rounded-lg">
            Scenario: {scenario.name}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {modelIds.map(id => {
          const m = results[id];
          const meta = models.find(mm => mm.id === id);
          const isSelected = candidate === id;
          const isRecommended = id === recommended;
          return (
            <button
              key={id}
              onClick={() => selectCandidate(id)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                isSelected
                  ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-neutral-900">{m.name}</span>
                  {isRecommended && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Router Pick
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-neutral-500">
                  <span>{m.avgInferenceMs}ms avg</span>
                  <span>{m.effectiveFPS} fps</span>
                  <span>conf {m.avgConfidence?.toFixed(2)}</span>
                  <span>stab {m.stabilityScore}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {candidate && (
        <div className="flex items-center gap-3 pt-2 border-t border-neutral-100">
          {confirmed ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <Check className="w-4 h-4" />
              <span>
                Candidate selected: <strong>{results[candidate].name}</strong>. Tagged for validation review.
              </span>
            </div>
          ) : (
            <>
              <button
                onClick={confirmCandidate}
                className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
              >
                Confirm candidate
              </button>
              <span className="text-xs text-neutral-400">No changes will be made to the deployed app</span>
            </>
          )}
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-neutral-400">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <p>
          Sandbox results measure model performance under benchmark conditions, not clinical accuracy.
          Validate with representative users and devices before deployment.
        </p>
      </div>
    </div>
  );
}