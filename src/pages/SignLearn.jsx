import React, { useState, useCallback, useEffect, useMemo } from "react";
import SignNav from "@/components/sign/SignNav";
import CameraStage from "@/components/af/CameraStage";
import SignFeedback from "@/components/sign/SignFeedback";
import LearnerInsight from "@/components/sign/LearnerInsight";
import { useSignCoach } from "@/hooks/useSignCoach";
import { SIGNS } from "@/lib/af/signs";
import { speak, primeVoices } from "@/lib/af/speech";
import { recordAttempt, adaptFor, nextLetter, mastery, syncLearner } from "@/lib/af/learner";

const LETTERS = SIGNS.map((s) => s.letter);
const masteryClass = (m) => m >= 0.75 ? "ring-2 ring-emerald-400" : m >= 0.4 ? "ring-2 ring-amber-300" : m > 0 ? "ring-2 ring-rose-300" : "";

export default function SignLearn() {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [reason, setReason] = useState("");
  const [mastered, setMastered] = useState(false);
  const [, bump] = useState(0);
  const sign = SIGNS[index];
  const adapt = useMemo(() => adaptFor(sign.letter), [sign, mastered]);

  const onSuccess = useCallback((stats) => {
    recordAttempt(sign.letter, { success: true, seconds: stats.seconds, issues: stats.issues });
    setMastered(true);
    const next = nextLetter(LETTERS, sign.letter);
    setTimeout(() => { setMastered(false); setReason(next.reason); setIndex(LETTERS.indexOf(next.letter)); }, 2000);
  }, [sign]);
  const { handlePose, result, hold, reset, getStats } = useSignCoach({ sign, onSuccess, adapt });

  const pick = (i) => {
    const st = getStats();
    if (started && !st.done && st.seconds > 5) recordAttempt(sign.letter, { success: false, seconds: st.seconds, issues: st.issues });
    setReason("");
    setIndex(i);
  };

  useEffect(() => {
    primeVoices();
    syncLearner();
    const h = () => bump((n) => n + 1);
    window.addEventListener("learner-updated", h);
    return () => window.removeEventListener("learner-updated", h);
  }, []);
  useEffect(() => {
    if (!started) return;
    reset();
    const focus = adapt.focus ? ` Last time the tricky part was: ${adapt.focus}.` : "";
    speak(`Letter ${sign.letter}. ${sign.tip}${focus}`, { force: true, interrupt: true, rate: adapt.rate });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, started]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <SignNav />
      {!started ? (
        <div className="max-w-xl mx-auto px-5 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Learn the ASL alphabet</h1>
          <p className="text-neutral-500 mt-4">The camera watches each finger and tells you exactly how to adjust your hand until the sign is right. Your coach learns which letters are tricky for you and adapts as you go.</p>
          <button onClick={() => { const n = nextLetter(LETTERS, null); setIndex(LETTERS.indexOf(n.letter)); setReason(n.reason); setStarted(true); }} className="mt-10 h-16 px-10 rounded-2xl bg-neutral-900 text-white text-lg font-semibold">Start learning</button>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-5 py-8 grid lg:grid-cols-2 gap-8 items-start">
          <CameraStage onPose={handlePose} active side="both" />
          <div className="space-y-4">
            <SignFeedback sign={sign} result={result} hold={hold} mastered={mastered} />
            <LearnerInsight reason={reason} adapt={adapt} />
            <div className="flex flex-wrap gap-2">
              {SIGNS.map((s, i) => (
                <button key={s.letter} onClick={() => pick(i)} className={`w-12 h-12 rounded-xl text-lg font-semibold ${masteryClass(mastery(s.letter))} ${i === index ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"}`}>{s.letter}</button>
              ))}
            </div>
            <p className="text-xs text-neutral-500">Ring color: green mastered, amber getting there, red needs practice.</p>
          </div>
        </div>
      )}
    </div>
  );
}