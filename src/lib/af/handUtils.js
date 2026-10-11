// Hand-pose analysis for AdaptiveFit — finger spread tracking using
// MediaPipe Hands (21 landmarks per hand). Detects open hand vs fist using
// scale-invariant fingertip-to-wrist ratios, counts reps, and flags
// fingers that aren't fully extending.
// Supports left, right, and both hands via extractHands().

import { EXERCISE_LIBRARY } from "@/lib/af/exercises";
import { computeJointAngles, inRange } from "@/lib/af/angles";

// MediaPipe Hands 21-landmark connections for skeleton overlay.
export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],             // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],             // index
  [5, 9], [9, 10], [10, 11], [11, 12],       // middle
  [9, 13], [13, 14], [14, 15], [15, 16],     // ring
  [13, 17], [17, 18], [18, 19], [19, 20],    // pinky
  [0, 17]                                    // palm base
];

// Finger name → tip landmark index (for highlighting)
export const FINGER_TIP_INDEX = {
  thumb: 4, index: 8, middle: 12, ring: 16, pinky: 20
};

// Fingers used for the openness signal (thumb excluded — it moves differently).
const OPENNESS_FINGERS = [
  { tip: 8, mcp: 5, name: "index" },
  { tip: 12, mcp: 9, name: "middle" },
  { tip: 16, mcp: 13, name: "ring" },
  { tip: 20, mcp: 17, name: "pinky" }
];

