import { useRef, useState, useCallback } from "react";
import { normalize, addSamples, matchCalibrated } from "@/lib/af/calibration";
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
    if (!h) { setLive(null); return; }
    setLive({ reading: readHand(h.landmarks), match: matchCalibrated(h.landmarks, h.handedness), guess: classifySign(h.landmarks, h.handedness) });
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