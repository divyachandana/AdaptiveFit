import React, { useEffect, useRef, useState, useCallback } from "react";
import CameraStage from "@/components/af/CameraStage";
import SetupScreen from "@/components/af/SetupScreen";
import CoachPanel from "@/components/af/CoachPanel";
import SummaryScreen from "@/components/af/SummaryScreen";
import { useLiveCoach } from "@/hooks/useLiveCoach";
import { useVoiceConversation } from "@/hooks/useVoiceConversation";
import { EXERCISE_LIBRARY, ROUTINES } from "@/lib/af/exercises";
import { speak, primeVoices, stopSpeaking } from "@/lib/af/speech";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import LanguagePicker from "@/components/LanguagePicker";

export default function AdaptiveFit() {
  const [phase, setPhase] = useState("setup");
  const [routine, setRoutine] = useState(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [briefing, setBriefing] = useState(false);
  const [goal, setGoal] = useState(null);
  const [goalProgress, setGoalProgress] = useState({ todayReps: 0, weekReps: 0 });
  const [isGuest, setIsGuest] = useState(false);

  const exerciseRef = useRef(null);
  const cameraRef = useRef(null);
  const correctionsCountRef = useRef(0);
  const exerciseCorrectionsRef = useRef(0);
  const lastCorrectionMsgRef = useRef("");
  const startTimeRef = useRef(0);
  const repCountRef = useRef(0);
  const finishRef = useRef(null);
  const advancingRef = useRef(false);
  const completedExercisesRef = useRef([]);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Build current exercise from routine + index
  const currentExercise = routine && routine.exercises[exerciseIndex]
    ? {
        name: routine.exercises[exerciseIndex].name,
        ...EXERCISE_LIBRARY[routine.exercises[exerciseIndex].name],
        side: routine.exercises[exerciseIndex].side,
        targetReps: EXERCISE_LIBRARY[routine.exercises[exerciseIndex].name].defaultReps
      }
    : null;

  useEffect(() => { exerciseRef.current = currentExercise; }, [currentExercise]);

  const { handlePose, repCount, correction, confidence, reset } = useLiveCoach({ exerciseRef });
  useEffect(() => { repCountRef.current = repCount; }, [repCount]);

  // Load goals and progress from the database
  const loadGoalsAndProgress = useCallback(async () => {
    try {
      if (!(await base44.auth.isAuthenticated())) { setIsGuest(true); return; }
      const me = await base44.auth.me();
      let result = await base44.entities.Goal.filter({ created_by_id: me.id }, { limit: 1 });
      if (!result.items?.length) {
        const created = await base44.entities.Goal.create({
          daily_reps_target: 15,
          weekly_reps_target: 60
        });
        setGoal(created);
      } else {
        setGoal(result.items[0]);
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      const [todayAgg, weekAgg] = await Promise.all([
        base44.entities.SessionRecord.aggregate({
          query: { user_id: me.id, created_date: { $gte: todayStart.toISOString() } },
          sum: "reps_completed"
        }),
        base44.entities.SessionRecord.aggregate({
          query: { user_id: me.id, created_date: { $gte: weekStart.toISOString() } },
          sum: "reps_completed"
        })
      ]);

      setGoalProgress({
        todayReps: todayAgg.rows?.[0]?.sum_reps_completed || 0,
        weekReps: weekAgg.rows?.[0]?.sum_reps_completed || 0
      });
    } catch (_) {
      // non-blocking: goals feature degrades gracefully
    }
  }, []);

  useEffect(() => {
    loadGoalsAndProgress();
  }, [loadGoalsAndProgress]);

  // Voice conversation
  const continueSession = useCallback(() => {
    advancingRef.current = false;
    reset();
  }, [reset]);

  const noChoiceRef = useRef(false);

  const {
    supported: voiceSupported,
    listening,
    transcript,
    coachResponse,
    thinking,
    start: startVoice,
    stop: stopVoice
  } = useVoiceConversation({
    exerciseRef,
    repCountRef,
    onUserSaysFinish: () => finishRef.current?.(),
    onUserSaysContinue: continueSession,
    awaitingChoiceRef: noChoiceRef
  });

  useEffect(() => {
    primeVoices();
    return () => { stopSpeaking(); stopVoice(); };
  }, [stopVoice]);

  // Brief for an exercise
  const briefForExercise = useCallback((exercise, isFirst = false) => {
    setBriefing(true);
    const lib = EXERCISE_LIBRARY[exercise.name];
    const sideText = exercise.side === "left" ? "with your left hand"
      : exercise.side === "right" ? "with your right hand"
      : "with both hands";
    const text = isFirst
      ? `Welcome. Today's routine: ${routine?.name}. Let's start with ${exercise.name}. ${lib.focus} Do this ${sideText}. We'll do ${exercise.targetReps} reps. The microphone stays on, so talk to me anytime. Say "I'm done" to stop.`
      : `Next exercise: ${exercise.name}. ${lib.cue}. ${sideText}. ${exercise.targetReps} reps.`;
    speak(text, {
      force: true, interrupt: true, onEnd: () => {
        if (phaseRef.current !== "session") return;
        setBriefing(false);
        reset();
        if (isFirst) speak("Ready? Let's begin.", { force: true });
      }
    });
  }, [reset, routine]);

  // Start session
  const startSession = useCallback(() => {
    if (!routine) return;
    correctionsCountRef.current = 0;
    exerciseCorrectionsRef.current = 0;
    lastCorrectionMsgRef.current = "";
    startTimeRef.current = Date.now();
    advancingRef.current = false;
    completedExercisesRef.current = [];
    setExerciseIndex(0);
    setPhase("session");
    startVoice();
    briefForExercise(routine.exercises[0], true);
  }, [routine, startVoice, briefForExercise]);

  // Finish session
  const finishSession = useCallback(async () => {
    stopVoice();
    stopSpeaking();
    setPhase("summary");
    setSummaryLoading(true);
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);

    // Record current exercise if it has reps and we're not mid-advance
    const current = exerciseRef.current;
    if (current && repCountRef.current > 0 && !advancingRef.current) {
      completedExercisesRef.current.push({
        name: current.name,
        side: current.side,
        reps: repCountRef.current,
        targetReps: current.targetReps,
        corrections: exerciseCorrectionsRef.current
      });
    }

    const exercises = completedExercisesRef.current;
    const totalReps = exercises.reduce((s, e) => s + e.reps, 0);
    const bodyParts = routine ? [routine.bodyPart] : ["hands"];

    try {
      const res = await base44.functions.invoke("adaptiveCoach", {
        task: "summary",
        exercises: exercises.map(e => ({
          name: `${e.name} (${e.side})`,
          reps: e.reps,
          targetReps: e.targetReps,
          corrections: e.corrections
        })),
        durationSeconds: duration,
        bodyParts
      });
      const data = res?.data || res;
      setSummary({
        summary: data.summary,
        highlight: data.highlight,
        focusNext: data.focus_next,
        stats: {
          reps: totalReps,
          corrections: correctionsCountRef.current,
          duration,
          exerciseCount: exercises.length
        }
      });
      speak(data.summary || "Session complete. Great work.", { force: true });
    } catch (_) {
      setSummary({
        summary: `You completed ${totalReps} reps across ${exercises.length} exercises. Great work today.`,
        focusNext: "Keep showing up.",
        stats: { reps: totalReps, corrections: 0, duration, exerciseCount: exercises.length }
      });
      speak("Session complete. Great work.", { force: true });
    } finally {
      setSummaryLoading(false);
      loadGoalsAndProgress();
    }
  }, [stopVoice, routine, loadGoalsAndProgress]);

  useEffect(() => { finishRef.current = finishSession; }, [finishSession]);

  // Exercise advancement: when reps are done, move to next exercise or finish
  useEffect(() => {
    if (phase !== "session" || !routine || !currentExercise) return;
    if (repCount >= currentExercise.targetReps && !advancingRef.current) {
      advancingRef.current = true;
      // Record completed exercise
      completedExercisesRef.current.push({
        name: currentExercise.name,
        side: currentExercise.side,
        reps: repCount,
        targetReps: currentExercise.targetReps,
        corrections: exerciseCorrectionsRef.current
      });

      if (exerciseIndex < routine.exercises.length - 1) {
        const nextIdx = exerciseIndex + 1;
        const nextEx = routine.exercises[nextIdx];
        speak(`Great! ${repCount} reps done. Next: ${nextEx.name}.`, {
          force: true, interrupt: true, onEnd: () => {
            if (phaseRef.current !== "session") return;
            setExerciseIndex(nextIdx);
            advancingRef.current = false;
            exerciseCorrectionsRef.current = 0;
            lastCorrectionMsgRef.current = "";
            briefForExercise(nextEx, false);
          }
        });
      } else {
        speak("Great job! You finished all exercises.", {
          force: true, interrupt: true, onEnd: () => {
            if (phaseRef.current !== "session") return;
            finishSession();
          }
        });
      }
    }
  }, [repCount, phase, currentExercise, exerciseIndex, routine, briefForExercise, finishSession]);

  // Track corrections
  useEffect(() => {
    if (phase !== "session" || !correction) return;
    if (correction.message !== lastCorrectionMsgRef.current) {
      lastCorrectionMsgRef.current = correction.message;
      correctionsCountRef.current += 1;
      exerciseCorrectionsRef.current += 1;
    }
  }, [correction, phase]);

  const restart = useCallback(() => {
    stopSpeaking();
    reset();
    setPhase("setup");
    setSummary(null);
    setRoutine(null);
    setExerciseIndex(0);
    loadGoalsAndProgress();
  }, [reset, loadGoalsAndProgress]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <header className="max-w-5xl mx-auto px-5 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white grid place-items-center font-bold">A</div>
          <span className="font-semibold text-neutral-900 tracking-tight">AdaptiveFit</span>
        </div>
        <div className="flex items-center gap-2">
        <LanguagePicker />
        {isGuest ? (
          <Link to="/login" className="h-11 px-4 inline-flex items-center rounded-xl bg-neutral-900 text-white text-sm font-semibold">Sign in to save progress</Link>
        ) : <div className="flex gap-2">
          <Link to="/therapist" className="h-11 px-4 inline-flex items-center rounded-xl border-2 border-neutral-900 text-sm font-semibold">Therapist portal</Link>
          <Link to="/dashboard" className="h-11 px-4 inline-flex items-center rounded-xl bg-neutral-900 text-white text-sm font-semibold">Progress dashboard</Link>
        </div>}
        </div>
      </header>

      {phase === "setup" && (
        <SetupScreen
          onStart={startSession}
          voiceSupported={voiceSupported}
          routine={routine}
          onSelectRoutine={setRoutine}
          goal={goal}
          goalProgress={goalProgress}
        />
      )}

      {phase === "session" && currentExercise && (
        <div className="max-w-5xl mx-auto px-5 py-8 grid lg:grid-cols-2 gap-8 items-start">
          <CameraStage
            ref={cameraRef}
            onPose={handlePose}
            highlight={correction}
            active={!briefing}
            briefing={briefing}
            repCount={repCount}
            targetReps={currentExercise.targetReps}
            side={currentExercise.side}
          />
          <CoachPanel
            exercise={currentExercise}
            repCount={repCount}
            targetReps={currentExercise.targetReps}
            correction={correction}
            confidence={confidence}
            voiceSupported={voiceSupported}
            listening={listening}
            transcript={transcript}
            coachResponse={coachResponse}
            thinking={thinking}
            onFinish={finishSession}
            routine={routine}
            exerciseIndex={exerciseIndex}
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
          goal={goal}
          goalProgress={goalProgress}
        />
      )}
    </div>
  );
}