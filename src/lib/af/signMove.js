// Turns ASL letters into a mobility routine: each sign works specific fingers,
// and signs that train the user's limited fingers are picked first.
import { SIGNS } from "@/lib/af/signs";
import { limitedJoints } from "@/lib/af/mobility";

export function fingersWorked(sign) {
  const out = new Set([...Object.keys(sign.fingers || {}), ...Object.keys(sign.curl || {})]);
  if (sign.thumb || sign.thumbAt || sign.touch || sign.gap || sign.thumbOnMiddle || sign.tipsOnThumb != null) out.add("thumb");
  return [...out];
}

export function buildSignRoutine(count = 6) {
  const limited = new Set(limitedJoints().map(j => j.finger));
  const scored = SIGNS.map(s => {
    const f = fingersWorked(s);
    return { sign: s, fingers: f, focus: f.filter(x => limited.has(x)), score: f.filter(x => limited.has(x)).length + Math.random() };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, count);
}

// Points: 100 per sign, up to +50 for speed, x combo multiplier.
export function pointsFor(seconds, combo) {
  return Math.round((100 + Math.max(0, 50 - seconds * 5)) * (1 + Math.min(combo, 5) * 0.2));
}