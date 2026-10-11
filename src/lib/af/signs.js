// ASL handshapes checked against MediaPipe Hands landmarks.
// Each sign lists the constraints it needs; evaluateSign() compares the
// live hand and returns specific placement corrections.
//
// Constraints:
//   fingers: { name: "up" | "down" }        extended vs folded (distance based)
//   curl:    { name: "straight" | "bent" | "fist" }  joint angle at the middle knuckle
//   thumb:   "out" | "in"
//   thumbAt: "side" | "T" | "N" | "M" | "S"  where the thumb tip sits
//   dir:     "up" | "side" | "down"          which way the hand points
//   spread, touch, gap ("open"|"closed"), crossed, thumbOnMiddle, tipsOnThumb

import { loadSamples, matchCalibrated } from "@/lib/af/calibration";

const FINGERS = [
  { name: "index", mcp: 5, pip: 6, tip: 8 },
  { name: "middle", mcp: 9, pip: 10, tip: 12 },
  { name: "ring", mcp: 13, pip: 14, tip: 16 },
  { name: "pinky", mcp: 17, pip: 18, tip: 20 }
];

const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const ALL_DOWN = { index: "down", middle: "down", ring: "down", pinky: "down" };
const ALL_BENT = { index: "bent", middle: "bent", ring: "bent", pinky: "bent" };

export const SIGNS = [
  { letter: "A", fingers: ALL_DOWN, thumbAt: "side", dir: "up", tip: "Make a fist with your thumb resting against the side of your index finger." },
  { letter: "B", fingers: { index: "up", middle: "up", ring: "up", pinky: "up" }, thumb: "in", spread: false, dir: "up", tip: "Hold four fingers straight up together and fold your thumb across your palm." },
  { letter: "C", curl: ALL_BENT, gap: "open", tip: "Curve all your fingers and thumb into a C shape, like holding a cup." },
  { letter: "D", fingers: { index: "up", middle: "down", ring: "down", pinky: "down" }, thumb: "in", dir: "up", tip: "Point your index finger up and curl the other fingers to touch your thumb." },
  { letter: "E", fingers: ALL_DOWN, tipsOnThumb: true, dir: "up", tip: "Curl all your fingertips down to rest on your thumb, tucked across your palm." },
  { letter: "F", fingers: { middle: "up", ring: "up", pinky: "up" }, touch: true, dir: "up", tip: "Touch your index fingertip to your thumb tip and raise the other three fingers." },
  { letter: "G", fingers: { index: "up", middle: "down", ring: "down", pinky: "down" }, thumb: "out", dir: "side", tip: "Point your index finger sideways with your thumb parallel above it." },
  { letter: "H", fingers: { index: "up", middle: "up", ring: "down", pinky: "down" }, spread: false, dir: "side", tip: "Point your index and middle fingers sideways, held together." },
  { letter: "I", fingers: { index: "down", middle: "down", ring: "down", pinky: "up" }, thumb: "in", dir: "up", tip: "Make a fist and raise only your pinky finger." },
  { letter: "J", fingers: { index: "down", middle: "down", ring: "down", pinky: "up" }, thumb: "in", motion: { tip: 20 }, tip: "Make the I shape, then draw a J in the air with your pinky: down, then curve to the side." },
  { letter: "K", fingers: { index: "up", middle: "up", ring: "down", pinky: "down" }, thumbOnMiddle: true, dir: "up", tip: "Raise your index and middle fingers in a V and press your thumb tip against your middle finger." },
  { letter: "L", fingers: { index: "up", middle: "down", ring: "down", pinky: "down" }, thumb: "out", dir: "up", tip: "Raise your index finger and stretch your thumb out to make an L shape." },
  { letter: "M", fingers: ALL_DOWN, thumbAt: "M", tipsOnThumb: false, dir: "up", tip: "Fold three fingers over your thumb, with the thumb tip poking out between your ring and pinky." },
  { letter: "N", fingers: ALL_DOWN, thumbAt: "N", tipsOnThumb: false, dir: "up", tip: "Fold two fingers over your thumb, with the thumb tip between your middle and ring fingers." },
  { letter: "O", curl: ALL_BENT, gap: "closed", tip: "Curve all your fingers to touch your thumb tip, making an O shape." },
  { letter: "P", fingers: { index: "up", middle: "up", ring: "down", pinky: "down" }, thumbOnMiddle: true, dir: "down", tip: "Make the K shape, then turn your hand so the fingers point down." },
  { letter: "Q", fingers: { index: "up", middle: "down", ring: "down", pinky: "down" }, thumb: "out", dir: "down", tip: "Make the G shape, then turn your hand so the index finger and thumb point down." },
  { letter: "R", fingers: { index: "up", middle: "up", ring: "down", pinky: "down" }, crossed: true, dir: "up", tip: "Raise your index and middle fingers and cross the middle finger over the index." },
  { letter: "S", fingers: ALL_DOWN, thumbAt: "S", tipsOnThumb: false, dir: "up", tip: "Make a tight fist with your thumb wrapped across the front of your fingers." },
  { letter: "T", fingers: ALL_DOWN, thumbAt: "T", tipsOnThumb: false, dir: "up", tip: "Make a fist with your thumb tucked between your index and middle fingers." },
  { letter: "U", fingers: { index: "up", middle: "up", ring: "down", pinky: "down" }, spread: false, crossed: false, dir: "up", tip: "Raise your index and middle fingers pressed together." },
  { letter: "V", fingers: { index: "up", middle: "up", ring: "down", pinky: "down" }, spread: true, crossed: false, dir: "up", tip: "Raise your index and middle fingers apart in a V." },
  { letter: "W", fingers: { index: "up", middle: "up", ring: "up", pinky: "down" }, dir: "up", tip: "Raise index, middle and ring fingers apart, and hold your pinky with your thumb." },
  { letter: "X", curl: { index: "bent" }, fingers: { middle: "down", ring: "down", pinky: "down" }, dir: "up", tip: "Make a fist and raise your index finger in a hook shape." },
  { letter: "Y", fingers: { index: "down", middle: "down", ring: "down", pinky: "up" }, thumb: "out", tip: "Curl your middle fingers and stretch out your thumb and pinky." },
  { letter: "Z", fingers: { index: "up", middle: "down", ring: "down", pinky: "down" }, motion: { tip: 8 }, tip: "Point your index finger and draw a Z in the air: across, diagonally down, then across again." }
];

