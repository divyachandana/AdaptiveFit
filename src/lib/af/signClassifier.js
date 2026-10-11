import { SIGNS, evaluateSign, constraintCount } from "@/lib/af/signs";

// Static letters ordered most-constrained first so specific shapes win.
const STATIC = SIGNS.filter((s) => !s.motion).sort((a, b) => constraintCount(b) - constraintCount(a));

export const TRANSLATABLE = STATIC.map((s) => s.letter).sort();

// Returns the recognized letter for a hand, or null.
export function classifySign(landmarks) {
  if (!landmarks) return null;
  const hit = STATIC.find((s) => evaluateSign(s, landmarks).correct);
  return hit ? hit.letter : null;
}