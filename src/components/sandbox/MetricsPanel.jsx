import React from "react";

// MetricsPanel: displays per-model metrics in a comparison table
// and the router's recommendation. Inspired by RalphMeter's
// benchmark comparison output format.

function MetricCell({ label, value, best }) {
  return (
    <td className="px-3 py-2 text-center tabular-nums">
      <span className={best ? "font-bold text-emerald-600" : "text-neutral-700"}>
        {value}
      </span>
    </td>
  );
}

export function ComparisonTable({ results, modelMeta }) {
  const modelIds = Object.keys(results);
  const metrics = modelIds.map(id => results[id]).filter(Boolean);
  if (!metrics.length) {
    return <p className="text-sm text-neutral-400">No benchmark data yet.</p>;
  }

  const best = (key) => {
    if (!metrics.length) return null;
    const vals = metrics.map(m => m[key]).filter(v => v != null);
    if (!vals.length) return null;
    return Math.max(...vals);
  };

  const bestInference = Math.min(...metrics.map(m => m.avgInferenceMs).filter(v => v > 0));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-500 text-xs uppercase tracking-wide">
            <th className="px-3 py-2 text-left">Metric</th>
            {metrics.map(m => (
              <th key={m.name} className="px-3 py-2 text-center">
                {m.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-neutral-100">
            <td className="px-3 py-2 text-neutral-500">Load time (ms)</td>
            {metrics.map(m => (
              <MetricCell key={m.name} value={m.loadTimeMs ?? "—"} best={m.loadTimeMs === best("loadTimeMs")} />
            ))}
          </tr>
          <tr className="border-b border-neutral-100">
            <td className="px-3 py-2 text-neutral-500">Frames tested</td>
            {metrics.map(m => (
              <MetricCell key={m.name} value={m.frameCount} />
            ))}
          </tr>
          <tr className="border-b border-neutral-100">
            <td className="px-3 py-2 text-neutral-500">Avg inference (ms)</td>
            {metrics.map(m => (
              <MetricCell key={m.name} value={m.avgInferenceMs} best={m.avgInferenceMs === bestInference} />
            ))}
          </tr>
          <tr className="border-b border-neutral-100">
            <td className="px-3 py-2 text-neutral-500">P50 (ms)</td>
            {metrics.map(m => (
              <MetricCell key={m.name} value={m.p50Ms} />
            ))}
          </tr>
          <tr className="border-b border-neutral-100">
            <td className="px-3 py-2 text-neutral-500">P95 (ms)</td>
            {metrics.map(m => (
              <MetricCell key={m.name} value={m.p95Ms} />
            ))}
          </tr>
          <tr className="border-b border-neutral-100">
            <td className="px-3 py-2 text-neutral-500">Effective FPS</td>
            {metrics.map(m => (
              <MetricCell key={m.name} value={m.effectiveFPS} best={m.effectiveFPS === best("effectiveFPS")} />
            ))}
          </tr>
          <tr className="border-b border-neutral-100">
            <td className="px-3 py-2 text-neutral-500">Avg confidence</td>
            {metrics.map(m => (
              <MetricCell key={m.name} value={m.avgConfidence?.toFixed(3)} best={m.avgConfidence === best("avgConfidence")} />
            ))}
          </tr>
          <tr className="border-b border-neutral-100">
            <td className="px-3 py-2 text-neutral-500">Avg landmarks</td>
            {metrics.map(m => (
              <MetricCell key={m.name} value={m.avgLandmarks} best={m.avgLandmarks === best("avgLandmarks")} />
            ))}
          </tr>
          <tr className="border-b border-neutral-100">
            <td className="px-3 py-2 text-neutral-500">Stability score</td>
            {metrics.map(m => (
              <MetricCell key={m.name} value={m.stabilityScore} best={m.stabilityScore === best("stabilityScore")} />
            ))}
          </tr>
          <tr>
            <td className="px-3 py-2 text-neutral-500">Error rate</td>
            {metrics.map(m => (
              <MetricCell key={m.name} value={m.errorRate} best={m.errorRate === 0} />
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function RouterPanel({ routing, exerciseType, onExerciseTypeChange }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900">Model Router</h3>
        <select
          value={exerciseType}
          onChange={(e) => onExerciseTypeChange(e.target.value)}
          className="text-sm border border-neutral-200 rounded-lg px-2 py-1.5 bg-white"
        >
          <option value="hands">Hand exercises</option>
          <option value="full-body">Full-body exercises</option>
        </select>
      </div>

      {!routing?.recommendation ? (
        <p className="text-sm text-neutral-400">{routing?.reason || "Run a benchmark to get a recommendation."}</p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
              Recommended
            </span>
            <span className="font-semibold text-neutral-900">{routing.name}</span>
          </div>
          <p className="text-sm text-neutral-500">{routing.reason}</p>
          {routing.scores && (
            <div className="space-y-1.5 pt-1">
              {routing.scores.map(s => (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <span className="w-40 truncate text-neutral-600">{s.name}</span>
                  <div className="flex-1 h-5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${Math.min(s.total, 100)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right tabular-nums text-neutral-700">{s.total}</span>
                </div>
              ))}
              <p className="text-xs text-neutral-400 pt-1">
                Weights: speed {Math.round(routing.weights.speed * 100)}%, confidence {Math.round(routing.weights.confidence * 100)}%, stability {Math.round(routing.weights.stability * 100)}%
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function ModelLoadError({ modelId, error }) {
  if (!error) return null;
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
      <span className="font-medium">{modelId}:</span> {error.message}
    </div>
  );
}