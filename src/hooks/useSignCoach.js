import { useRef, useState, useCallback } from "react";
import { evaluateSign, motionProgress } from "@/lib/af/signs";
import { speak } from "@/lib/af/speech";

// adapt: { holdFrames, cueGapMs, rate } from the learner model.
export function useSignCoach({ sign, onSuccess, adapt = {} }) {
  const HOLD_FRAMES = adapt.holdFrames || 10;
  const CUE_GAP = adapt.cueGapMs || 3500;
  const rate = adapt.rate || 1;
  const holdRef = useRef(0);
  const trailRef = useRef([]);
  const lastCueRef = useRef(0);
  const doneRef = useRef(false);
  const startRef = useRef(Date.now());
  const issuesRef = useRef({});
  const [result, setResult] = useState({ correct: false, issues: [] });
  const [hold, setHold] = useState(0);

  const reset = useCallback(() => {
    holdRef.current = 0; trailRef.current = []; doneRef.current = false; lastCueRef.current = Date.now();
    startRef.current = Date.now(); issuesRef.current = {};
    setHold(0); setResult({ correct: false, issues: [] });
  }, []);

  // Behaviour observed for the current attempt (for the learner model).
  const getStats = useCallback(() => ({
    seconds: (Date.now() - startRef.current) / 1000, issues: issuesRef.current, done: doneRef.current
  }), []);

  const cue = (text) => {
    lastCueRef.current = Date.now();
    issuesRef.current[text] = (issuesRef.current[text] || 0) + 1;
    speak(text, { force: true, rate });
  };

  const succeed = useCallback(() => {
    doneRef.current = true;
    speak(`Perfect. That's the letter ${sign.letter}.`, { force: true, interrupt: true, rate });
    onSuccess?.(getStats());
  }, [sign, onSuccess, getStats, rate]);

  const handlePose = useCallback((hands) => {
    if (!sign || doneRef.current) return;
    const lm = hands?.[0]?.landmarks;
    const r = evaluateSign(sign, lm, hands?.[0]?.handedness);
    const now = Date.now();

    if (sign.motion) {
      if (r.correct) {
        trailRef.current = [...trailRef.current, lm[sign.motion.tip]].slice(-40);
        const palm = Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y);
        const p = motionProgress(sign, trailRef.current, palm);
        setHold(p);
        setResult({ correct: true, issues: [] });
        if (p >= 1) return succeed();
        if (now - lastCueRef.current > CUE_GAP + 1500) { lastCueRef.current = now; speak(`Good shape. Now trace the ${sign.letter}`, { force: true, rate }); }
      } else {
        trailRef.current = [];
        setHold(0);
        setResult(r);
        if (now - lastCueRef.current > CUE_GAP && lm) cue(r.issues[0]);
      }
      return;
    }

    setResult(r);
    holdRef.current = r.correct ? holdRef.current + 1 : 0;
    setHold(Math.min(holdRef.current / HOLD_FRAMES, 1));
    if (holdRef.current >= HOLD_FRAMES) succeed();
    else if (!r.correct && lm && now - lastCueRef.current > CUE_GAP) cue(r.issues[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sign, succeed, HOLD_FRAMES, CUE_GAP, rate]);

  return { handlePose, result, hold, reset, getStats };
}