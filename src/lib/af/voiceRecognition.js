// Browser SpeechRecognition wrapper for two-way voice conversation.
// The mic stays on for the whole session (never paused while the coach
// speaks) and auto-restarts after silence or errors. Coach echo is filtered
// by the conversation layer.

import { getLanguage } from "@/lib/af/languages";

export function recognitionSupported() {
  return typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
}

export function createRecognition({ onResult, onError } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = getLanguage();

  let manualStop = false;

  rec.onresult = (e) => {
    let interim = "";
    let final = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t;
      else interim += t;
    }
    if (final.trim()) onResult?.(final.trim(), true);
    else if (interim.trim()) onResult?.(interim.trim(), false);
  };

  rec.onerror = (e) => {
    if (e.error !== "no-speech" && e.error !== "aborted" && e.error !== "audio-capture") {
      onError?.(e.error);
    }
  };

  rec.onend = () => {
    if (!manualStop) {
      setTimeout(() => { if (!manualStop) { try { rec.start(); } catch (_) {} } }, 200);
    }
  };

  return {
    start() {
      manualStop = false;
      try { rec.start(); } catch (_) {}
    },
    stop() {
      manualStop = true;
      try { rec.stop(); } catch (_) {}
    }
  };
}