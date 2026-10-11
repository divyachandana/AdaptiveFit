import React from "react";
import { Activity, CheckCircle2, AlertCircle, Clock } from "lucide-react";

// HeartbeatMonitor: shows per-agent health status and last check time.
// Heartbeat runs a lightweight eval periodically to verify agents
// are responsive and producing correct outputs.
export default function HeartbeatMonitor({ heartbeatStatus, lastCheck, onToggle, enabled }) {
  const agents = Object.entries(heartbeatStatus);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-neutral-600" />
          <h3 className="font-semibold text-neutral-900 text-sm">Heartbeat</h3>
          {lastCheck && (
            <span className="text-xs text-neutral-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastCheck.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
            enabled
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
          }`}
        >
          {enabled ? "On" : "Off"}
        </button>
      </div>

      {agents.length === 0 ? (
        <p className="text-xs text-neutral-400">No heartbeat data yet.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {agents.map(([id, status]) => (
            <div key={id} className="flex items-center gap-1.5 text-sm">
              {status.state === "healthy" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : status.state === "unhealthy" ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : (
                <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
              )}
              <span className="text-neutral-600">{status.name}</span>
              {status.latencyMs != null && (
                <span className="text-xs text-neutral-400 tabular-nums">{status.latencyMs}ms</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}