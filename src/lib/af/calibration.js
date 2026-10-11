// Personal calibration: the user records samples of each letter, and live
// hands are matched to the nearest recorded samples (k-nearest neighbours).
// Samples are normalized (wrist at origin, scaled by palm size, left hands
// mirrored) so position, distance from camera and hand side don't matter.
const KEY = "asl_calibration_v1";
const MATCH_MAX = 0.55; // max average distance to count as a match
const MARGIN = 0.08;    // best letter must beat the runner-up by this much

let cache = null;
export function loadSamples() {
  if (!cache) cache = JSON.parse(localStorage.getItem(KEY) || "{}");
  return cache;
}
function save(s) { cache = s; localStorage.setItem(KEY, JSON.stringify(s)); }

export function normalize(lm, handedness) {
  const w = lm[0];
  const palm = Math.hypot(lm[9].x - w.x, lm[9].y - w.y) || 1;
  const flip = handedness === "Left" ? -1 : 1;
  return lm.flatMap((p) => [flip * (p.x - w.x) / palm, (p.y - w.y) / palm]);
}

const dist = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s / (a.length / 2));
};

export function addSamples(letter, vectors) {
  const s = { ...loadSamples() };
  s[letter] = [...(s[letter] || []), ...vectors].slice(-60);
  save(s);
}
export function clearLetter(letter) { const s = { ...loadSamples() }; delete s[letter]; save(s); }
export function clearAll() { save({}); }
export const hasCalibration = () => Object.keys(loadSamples()).length > 0;

// Returns { letter, distance } for the best match, or null.
export function matchCalibrated(lm, handedness) {
  const samples = loadSamples();
  const letters = Object.keys(samples);
  if (!lm || !letters.length) return null;
  const v = normalize(lm, handedness);
  const scored = letters.map((letter) => {
    const ds = samples[letter].map((x) => dist(v, x)).sort((a, b) => a - b).slice(0, 5);
    return { letter, distance: ds.reduce((a, b) => a + b, 0) / ds.length };
  }).sort((a, b) => a.distance - b.distance);
  const [best, next] = scored;
  if (best.distance > MATCH_MAX) return null;
  if (next && next.distance - best.distance < MARGIN) return null;
  return best;
}