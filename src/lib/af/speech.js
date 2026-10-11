// Spoken coaching layer (the "speech" modality). Uses the browser's
// SpeechSynthesis API for the low-latency corrections the live loop needs
// (under ~1-2s). SpeechSynthesis is queued; we manage the queue so a new
// correction can interrupt a stale one, and we rate-limit to avoid nagging.

let voicesCache = [];
let lastSpoken = 0;
let lastText = "";

function pickVoice() {
  if (voicesCache.length === 0) voicesCache = window.speechSynthesis?.getVoices() || [];
  // Prefer a natural-sounding English voice if available.
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

// Speak text. opts: {interrupt, rate, pitch, minGapMs, force}
export function speak(text, opts = {}) {
  if (!speechSupported() || !text) return;
  const now = Date.now();
  const gap = opts.minGapMs != null ? opts.minGapMs : 1200;
  if (!opts.force && text === lastText && now - lastSpoken < gap) return;
  if (!opts.force && now - lastSpoken < (opts.minGapMs || 0)) return;
  lastSpoken = now;
  lastText = text;
  if (opts.interrupt) window.speechSynthesis.cancel();
  const u = new window.SpeechSynthesisUtterance(text);
  const v = pickVoice();
  if (v) u.voice = v;
  u.rate = opts.rate != null ? opts.rate : 1;
  u.pitch = opts.pitch != null ? opts.pitch : 1.05;
  u.volume = 1;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
}