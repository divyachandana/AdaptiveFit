import { useRef, useState, useCallback } from "react";
import { JOINTS, jointAngles, rateJoint } from "@/lib/af/joints";
import { analyzeFingerSpread } from "@/lib/af/handUtils";
import { saveMobility } from "@/lib/af/mobility";
import { speak } from "@/lib/af/speech";

const STEPS = [
  { id: "open", say: "Open your hand as wide and straight as is comfortable. Hold it." },
  { id: "fist", say: "Now close your hand into the tightest comfortable fist, thumb folded in. Hold it." }
];
const HOLD_MS = 4000;

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] ?? 0; };
const std = (a) => { const m = a.reduce((x, y) => x + y, 0) / (a.length || 1); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length || 1)); };

// Guides an open-hand then fist hold, measures every joint's range of motion.
export function useMobilityCheck() {
  const [step, setStep] = useState(-1); // -1 idle, 0..n steps, n = done
  const [result, setResult] = useState(null);
  const [live, setLive] = useState(null);
  const buf = useRef({}); // buf[step][hand] = [{ angles, openness }]
  const stepRef = useRef(-1);

  const finish = useCallback(async () => {
    const hands = {};
    const labels = new Set([...Object.keys(buf.current.open || {}), ...Object.keys(buf.current.fist || {})]);
    for (const hand of labels) {
      const o = buf.current.open?.[hand] || [], f = buf.current.fist?.[hand] || [];
      if (o.length < 5 || f.length < 5) continue;
      const joints = {};
      for (const j of JOINTS) {
        const min = median(o.map(s => s.angles[j.id])), max = median(f.map(s => s.angles[j.id]));
        const rom = Math.max(0, max - min);
        joints[j.id] = { min: Math.round(min), max: Math.round(max), rom: Math.round(rom), ...rateJoint(rom, j.normal) };
      }
      const openO = o.map(s => s.openness), fistO = f.map(s => s.openness);
      hands[hand] = { joints, openness: { open: median(openO), fist: median(fistO) }, tremor: Math.max(std(openO), std(fistO)) };
    }
    const profile = Object.keys(hands).length ? await saveMobility(hands) : null;
    setResult(profile);
    speak(profile ? "Check complete. Here are your results." : "I couldn't see your hand clearly. Let's try again.", { force: true });
  }, []);

  const runStep = useCallback((i) => {
    stepRef.current = -1;
    setStep(i);
    if (i >= STEPS.length) { finish(); return; }
    speak(STEPS[i].say, { force: true, interrupt: true, onEnd: () => {
      stepRef.current = i;
      setTimeout(() => runStep(i + 1), HOLD_MS);
    } });
  }, [finish]);

  const start = useCallback(() => { buf.current = {}; setResult(null); runStep(0); }, [runStep]);

  const handlePose = useCallback((hands) => {
    if (!hands?.length) { setLive(null); return; }
    setLive(hands.map(h => ({ hand: h.handedness, angles: jointAngles(h.landmarks) })));
    const i = stepRef.current;
    if (i < 0) return;
    const id = STEPS[i].id;
    for (const h of hands) {
      const a = analyzeFingerSpread(h.landmarks);
      if (!a.trackable) continue;
      ((buf.current[id] ||= {})[h.handedness] ||= []).push({ angles: jointAngles(h.landmarks), openness: a.phaseMetric });
    }
  }, []);

  return { start, handlePose, step, steps: STEPS, holding: step >= 0 && step < STEPS.length, result, live };
}