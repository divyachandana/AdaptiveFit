// Exercise definitions for AdaptiveFit seated coaching.
// Each exercise maps to pose metrics computed from MoveNet keypoints.
// "rhythm" exercises are time-counted when pose confidence is low.

export const BODY_PARTS = [
  { id: "upper_body", label: "Arms & Shoulders", emoji: "💪" },
  { id: "neck", label: "Neck & Head", emoji: "🧠" },
  { id: "hands", label: "Hands & Wrists", emoji: "✋" }
];

export const EXERCISE_LIBRARY = {
  "Arm Raises": {
    id: "arm_raises",
    type: "pose",
    side: "both",
    defaultReps: 10,
    cue: "Raise your arms out to the sides up to shoulder height",
    focus: "Lift your wrists up to shoulder height, then a little higher if you can.",
    detect: "armRaise"
  },
  "Overhead Press": {
    id: "overhead_press",
    type: "pose",
    side: "both",
    defaultReps: 8,
    cue: "Press your hands up toward the ceiling",
    focus: "Press your hands up as high as you comfortably can.",
    detect: "overheadPress"
  },
  "Neck Tilts": {
    id: "neck_tilts",
    type: "pose",
    side: "both",
    defaultReps: 8,
    cue: "Tilt your ear toward your shoulder",
    focus: "Tilt your head to the side, keep your shoulders down.",
    detect: "neckTilt"
  },
  "Neck Turns": {
    id: "neck_turns",
    type: "rhythm",
    side: "both",
    defaultReps: 8,
    cue: "Turn your chin toward each shoulder slowly",
    focus: "Turn your head slowly side to side.",
    detect: null
  },
  "Wrist Rotations": {
    id: "wrist_rotations",
    type: "rhythm",
    side: "both",
    defaultReps: 10,
    cue: "Make gentle circles with your wrists",
    focus: "Circle your wrists slowly and smoothly.",
    detect: null
  },
  "Hand Open-Close": {
    id: "hand_open_close",
    type: "rhythm",
    side: "both",
    defaultReps: 12,
    cue: "Spread your fingers wide, then make a fist",
    focus: "Open your hand wide, then gently close it.",
    detect: null
  }
};

// Build a default plan from chosen body parts (mirrors the backend defaults
// so the UI can render instantly before the reasoning model refines it).
export function defaultPlanForParts(parts) {
  const map = {
    upper_body: ["Arm Raises", "Overhead Press", "Hand Open-Close"],
    neck: ["Neck Tilts", "Neck Turns"],
    hands: ["Wrist Rotations", "Hand Open-Close"]
  };
  const seen = new Set();
  const out = [];
  for (const p of parts) {
    for (const name of map[p] || []) {
      if (!seen.has(name)) { seen.add(name); out.push(name); }
    }
  }
  if (out.length === 0) out.push("Arm Raises");
  return out.map(name => ({
    name,
    ...EXERCISE_LIBRARY[name],
    targetReps: EXERCISE_LIBRARY[name].defaultReps
  }));
}