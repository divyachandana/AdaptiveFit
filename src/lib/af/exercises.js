// Exercise definitions for AdaptiveFit seated coaching.
// Each exercise maps to pose metrics computed from MediaPipe hand landmarks.
// "rhythm" exercises are time-counted when pose confidence is low.
// "pose" exercises count reps via the openness or thumb-touch signal.
// Reps are kept low (3) for gentle, accessible practice.
//
// Angle targets (mcp/pip/dip ranges in degrees) come from clinical hand-therapy
// sources (Mayo Clinic, Harvard Health, Cleveland Clinic, Michigan Medicine,
// Hand Therapy Australia). They drive precise form-correction cues.

import { STRAIGHT, BENT_90, BENT_FULL, ALL_FINGERS } from "@/lib/af/angles";

export const BODY_PARTS = [
  { id: "upper_body", label: "Arms & Shoulders", emoji: "💪" },
  { id: "neck", label: "Neck & Head", emoji: "🧠" },
  { id: "hands", label: "Hands & Wrists", emoji: "✋" }
];

const HAND_SIDES = ["left", "right", "both"];

export const EXERCISE_LIBRARY = {
  // ---------- Original exercises ----------
  "Hand Open-Close": {
    id: "hand_open_close",
    type: "pose",
    sides: HAND_SIDES,
    defaultReps: 3,
    cue: "Open your hand, then gently close it",
    focus: "Slowly open your fingers, then make a comfortable fist without squeezing hard.",
    detect: "fingerSpread"
  },
  "Finger Spreads": {
    id: "finger_spreads",
    type: "pose",
    sides: HAND_SIDES,
    defaultReps: 3,
    cue: "Spread your fingers apart, then bring them together",
    focus: "Spread your fingers apart comfortably, then bring them back together.",
    detect: "fingerSpread"
  },
  "Wrist Rotations": {
    id: "wrist_rotations",
    type: "rhythm",
    sides: HAND_SIDES,
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
  },

  // ---------- Group 1: Tendon glides (Harvard Health; Hand Therapy Australia) ----------
  "Straight Hand": {
    id: "straight_hand",
    type: "rhythm",
    sides: HAND_SIDES,
    defaultReps: 3,
    cue: "Hold your hand up, fingers straight and together",
    focus: "Hold your hand up with fingers straight and together, wrist relaxed. Hold a few seconds.",
    detect: null,
    group: "tendon_glides"
  },
  "Hook Fist": {
    id: "hook_fist",
    type: "pose",
    sides: HAND_SIDES,
    defaultReps: 3,
    cue: "Curl your fingertips down into a hook, keep big knuckles straight",
    focus: "Curl your fingertips down into a hook while keeping your big knuckles straight.",
    detect: "fingerSpread",
    fingers: ALL_FINGERS,
    angles: { mcp: STRAIGHT, pip: BENT_FULL, dip: BENT_FULL },
    cues: {
      mcp: "Keep your big knuckles straight, only curl the top of your fingers.",
      pip: "Curl your fingers a bit more.",
      dip: "Bend your fingertips down a little more."
    },
    group: "tendon_glides"
  },
  "Tabletop": {
    id: "tabletop",
    type: "pose",
    sides: HAND_SIDES,
    defaultReps: 3,
    cue: "Bend only at your big knuckles so your fingers make a flat table",
    focus: "Bend only at your big knuckles so your fingers make a flat table. Keep your fingers straight.",
    detect: "fingerSpread",
    fingers: ALL_FINGERS,
    angles: { mcp: BENT_90, pip: STRAIGHT, dip: STRAIGHT },
    cues: {
      mcp: "Bend more at your big knuckles.",
      pip: "Keep your fingers straight like a tabletop.",
      dip: "Keep your fingertips straight."
    },
    group: "tendon_glides"
  },
  "Straight Fist": {
    id: "straight_fist",
    type: "pose",
    sides: HAND_SIDES,
    defaultReps: 3,
    cue: "Touch your fingertips to the base of your palm, keep end joints straight",
    focus: "Touch your fingertips to the base of your palm, keeping the end joints straight.",
    detect: "fingerSpread",
    fingers: ALL_FINGERS,
    angles: { mcp: BENT_90, pip: BENT_90, dip: STRAIGHT },
    cues: {
      mcp: "Bend more at your big knuckles.",
      pip: "Bend the middle of your fingers more.",
      dip: "Keep your fingertips straight."
    },
    group: "tendon_glides"
  },
  "Full Fist": {
    id: "full_fist",
    type: "pose",
    sides: HAND_SIDES,
    defaultReps: 3,
    cue: "Make a gentle full fist, all joints bent, don't squeeze",
    focus: "Make a gentle full fist with all joints bent. Don't squeeze.",
    detect: "fingerSpread",
    fingers: ALL_FINGERS,
    angles: { mcp: BENT_90, pip: BENT_FULL, dip: BENT_FULL },
    cues: {
      mcp: "Bend your big knuckles more.",
      pip: "Close your fingers a little more.",
      dip: "Curl your fingertips in."
    },
    group: "tendon_glides"
  },

  // ---------- Group 2: Arthritis / range of motion (Mayo Clinic) ----------
  "Knuckle Bend": {
    id: "knuckle_bend",
    type: "pose",
    sides: HAND_SIDES,
    defaultReps: 3,
    cue: "Bend the middle joints of your fingers, keep knuckles straight",
    focus: "Fingers straight and together. Bend the middle joints of your fingers, knuckles stay straight.",
    detect: "fingerSpread",
    fingers: ALL_FINGERS,
    angles: { mcp: STRAIGHT, pip: BENT_90 },
    cues: {
      mcp: "Keep your big knuckles straight.",
      pip: "Bend the middle joints a bit more."
    },
    group: "range_of_motion"
  },
  "Gentle Fist": {
    id: "gentle_fist",
    type: "pose",
    sides: HAND_SIDES,
    defaultReps: 3,
    cue: "Close into a soft fist with your thumb wrapped outside, don't squeeze",
    focus: "Rest your forearm on a table. Close into a soft fist with your thumb wrapped across the outside. Don't squeeze.",
    detect: "fingerSpread",
    fingers: ALL_FINGERS,
    angles: { mcp: BENT_90, pip: BENT_FULL },
    cues: {
      mcp: "Close your fingers a little more.",
      pip: "Curl your fingers into your palm."
    },
    group: "range_of_motion"
  },
  "C-Grip": {
    id: "c_grip",
    type: "pose",
    sides: HAND_SIDES,
    defaultReps: 3,
    cue: "Curl your fingers and thumb gently as if holding a can",
    focus: "Curl your fingers and thumb gently as if holding a can or jar, keeping a C-shaped gap.",
    detect: "fingerSpread",
    fingers: ALL_FINGERS,
    angles: { mcp: [120, 160], pip: [100, 150] },
    cues: {
      mcp: "Curve your fingers a little, like holding a jar.",
      pip: "Soften the bend in your fingers."
    },
    group: "range_of_motion"
  },
  "Thumb-to-Fingertip Touch": {
    id: "thumb_opposition",
    type: "pose",
    sides: HAND_SIDES,
    defaultReps: 3,
    cue: "Touch your thumb to each fingertip in turn, making an O",
    focus: "Touch your thumb to each fingertip in turn, making an O. Hold each touch briefly.",
    detect: "thumbTouch",
    sequence: [8, 12, 16, 20],
    phase: { open: 0.6, closed: 0.25 },
    cues: {
      distance: "Bring your thumb closer to your fingertip.",
      sequence: "Now move to the next finger."
    },
    group: "range_of_motion"
  },
  "Finger Walk": {
    id: "finger_walk",
    type: "rhythm",
    sides: HAND_SIDES,
    defaultReps: 3,
    cue: "Lift each finger in turn and move it toward your thumb",
    focus: "Palm flat, thumb apart. Lift each finger in turn and move it toward your thumb.",
    detect: null,
    group: "range_of_motion"
  },

  // ---------- Group 3: Isolation (Cleveland Clinic) ----------
  "Fingertip Bend": {
    id: "fingertip_bend",
    type: "pose",
    sides: HAND_SIDES,
    defaultReps: 3,
    cue: "Bend and straighten just the tip of each finger",
    focus: "Bend and straighten just the tip of each finger, keeping the rest of the finger still.",
    detect: "fingerSpread",
    fingers: ALL_FINGERS,
    angles: { dip: BENT_90 },
    cues: { dip: "Bend just the very tip of your finger." },
    group: "isolation"
  },
  "Finger Lifts": {
    id: "finger_lifts",
    type: "rhythm",
    sides: HAND_SIDES,
    defaultReps: 3,
    cue: "Lift one finger at a time, others stay down",
    focus: "Palm flat on the table. Lift one finger at a time, others stay down.",
    detect: null,
    group: "isolation"
  },

  // ---------- Group 4: Wrist (rhythm — needs pose/elbow tracking) ----------
  "Wrist Flex-Extend": {
    id: "wrist_flex_extend",
    type: "rhythm",
    sides: HAND_SIDES,
    defaultReps: 3,
    cue: "Move your hand up, then down",
    focus: "Forearm on a padded table edge, hand hanging off. Move your hand up, then down.",
    detect: null,
    group: "wrist"
  },
  "Palm Flip": {
    id: "palm_flip",
    type: "rhythm",
    sides: HAND_SIDES,
    defaultReps: 3,
    cue: "Turn your palm up, then down",
    focus: "Elbow at your side, bent. Turn your palm up, then down.",
    detect: null,
    group: "wrist"
  },
  "Side-to-Side Wrist Wave": {
    id: "wrist_deviation",
    type: "rhythm",
    sides: HAND_SIDES,
    defaultReps: 3,
    cue: "Tilt your hand toward your thumb, then toward your pinky",
    focus: "Hand flat, palm down. Tilt your hand toward your thumb, then toward your pinky.",
    detect: null,
    group: "wrist"
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
  },
  {
    id: "tendon_glide_series",
    name: "Tendon Glide Series",
    description: "Classic hand-therapy tendon glides, both hands",
    bodyPart: "hands",
    exercises: [
      { name: "Hook Fist", side: "both" },
      { name: "Tabletop", side: "both" },
      { name: "Straight Fist", side: "both" },
      { name: "Full Fist", side: "both" }
    ]
  },
  {
    id: "arthritis_gentle_rom",
    name: "Gentle Arthritis ROM",
    description: "Mayo Clinic range-of-motion set for stiff hands",
    bodyPart: "hands",
    exercises: [
      { name: "Knuckle Bend", side: "both" },
      { name: "Gentle Fist", side: "both" },
      { name: "C-Grip", side: "both" },
      { name: "Thumb-to-Fingertip Touch", side: "both" }
    ]
  },
  {
    id: "finger_power",
    name: "Finger Power",
    description: "Curls, tips, and spreads for dexterity",
    bodyPart: "hands",
    exercises: [
      { name: "Full Fist", side: "both" },
      { name: "Fingertip Bend", side: "both" },
      { name: "Finger Spreads", side: "both" },
      { name: "Hook Fist", side: "both" }
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