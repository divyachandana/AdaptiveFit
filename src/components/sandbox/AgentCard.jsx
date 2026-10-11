import React from "react";
import { CheckCircle2, XCircle, Loader2, Wand2 } from "lucide-react";

// AgentCard: shows one agent's prompt (editable), eval results,
// and an optimize button that triggers metaprompting.
export default function AgentCard({
  agent,
  evalResults,
  onPromptChange,
  onOptimize,
  optimizing,
  metapromptResult,
}) {
  const results = evalResults?.[agent.id] || {};
  const evalIds = Object.keys(results);
  const passCount = evalIds.filter(id => results[id]?.passed).length;
  const allDone = evalIds.length === agent.evals.length && evalIds.length > 0;

  const colorClasses = {
    emerald: "border-emerald-200 bg-emerald-50/30",
    sky: "border-sky-200 bg-sky-50/30",
    amber: "border-amber-200 bg-amber-50/30",
    violet: "border-violet-200 bg-violet-50/30",
  };

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${colorClasses[agent.color] || "border-neutral-200 bg-white"}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-neutral-900">{agent.name}</h3>
          <p className="text-xs text-neutral-500">{agent.role}</p>
        </div>
        {allDone && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${passCount === evalIds.length ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {passCount}/{evalIds.length} passed
          </span>
        )}
      </div>

      <textarea
        value={agent.systemPrompt}
        onChange={(e) => onPromptChange(agent.id, e.target.value)}
        rows={4}
        className="w-full text-xs text-neutral-700 bg-white/80 rounded-lg border border-neutral-200 p-2.5 resize-y focus:outline-none focus:ring-1 focus:ring-neutral-400"
        placeholder="System prompt..."
      />

      {/* Eval results */}
      <div className="space-y-1.5">
        {agent.evals.map(ev => {
          const r = results[ev.id];
          return (
            <div key={ev.id} className="flex items-start gap-2 text-sm">
              {r ? (
                r.passed
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              ) : (
                <div className="w-4 h-4 mt-0.5 shrink-0 rounded-full border border-neutral-300" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-700 truncate">{ev.name}</span>
                  {r && <span className="text-xs text-neutral-400 tabular-nums">{r.score}/10</span>}
                </div>
                {r && <p className="text-xs text-neutral-400 truncate">{r.response}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Optimize */}
      <button
        onClick={() => onOptimize(agent.id)}
        disabled={optimizing || !allDone || passCount === evalIds.length}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {optimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
        Optimize Prompt
      </button>

      {/* Metaprompt result */}
      {metapromptResult && (
        <div className="rounded-lg bg-white/70 border border-neutral-200 p-2.5 text-xs space-y-1">
          <p className="font-medium text-neutral-700">Metaprompt changes:</p>
          <p className="text-neutral-500">{metapromptResult.changes}</p>
        </div>
      )}
    </div>
  );
}