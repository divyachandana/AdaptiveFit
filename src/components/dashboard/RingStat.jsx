import React from "react";

export default function RingStat({ label, value, target }) {
  const pct = Math.min(100, target ? Math.round((value / target) * 100) : 0);
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div className="rounded-3xl bg-neutral-950 text-white p-6 flex items-center gap-6">
      <svg viewBox="0 0 120 120" className="w-28 h-28 shrink-0 -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#404040" strokeWidth="12" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#facc15" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div>
        <p className="text-sm uppercase tracking-widest text-neutral-400">{label}</p>
        <p className="text-5xl font-bold tabular-nums mt-1">{value}<span className="text-2xl text-neutral-500"> / {target}</span></p>
        <p className="text-lg font-semibold text-yellow-400 mt-1">{pct >= 100 ? "Goal reached!" : `${pct}% complete`}</p>
      </div>
    </div>
  );
}