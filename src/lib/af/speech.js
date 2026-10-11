// Spoken coaching layer. Uses the browser's SpeechSynthesis API for
// low-latency cues. The mic is never paused while the coach talks; instead
// we remember what the coach recently said so the voice layer can ignore
// its own echo (see isCoachEcho).

import { getLanguage } from "@/lib/af/languages";

let voicesCache = [];
let lastSpoken = 0;
let lastText = "";
const recentSpoken = []; // [{ words: Set, at }]

function words(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}' ]/gu, " ").split(/\s+/).filter(Boolean);
}

function remember(text) {
  recentSpoken.push({ words: new Set(words(text)), at: Date.now() });
  while (recentSpoken.length > 6) recentSpoken.shift();
}

// True when a transcript is most likely the coach's own voice picked up by the mic.
export function isCoachEcho(text) {
  const w = words(text);
  if (w.length === 0) return true;
  const cutoff = Date.now() - 12000;
  return recentSpoken.some(r => {
    if (r.at < cutoff) return false;
    const hits = w.filter(x => r.words.has(x)).length;
    return hits / w.length >= 0.7;
  });
}

function pickVoice(lang) {
  if (voicesCache.length === 0) voicesCache = window.speechSynthesis?.getVoices() || [];
  const norm = (s) => s.replace("_", "-").toLowerCase();
  const base = lang.split("-")[0].toLowerCase();
  const exact = voicesCache.filter(v => norm(v.lang) === lang.toLowerCase());
  const family = voicesCache.filter(v => norm(v.lang).startsWith(base));
  const nice = (list) => list.find(v => /female|samantha|google|natural/i.test(v.name)) || list[0];
  return nice(exact) || nice(family) || null;
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
  const lang = getLanguage();
  u.lang = lang;
  const v = pickVoice(lang);
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