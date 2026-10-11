// Spoken coaching layer. Uses the browser's SpeechSynthesis API for
// low-latency cues. The mic is never paused while the coach talks; instead
// we remember what the coach recently said so the voice layer can ignore
// its own echo (see isCoachEcho).

let voicesCache = [];
let lastSpoken = 0;
let lastText = "";
const recentSpoken = []; // [{ words: Set, at }]

function words(text) {
  return text.toLowerCase().replace(/[^a-z0-9' ]/g, " ").split(/\s+/).filter(Boolean);
}

function remember(text) {
  recentSpoken.push({ words: new Set(words(text)), at: Date.now() });
  while (recentSpoken.length > 6) recentSpoken.shift();
}

// True when a transcript is most likely the coach's own voice picked up by the mic.
export function isCoachEcho(text) {
  const w = words(text);
  if (w.length === 0) return true;
  // Short answers (1-2 words) often reuse a word the coach just said
  // (e.g. "hands", "left", "both"). Treat them as real input, not echo —
  // the coach's own voice picked up by the mic is usually a full sentence,
  // so a 70% match on one or two words is almost always a false positive.
  if (w.length <= 2) return false;
  const cutoff = Date.now() - 12000;
  return recentSpoken.some(r => {
    if (r.at < cutoff) return false;
    const hits = w.filter(x => r.words.has(x)).length;
    return hits / w.length >= 0.7;
  });
}

function pickVoice() {
  if (voicesCache.length === 0) voicesCache = window.speechSynthesis?.getVoices() || [];
  return voicesCache.find(v => /en[-_]?(GB|US)/i.test(v.lang) && /female|samantha|google|natural/i.test(v.name))
    || voicesCache.find(v => /^en/i.test(v.lang))
    || voicesCache[0];
}

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
}

export function primeVoices() {
  if (!speechSupported()) return;
  voicesCache = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => { voicesCache = window.speechSynthesis.getVoices(); };
}

// Speak text. opts: {interrupt, rate, pitch, minGapMs, force, onEnd}
export function speak(text, opts = {}) {
  if (!speechSupported() || !text) { opts.onEnd?.(); return; }
  const now = Date.now();
  const gap = opts.minGapMs != null ? opts.minGapMs : 1200;
  if (!opts.force && text === lastText && now - lastSpoken < gap) return;
  lastSpoken = now;
  lastText = text;
  if (opts.interrupt) window.speechSynthesis.cancel();
  const u = new window.SpeechSynthesisUtterance(text);
  const v = pickVoice();
  if (v) u.voice = v;
  u.rate = opts.rate != null ? opts.rate : 1;
  u.pitch = opts.pitch != null ? opts.pitch : 1.05;
  u.volume = 1;
  remember(text);
  if (opts.onEnd) {
    // Fallback in case the browser never fires onend.
    let done = false;
    const finish = () => { if (!done) { done = true; opts.onEnd(); } };
    const fallback = setTimeout(finish, Math.max(3000, text.length * 90));
    u.onend = () => { clearTimeout(fallback); finish(); };
  }
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
}