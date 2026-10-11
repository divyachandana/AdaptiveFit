import { useRef, useState, useCallback } from "react";
import { evaluateSign, motionProgress } from "@/lib/af/signs";
import { speak } from "@/lib/af/speech";

const HOLD_FRAMES = 10; // ~1 second of correct placement

export function useSignCoach({ sign, onSuccess }) {
  const holdRef = useRef(0);
  const trailRef = useRef([]);
  const lastCueRef = useRef(0);
  const doneRef = useRef(false);
  const [result, setResult] = useState({ correct: false, issues: [] });
  const [hold, setHold] = useState(0);

  const reset = useCallback(() => {
    holdRef.current = 0; trailRef.current = []; doneRef.current = false; lastCueRef.current = Date.now();
    setHold(0); setResult({ correct: false, issues: [] });
  }, []);

  const succeed = useCallback(() => {
    doneRef.current = true;
    speak(`Perfect. That's the letter ${sign.letter}.`, { force: true, interrupt: true });
    onSuccess?.();
  }, [sign, onSuccess]);

  const handlePose = useCallback((hands) => {
    if (!sign || doneRef.current) return;
    const lm = hands?.[0]?.landmarks;
    const r = evaluateSign(sign, lm);
    const now = Date.now();

    if (sign.motion) {
      if (r.correct) {
        trailRef.current = [...trailRef.current, lm[sign.motion.tip]].slice(-40);
        const palm = Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y);
        const p = motionProgress(sign, trailRef.current, palm);
        setHold(p);
        setResult({ correct: true, issues: [] });
        if (p >= 1) return succeed();
        if (now - lastCueRef.current > 5000) { lastCueRef.current = now; speak(`Good shape. Now trace the ${sign.letter}`, { force: true }); }
      } else {
        trailRef.current = [];
        setHold(0);
        setResult(r);
        if (now - lastCueRef.current > 3500) { lastCueRef.current = now; speak(r.issues[0], { force: true }); }
      }
      return;
    }

    setResult(r);
    holdRef.current = r.correct ? holdRef.current + 1 : 0;
    setHold(Math.min(holdRef.current / HOLD_FRAMES, 1));
    if (holdRef.current >= HOLD_FRAMES) succeed();
    else if (!r.correct && now - lastCueRef.current > 3500) {
      lastCueRef.current = now;
      speak(r.issues[0], { force: true });
    }
  }, [sign, succeed]);

  return { handlePose, result, hold, reset };
}