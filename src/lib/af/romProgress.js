import { JOINTS } from "@/lib/af/joints";

// Joints whose range of motion grew by at least `minGain` degrees since the previous check.
export function romGains(prev, next, minGain = 10) {
  const out = [];
  for (const [hand, h] of Object.entries(next?.hands || {})) {
    for (const j of JOINTS) {
      const before = prev?.hands?.[hand]?.joints?.[j.id]?.rom;
      const after = h.joints?.[j.id]?.rom;
      if (before != null && after != null && after - before >= minGain) {
        out.push({ hand, label: j.label, gain: Math.round(after - before), now: Math.round(after) });
      }
    }
  }
  return out.sort((a, b) => b.gain - a.gain);
}