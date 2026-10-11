// Stores the user's mobility check (local + account) and turns it into
// personal rep thresholds and an adapted routine.
import { base44 } from "@/api/base44Client";
import { JOINTS } from "@/lib/af/joints";

const KEY = "af_mobility_profile";

export function loadMobility() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (_) { return null; }
}

export async function saveMobility(hands) {
  const profile = { hands, checked_at: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(profile));
  if (await base44.auth.isAuthenticated()) {
    // Each check is kept as its own record so progress can be charted over time.
    await base44.entities.MobilityProfile.create(profile);
  }
  return profile;
}

export async function syncMobility() {
  if (!(await base44.auth.isAuthenticated())) return loadMobility();
  const me = await base44.auth.me();
  const { items } = await base44.entities.MobilityProfile.filter({ created_by_id: me.id }, { sort: "-checked_at", limit: 1 });
  if (items[0]) localStorage.setItem(KEY, JSON.stringify({ hands: items[0].hands, checked_at: items[0].checked_at }));
  return loadMobility();
}

// Personal open/closed openness thresholds so a rep counts within the
// range this person can actually reach.
export function repThresholds() {
  const hands = Object.values(loadMobility()?.hands || {}).filter(h => h.openness);
  if (!hands.length) return { OPEN: 1.15, CLOSED: 0.85 };
  const open = Math.min(...hands.map(h => h.openness.open));
  const fist = Math.max(...hands.map(h => h.openness.fist));
  const span = Math.max(open - fist, 0.1);
  return { OPEN: fist + span * 0.7, CLOSED: fist + span * 0.3 };
}

// Joints flagged as limited, per hand.
export function limitedJoints(profile = loadMobility()) {
  const out = [];
  for (const [hand, h] of Object.entries(profile?.hands || {})) {
    for (const j of JOINTS) {
      const r = h.joints?.[j.id];
      if (r && r.level !== "typical") out.push({ hand, ...j, ...r });
    }
  }
  return out;
}

// Build a routine fitted to the check results.
export function personalizedRoutine(profile = loadMobility()) {
  if (!profile?.hands) return null;
  const limited = limitedJoints(profile);
  const hands = Object.keys(profile.hands);
  const affected = [...new Set(limited.map(l => l.hand))];
  const side = (affected.length === 1 ? affected : hands).length === 1
    ? (affected[0] || hands[0]).toLowerCase() : "both";
  const severe = limited.some(l => l.level === "very_limited");
  const reps = severe ? 2 : 3;
  const exercises = [{ name: "Hand Open-Close", side, reps }];
  if (!limited.some(l => l.finger !== "thumb" && l.id.endsWith("_mcp") && l.level === "very_limited")) {
    exercises.push({ name: "Finger Spreads", side, reps });
  }
  if (affected.length && side !== "both") exercises.push({ name: "Hand Open-Close", side: "both", reps });
  return {
    id: "personalized",
    name: "My Fitted Routine",
    description: limited.length
      ? `Adapted to ${limited.length} limited joint${limited.length > 1 ? "s" : ""}${severe ? ", gentler reps" : ""}`
      : "Full range detected: standard routine",
    bodyPart: "hands",
    exercises
  };
}