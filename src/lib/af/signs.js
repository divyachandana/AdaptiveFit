// ASL static handshapes checked against MediaPipe Hands landmarks.
// Each sign defines the expected state of every finger; evaluateSign()
// compares the live hand and returns specific placement corrections.

const FINGERS = [
  { name: "index", tip: 8, pip: 6 },
  { name: "middle", tip: 12, pip: 10 },
  { name: "ring", tip: 16, pip: 14 },
  { name: "pinky", tip: 20, pip: 18 }
];

const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// up = extended, down = curled. thumb: "out" | "in". extras: spread/touch checks.
export const SIGNS = [
  { letter: "A", fingers: { index: "down", middle: "down", ring: "down", pinky: "down" }, thumb: "in", tip: "Make a fist with your thumb resting against the side of your index finger." },
  { letter: "B", fingers: { index: "up", middle: "up", ring: "up", pinky: "up" }, thumb: "in", spread: false, tip: "Hold four fingers straight up together and fold your thumb across your palm." },
  { letter: "D", fingers: { index: "up", middle: "down", ring: "down", pinky: "down" }, tip: "Point your index finger up and curl the other fingers to touch your thumb." },
  { letter: "F", fingers: { middle: "up", ring: "up", pinky: "up" }, touch: true, tip: "Touch your index fingertip to your thumb tip and raise the other three fingers." },
  { letter: "I", fingers: { index: "down", middle: "down", ring: "down", pinky: "up" }, thumb: "in", tip: "Make a fist and raise only your pinky finger." },
  { letter: "L", fingers: { index: "up", middle: "down", ring: "down", pinky: "down" }, thumb: "out", tip: "Raise your index finger and stretch your thumb out to make an L shape." },
  { letter: "U", fingers: { index: "up", middle: "up", ring: "down", pinky: "down" }, spread: false, tip: "Raise your index and middle fingers pressed together." },
  { letter: "V", fingers: { index: "up", middle: "up", ring: "down", pinky: "down" }, spread: true, tip: "Raise your index and middle fingers apart in a V." },
  { letter: "W", fingers: { index: "up", middle: "up", ring: "up", pinky: "down" }, tip: "Raise index, middle and ring fingers apart, and hold your pinky with your thumb." },
  { letter: "J", fingers: { index: "down", middle: "down", ring: "down", pinky: "up" }, thumb: "in", motion: { tip: 20 }, tip: "Make the I shape, then draw a J in the air with your pinky: down, then curve to the side." },
  { letter: "Z", fingers: { index: "up", middle: "down", ring: "down", pinky: "down" }, motion: { tip: 8 }, tip: "Point your index finger and draw a Z in the air: across, diagonally down, then across again." },
  { letter: "Y", fingers: { index: "down", middle: "down", ring: "down", pinky: "up" }, thumb: "out", tip: "Curl your middle fingers and stretch out your thumb and pinky." }
];

export function readHand(lm) {
  const wrist = lm[0];
  const palm = d(wrist, lm[9]) || 1;
  const fingers = {};
  for (const f of FINGERS) fingers[f.name] = d(lm[f.tip], wrist) > d(lm[f.pip], wrist) * 1.1 ? "up" : "down";
  const thumb = d(lm[4], lm[5]) / palm > 0.55 ? "out" : "in";
  const spread = d(lm[8], lm[12]) / (d(lm[5], lm[9]) || 1) > 1.6;
  const touch = d(lm[4], lm[8]) / palm < 0.3;
  return { fingers, thumb, spread, touch };
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

// Returns { correct, issues: [string] } — issues are ordered by importance.
export function evaluateSign(sign, landmarks) {
  if (!landmarks) return { correct: false, issues: ["Show your hand to the camera"] };
  const s = readHand(landmarks);
  const issues = [];
  for (const [name, want] of Object.entries(sign.fingers)) {
    if (s.fingers[name] !== want) issues.push(want === "up" ? `Straighten your ${name} finger` : `Curl your ${name} finger down`);
  }
  if (sign.touch && !s.touch) issues.push("Touch your index fingertip to your thumb");
  if (sign.thumb && s.thumb !== sign.thumb) issues.push(sign.thumb === "out" ? "Stretch your thumb out to the side" : "Bring your thumb in close to your hand");
  if (sign.spread === true && !s.spread) issues.push("Spread your two fingers apart");
  if (sign.spread === false && s.spread && sign.fingers.middle === "up") issues.push("Press your fingers together");
  return { correct: issues.length === 0, issues };
}