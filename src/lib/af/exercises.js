// Exercise definitions for AdaptiveFit seated coaching.
// Each exercise maps to pose metrics computed from MediaPipe hand landmarks.
// "rhythm" exercises are time-counted when pose confidence is low.
// Reps are kept low (3) for gentle, accessible practice.

export const BODY_PARTS = [
  { id: "upper_body", label: "Arms & Shoulders", emoji: "💪" },
  { id: "neck", label: "Neck & Head", emoji: "🧠" },
  { id: "hands", label: "Hands & Wrists", emoji: "✋" }
];

export const EXERCISE_LIBRARY = {
  "Hand Open-Close": {
    id: "hand_open_close",
    type: "pose",
    sides: ["left", "right", "both"],
    defaultReps: 3,
    cue: "Open your hand, then gently close it",
    focus: "Slowly open your fingers, then make a comfortable fist without squeezing hard.",
    detect: "fingerSpread"
  },
  "Finger Spreads": {
    id: "finger_spreads",
    type: "pose",
    sides: ["left", "right", "both"],
    defaultReps: 3,
    cue: "Spread your fingers apart, then bring them together",
    focus: "Spread your fingers apart comfortably, then bring them back together.",
    detect: "fingerSpread"
  },
  "Wrist Rotations": {
    id: "wrist_rotations",
    type: "rhythm",
    sides: ["left", "right", "both"],
    defaultReps: 3,
    cue: "Make gentle circles with your wrist",
    focus: "Circle your wrist slowly and smoothly.",
    detect: null
  },
  "Arm Raises": {
    id: "arm_raises",
    type: "pose",
    sides: ["both"],
    defaultReps: 3,
    cue: "Raise your arms out to the sides up to shoulder height",
    focus: "Lift your wrists up to shoulder height, then a little higher if you can.",
    detect: "armRaise"
  },
  "Overhead Press": {
    id: "overhead_press",
    type: "pose",
    sides: ["both"],
    defaultReps: 3,
    cue: "Press your hands up toward the ceiling",
    focus: "Press your hands up as high as you comfortably can.",
    detect: "overheadPress"
  },
  "Neck Tilts": {
    id: "neck_tilts",
    type: "pose",
    sides: ["both"],
    defaultReps: 3,
    cue: "Tilt your ear toward your shoulder",
    focus: "Tilt your head to the side, keep your shoulders down.",
    detect: "neckTilt"
  },
  "Neck Turns": {
    id: "neck_turns",
    type: "rhythm",
    sides: ["both"],
    defaultReps: 3,
    cue: "Turn your chin toward each shoulder slowly",
    focus: "Turn your head slowly side to side.",
    detect: null
  }
};

// Predefined routines — each is a sequence of exercises with a hand side.
export const ROUTINES = [
  {
    id: "both_hands_basics",
    name: "Both Hands Basics",
    description: "Open-close and spread with both hands",
    bodyPart: "hands",
    exercises: [
      { name: "Hand Open-Close", side: "both" },
      { name: "Finger Spreads", side: "both" }
    ]
  },
  {
    id: "left_hand_drills",
    name: "Left Hand Drills",
    description: "Focused practice for your left hand",
    bodyPart: "hands",
    exercises: [
      { name: "Hand Open-Close", side: "left" },
      { name: "Finger Spreads", side: "left" }
    ]
  },
  {
    id: "right_hand_drills",
    name: "Right Hand Drills",
    description: "Focused practice for your right hand",
    bodyPart: "hands",
    exercises: [
      { name: "Hand Open-Close", side: "right" },
      { name: "Finger Spreads", side: "right" }
    ]
  },
  {
    id: "full_hand_session",
    name: "Full Hand Session",
    description: "Left, right, and both hands together",
    bodyPart: "hands",
    exercises: [
      { name: "Hand Open-Close", side: "left" },
      { name: "Hand Open-Close", side: "right" },
      { name: "Finger Spreads", side: "both" }
    ]
  }
];

// Build a default plan from chosen body parts (mirrors the backend defaults
// so the UI can render instantly before the reasoning model refines it).
export function defaultPlanForParts(parts) {
  const map = {
    upper_body: ["Arm Raises", "Overhead Press"],
    neck: ["Neck Tilts", "Neck Turns"],
    hands: ["Hand Open-Close", "Finger Spreads"]
  };
  const seen = new Set();
  const out = [];
  for (const p of parts) {
    for (const name of map[p] || []) {
      if (!seen.has(name)) { seen.add(name); out.push(name); }
    }
  }
  if (out.length === 0) out.push("Hand Open-Close");
  return out.map(name => ({
    name,
    ...EXERCISE_LIBRARY[name],
    targetReps: EXERCISE_LIBRARY[name].defaultReps
  }));
}