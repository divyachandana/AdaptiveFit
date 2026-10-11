// Exercise guidance knowledge base used by the coach to give grounded, safe advice.
export const EXERCISE_GUIDANCE = {
  "Hand Open-Close": {
    purpose: "Maintains finger range of motion and grip readiness; reduces stiffness.",
    howTo: "Rest forearm on a surface. Open fingers as wide as comfortable, pause 2 seconds, then close into a soft fist with thumb outside.",
    commonMistakes: "Squeezing too hard, rushing, tucking the thumb inside the fist.",
    modifications: "Partial fist is fine. Warm hands in water first if stiff. Use the other hand to gently assist.",
    stopIf: "Sharp pain, numbness, tingling, or swelling."
  },
  "Finger Spreads": {
    purpose: "Strengthens small hand muscles and improves finger independence.",
    howTo: "Lay hand flat or hold it up, spread fingers apart slowly, hold 2 seconds, then bring them together.",
    commonMistakes: "Lifting the wrist, holding the breath, forcing past comfort.",
    modifications: "Spread only as far as comfortable; place hand on a table for support.",
    stopIf: "Joint pain or cramping that does not ease with rest."
  },
  general: {
    pacing: "Move slowly, about 2 seconds each way. Rest 30 to 60 seconds between sets.",
    breathing: "Breathe out while opening or exerting, breathe in while relaxing.",
    pain: "Mild stretch is okay. Pain above 3 out of 10 means stop and rest.",
    fatigue: "Fewer good reps beat many rushed ones. It is fine to stop early.",
    safety: "This coach does not replace a therapist. Follow your therapist's plan if it differs."
  }
};

export function guidanceFor(exerciseName) {
  const key = Object.keys(EXERCISE_GUIDANCE).find(k => String(exerciseName || "").startsWith(k));
  return JSON.stringify({ exercise: key ? EXERCISE_GUIDANCE[key] : null, general: EXERCISE_GUIDANCE.general });
}