// Joint angle computation for hand exercises.
// All angles are INTERIOR angles in degrees at the middle landmark:
//   180 = fully straight, smaller = more bent.
// MediaPipe hand landmarks:
//   0 wrist | thumb 1 CMC, 2 MCP, 3 IP, 4 tip
//   index 5 MCP, 6 PIP, 7 DIP, 8 tip | middle 9-12 | ring 13-16 | pinky 17-20

// Joint angle triplets (a, b, c): angle measured at b.
export const JOINT_TRIPLETS = {
  index: { mcp: [0, 5, 6], pip: [5, 6, 7], dip: [6, 7, 8] },
  middle: { mcp: [0, 9, 10], pip: [9, 10, 11], dip: [10, 11, 12] },
  ring: { mcp: [0, 13, 14], pip: [13, 14, 15], dip: [14, 15, 16] },
  pinky: { mcp: [0, 17, 18], pip: [17, 18, 19], dip: [18, 19, 20] }
};

export const ALL_FINGERS = ["index", "middle", "ring", "pinky"];

// Reference target ranges (degrees). Starting values, not clinical norms.
export const STRAIGHT = [160, 180];
export const BENT_90 = [70, 110];
export const BENT_FULL = [20, 80];

// Interior angle at b, from landmarks a-b-c. Returns degrees or null.
export function angleAt(a, b, c) {
  if (!a || !b || !c) return null;
  const abx = a.x - b.x, aby = a.y - b.y;
  const cbx = c.x - b.x, cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
  if (mag < 1e-6) return null;
  let cos = dot / mag;
  cos = Math.min(1, Math.max(-1, cos));
  return Math.acos(cos) * 180 / Math.PI;
}

// Compute MCP / PIP / DIP angles for the four fingers.
export function computeJointAngles(landmarks) {
  const out = {};
  for (const [finger, joints] of Object.entries(JOINT_TRIPLETS)) {
    out[finger] = {};
    for (const [joint, [a, b, c]] of Object.entries(joints)) {
      out[finger][joint] = angleAt(landmarks[a], landmarks[b], landmarks[c]);
    }
  }
  return out;
}

export function inRange(angle, range) {
  return angle != null && range && angle >= range[0] && angle <= range[1];
}