function dist(a, b) {
  if (!a || !b) return Infinity;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Convert MediaPipe results to an array of detected hands filtered by side.
// side: "left" | "right" | "both"
// Returns: [{ landmarks: [{x,y,z,score}, ...21], handedness: "Left"|"Right" }]
export function extractHands(results, videoWidth, videoHeight, side = "both") {
  const lm = results?.multiHandLandmarks;
  const hd = results?.multiHandedness;
  if (!lm || !lm.length) return [];

  const hands = lm.map((hand, i) => ({
    landmarks: hand.map(p => ({
      x: p.x * (videoWidth || 640),
      y: p.y * (videoHeight || 480),
      z: p.z || 0,
      score: p.visibility != null ? p.visibility : 1
    })),
    handedness: hd?.[i]?.label || "Unknown"
  }));

  if (side === "both") return hands;

  const targetLabel = side === "left" ? "Left" : "Right";
  const filtered = hands.filter(h => h.handedness === targetLabel);
  return filtered.length ? filtered : hands; // fallback: show what's visible
}

// Average confidence of key landmarks (wrist + knuckles + fingertips).
export function handConfidence(landmarks) {
  if (!landmarks) return 0;
  const key = [0, 5, 9, 8, 12, 16, 20];
  let sum = 0, count = 0;
  for (const i of key) {
    if (landmarks[i]) { sum += landmarks[i].score || 0.5; count++; }
  }
  return count > 0 ? sum / count : 0;
}

// Combined confidence across multiple hands.
export function combinedConfidence(hands) {
  if (!hands || !hands.length) return 0;
  return hands.reduce((s, h) => s + handConfidence(h.landmarks), 0) / hands.length;
}

// Analyze finger spread: openness signal based on fingertip-to-wrist
// distance relative to knuckle-to-wrist distance. Scale-invariant ratio:
//   >1 = finger extended (tip beyond knuckle),  <1 = finger curled (tip folded back)
// When an exercise defines joint angle targets, precise per-joint correction
// cues are generated from the measured MCP/PIP/DIP angles.
export function analyzeFingerSpread(landmarks, exercise) {
  if (!landmarks) return { metrics: {}, flags: [], phaseMetric: null, trackable: false };
  const wrist = landmarks[0];
  if (!wrist) return { metrics: {}, flags: [], phaseMetric: null, trackable: false };

  const metrics = {};
  const flags = [];
  const ratios = [];

  for (const { tip, mcp, name } of OPENNESS_FINGERS) {
    const tipP = landmarks[tip], mcpP = landmarks[mcp];
    if (!tipP || !mcpP) continue;
    const mcpDist = dist(mcpP, wrist);
    if (mcpDist < 1) continue;
    const ratio = dist(tipP, wrist) / mcpDist;
    metrics[`finger_${name}_ratio`] = ratio;
    ratios.push({ ratio, name });
  }

  if (ratios.length < 3) {
    return { metrics, flags, phaseMetric: null, trackable: false };
  }

  const phaseMetric = ratios.reduce((s, r) => s + r.ratio, 0) / ratios.length;
  metrics.openness = phaseMetric;

  // Angle-based corrections when the exercise defines joint targets.
  // Only fire while the hand is curling toward the target (openness dropping),
  // so we don't nag during the straight/rest phase of a rep.
  if (exercise?.angles && phaseMetric < 1.05) {
    const angles = computeJointAngles(landmarks);
    metrics.angles = angles;
    const fingers = exercise.fingers || ["index", "middle", "ring", "pinky"];
    for (const finger of fingers) {
      const fa = angles[finger];
      if (!fa) continue;
      for (const joint of ["mcp", "pip", "dip"]) {
        const target = exercise.angles[joint];
        if (!target) continue;
        if (!inRange(fa[joint], target)) {
          const cue = exercise.cues?.[joint];
          if (cue) {
            flags.push({ kind: "angle", finger, joint, text: cue });
          }
          break; // one joint cue per finger
        }
      }
      if (flags.length) break; // one correction at a time
    }
  }

  // Openness fallback flags for exercises without angle targets.
  if (!exercise?.angles) {
    if (phaseMetric > 1.1) {
      for (const { ratio, name } of ratios) {
        if (ratio < 0.95) {
          flags.push({ kind: "bend", finger: name, text: `Try to extend your ${name} finger fully` });
          break;
        }
      }
    }
    if (!flags.length && phaseMetric < 0.7 && phaseMetric > 0.5) {
      flags.push({ kind: "range", finger: "hand", text: "Open your hand a little wider" });
    }
  }

  return { metrics, flags, phaseMetric, trackable: true };
}

// Thumb-to-fingertip touch detection (thumb opposition).
// phaseMetric: 1 = thumb far from all fingertips (rest), 0 = thumb touching a
// fingertip (target). Rep counts on far → near. Scaled by index-MCP-to-wrist
// distance so it stays hand-size invariant.
export function analyzeThumbTouch(landmarks, exercise) {
  if (!landmarks) return { metrics: {}, flags: [], phaseMetric: null, trackable: false };
  const thumbTip = landmarks[4];
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  if (!thumbTip || !wrist || !indexMcp) {
    return { metrics: {}, flags: [], phaseMetric: null, trackable: false };
  }
  const scale = dist(indexMcp, wrist) || 1;
  const tips = exercise?.sequence || [8, 12, 16, 20];
  let minDist = Infinity;
  for (const t of tips) {
    const p = landmarks[t];
    if (!p) continue;
    const d = dist(thumbTip, p) / scale;
    if (d < minDist) minDist = d;
  }
  if (minDist === Infinity) {
    return { metrics: {}, flags: [], phaseMetric: null, trackable: false };
  }
  // Normalize: ~0.25 = touching, ~1.2+ = fully extended apart.
  const phaseMetric = Math.min(1, minDist / 1.2);
  const flags = [];
  if (phaseMetric > 0.5) {
    flags.push({
      kind: "distance",
      finger: "thumb",
      text: exercise?.cues?.distance || "Bring your thumb closer to your fingertip."
    });
  }
  return { metrics: { thumb_tip_distance: minDist }, flags, phaseMetric, trackable: true };
}

// Combined analysis across multiple hands. For "both hands" exercises we
// expose per-hand metrics so the rep state machine can track each hand
// independently and only count a shared rep when both hands complete.
export function combinedAnalysis(hands, exercise) {
  if (!hands || !hands.length) {
    return { metrics: {}, flags: [], phaseMetric: null, trackable: false, perHand: [] };
  }
  const analyze = (h) => exercise?.detect === "thumbTouch"
    ? analyzeThumbTouch(h.landmarks, exercise)
    : analyzeFingerSpread(h.landmarks, exercise);
  const perHand = hands.map(analyze);

  if (perHand.length === 1) {
    return { ...perHand[0], perHand };
  }

  const trackable = perHand.filter(a => a.trackable);
  const avgOpenness = trackable.length
    ? trackable.reduce((s, a) => s + (a.phaseMetric || 0), 0) / trackable.length
    : null;
  const flags = perHand.flatMap(a => a.flags);
  return {
    metrics: { openness: avgOpenness },
    flags,
    phaseMetric: avgOpenness,
    trackable: trackable.length > 0,
    perHand
  };
}

// Rep state machine for finger spreads.
// Single hand: phase "open" → "closed" = one rep.
// Both hands: each hand is tracked independently; a shared rep counts only
// when BOTH hands have completed an open→closed transition (the shared
// count is the min of the per-hand counts, so a faster hand waits for the
// slower one). 3-frame smoothing per hand.
export function updateRepState(state, exercise, analysis) {
  const ex = EXERCISE_LIBRARY[exercise];
  if (!ex || ex.type !== "pose") return { count: state.count, phase: state.phase, rep: false };
  // Per-exercise phase thresholds (defaults suit the openness ratio).
  const OPEN = ex.phase?.open ?? 1.15;
  const CLOSED = ex.phase?.closed ?? 0.85;

  // Both-hands mode: independent per-hand tracking, shared count = min.
  if (analysis.perHand && analysis.perHand.length > 1) {
    const phases = state.phases || analysis.perHand.map(() => "open");
    const histories = state.histories || analysis.perHand.map(() => []);
    const handCounts = state.handCounts || analysis.perHand.map(() => 0);
    const newPhases = [...phases];
    const newHistories = histories.map(h => [...h]);
    const newHandCounts = [...handCounts];

    for (let i = 0; i < analysis.perHand.length; i++) {
      const a = analysis.perHand[i];
      const val = a.phaseMetric;
      if (!a.trackable || val == null) continue;
      const hist = [...newHistories[i], val].slice(-3);
      newHistories[i] = hist;
      const smoothed = hist.reduce((s, v) => s + v, 0) / hist.length;
      let phase = newPhases[i] || "open";
      if (phase === "open" && smoothed < CLOSED) {
        phase = "closed";
        newHandCounts[i] += 1;
      } else if (phase === "closed" && smoothed > OPEN) {
        phase = "open";
      }
      newPhases[i] = phase;
    }

    const prevShared = state.count || 0;
    const sharedCount = Math.min(...newHandCounts);
    const rep = sharedCount > prevShared;
    return {
      count: sharedCount,
      phase: newPhases.every(p => p === "closed") ? "closed" : "open",
      rep,
      phases: newPhases,
      histories: newHistories,
      handCounts: newHandCounts
    };
  }

  // Single-hand mode.
  const val = analysis.phaseMetric;
  if (!analysis.trackable || val == null) {
    return { count: state.count, phase: state.phase, rep: false, history: state.history || [] };
  }
  const history = [...(state.history || []), val].slice(-3);
  const smoothed = history.reduce((a, b) => a + b, 0) / history.length;
  let phase = state.phase || "open";
  let count = state.count || 0;
  let rep = false;
  if (phase === "open" && smoothed < CLOSED) { phase = "closed"; count += 1; rep = true; }
  else if (phase === "closed" && smoothed > OPEN) phase = "open";
  return { count, phase, rep, history };
}

// Summarize a single hand's pose for the reasoning model.
export function summarizeHand(landmarks) {
  if (!landmarks) return "hand not visible";
  const a = analyzeFingerSpread(landmarks);
  if (a.metrics.openness == null) return "hand not trackable";
  const o = a.metrics.openness.toFixed(2);
  const state = a.metrics.openness > 1.1 ? "hand open" : a.metrics.openness < 0.85 ? "fist closed" : "partially open";
  return `openness ${o}, ${state}`;
}

// Summarize one or both hands for the reasoning model.
export function summarizeHands(hands) {
  if (!hands || !hands.length) return "hand not visible";
  if (hands.length === 1) return summarizeHand(hands[0].landmarks);
  return hands.map((h, i) => `${h.handedness}: ${summarizeHand(h.landmarks)}`).join("; ");
}