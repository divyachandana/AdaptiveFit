import React, { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JOINTS } from "@/lib/af/joints";

export default function RomTrendChart({ checks }) {
  const [jointId, setJointId] = useState(JOINTS[3].id);
  const joint = JOINTS.find(j => j.id === jointId);
  const data = useMemo(() => checks.map(c => ({
    day: new Date(c.checked_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    Left: c.hands?.Left?.joints?.[jointId]?.rom != null ? Math.round(c.hands.Left.joints[jointId].rom) : null,
    Right: c.hands?.Right?.joints?.[jointId]?.rom != null ? Math.round(c.hands.Right.joints[jointId].rom) : null
  })), [checks, jointId]);

  return (
    <div className="rounded-3xl border-2 border-neutral-950 bg-white p-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-950">Range of motion by joint</h2>
          <p className="text-sm text-neutral-600">Degrees of bend at each mobility check · dashed line = typical ({joint.normal}°)</p>
        </div>
        <Select value={jointId} onValueChange={setJointId}>
          <SelectTrigger className="w-56 h-11"><SelectValue /></SelectTrigger>
          <SelectContent>{JOINTS.map(j => <SelectItem key={j.id} value={j.id}>{j.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {checks.length === 0 ? (
        <p className="py-12 text-center text-neutral-600">No mobility checks yet. Run a joint mobility check from the exercise coach to start tracking.</p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e5e5e5" />
              <XAxis dataKey="day" tick={{ fill: "#404040", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#0a0a0a" }} />
              <YAxis unit="°" tick={{ fill: "#404040", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `${v}°`} contentStyle={{ borderRadius: 12, border: "2px solid #0a0a0a" }} />
              <Legend />
              <ReferenceLine y={joint.normal} stroke="#0a0a0a" strokeDasharray="6 4" />
              <Line type="monotone" dataKey="Left" name="Left hand" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} connectNulls />
              <Line type="monotone" dataKey="Right" name="Right hand" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}