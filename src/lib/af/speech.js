// Spoken coaching layer (the "speech" modality). Uses the browser's
// SpeechSynthesis API for the low-latency corrections the live loop needs
// (under ~1-2s). SpeechSynthesis is queued; we manage the queue so a new
// correction can interrupt a stale one, and we rate-limit to avoid nagging.

let voicesCache = [];
let lastSpoken = 0;
let lastText = "";

// Speech event system: lets the voice-conversation layer pause recognition
// while the coach speaks (so it doesn't transcribe its own voice) and resume
// when speech ends. Uses a debounce + counter to handle interrupt-cancelled
// utterances (a new speak() right after cancel shouldn't fire a premature "end").
const listeners = new Set();
let activeCount = 0;
let endTimer = null;

function notifyStart() {
  if (endTimer) { clearTimeout(endTimer); endTimer = null; }
  activeCount++;
  if (activeCount === 1) listeners.forEach(f => f("start"));
}

function notifyEndSoon() {
  if (endTimer) clearTimeout(endTimer);
  endTimer = setTimeout(() => {
    activeCount = 0;
    endTimer = null;
    listeners.forEach(f => f("end"));
  }, 150);
}

export function onSpeechEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

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
  if (opts.silent) {
    // Short cues (rep counts) don't pause the voice-conversation mic.
    window.speechSynthesis.speak(u);
    return;
  }
  notifyStart();
  // Fallback: some browsers/environments never fire onend (no audio hardware,
  // or the utterance was cancelled). Without this, the voice-conversation mic
  // stays paused forever. Force the "end" event after a max duration.
  const maxMs = Math.max(3000, Math.min(20000, text.length * 100));
  const fallback = setTimeout(notifyEndSoon, maxMs);
  u.onend = () => { clearTimeout(fallback); notifyEndSoon(); };
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
  if (endTimer) { clearTimeout(endTimer); endTimer = null; }
  activeCount = 0;
  listeners.forEach(f => f("end"));
}