// How many checks a sign has; more specific signs are matched first.
export function constraintCount(s) {
  return Object.keys(s.fingers || {}).length + Object.keys(s.curl || {}).length +
    ["thumb", "thumbAt", "dir", "spread", "touch", "gap", "crossed", "thumbOnMiddle", "tipsOnThumb"].filter(k => s[k] != null).length;
}

function jointAngle(a, b, c) {
  const v1 = { x: b.x - a.x, y: b.y - a.y }, v2 = { x: c.x - b.x, y: c.y - b.y };
  const m = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) || 1;
  return Math.acos(Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / m))) * 180 / Math.PI;
}

export function readHand(lm) {
  const wrist = lm[0];
  const palm = d(wrist, lm[9]) || 1;
  const fingers = {}, curl = {};
  for (const f of FINGERS) {
    fingers[f.name] = d(lm[f.tip], wrist) > d(lm[f.pip], wrist) * 1.1 ? "up" : "down";
    const a = jointAngle(lm[f.mcp], lm[f.pip], lm[f.tip]);
    curl[f.name] = a < 35 ? "straight" : a < 115 ? "bent" : "fist";
  }
  const thumb = d(lm[4], lm[5]) / palm > 0.55 ? "out" : "in";
  const spread = d(lm[8], lm[12]) / (d(lm[5], lm[9]) || 1) > 1.6;
  const touch = d(lm[4], lm[8]) / palm < 0.3;
  const gap = d(lm[4], lm[8]) / palm < 0.3 && d(lm[4], lm[12]) / palm < 0.45 ? "closed" : d(lm[4], lm[8]) / palm > 0.4 ? "open" : "mid";

  // Pointing direction: wrist → middle knuckle
  const vx = lm[9].x - wrist.x, vy = lm[9].y - wrist.y;
  const dir = Math.abs(vx) > Math.abs(vy) ? "side" : vy < 0 ? "up" : "down";

  // Crossed: index/middle tips swap order compared to their knuckles
  const crossed = Math.sign(lm[8].x - lm[12].x) !== Math.sign(lm[5].x - lm[9].x) && d(lm[8], lm[12]) / palm < 0.4;

  // Thumb tip measured against the folded-finger knuckle row (index PIP 6 → pinky PIP 18).
  //   thumbT: 0 = at index finger, 1 = at pinky (where it pokes out between fingers)
  //   thumbH: how far below that row toward the wrist (wrapped across the front = S)
  const kx = lm[18].x - lm[6].x, ky = lm[18].y - lm[6].y;
  const klen = Math.hypot(kx, ky) || 1;
  const t = ((lm[4].x - lm[6].x) * kx + (lm[4].y - lm[6].y) * ky) / (klen * klen);
  let nx = -ky / klen, ny = kx / klen;
  if ((wrist.x - lm[6].x) * nx + (wrist.y - lm[6].y) * ny < 0) { nx = -nx; ny = -ny; }
  const h = ((lm[4].x - lm[6].x) * nx + (lm[4].y - lm[6].y) * ny) / palm;

  // Fingertips resting on top of the thumb (E): tips close to the thumb tip and farther from the wrist.
  const tipsOnThumb = d(lm[8], lm[4]) / palm < 0.4 && d(lm[12], lm[4]) / palm < 0.45 &&
    d(lm[8], wrist) > d(lm[4], wrist) && t > 0.1;

  // Dead zones between letters ("between") so borderline thumbs don't flip letters.
  let thumbAt = "between";
  if (t < -0.05) thumbAt = "side";
  else if (h > 0.22 && t > 0.1 && t < 0.85) thumbAt = "S";
  else if (h < 0.15) {
    if (t >= 0 && t < 0.3) thumbAt = "T";
    else if (t > 0.38 && t < 0.6) thumbAt = "N";
    else if (t > 0.68) thumbAt = "M";
  }

  const thumbOnMiddle = d(lm[4], lm[10]) / palm < 0.4 || d(lm[4], lm[9]) / palm < 0.4;

  return { fingers, curl, thumb, spread, touch, gap, dir, crossed, thumbAt, thumbOnMiddle, tipsOnThumb, thumbT: t, thumbH: h };
}

