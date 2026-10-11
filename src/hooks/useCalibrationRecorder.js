import { useRef, useState, useCallback } from "react";
import { normalize, addSamples, matchCalibrated, scoreCalibrated } from "@/lib/af/calibration";
import { readHand } from "@/lib/af/signs";
import { classifySign } from "@/lib/af/signClassifier";
import { speak } from "@/lib/af/speech";

const FRAMES = 20; // samples captured per recording (~2s)

export function useCalibrationRecorder({ onSaved }) {
  const [live, setLive] = useState(null);
  const [recording, setRecording] = useState(null); // { letter, count }
  const [countdown, setCountdown] = useState(0);
  const buf = useRef([]);
  const rec = useRef(null);
  const prev = useRef(null);
  const jitter = useRef(0);

  const record = useCallback((letter) => {
    let n = 3;
    setCountdown(n);
    speak(`Hold the letter ${letter}`, { force: true, interrupt: true });
    const t = setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n <= 0) {
        clearInterval(t);
        buf.current = [];
        rec.current = letter;
        setRecording({ letter, count: 0 });
      }
    }, 1000);
  }, []);

  const handlePose = useCallback((hands) => {
    const h = hands?.[0];
    if (!h) { setLive(null); prev.current = null; return; }
    // Tracking stability: wrist movement between frames relative to palm size (high = poor light / blur).
    const w = h.landmarks[0], palm = Math.hypot(w.x - h.landmarks[9].x, w.y - h.landmarks[9].y) || 1;
    if (prev.current) jitter.current = jitter.current * 0.85 + (Math.hypot(w.x - prev.current.x, w.y - prev.current.y) / palm) * 0.15;
    prev.current = w;
    setLive({ reading: readHand(h.landmarks), match: matchCalibrated(h.landmarks, h.handedness), scores: scoreCalibrated(h.landmarks, h.handedness), jitter: jitter.current, guess: classifySign(h.landmarks, h.handedness) });
    if (!rec.current) return;
    buf.current.push(normalize(h.landmarks, h.handedness));
    setRecording({ letter: rec.current, count: buf.current.length });
    if (buf.current.length >= FRAMES) {
      addSamples(rec.current, buf.current);
      speak("Saved", { force: true });
      rec.current = null;
      setRecording(null);
      onSaved?.();
    }
  }, [onSaved]);

  return { handlePose, live, recording, countdown, record, frames: FRAMES };
}