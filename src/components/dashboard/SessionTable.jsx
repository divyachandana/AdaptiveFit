import React from "react";

export default function SessionTable({ sessions }) {
  if (!sessions.length) return <p className="text-neutral-600">No sessions recorded yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-neutral-950 text-left">
            <th className="py-2 pr-3">Date</th><th className="pr-3">Exercises</th><th className="pr-3">Reps</th>
            <th className="pr-3">Completion</th><th className="pr-3">Corrections</th><th>Duration</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(s => (
            <tr key={s.id} className="border-b border-neutral-200 align-top">
              <td className="py-2 pr-3 whitespace-nowrap">{new Date(s.created_date).toLocaleDateString()}</td>
              <td className="pr-3">{(s.exercises || []).join(", ")}</td>
              <td className="pr-3 tabular-nums">{s.reps_completed}/{s.target_reps || "–"}</td>
              <td className="pr-3 tabular-nums">{s.target_reps ? Math.round((s.reps_completed / s.target_reps) * 100) + "%" : "–"}</td>
              <td className="pr-3 tabular-nums">{s.corrections_count || 0}</td>
              <td className="tabular-nums">{Math.round((s.duration_seconds || 0) / 60)} min</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}