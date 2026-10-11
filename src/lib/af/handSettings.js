// Per-user landmark thresholds. Saved locally and on the signed-in user's profile.
import { base44 } from "@/api/base44Client";

const KEY = "asl_hand_settings_v1";
export const DEFAULTS = {
  matchMax: 0.55,   // how close a hand must be to your recordings
  margin: 0.08,     // how clearly the best letter must win
  thumbOut: 0.55,   // thumb distance that counts as "out"
  touch: 0.3        // fingertip-to-thumb distance that counts as touching
};

let cache = null;
export function getSettings() {
  if (!cache) cache = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  return cache;
}
function store(s) { cache = s; localStorage.setItem(KEY, JSON.stringify(s)); window.dispatchEvent(new Event("hand-settings-changed")); }

let timer;
export function saveSettings(patch) {
  store({ ...getSettings(), ...patch });
  clearTimeout(timer);
  timer = setTimeout(async () => {
    if (await base44.auth.isAuthenticated()) await base44.auth.updateMe({ hand_settings: getSettings() });
  }, 600);
}

export async function syncSettings() {
  if (!(await base44.auth.isAuthenticated())) return;
  const me = await base44.auth.me();
  if (me.hand_settings) store({ ...DEFAULTS, ...me.hand_settings });
  else await base44.auth.updateMe({ hand_settings: getSettings() });
}