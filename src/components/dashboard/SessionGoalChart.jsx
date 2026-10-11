import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

export default function SessionGoalChart({ sessions }) {
  const data = [...sessions].reverse().map(s => ({
    day: new Date(s.created_date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    target: s.target_reps || 0,
    reps: s.reps_completed || 0
  }));
  return (
    <div className="rounded-3xl border-2 border-neutral-950 bg-white p-6">
      <h2 className="text-xl font-bold text-neutral-950">Each session: goal vs actual</h2>
      <p className="text-sm text-neutral-600 mb-4">Your last {data.length} sessions</p>
      {data.length === 0 ? (
        <p className="py-12 text-center text-neutral-600">No sessions yet. Finish an exercise session to see it here.</p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e5e5e5" />
              <XAxis dataKey="day" tick={{ fill: "#404040", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#0a0a0a" }} />
              <YAxis tick={{ fill: "#404040", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "2px solid #0a0a0a" }} />
              <Legend />
              <Bar dataKey="target" name="Goal reps" fill="#d4d4d4" radius={[6, 6, 0, 0]} />
              <Bar dataKey="reps" name="Actual reps" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}