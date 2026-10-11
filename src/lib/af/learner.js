// Learner model inspired by OmegaClaw: a persistent memory of the user's
// behaviour, a goal-driven policy that picks what to practise next, and a
// plain-language reason for every decision (auditable, not a black box).
import { base44 } from "@/api/base44Client";

const KEY = "asl_learner_v1";
let mem = null;
const load = () => (mem ||= JSON.parse(localStorage.getItem(KEY) || "{}"));
const save = () => { localStorage.setItem(KEY, JSON.stringify(mem)); window.dispatchEvent(new Event("learner-updated")); };

export const getLetter = (l) => load()[l] || { attempts: 0, successes: 0, avg_seconds: 0, issues: {}, last_practiced: 0 };

// 0..1 — success rate, slowed by time-to-sign, decays when not practised.
export function mastery(l) {
  const s = getLetter(l);
  if (!s.attempts) return 0;
  const rate = s.successes / s.attempts;
  const speed = s.successes ? Math.min(1, 8 / Math.max(s.avg_seconds, 1)) : 0;
  const days = (Date.now() - s.last_practiced) / 86400000;
  return Math.max(0, (rate * 0.6 + speed * 0.4) * Math.pow(0.9, days));
}

export function topIssue(l) {
  const e = Object.entries(getLetter(l).issues || {}).sort((a, b) => b[1] - a[1])[0];
  return e && e[1] >= 3 ? e[0] : null;
}

export function recordAttempt(letter, { success, seconds, issues }) {
  const s = { ...getLetter(letter), issues: { ...getLetter(letter).issues } };
  s.attempts += 1;
  if (success) {
    s.avg_seconds = (s.avg_seconds * s.successes + seconds) / (s.successes + 1);
    s.successes += 1;
  }
  Object.entries(issues || {}).forEach(([k, n]) => { s.issues[k] = (s.issues[k] || 0) + n; });
  s.last_practiced = Date.now();
  load()[letter] = s;
  save();
  push(letter, s);
}

// Adapts the interaction to how this learner is doing on a letter.
export function adaptFor(letter) {
  const m = mastery(letter), s = getLetter(letter);
  const struggling = s.attempts >= 2 && m < 0.4;
  return {
    struggling,
    cueGapMs: struggling ? 5000 : m > 0.75 ? 2500 : 3500, // fewer interruptions when struggling
    rate: struggling ? 0.85 : 1,                             // slower voice when struggling
    holdFrames: m > 0.75 ? 14 : 10,                          // ask for a steadier hold once confident
    focus: topIssue(letter)
  };
}

// Goal: reach mastery on every letter. Picks the next one and explains why.
export function nextLetter(letters, current) {
  const pool = letters.filter((l) => l !== current);
  const fresh = pool.find((l) => !getLetter(l).attempts);
  const weak = pool.map((l) => ({ l, m: mastery(l) })).filter((x) => getLetter(x.l).attempts && x.m < 0.5).sort((a, b) => a.m - b.m)[0];
  const stale = pool.filter((l) => getLetter(l).attempts && Date.now() - getLetter(l).last_practiced > 86400000)[0];
  if (weak && (!fresh || Math.random() < 0.6)) return { letter: weak.l, reason: `Reviewing ${weak.l}: it has been tricky for you so far.` };
  if (stale && !fresh) return { letter: stale, reason: `Refreshing ${stale}: you haven't practised it in a while.` };
  if (fresh) return { letter: fresh, reason: `New letter ${fresh}: you're ready for the next one.` };
  const any = pool.sort((a, b) => mastery(a) - mastery(b))[0];
  return { letter: any, reason: `Polishing ${any}: your least-mastered letter.` };
}

// --- Account sync ---
const E = () => base44.entities.LetterProgress;
async function me() { return (await base44.auth.isAuthenticated()) ? base44.auth.me() : null; }
async function push(letter, s) {
  const user = await me();
  if (!user) return;
  const { items } = await E().filter({ created_by_id: user.id, letter }, { limit: 1 });
  if (items[0]) await E().update(items[0].id, s); else await E().create({ letter, ...s });
}
export async function syncLearner() {
  const user = await me();
  if (!user) return;
  const { items } = await E().filter({ created_by_id: user.id }, { limit: 100 });
  const m = load();
  items.forEach((r) => {
    if (!m[r.letter] || (r.last_practiced || 0) > (m[r.letter].last_practiced || 0)) {
      m[r.letter] = { attempts: r.attempts || 0, successes: r.successes || 0, avg_seconds: r.avg_seconds || 0, issues: r.issues || {}, last_practiced: r.last_practiced || 0 };
    }
  });
  save();
}