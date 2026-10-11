import React, { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { DEFAULTS, getSettings, saveSettings } from "@/lib/af/handSettings";

const FIELDS = [
  { key: "matchMax", label: "Recording match tolerance", min: 0.3, max: 0.9, step: 0.01 },
  { key: "margin", label: "Look-alike separation", min: 0, max: 0.2, step: 0.01 },
  { key: "thumbOut", label: "Thumb-out distance", min: 0.35, max: 0.8, step: 0.01 },
  { key: "touch", label: "Fingertip touch distance", min: 0.15, max: 0.5, step: 0.01 }
];

export default function ThresholdSettings({ signedIn }) {
  const [s, setS] = useState(getSettings());
  useEffect(() => {
    const h = () => setS({ ...getSettings() });
    window.addEventListener("hand-settings-changed", h);
    return () => window.removeEventListener("hand-settings-changed", h);
  }, []);
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900">Landmark thresholds</h3>
        <button onClick={() => saveSettings(DEFAULTS)} className="text-sm text-neutral-500 underline">Reset</button>
      </div>
      {FIELDS.map((f) => (
        <div key={f.key} className="space-y-2">
          <div className="flex justify-between text-sm"><span>{f.label}</span><span className="tabular-nums text-neutral-500">{s[f.key].toFixed(2)}</span></div>
          <Slider min={f.min} max={f.max} step={f.step} value={[s[f.key]]} onValueChange={([v]) => saveSettings({ [f.key]: v })} />
        </div>
      ))}
      <p className="text-xs text-neutral-500">{signedIn ? "Saved to your profile." : "Saved on this device. Sign in to sync."}</p>
    </div>
  );
}