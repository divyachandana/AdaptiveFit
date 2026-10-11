import { useRef, useState, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { combinedConfidence, combinedAnalysis, updateRepState, summarizeHands } from "@/lib/af/handUtils";
import { speak, stopSpeaking } from "@/lib/af/speech";
import { EXERCISE_LIBRARY } from "@/lib/af/exercises";

// useLiveCoach owns the real-time correction loop.
// Vision fast path: local hand math counts reps and fires short, instant
// spoken cues for clear deviations. Reasoning path: when a deviation
// persists, the loop routes the hand summary to the adaptiveCoach backend
// function (the LLM reasoning model) for a warmer, specific correction and
// tells the UI which finger to highlight.
// Supports left, right, or both hands — handlePose receives an array of
// detected hands and uses combinedAnalysis to average metrics.
export function useLiveCoach({ exerciseRef, onRepComplete }) {
  const repStateRef = useRef({ count: 0, phase: "open" });
  const lastLocalCueRef = useRef(0);
  const lastLLMAtRef = useRef(0);
  const recentRef = useRef([]);
  const inflightRef = useRef(false);
  const devRef = useRef(null);
  const lastRepAtRef = useRef(Date.now());
  const lastInactivityRef = useRef(0);
  const onRepCompleteRef = useRef(onRepComplete);
  useEffect(() => { onRepCompleteRef.current = onRepComplete; }, [onRepComplete]);
  const [repCount, setRepCount] = useState(0);
  const [correction, setCorrection] = useState(null);
  const [confidence, setConfidence] = useState(0);

  const reset = useCallback(() => {
    repStateRef.current = { count: 0, phase: "open" };
    lastLocalCueRef.current = 0;
    lastLLMAtRef.current = 0;
    recentRef.current = [];
    devRef.current = null;
    lastRepAtRef.current = Date.now();
    lastInactivityRef.current = 0;
    setRepCount(0);
    setCorrection(null);
    setConfidence(0);
  }, []);

  const handlePose = useCallback((hands) => {
    if (!hands || !hands.length) { setConfidence(0); return; }
    const ex = exerciseRef.current;
    if (!ex) return;
    const lib = EXERCISE_LIBRARY[ex.name];
    if (!lib || lib.type !== "pose") { setConfidence(0); return; }

    const conf = combinedConfidence(hands);
    setConfidence(conf);
    const analysis = combinedAnalysis(hands);

    // --- rep counting (fast path) ---
    const prevCount = repStateRef.current.count;
    const next = updateRepState(repStateRef.current, ex.name, analysis);
    repStateRef.current = next;
    if (next.count !== prevCount) {
      setRepCount(next.count);
      if (next.rep) {
        lastRepAtRef.current = Date.now();
        const n = next.count;
        const cue = `${n}`;
        speak(cue, { interrupt: false, minGapMs: 400, force: true });
        onRepCompleteRef.current?.(n);
      }
    }

    // --- deviation detection ---
    const flags = analysis.flags || [];
    if (flags.length > 0 && conf > 0.4) {
      const top = flags[0];
      devRef.current = { text: top.text, part: mapPart(top), kind: top.kind };
      const now = Date.now();
      if (now - lastLocalCueRef.current > 3500) {
        lastLocalCueRef.current = now;
        speak(top.text, { interrupt: false, minGapMs: 0, force: true });
        setCorrection({ message: top.text, part: mapPart(top), source: "vision" });
      }
      if (now - lastLLMAtRef.current > 6000 && !inflightRef.current) {
        routeToReasoning(ex, top, hands);
      }
    } else {
      devRef.current = null;
    }

    // --- inactivity cue ---
    if (conf > 0.4) {
      const now = Date.now();
      if (now - lastRepAtRef.current > 10000 && now - lastInactivityRef.current > 15000) {
        lastInactivityRef.current = now;
        lastLocalCueRef.current = now;
        const cue = repStateRef.current.phase === "open"
          ? "Now make a gentle fist"
          : "Open your hand wide";
        speak(cue, { interrupt: false, minGapMs: 0, force: true });
        setCorrection({ message: cue, part: "hand", source: "vision" });
      }
    }
  }, [exerciseRef]);

  const routeToReasoning = useCallback(async (ex, flag, hands) => {
    inflightRef.current = true;
    lastLLMAtRef.current = Date.now();
    try {
      const recent = recentRef.current.slice(-3);
      const res = await base44.functions.invoke("adaptiveCoach", {
        task: "correct",
        exercise: ex.name,
        deviation: `${flag.kind}: ${flag.text}`,
        poseSummary: summarizeHands(hands),
        recentCorrections: recent
      });
      const data = res?.data || res;
      if (data && data.should_correct && data.message) {
        recentRef.current.push(data.message);
        setCorrection({ message: data.message, part: (data.body_part || "").toLowerCase(), source: "reasoning", severity: data.severity });
        speak(data.message, { interrupt: false, minGapMs: 0, force: true });
      }
    } catch (_) {
      // resilient: if the reasoning model is slow/down, the fast path keeps coaching
    } finally {
      inflightRef.current = false;
    }
  }, []);

  useEffect(() => () => stopSpeaking(), []);

  return { handlePose, repCount, correction, confidence, reset };
}

function mapPart(flag) {
  if (flag.finger) return flag.finger;
  return "hand";
}