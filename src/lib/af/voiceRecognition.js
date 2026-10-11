// Browser SpeechRecognition wrapper for two-way voice conversation.
// Pauses recognition while the coach speaks (stops the mic so it can't
// transcribe its own voice), resumes when the coach finishes. Continuous
// and hands-free: auto-restarts on its own after silence or errors.

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
  rec.lang = "en-US";

  let manualStop = false; // true when the session ends
  let speaking = false;   // true while the coach is talking (paused)

  rec.onresult = (e) => {
    if (speaking) return; // discard results captured while coach speaks
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
    // "no-speech" and "aborted" are expected during continuous listening.
    // "audio-capture" means the mic is busy (likely the coach speaking).
    if (e.error !== "no-speech" && e.error !== "aborted" && e.error !== "audio-capture") {
      onError?.(e.error);
    }
  };

  rec.onend = () => {
    // Auto-restart unless we deliberately stopped or the coach is speaking.
    if (!manualStop && !speaking) {
      try { rec.start(); } catch (_) { /* already starting */ }
    }
  };

  return {
    start() {
      manualStop = false;
      speaking = false;
      try { rec.start(); } catch (_) {}
    },
    stop() {
      manualStop = true;
      speaking = false;
      try { rec.stop(); } catch (_) {}
    },
    pauseForSpeech() {
      speaking = true;
      try { rec.stop(); } catch (_) {}
    },
    resumeAfterSpeech() {
      speaking = false;
      if (!manualStop) {
        try { rec.start(); } catch (_) {}
      }
    }
  };
}