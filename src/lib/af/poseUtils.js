// Local pose reasoning for AdaptiveFit — the "fast path" of the multimodal
// stack. MoveNet (the vision model) returns 17 COCO keypoints; this module
// computes angles, counts reps, and flags deviations for seated upper-body
// exercises. It deliberately reasons about partial poses: lower-body
// landmarks may be occluded by a wheelchair, so every check guards missing
// points and falls back to rhythm coaching when confidence is low.

import { EXERCISE_LIBRARY } from "@/lib/af/exercises";

// MoveNet COCO-17 keypoint indices
export const KP = {
  nose: 0, leftEye: 1, rightEye: 2, leftEar: 3, rightEar: 4,
  leftShoulder: 5, rightShoulder: 6, leftElbow: 7, rightElbow: 8,
  leftWrist: 9, rightWrist: 10, leftHip: 11, rightHip: 12,
  leftKnee: 13, rightKnee: 14, leftAnkle: 15, rightAnkle: 16
};

function dist(a, b) {
  if (!a || !b) return Infinity;
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

// angle at point b formed by a-b-c, in degrees
function angleAt(a, b, c) {
  if (!a || !b || !c) return null;
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const m1 = Math.hypot(v1.x, v1.y), m2 = Math.hypot(v2.x, v2.y);
  if (m1 === 0 || m2 === 0) return null;
  let cos = dot / (m1 * m2);
  cos = Math.max(-1, Math.min(1, cos));
  return Math.acos(cos) * 180 / Math.PI;
}

// Extract normalized keypoints with confidence threshold.
export function extractKeypoints(pose, minScore = 0.3) {
  const kps = pose?.keypoints;
  if (!kps) return {};
  const out = {};
  for (const k of kps) {
    out[k.name || k.part] = (k.score != null ? k.score : (k.confidence != null ? k.confidence : 1)) >= minScore
      ? { x: k.x, y: k.y, score: k.score ?? k.confidence ?? 0 }
      : null;
  }
  return out;
}

// Confidence that the upper body is framed (shoulders + at least one arm visible).
export function upperBodyConfidence(k) {
  const need = [k.leftShoulder, k.rightShoulder, k.leftWrist, k.rightWrist, k.nose];
  const scores = need.filter(Boolean).map(p => p.score);
  if (scores.length === 0) return 0;
  return scores.reduce((s, v) => s + v, 0) / scores.length;
}

// ---- Exercise-specific analysis ----

// Arm raise (seated): the movement signal is wrist height relative to the
// shoulder, normalized by shoulder width so thresholds don't depend on how
// close the user sits to the camera. Uses the higher of the two arms so a
// one-arm raise still registers. Returns a `trackable` flag so the rep state
// machine can skip low-confidence frames.
function analyzeArmRaise(k) {
  const flags = [];
  const metrics = {};

  // Body scale — shoulder width is the most stable seated upper-body reference.
  const ls = k.leftShoulder, rs = k.rightShoulder;
  let scale = null;
  if (ls && rs) {
    scale = dist(ls, rs);
  } else if (ls || rs) {
    // Fallback when one shoulder is occluded: upper-arm length.
    const sh = ls || rs;
    const el = sh === ls ? k.leftElbow : k.rightElbow;
    if (el) scale = dist(sh, el);
  }
  metrics.scale = scale;

  // Per-arm raise ratio: (shoulder.y − wrist.y) / scale.
  //   0 = wrist at shoulder height,  >0 = above,  <0 = below.
  const ratios = [];
  let trackable = false;
  for (const side of ["left", "right"]) {
    const sh = k[side + "Shoulder"], wr = k[side + "Wrist"], el = k[side + "Elbow"];
    if (!sh || !wr || !scale) continue;
    // Require a minimum wrist confidence so a flickering detection can't count.
    if ((wr.score ?? 0) < 0.35) continue;
    const ratio = (sh.y - wr.y) / scale;
    metrics[side + "_raiseRatio"] = ratio;
    ratios.push(ratio);
    trackable = true;
    if (ratio > -0.2 && el) {
      const armAngle = angleAt(sh, el, wr); // ~180 straight
      metrics[side + "_armAngle"] = armAngle;
      if (armAngle != null && armAngle < 140) {
        flags.push({ side, kind: "bend", text: `Try to straighten your ${side} arm a little more` });
      }
    }
  }

  // phaseMetric = highest arm ratio (so a unilateral raise still registers).
  const phaseMetric = ratios.length > 0 ? Math.max(...ratios) : null;

  // shoulder asymmetry / drop — normalized by scale
  if (ls && rs) {
    const dy = Math.abs(ls.y - rs.y);
    metrics.shoulderDrop = dy;
    if (scale && dy > scale * 0.25) {
      flags.push({ side: ls.y < rs.y ? "left" : "right", kind: "shoulder", text: "Level your shoulders, sit tall" });
    }
  }
  // slouch: nose far below shoulder midpoint — normalized by scale
  const nose = k.nose;
  if (nose && ls && rs) {
    const midY = (ls.y + rs.y) / 2;
    metrics.slouch = nose.y - midY;
    if (scale && nose.y - midY > scale * 0.65) flags.push({ side: "spine", kind: "posture", text: "Sit up tall, lift your chest" });
  }

  return { metrics, flags, phaseMetric, trackable };
}

function analyzeOverheadPress(k) {
  const base = analyzeArmRaise(k);
  // require wrists clearly above shoulders for the "press" top
  const flags = base.flags.filter(f => f.kind !== "bend");
  for (const side of ["left", "right"]) {
    const sh = k[side + "Shoulder"], wr = k[side + "Wrist"];
    if (sh && wr) {
      if (wr.y < sh.y - 30 && base.metrics[side + "_armAngle"] != null && base.metrics[side + "_armAngle"] < 150) {
        flags.push({ side, kind: "bend", text: `Press your ${side} hand a bit higher` });
      }
    }
  }
  return { metrics: base.metrics, flags, phaseMetric: base.phaseMetric };
}

// Neck tilt: nose lateral offset relative to shoulder midpoint.
function analyzeNeckTilt(k) {
  const ls = k.leftShoulder, rs = k.rightShoulder, nose = k.nose;
  const flags = [];
  let metrics = {};
  if (ls && rs && nose) {
    const midX = (ls.x + rs.x) / 2;
    const shoulderWidth = dist(ls, rs) || 1;
    const tilt = (nose.x - midX) / shoulderWidth; // -1..1
    metrics.tilt = tilt;
    // shoulders rising toward the tilt indicates cheating
    const dy = Math.abs(ls.y - rs.y);
    if (dy > 40) flags.push({ side: "shoulders", kind: "shoulder", text: "Keep your shoulders down as you tilt" });
  }
  return { metrics, flags, phaseMetric: Math.abs(metrics.tilt || 0) };
}

const ANALYZERS = {
  armRaise: analyzeArmRaise,
  overheadPress: analyzeOverheadPress,
  neckTilt: analyzeNeckTilt
};

// Count reps via a phase state machine on the normalized raise ratio.
// Confidence gate: non-trackable (low-confidence) frames don't advance the
// count. A 3-frame moving average smooths the signal so a single noisy frame
// can't trigger a transition. Thresholds are on the ratio scale where
// 0 = wrist at shoulder height, negative = below.
export function updateRepState(state, exercise, analysis) {
  const ex = EXERCISE_LIBRARY[exercise];
  if (!ex || ex.type !== "pose") return { count: state.count, phase: state.phase, rep: false };
  const val = analysis.phaseMetric;
  if (!analysis.trackable || val == null) {
    return { count: state.count, phase: state.phase, rep: false, history: state.history || [] };
  }
  const history = [...(state.history || []), val].slice(-3);
  const smoothed = history.reduce((a, b) => a + b, 0) / history.length;
  const UP = -0.15, DOWN = -0.55; // ratio-scale thresholds
  let phase = state.phase || "down";
  let count = state.count || 0;
  let rep = false;
  if (phase === "down" && smoothed > UP) phase = "up";
  else if (phase === "up" && smoothed < DOWN) { phase = "down"; count += 1; rep = true; }
  return { count, phase, rep, history };
}

function EXERCISE_LIB(name) {
  return EXERCISE_LIBRARY[name];
}

// Analyze a single pose for the active exercise.
export function analyzePose(keypoints, exercise) {
  const ex = EXERCISE_LIBRARY[exercise];
  if (!ex || !ex.detect) {
    return { metrics: {}, flags: [], phaseMetric: null, rhythm: true };
  }
  const analyzer = ANALYZERS[ex.detect];
  if (!analyzer) return { metrics: {}, flags: [], phaseMetric: null };
  return analyzer(keypoints);
}

// Summarize the pose for the reasoning model (cheap textual description).
export function summarizePose(k) {
  const parts = [];
  const label = (name, present) => parts.push(`${name}: ${present ? "visible" : "hidden"}`);
  label("nose", !!k.nose);
  label("shoulders", !!(k.leftShoulder || k.rightShoulder));
  label("left arm", !!(k.leftShoulder && k.leftWrist));
  label("right arm", !!(k.rightShoulder && k.rightWrist));
  if (k.leftShoulder && k.rightShoulder) {
    parts.push(`shoulder level diff ${Math.round(Math.abs(k.leftShoulder.y - k.rightShoulder.y))}px`);
  }
  return parts.join(", ");
}