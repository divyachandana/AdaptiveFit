import { useRef, useState, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { extractKeypoints, upperBodyConfidence, analyzePose, updateRepState, summarizePose } from "@/lib/af/poseUtils";
import { speak, stopSpeaking } from "@/lib/af/speech";
import { EXERCISE_LIBRARY } from "@/lib/af/exercises";

// useLiveCoach owns the real-time correction loop.
// Vision fast path: local pose math counts reps and fires short, instant
// spoken cues for clear deviations. Reasoning path: when a deviation
// persists, the loop routes the pose summary to the adaptiveCoach backend
// function (the LLM reasoning model) for a warmer, specific correction and
// tells the UI which body part to highlight.
export function useLiveCoach({ exerciseRef, onRepComplete }) {
  const repStateRef = useRef({ count: 0, phase: "down" });
  const lastLocalCueRef = useRef(0);
  const lastLLMAtRef = useRef(0);
  const recentRef = useRef([]);
  const inflightRef = useRef(false);
  const devRef = useRef(null); // persistent deviation summary for LLM routing
  const onRepCompleteRef = useRef(onRepComplete);
  useEffect(() => { onRepCompleteRef.current = onRepComplete; }, [onRepComplete]);
  const [repCount, setRepCount] = useState(0);
  const [correction, setCorrection] = useState(null); // {message, part, source}
  const [confidence, setConfidence] = useState(0);
  const [listening, setListening] = useState(false);

  const reset = useCallback(() => {
    repStateRef.current = { count: 0, phase: "down" };
    lastLocalCueRef.current = 0;
    lastLLMAtRef.current = 0;
    recentRef.current = [];
    devRef.current = null;
    setRepCount(0);
    setCorrection(null);
    setConfidence(0);
  }, []);

  const handlePose = useCallback((pose) => {
    if (!pose) { setConfidence(0); return; }
    const ex = exerciseRef.current;
    if (!ex) return;
    const lib = EXERCISE_LIBRARY[ex.name];
    if (!lib || lib.type !== "pose") { setConfidence(0); return; }

    const k = extractKeypoints(pose, 0.3);
    const conf = upperBodyConfidence(k);
    setConfidence(conf);
    const analysis = analyzePose(k, ex.name);

    // --- rep counting (fast path) ---
    const prevCount = repStateRef.current.count;
    const next = updateRepState(repStateRef.current, ex.name, analysis);
    // Always persist phase + history — not just on count change — so the
    // down→up transition survives to the next frame and a rep can complete.
    repStateRef.current = next;
    if (next.count !== prevCount) {
      setRepCount(next.count);
      if (next.rep) {
        const n = next.count;
        const cue = n % 5 === 0 ? `Nice! ${n} reps` : `${n}`;
        speak(cue, { interrupt: false, minGapMs: 400, force: true });
        onRepCompleteRef.current?.(n);
      }
    }

    // --- deviation detection ---
    const flags = analysis.flags || [];
    if (flags.length > 0 && conf > 0.4) {
      const top = flags[0];
      devRef.current = { text: top.text, part: mapPart(top), kind: top.kind };
      // Local fast-path spoken cue (low latency), throttled.
      const now = Date.now();
      if (now - lastLocalCueRef.current > 3500) {
        lastLocalCueRef.current = now;
        speak(top.text, { interrupt: true, minGapMs: 0, force: true });
        setCorrection({ message: top.text, part: mapPart(top), source: "vision" });
      }
      // Reasoning path: route to LLM if deviation persists and not too soon.
      if (now - lastLLMAtRef.current > 6000 && !inflightRef.current) {
        routeToReasoning(ex, top, k);
      }
    } else {
      devRef.current = null;
    }
  }, [exerciseRef]);

  const routeToReasoning = useCallback(async (ex, flag, k) => {
    inflightRef.current = true;
    lastLLMAtRef.current = Date.now();
    try {
      const recent = recentRef.current.slice(-3);
      const res = await base44.functions.invoke("adaptiveCoach", {
        task: "correct",
        exercise: ex.name,
        deviation: `${flag.kind}: ${flag.text}`,
        poseSummary: summarizePose(k),
        recentCorrections: recent
      });
      const data = res?.data || res;
      if (data && data.should_correct && data.message) {
        recentRef.current.push(data.message);
        setCorrection({ message: data.message, part: (data.body_part || "").toLowerCase(), source: "reasoning", severity: data.severity });
        // The reasoning model's phrasing overrides the fast-path cue.
        speak(data.message, { interrupt: true, minGapMs: 0, force: true });
      }
    } catch (_) {
      // resilient: if the reasoning model is slow/down, the fast path keeps coaching
    } finally {
      inflightRef.current = false;
    }
  }, []);

  useEffect(() => () => stopSpeaking(), []);

  return { handlePose, repCount, correction, confidence, reset, setListening, listening };
}

function mapPart(flag) {
  if (flag.kind === "posture") return "spine";
  if (flag.kind === "shoulder") return "shoulders";
  if (flag.side === "left") return "left";
  if (flag.side === "right") return "right";
  return "default";
}