// Motion letters: checks the traced fingertip path (points in pixels).
// Returns progress 0..1; 1 means the letter was traced.
export function motionProgress(sign, trail, palm) {
  if (trail.length < 4 || !palm) return 0;
  const xs = trail.map(p => p.x), ys = trail.map(p => p.y);
  const xSpan = (Math.max(...xs) - Math.min(...xs)) / palm;
  const ySpan = (Math.max(...ys) - Math.min(...ys)) / palm;
  if (sign.letter === "J") {
    const down = (trail[trail.length - 1].y - trail[0].y) / palm;
    return Math.min(Math.min(down / 0.6, 1) * 0.6 + Math.min(xSpan / 0.3, 1) * 0.4, 1);
  }
  // Z: count horizontal direction reversals
  let dir = 0, reversals = 0, anchor = xs[0];
  for (const x of xs) {
    const dx = x - anchor;
    if (Math.abs(dx) > palm * 0.25) {
      const nd = Math.sign(dx);
      if (dir && nd !== dir) reversals++;
      dir = nd; anchor = x;
    }
  }
  return Math.min(Math.min(reversals / 2, 1) * 0.6 + Math.min(xSpan / 0.7, 1) * 0.2 + Math.min(ySpan / 0.4, 1) * 0.2, 1);
}

const DIR_TEXT = { up: "Point your fingers up", side: "Turn your hand so your fingers point sideways", down: "Turn your hand so your fingers point down" };
const THUMB_AT_TEXT = {
  side: "Rest your thumb against the side of your index finger",
  S: "Wrap your thumb across the front of your fingers",
  T: "Tuck your thumb between your index and middle fingers",
  N: "Tuck your thumb between your middle and ring fingers",
  M: "Tuck your thumb between your ring and pinky fingers"
};

// Returns { correct, issues: [string] } — issues are ordered by importance.
export function evaluateSign(sign, landmarks, handedness) {
  if (!landmarks) return { correct: false, issues: ["Show your hand to the camera"] };
  // A personal recording of this letter overrides the generic rules.
  if (loadSamples()[sign.letter]) {
    const m = matchCalibrated(landmarks, handedness);
    if (m?.letter === sign.letter) return { correct: true, issues: [] };
  }
  const s = readHand(landmarks);
  const issues = [];
  if (sign.dir && s.dir !== sign.dir) issues.push(DIR_TEXT[sign.dir]);
  for (const [name, want] of Object.entries(sign.fingers || {})) {
    if (s.fingers[name] !== want) issues.push(want === "up" ? `Straighten your ${name} finger` : `Curl your ${name} finger down`);
  }
  for (const [name, want] of Object.entries(sign.curl || {})) {
    if (s.curl[name] !== want) issues.push(s.curl[name] === "straight" ? `Bend your ${name} finger into a curve` : `Open your ${name} finger into a gentle curve`);
  }
  if (sign.gap === "open" && s.gap !== "open") issues.push("Leave a gap between your fingers and thumb");
  if (sign.gap === "closed" && s.gap !== "closed") issues.push("Touch your fingertips to your thumb");
  if (sign.touch && !s.touch) issues.push("Touch your index fingertip to your thumb");
  if (sign.thumb && s.thumb !== sign.thumb) issues.push(sign.thumb === "out" ? "Stretch your thumb out to the side" : "Bring your thumb in close to your hand");
  if (sign.thumbAt && s.thumbAt !== sign.thumbAt) issues.push(THUMB_AT_TEXT[sign.thumbAt]);
  if (sign.thumbOnMiddle && !s.thumbOnMiddle) issues.push("Press your thumb tip against your middle finger");
  if (sign.tipsOnThumb && !s.tipsOnThumb) issues.push("Rest your fingertips on your thumb");
  if (sign.tipsOnThumb === false && s.tipsOnThumb) issues.push("Curl your fingers tighter into your palm");
  if (sign.crossed === true && !s.crossed) issues.push("Cross your middle finger over your index finger");
  if (sign.crossed === false && s.crossed) issues.push("Uncross your fingers");
  if (sign.spread === true && !s.spread) issues.push("Spread your two fingers apart");
  if (sign.spread === false && s.spread && sign.fingers?.middle === "up") issues.push("Press your fingers together");
  return { correct: issues.length === 0, issues };
}