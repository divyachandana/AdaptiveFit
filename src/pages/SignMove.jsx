import React, { useState, useCallback, useEffect, useRef } from "react";
import CameraStage from "@/components/af/CameraStage";
import SignNav from "@/components/sign/SignNav";
import SignFeedback from "@/components/sign/SignFeedback";
import SignMoveHud from "@/components/sign/SignMoveHud";
import { useSignCoach } from "@/hooks/useSignCoach";
import { buildSignRoutine, pointsFor } from "@/lib/af/signMove";
import { syncMobility } from "@/lib/af/mobility";
import { speak, primeVoices } from "@/lib/af/speech";
import { base44 } from "@/api/base44Client";

export default function SignMove() {
  const [steps, setSteps] = useState([]);
  const [index, setIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [combo, setCombo] = useState(0);
  const [phase, setPhase] = useState("intro");
  const [summary, setSummary] = useState("");
  const stepStart = useRef(0);
  const sessionStart = useRef(0);
  const step = steps[index];

  useEffect(() => { primeVoices(); syncMobility(); }, []);

  const finish = useCallback(async (done) => {
    setPhase("done");
    const res = await base44.functions.invoke("adaptiveCoach", {
      task: "summary", bodyParts: ["hands"],
      durationSeconds: Math.round((Date.now() - sessionStart.current) / 1000),
      exercises: [{ name: "ASL Sign & Move", reps: done, targetReps: steps.length, corrections: 0 }]
    }).catch(() => null);
    const text = res?.data?.summary || `You signed ${done} letters. Great work for your hands.`;
    setSummary(text);
    speak(text, { force: true, interrupt: true });
  }, [steps.length]);

  const onSuccess = useCallback(() => {
    const secs = (Date.now() - stepStart.current) / 1000;
    const nextCombo = secs < 8 ? combo + 1 : 0;
    setCombo(nextCombo);
    setPoints(p => p + pointsFor(secs, nextCombo));
    if (index + 1 >= steps.length) finish(index + 1);
    else setIndex(index + 1);
  }, [combo, index, steps.length, finish]);

  const { handlePose, result, hold, reset } = useSignCoach({ sign: step?.sign || steps[0]?.sign, onSuccess });

  useEffect(() => {
    if (phase !== "play" || !step) return;
    reset();
    stepStart.current = Date.now();
    speak(`Sign ${step.sign.letter}. This works your ${step.fingers.join(", ")}.`, { force: true, interrupt: true });
  }, [phase, step, reset]);

  const start = () => {
    setSteps(buildSignRoutine(6));
    setIndex(0); setPoints(0); setCombo(0); setSummary("");
    sessionStart.current = Date.now();
    setPhase("play");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <SignNav />
      <div className="max-w-5xl mx-auto px-5 py-8 grid lg:grid-cols-2 gap-8 items-start">
        <CameraStage onPose={phase === "play" ? handlePose : undefined} active={phase === "play"} side="both" />
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-neutral-900">Sign &amp; Move</h1>
          <SignMoveHud points={points} combo={combo} index={index + (phase === "done" ? 1 : 0)} total={steps.length || 6} step={phase === "play" ? step : null} />
          {phase === "play" && step && <SignFeedback sign={step.sign} result={result} hold={hold} mastered={false} />}
          {phase === "done" && (
            <div className="rounded-2xl border-2 border-neutral-900 bg-white p-5">
              <p className="text-lg font-bold">Routine complete · {points} points</p>
              <p className="mt-1 text-neutral-700">{summary || "Saving your session…"}</p>
            </div>
          )}
          {phase !== "play" && (
            <>
              {phase === "intro" && <p className="text-neutral-600">Learn ASL letters while exercising your fingers. Signs are picked to train the joints your mobility check found limited. Each sign counts as a rep toward your daily goal; sign fast to build a combo.</p>}
              <button onClick={start} className="w-full h-16 rounded-2xl bg-neutral-900 text-white text-lg font-semibold">{phase === "done" ? "Play again" : "Start 6-sign routine"}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}