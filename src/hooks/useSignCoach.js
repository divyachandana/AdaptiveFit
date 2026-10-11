import { useRef, useState, useCallback } from "react";
import { evaluateSign } from "@/lib/af/signs";
import { speak } from "@/lib/af/speech";

const HOLD_FRAMES = 10; // ~1 second of correct placement

export function useSignCoach({ sign, onSuccess }) {
  const holdRef = useRef(0);
  const lastCueRef = useRef(0);
  const doneRef = useRef(false);
  const [result, setResult] = useState({ correct: false, issues: [] });
  const [hold, setHold] = useState(0);

  const reset = useCallback(() => {
    holdRef.current = 0; doneRef.current = false; lastCueRef.current = Date.now();
    setHold(0); setResult({ correct: false, issues: [] });
  }, []);

  const handlePose = useCallback((hands) => {
    if (!sign || doneRef.current) return;
    const r = evaluateSign(sign, hands?.[0]?.landmarks);
    setResult(r);
    holdRef.current = r.correct ? holdRef.current + 1 : 0;
    setHold(Math.min(holdRef.current / HOLD_FRAMES, 1));
    const now = Date.now();
    if (holdRef.current >= HOLD_FRAMES) {
      doneRef.current = true;
      speak(`Perfect. That's the letter ${sign.letter}.`, { force: true, interrupt: true });
      onSuccess?.();
    } else if (!r.correct && now - lastCueRef.current > 3500) {
      lastCueRef.current = now;
      speak(r.issues[0], { force: true });
    }
  }, [sign, onSuccess]);

  return { handlePose, result, hold, reset };
}