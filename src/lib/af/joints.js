// Per-joint flexion angles from MediaPipe's 21 hand landmarks.
// Flexion = bend at a joint in degrees (0 = straight). Uses 3D (z scaled
// to pixel units) so curling toward the camera is still measured.

export const JOINTS = [
  { id: "thumb_cmc", finger: "thumb", label: "Thumb base", pts: [0, 1, 2], normal: 40 },
  { id: "thumb_mcp", finger: "thumb", label: "Thumb knuckle", pts: [1, 2, 3], normal: 50 },
  { id: "thumb_ip", finger: "thumb", label: "Thumb tip joint", pts: [2, 3, 4], normal: 70 },
  ...[["index", 5], ["middle", 9], ["ring", 13], ["pinky", 17]].flatMap(([f, b]) => [
    { id: `${f}_mcp`, finger: f, label: `${cap(f)} knuckle`, pts: [0, b, b + 1], normal: 80 },
    { id: `${f}_pip`, finger: f, label: `${cap(f)} middle joint`, pts: [b, b + 1, b + 2], normal: 95 },
    { id: `${f}_dip`, finger: f, label: `${cap(f)} tip joint`, pts: [b + 1, b + 2, b + 3], normal: 65 }
  ])
];

function cap(s) { return s[0].toUpperCase() + s.slice(1); }

function flex(a, b, c) {
  const Z = 640;
  const v1 = [b.x - a.x, b.y - a.y, (b.z - a.z) * Z], v2 = [c.x - b.x, c.y - b.y, (c.z - b.z) * Z];
  const m = Math.hypot(...v1) * Math.hypot(...v2) || 1;
  const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
  return Math.acos(Math.max(-1, Math.min(1, dot / m))) * 180 / Math.PI;
}

// Returns { [jointId]: degrees }
export function jointAngles(lm) {
  const out = {};
  for (const j of JOINTS) out[j.id] = flex(lm[j.pts[0]], lm[j.pts[1]], lm[j.pts[2]]);
  return out;
}

// Classify measured range of motion against a typical healthy range.
export function rateJoint(rom, normal) {
  const ratio = rom / normal;
  return { ratio, level: ratio >= 0.7 ? "typical" : ratio >= 0.4 ? "limited" : "very_limited" };
}