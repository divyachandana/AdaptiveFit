import React from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

export default function GoalTrendChart({ data }) {
  const met = data.filter(d => d.reps >= d.goal).length;
  return (
    <div className="rounded-3xl border-2 border-neutral-950 bg-white p-6">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-950">Recovery trend · last 30 days</h2>
          <p className="text-sm text-neutral-600">How your daily goal changed versus the reps you actually completed</p>
        </div>
        <span className="text-sm font-semibold rounded-full bg-emerald-50 text-emerald-800 px-3 py-1">Goal met {met} of 30 days</span>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e5e5e5" />
            <XAxis dataKey="day" tick={{ fill: "#404040", fontSize: 12 }} interval={4} tickLine={false} axisLine={{ stroke: "#0a0a0a" }} />
            <YAxis tick={{ fill: "#404040", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "2px solid #0a0a0a" }} />
            <Legend />
            <Bar dataKey="reps" name="Actual reps" fill="#10b981" radius={[6, 6, 0, 0]} />
            <Line type="stepAfter" dataKey="goal" name="Daily goal" stroke="#0a0a0a" strokeWidth={2} strokeDasharray="6 4" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}