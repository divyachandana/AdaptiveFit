import React, { useState } from "react";
import { saveSettings } from "@/lib/af/handSettings";

// Live tuning: capture your real "in/out" and "touch/apart" positions under
// your lighting, and the app sets each threshold halfway between them.
function Pair({ title, value, a, b, onSet }) {
  const [cap, setCap] = useState({});
  const grab = (k) => {
    if (value == null) return;
    const next = { ...cap, [k]: value };
    setCap(next);
    if (next.a != null && next.b != null) onSet((next.a + next.b) / 2);
  };
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm"><span className="font-medium">{title}</span><span className="tabular-nums text-neutral-500">now {value?.toFixed(2) ?? "–"}</span></div>
      <div className="grid grid-cols-2 gap-2">
        {[["a", a], ["b", b]].map(([k, label]) => (
          <button key={k} onClick={() => grab(k)} disabled={value == null} className="h-11 rounded-xl bg-neutral-100 text-sm font-medium disabled:opacity-50">
            {label}{cap[k] != null ? ` ✓ ${cap[k].toFixed(2)}` : ""}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function LiveCalibration({ live }) {
  const r = live?.reading;
  const best = live?.scores?.[0];
  const j = live?.jitter ?? null;
  const quality = j == null ? null : j < 0.02 ? ["Steady tracking", "text-emerald-700 bg-emerald-50"] : j < 0.05 ? ["Some shake: add light or hold still", "text-amber-700 bg-amber-50"] : ["Unstable: improve lighting or move closer", "text-rose-700 bg-rose-50"];
  return (
    <div className="rounded-2xl border border-violet-200 bg-white p-5 space-y-4">
      <h3 className="font-semibold text-neutral-900">Live calibration</h3>
      {quality ? <p className={`text-sm rounded-lg px-3 py-2 ${quality[1]}`}>{quality[0]}</p> : <p className="text-sm text-neutral-500">Show your hand to the camera.</p>}
      <Pair title="Thumb position" value={r?.thumbRatio} a="Capture thumb in" b="Capture thumb out" onSet={(v) => saveSettings({ thumbOut: v })} />
      <Pair title="Fingertip touch" value={r?.touchRatio} a="Capture touching" b="Capture apart" onSet={(v) => saveSettings({ touch: v })} />
      <div className="space-y-2">
        <div className="flex justify-between text-sm"><span className="font-medium">Recording match</span><span className="tabular-nums text-neutral-500">{best ? `${best.letter} ${best.distance.toFixed(2)}` : "–"}</span></div>
        <button disabled={!best} onClick={() => saveSettings({ matchMax: Math.min(0.9, best.distance * 1.3) })} className="w-full h-11 rounded-xl bg-neutral-100 text-sm font-medium disabled:opacity-50">Set tolerance from the sign I'm holding</button>
      </div>
      <p className="text-xs text-neutral-500">Capture both positions of a pair and the threshold is set halfway between them. Adjust finely with the sliders below.</p>
    </div>
  );
}