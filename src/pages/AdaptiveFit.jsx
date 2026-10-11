import React, { useEffect, useRef, useState, useCallback } from "react";
import CameraStage from "@/components/af/CameraStage";
import SetupScreen from "@/components/af/SetupScreen";
import CoachPanel from "@/components/af/CoachPanel";
import SummaryScreen from "@/components/af/SummaryScreen";
import { useLiveCoach } from "@/hooks/useLiveCoach";
import { defaultPlanForParts, EXERCISE_LIBRARY } from "@/lib/af/exercises";
import { speak, primeVoices, stopSpeaking } from "@/lib/af/speech";
import { base44 } from "@/api/base44Client";

export default function AdaptiveFit() {
  const [phase, setPhase] = useState("setup");
  const [selected, setSelected] = useState([]);
  const [plan, setPlan] = useState([]);
  const [idx, setIdx] = useState(0);
  const [planLoading, setPlanLoading] = useState(false);
  const [rhythmRep, setRhythmRep] = useState(0);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const exerciseRef = useRef(null);
  const cameraRef = useRef(null);
  const statsRef = useRef([]); // per-exercise {name, reps, targetReps, corrections}
  const correctionsCountRef = useRef(0);
  const lastCorrectionMsgRef = useRef("");
  const startTimeRef = useRef(0);
  const rhythmTimerRef = useRef(null);

  const current = plan[idx];
  const isRhythm = current && EXERCISE_LIBRARY[current.name]?.type === "rhythm";

  const { handlePose, repCount, correction, confidence, reset } = useLiveCoach({
    exerciseRef,
    onRepComplete: () => {}
  });

  // Keep exerciseRef in sync with the active exercise.
  useEffect(() => {
    exerciseRef.current = current || null;
    setRhythmRep(0);
    correctionsCountRef.current = 0;
  }, [current]);

  // Count corrections per exercise (dedupe repeated messages).
  useEffect(() => {
    if (phase !== "session" || !correction) return;
    if (correction.message !== lastCorrectionMsgRef.current) {
      lastCorrectionMsgRef.current = correction.message;
      correctionsCountRef.current += 1;
    }
  }, [correction, phase]);

  // Rhythm-based rep counting for exercises pose can't measure (wrists, head turns).
  useEffect(() => {
    if (rhythmTimerRef.current) { clearInterval(rhythmTimerRef.current); rhythmTimerRef.current = null; }
    if (phase === "session" && isRhythm) {
      const tickMs = 3200;
      rhythmTimerRef.current = setInterval(() => {
        setRhythmRep((r) => {
          const n = r + 1;
          speak(n % 4 === 0 ? `Nice, ${n}` : `${n}`, { interrupt: false, minGapMs: 300, force: true });
          return n;
        });
      }, tickMs);
    }
    return () => { if (rhythmTimerRef.current) clearInterval(rhythmTimerRef.current); };
  }, [phase, isRhythm, idx]);

  useEffect(() => { primeVoices(); return () => stopSpeaking(); }, []);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const startSession = useCallback(async () => {
    setPlanLoading(true);
    const local = defaultPlanForParts(selected);
    setPlan(local);
    // Render instantly, then let the reasoning model refine the plan + greeting.
    try {
      const res = await base44.functions.invoke("adaptiveCoach", {
        task: "plan",
        bodyParts: selected
      });
      const data = res?.data || res;
      if (data?.exercises?.length) {
        const refined = data.exercises.map((e) => ({
          name: e.name,
          side: e.side || "both",
          targetReps: Number(e.targetReps) || 8,
          cue: e.cue || EXERCISE_LIBRARY[e.name]?.cue || "",
          focus: e.focus || EXERCISE_LIBRARY[e.name]?.focus || ""
        }));
        setPlan(refined);
        speak(data.greeting || "Let's get moving together.", { force: true });
        setTimeout(() => speak(refined[0]?.cue || "", { force: true }), 2200);
      } else {
        speak(local[0]?.cue || "Let's begin.", { force: true });
      }
    } catch (_) {
      speak(local[0]?.cue || "Let's begin.", { force: true });
    }
    statsRef.current = [];
    startTimeRef.current = Date.now();
    setIdx(0);
    setPlanLoading(false);
    setPhase("session");
  }, [selected]);

  const snapshotCurrent = useCallback(() => {
    if (!current) return;
    const reps = isRhythm ? rhythmRep : repCount;
    statsRef.current[idx] = {
      name: current.name,
      reps,
      targetReps: current.targetReps,
      corrections: correctionsCountRef.current
    };
  }, [current, idx, isRhythm, rhythmRep, repCount]);

  const goNext = useCallback(() => {
    snapshotCurrent();
    reset();
    lastCorrectionMsgRef.current = "";
    if (idx + 1 < plan.length) {
      const next = plan[idx + 1];
      setIdx(idx + 1);
      setTimeout(() => speak(next.cue || next.name, { force: true }), 400);
    } else {
      finishSession();
    }
  }, [snapshotCurrent, reset, idx, plan]);

  const finishSession = useCallback(async () => {
    snapshotCurrent();
    setPhase("summary");
    setSummaryLoading(true);
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const exercises = statsRef.current.filter(Boolean);
    try {
      const res = await base44.functions.invoke("adaptiveCoach", {
        task: "summary",
        exercises,
        durationSeconds: duration,
        bodyParts: selected
      });
      const data = res?.data || res;
      setSummary({
        summary: data.summary,
        highlight: data.highlight,
        focusNext: data.focus_next,
        stats: {
          reps: exercises.reduce((s, e) => s + (e.reps || 0), 0),
          corrections: exercises.reduce((s, e) => s + (e.corrections || 0), 0),
          duration
        }
      });
      speak(data.summary || "Session complete. Great work.", { force: true });
    } catch (_) {
      const reps = exercises.reduce((s, e) => s + (e.reps || 0), 0);
      setSummary({
        summary: `You completed ${reps} reps. Great work today.`,
        focusNext: "Keep showing up.",
        stats: { reps, corrections: 0, duration }
      });
      speak("Session complete. Great work.", { force: true });
    } finally {
      setSummaryLoading(false);
    }
  }, [snapshotCurrent, selected]);

  const restart = useCallback(() => {
    stopSpeaking();
    reset();
    setPhase("setup");
    setPlan([]);
    setIdx(0);
    setSummary(null);
    statsRef.current = [];
  }, [reset]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <header className="max-w-5xl mx-auto px-5 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white grid place-items-center font-bold">A</div>
          <span className="font-semibold text-neutral-900 tracking-tight">AdaptiveFit</span>
        </div>
        <span className="text-xs text-neutral-400 hidden sm:block">Seated exercise · multimodal AI coach</span>
      </header>

      {phase === "setup" && (
        <SetupScreen selected={selected} onToggle={toggle} onStart={startSession} loading={planLoading} />
      )}

      {phase === "session" && current && (
        <div className="max-w-5xl mx-auto px-5 py-8 grid lg:grid-cols-2 gap-8 items-start">
          <CameraStage ref={cameraRef} onPose={handlePose} highlight={correction} active={true} />
          <CoachPanel
            exercise={current}
            repCount={repCount}
            rhythmRep={isRhythm ? rhythmRep : 0}
            targetReps={current.targetReps}
            correction={correction}
            confidence={confidence}
            index={idx}
            total={plan.length}
            onNext={goNext}
            onFinish={finishSession}
          />
        </div>
      )}

      {phase === "summary" && (
        <SummaryScreen
          saving={summaryLoading}
          summary={summary?.summary}
          highlight={summary?.highlight}
          focusNext={summary?.focusNext}
          stats={summary?.stats}
          onRestart={restart}
        />
      )}
    </div>
  );
}