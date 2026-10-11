import { SIGNS, evaluateSign } from "@/lib/af/signs";

// Static letters ordered most-constrained first so e.g. L wins over D.
const weight = (s) => Object.keys(s.fingers).length + (s.thumb ? 1 : 0) + (s.spread != null ? 1 : 0) + (s.touch ? 1 : 0);
const STATIC = SIGNS.filter((s) => !s.motion).sort((a, b) => weight(b) - weight(a));

export const TRANSLATABLE = STATIC.map((s) => s.letter).sort();

// Returns the recognized letter for a hand, or null.
export function classifySign(landmarks) {
  if (!landmarks) return null;
  const hit = STATIC.find((s) => evaluateSign(s, landmarks).correct);
  return hit ? hit.letter : null;
}