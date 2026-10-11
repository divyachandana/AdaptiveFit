import React from "react";
import { JOINTS } from "@/lib/af/joints";

const LEVEL = {
  typical: ["Full range", "bg-emerald-50 text-emerald-700"],
  limited: ["Limited", "bg-amber-50 text-amber-700"],
  very_limited: ["Very limited", "bg-rose-50 text-rose-700"]
};
const FINGERS = ["thumb", "index", "middle", "ring", "pinky"];

export default function JointReport({ profile }) {
  return (
    <div className="space-y-5">
      {Object.entries(profile.hands).map(([hand, h]) => (
        <div key={hand} className="rounded-2xl bg-white ring-1 ring-black/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-neutral-900">{hand} hand</h3>
            {h.tremor > 0.06 && <span className="text-xs rounded-full bg-amber-50 text-amber-700 px-2 py-1">Shaking noticed while holding</span>}
          </div>
          <div className="grid sm:grid-cols-5 gap-3">
            {FINGERS.map(f => (
              <div key={f} className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{f}</p>
                {JOINTS.filter(j => j.finger === f).map(j => {
                  const r = h.joints[j.id];
                  const [label, cls] = LEVEL[r.level];
                  return (
                    <div key={j.id} className={`rounded-lg px-2.5 py-1.5 text-xs ${cls}`}>
                      <div className="font-medium">{j.label.replace(/^\w+ /, "")}</div>
                      <div>{r.rom}° · {label}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs text-neutral-500">Ranges are estimates from the camera, compared with typical joint movement. This is not a medical diagnosis; share concerns with your therapist.</p>
    </div>
  );
}