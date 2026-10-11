import React from "react";
import { BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer, LabelList } from "recharts";

export default function WeekChart({ data, dailyTarget }) {
  return (
    <div className="rounded-3xl border-2 border-neutral-950 bg-white p-6">
      <h2 className="text-xl font-bold text-neutral-950">Last 7 days</h2>
      <p className="text-sm text-neutral-600 mb-4">Dashed line = daily goal ({dailyTarget} reps)</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 8, left: -16, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fill: "#0a0a0a", fontSize: 14, fontWeight: 600 }} axisLine={{ stroke: "#0a0a0a" }} tickLine={false} />
            <YAxis tick={{ fill: "#0a0a0a", fontSize: 13 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <ReferenceLine y={dailyTarget} stroke="#0a0a0a" strokeDasharray="6 4" strokeWidth={2} />
            <Bar dataKey="reps" fill="#0a0a0a" radius={[8, 8, 0, 0]}>
              <LabelList dataKey="reps" position="top" style={{ fill: "#0a0a0a", fontWeight: 700 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}