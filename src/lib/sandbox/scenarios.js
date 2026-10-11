// Base exercise scenario catalog for the benchmark sandbox.
// Each scenario carries the supplied user instruction, game interaction
// concept, and release priority. Team edits are stored in the
// TrackingScenario entity and override these base definitions at runtime.

export const HAND_SCENARIOS = [
  {
    id: "hand_opening",
    name: "Hand Opening and Closing",
    userInstruction: "Open the fingers, then gently close into a comfortable fist without squeezing hard.",
    gameInteraction: "Open a flower; closing resets it for the next cycle.",
    releasePriority: "mvp",
    trackingCategory: "hand",
    trackingNotes: "Track fingertip-to-wrist ratios. Flag fingers that lag during extension. Tolerate partial range. Stop signal: new pain or worsening symptoms.",
  },
  {
    id: "finger_spreading",
    name: "Finger Spreading",
    userInstruction: "Spread the fingers, then bring them together comfortably.",
    gameInteraction: "Expand and gather colored rays.",
    releasePriority: "mvp",
    trackingCategory: "hand",
    trackingNotes: "Measure inter-finger spread distance. Should work with one hand visible.",
  },
  {
    id: "thumb_touches",
    name: "Thumb-to-Fingertip Touches",
    userInstruction: "Touch the thumb to each fingertip in turn.",
    gameInteraction: "Light up four colored targets.",
    releasePriority: "mvp",
    trackingCategory: "hand",
    trackingNotes: "Detect thumb-tip to finger-tip contact (thumb opposition). Requires precise landmark stability across all four fingertips.",
  },
  {
    id: "wrist_bending",
    name: "Wrist Bending",
    userInstruction: "With the forearm supported, slowly move the hand up and down.",
    gameInteraction: "Guide a floating object vertically.",
    releasePriority: "mvp",
    trackingCategory: "hand",
    trackingNotes: "Track wrist angle relative to forearm. Keep fingers relaxed. Ensure forearm stays supported on a surface.",
  },
  {
    id: "wrist_side_to_side",
    name: "Wrist Side-to-Side Movement",
    userInstruction: "With the forearm and hand supported, move toward the thumb side and then the little-finger side.",
    gameInteraction: "Move a boat between nearby markers.",
    releasePriority: "mvp",
    trackingCategory: "hand",
    trackingNotes: "Track radial/ulnar deviation. Small range of motion expected. Do not rotate the forearm during this exercise.",
  },
  {
    id: "forearm_rotation",
    name: "Forearm Rotation",
    userInstruction: "Keep the elbow near the body; turn the palm upward and downward.",
    gameInteraction: "Rotate a virtual leaf to catch light.",
    releasePriority: "next_release",
    trackingCategory: "hand",
    trackingNotes: "Pronation/supination — keep elbow bent and tucked against the side. 2D tracking has limited depth sensitivity; note limitations.",
  },
  {
    id: "tendon_glides",
    name: "Finger Tendon Glides",
    userInstruction: "Follow a therapist-selected sequence of finger positions.",
    gameInteraction: "Step through illustrated poses, with optional manual confirmation.",
    releasePriority: "clinician_configured",
    trackingCategory: "hand",
    trackingNotes: "Clinician-configured. Sequence: straight → hook (bend middle/end joints, keep knuckles straight) → comfortable full fist → straight. Not available for ordinary benchmark testing.",
  },
];

export const POSE_SCENARIOS = [
  {
    id: "seated_arm_raise",
    name: "Seated Arm Raise",
    userInstruction: "Slowly raise one arm to a comfortable height, then lower it.",
    gameInteraction: "Move an arm toward a comfortable height and return.",
    releasePriority: "mvp",
    trackingCategory: "pose",
    trackingNotes: "Track shoulder and elbow keypoints. Respect user-chosen range, not max ROM.",
  },
  {
    id: "elbow_bend",
    name: "Elbow Bend and Straighten",
    userInstruction: "Bend the elbow to bring the hand toward the shoulder, then straighten.",
    gameInteraction: "Raise and lower a lantern through a small arc.",
    releasePriority: "mvp",
    trackingCategory: "pose",
    trackingNotes: "Track elbow angle. Offer supported-arm version and left/right settings.",
  },
  {
    id: "tabletop_reach",
    name: "Tabletop Forward Reach",
    userInstruction: "Slide the hand or forearm toward a nearby target and return.",
    gameInteraction: "Slide toward a nearby target.",
    releasePriority: "mvp",
    trackingCategory: "pose",
    trackingNotes: "Track wrist position in 2D. Keep targets within supported reach.",
  },
];

export const ALL_SCENARIOS = [...HAND_SCENARIOS, ...POSE_SCENARIOS];

export function scenariosByCategory(category) {
  return ALL_SCENARIOS.filter(s => s.trackingCategory === category);
}

export function getScenario(id) {
  return ALL_SCENARIOS.find(s => s.id === id);
}

export const PRIORITY_LABELS = {
  mvp: "MVP",
  next_release: "Next Release",
  clinician_configured: "Clinician-Configured",
};

export const PRIORITY_STYLES = {
  mvp: "bg-emerald-50 text-emerald-700 border-emerald-200",
  next_release: "bg-amber-50 text-amber-700 border-amber-200",
  clinician_configured: "bg-rose-50 text-rose-700 border-rose-200",
};