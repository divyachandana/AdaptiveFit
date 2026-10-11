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
  "Hook Fist": {
    purpose: "Tendon glide that keeps big knuckles straight while curling fingertips; improves finger flexibility.",
    howTo: "Keep your big knuckles straight, curl only your fingertips down into a hook, hold, then open.",
    commonMistakes: "Bending at the big knuckles, squeezing hard, rushing.",
    modifications: "Curl only as far as comfortable; warm hands first if stiff.",
    stopIf: "Sharp pain, numbness, or tingling."
  },
  "Tabletop": {
    purpose: "Tendon glide that bends only the big knuckles while fingers stay straight; improves knuckle control.",
    howTo: "Bend only at your big knuckles so your fingers make a flat table, keep fingers straight, hold, then open.",
    commonMistakes: "Curling the middle or tip joints, lifting the wrist.",
    modifications: "A smaller bend is fine; keep fingers straight.",
    stopIf: "Sharp pain, numbness, or tingling."
  },
  "Straight Fist": {
    purpose: "Tendon glide that bends knuckles and middle joints while fingertips stay straight.",
    howTo: "Touch your fingertips to the base of your palm, keeping the end joints straight, hold, then open.",
    commonMistakes: "Curling the fingertips, squeezing hard.",
    modifications: "A partial bend is fine; keep fingertips straight.",
    stopIf: "Sharp pain, numbness, or tingling."
  },
  "Full Fist": {
    purpose: "Tendon glide that bends all joints for full range of motion; reduces stiffness.",
    howTo: "Make a gentle full fist with all joints bent and thumb wrapped outside, don't squeeze, hold, then open.",
    commonMistakes: "Squeezing hard, tucking the thumb inside, rushing.",
    modifications: "A partial fist is fine; warm hands first if stiff.",
    stopIf: "Sharp pain, numbness, or tingling."
  },
  "Knuckle Bend": {
    purpose: "Range-of-motion exercise that isolates the middle finger joints, knuckles stay straight.",
    howTo: "Fingers straight and together, bend the middle joints of your fingers, keep big knuckles straight, hold, then open.",
    commonMistakes: "Bending the big knuckles, forcing past comfort.",
    modifications: "A smaller bend is fine; keep big knuckles straight.",
    stopIf: "Joint pain or cramping that does not ease with rest."
  },
  "Gentle Fist": {
    purpose: "Soft full fist with thumb outside; arthritis-friendly grip and range of motion.",
    howTo: "Rest your forearm on a table, close into a soft fist with thumb wrapped across the outside, don't squeeze, then open.",
    commonMistakes: "Squeezing hard, tucking the thumb inside.",
    modifications: "A partial fist is fine; warm hands first if stiff.",
    stopIf: "Sharp pain, numbness, or tingling."
  },
  "C-Grip": {
    purpose: "Range-of-motion grip exercise shaping the hand into a C, like holding a jar.",
    howTo: "Curl your fingers and thumb gently into a C shape, keep a gap between thumb and fingers, hold, then relax.",
    commonMistakes: "Closing the gap fully, squeezing hard.",
    modifications: "A larger C is fine; keep the gap open.",
    stopIf: "Joint pain or cramping that does not ease with rest."
  },
  "Thumb-to-Fingertip Touch": {
    purpose: "Thumb opposition exercise improving pinch and dexterity; touches thumb to each fingertip.",
    howTo: "Touch your thumb to each fingertip in turn, making an O, hold each touch briefly, then open.",
    commonMistakes: "Rushing between fingers, forcing the thumb past comfort.",
    modifications: "Touch as close as you can; warm hands first if stiff.",
    stopIf: "Sharp pain, numbness, or tingling."
  },
  "Fingertip Bend": {
    purpose: "Isolates the end finger joints for fine dexterity and flexibility.",
    howTo: "Bend and straighten just the tip of each finger, keep the rest of the finger still.",
    commonMistakes: "Bending the whole finger, rushing.",
    modifications: "A small tip bend is fine.",
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