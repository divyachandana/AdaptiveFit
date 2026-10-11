import React, { useState, useCallback, useEffect } from "react";
import SignNav from "@/components/sign/SignNav";
import CameraStage from "@/components/af/CameraStage";
import SignFeedback from "@/components/sign/SignFeedback";
import { useSignCoach } from "@/hooks/useSignCoach";
import { SIGNS } from "@/lib/af/signs";
import { speak, primeVoices } from "@/lib/af/speech";

export default function SignLearn() {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [mastered, setMastered] = useState(false);
  const sign = SIGNS[index];

  const onSuccess = useCallback(() => {
    setMastered(true);
    setTimeout(() => { setMastered(false); setIndex((i) => (i + 1) % SIGNS.length); }, 2000);
  }, []);
  const { handlePose, result, hold, reset } = useSignCoach({ sign, onSuccess });

  useEffect(() => { primeVoices(); }, []);
  useEffect(() => {
    if (!started) return;
    reset();
    speak(`Letter ${sign.letter}. ${sign.tip}`, { force: true, interrupt: true });
  }, [index, started, sign, reset]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <SignNav />
      {!started ? (
        <div className="max-w-xl mx-auto px-5 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Learn the ASL alphabet</h1>
          <p className="text-neutral-500 mt-4">The camera watches each finger and tells you exactly how to adjust your hand until the sign is right. Use your dominant hand.</p>
          <button onClick={() => setStarted(true)} className="mt-10 h-16 px-10 rounded-2xl bg-neutral-900 text-white text-lg font-semibold">Start learning</button>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-5 py-8 grid lg:grid-cols-2 gap-8 items-start">
          <CameraStage onPose={handlePose} active side="both" />
          <div className="space-y-4">
            <SignFeedback sign={sign} result={result} hold={hold} mastered={mastered} />
            <div className="flex flex-wrap gap-2">
              {SIGNS.map((s, i) => (
                <button key={s.letter} onClick={() => setIndex(i)} className={`w-12 h-12 rounded-xl text-lg font-semibold ${i === index ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"}`}>{s.letter}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}