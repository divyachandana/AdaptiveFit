import React, { useEffect, useRef, useState, useCallback } from "react";
import CameraStage from "@/components/af/CameraStage";
import SetupScreen from "@/components/af/SetupScreen";
import CoachPanel from "@/components/af/CoachPanel";
import SummaryScreen from "@/components/af/SummaryScreen";
import { useLiveCoach } from "@/hooks/useLiveCoach";
import { useVoiceConversation } from "@/hooks/useVoiceConversation";
import { EXERCISE_LIBRARY } from "@/lib/af/exercises";
import { speak, primeVoices, stopSpeaking } from "@/lib/af/speech";
import { base44 } from "@/api/base44Client";

const FINGER_SPREADS = {
  name: "Finger Spreads",
  ...EXERCISE_LIBRARY["Finger Spreads"],
  targetReps: 10
};

export default function AdaptiveFit() {
  const [phase, setPhase] = useState("setup");
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const exerciseRef = useRef(null);
  const cameraRef = useRef(null);
  const correctionsCountRef = useRef(0);
  const lastCorrectionMsgRef = useRef("");
  const startTimeRef = useRef(0);
  const repCountRef = useRef(0);
  const finishRef = useRef(null);

  const current = FINGER_SPREADS;
  useEffect(() => { exerciseRef.current = current; }, [current]);

  const { handlePose, repCount, correction, confidence, reset } = useLiveCoach({ exerciseRef });
  useEffect(() => { repCountRef.current = repCount; }, [repCount]);

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
    onUserSaysFinish: () => finishRef.current?.()
  });

  useEffect(() => {
    if (phase !== "session" || !correction) return;
    if (correction.message !== lastCorrectionMsgRef.current) {
      lastCorrectionMsgRef.current = correction.message;
      correctionsCountRef.current += 1;
    }
  }, [correction, phase]);

  useEffect(() => {
    primeVoices();
    return () => { stopSpeaking(); stopVoice(); };
  }, [stopVoice]);

  const startSession = useCallback(() => {
    correctionsCountRef.current = 0;
    lastCorrectionMsgRef.current = "";
    startTimeRef.current = Date.now();
    reset();
    setPhase("session");
    startVoice();
    speak(
      "Let's do some finger spreads. Open your hand as wide as you can, then make a gentle fist. Hold your hand in front of the camera. You can talk to me anytime. Just say I'm done when you're finished.",
      { force: true }
    );
  }, [reset, startVoice]);

  const finishSession = useCallback(async () => {
    stopVoice();
    stopSpeaking();
    setPhase("summary");
    setSummaryLoading(true);
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const reps = repCountRef.current;
    const exercises = [{ name: "Finger Spreads", reps, targetReps: current.targetReps, corrections: correctionsCountRef.current }];
    try {
      const res = await base44.functions.invoke("adaptiveCoach", {
        task: "summary",
        exercises,
        durationSeconds: duration,
        bodyParts: ["hands"]
      });
      const data = res?.data || res;
      setSummary({
        summary: data.summary,
        highlight: data.highlight,
        focusNext: data.focus_next,
        stats: { reps, corrections: correctionsCountRef.current, duration }
      });
      speak(data.summary || "Session complete. Great work.", { force: true });
    } catch (_) {
      setSummary({
        summary: `You completed ${reps} finger spreads. Great work today.`,
        focusNext: "Keep showing up.",
        stats: { reps, corrections: 0, duration }
      });
      speak("Session complete. Great work.", { force: true });
    } finally {
      setSummaryLoading(false);
    }
  }, [current, stopVoice]);

  useEffect(() => { finishRef.current = finishSession; }, [finishSession]);

  const restart = useCallback(() => {
    stopSpeaking();
    reset();
    setPhase("setup");
    setSummary(null);
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
        <SetupScreen onStart={startSession} voiceSupported={voiceSupported} />
      )}

      {phase === "session" && (
        <div className="max-w-5xl mx-auto px-5 py-8 grid lg:grid-cols-2 gap-8 items-start">
          <CameraStage ref={cameraRef} onPose={handlePose} highlight={correction} active={true} />
          <CoachPanel
            exercise={current}
            repCount={repCount}
            targetReps={current.targetReps}
            correction={correction}
            confidence={confidence}
            voiceSupported={voiceSupported}
            listening={listening}
            transcript={transcript}
            coachResponse={coachResponse}
            thinking={thinking}
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