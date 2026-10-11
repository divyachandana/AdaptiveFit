import { readHand } from "@/lib/af/signs";

// Whole-word ASL signs recognized from a hand shape plus a movement.
// Each frame is reduced to { t, x, y, shape, tap } and kept for WINDOW ms.
const WINDOW = 1600;

const shapeOf = (f, thumb) => {
  const up = ["index", "middle", "ring", "pinky"].filter((n) => f[n] === "up").length;
  if (up === 4) return "flat";
  if (up === 0) return "fist";
  if (f.index === "up" && f.middle === "up" && f.ring === "down" && f.pinky === "down") return "two";
  return thumb === "out" && f.pinky === "up" ? "y" : "other";
};

export const WORD_SIGNS = [
  { word: "HELLO", tip: "Flat hand by your forehead, sweep it out to the side like a salute." },
  { word: "THANK YOU", tip: "Flat hand at your chin, move it forward and down toward the camera." },
  { word: "PLEASE", tip: "Flat hand on your chest, rub it in a circle." },
  { word: "YES", tip: "Make a fist and nod it up and down, like a head nodding." },
  { word: "NO", tip: "Index and middle fingers tap down onto your thumb twice." }
];

export function wordFrame(lm) {
  const r = readHand(lm);
  const palm = Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y) || 1;
  const tap = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y) / palm < 0.35;
  return { t: Date.now(), x: lm[9].x / palm, y: lm[9].y / palm, palm, shape: shapeOf(r.fingers, r.thumb), up: r.fingers.index === "up", tap };
}

const reversals = (vals, min) => {
  let dir = 0, n = 0, anchor = vals[0];
  for (const v of vals) {
    if (Math.abs(v - anchor) > min) { const nd = Math.sign(v - anchor); if (dir && nd !== dir) n++; dir = nd; anchor = v; }
  }
  return n;
};
const toggles = (arr) => arr.reduce((n, v, i) => (i && v !== arr[i - 1] ? n + 1 : n), 0);

// Keeps the trail and returns a recognized word, or null.
export function pushWordFrame(trail, frame) {
  const now = frame.t;
  const tr = [...trail.filter((p) => now - p.t < WINDOW), frame];
  const share = (s) => tr.filter((p) => p.shape === s).length / tr.length;
  if (tr.length < 8) return { trail: tr, word: null };
  const xs = tr.map((p) => p.x), ys = tr.map((p) => p.y);
  const xSpan = Math.max(...xs) - Math.min(...xs), ySpan = Math.max(...ys) - Math.min(...ys);
  const dy = ys[ys.length - 1] - ys[0];
  let word = null;
  if (share("two") > 0.7 && toggles(tr.map((p) => p.tap)) >= 3) word = "NO";
  else if (share("fist") > 0.8 && reversals(ys, 0.25) >= 2 && xSpan < 0.6) word = "YES";
  else if (share("flat") > 0.8) {
    if (reversals(xs, 0.25) >= 2 && reversals(ys, 0.25) >= 2) word = "PLEASE";
    else if (xSpan > 1.2 && ySpan < 0.6) word = "HELLO";
    else if (dy > 1.0 && xSpan < 0.8) word = "THANK YOU";
  }
  return { trail: word ? [] : tr, word, since: tr[0].t };
}