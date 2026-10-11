import React, { useState, useCallback, useEffect } from "react";
import CameraStage from "@/components/af/CameraStage";
import SignNav from "@/components/sign/SignNav";
import SignFeedback from "@/components/sign/SignFeedback";
import { useSignCoach } from "@/hooks/useSignCoach";
import { SIGNS } from "@/lib/af/signs";
import { speak, primeVoices } from "@/lib/af/speech";

const ROUND = 60;
const pick = (prev) => { let s; do { s = SIGNS[Math.floor(Math.random() * SIGNS.length)]; } while (s === prev); return s; };

export default function SignDrill() {
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(ROUND);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("signDrillBest") || 0));
  const [sign, setSign] = useState(SIGNS[0]);

  const onSuccess = useCallback(() => { setScore((n) => n + 1); setSign((s) => pick(s)); }, []);
  const { handlePose, result, hold, reset } = useSignCoach({ sign, onSuccess });

  useEffect(() => { primeVoices(); }, []);
  useEffect(() => { if (running) { reset(); speak(sign.letter, { force: true, interrupt: true }); } }, [sign, running, reset]);
  useEffect(() => {
    if (!running) return;
    if (left <= 0) {
      setRunning(false);
      if (score > best) { setBest(score); localStorage.setItem("signDrillBest", String(score)); }
      speak(`Time's up. You signed ${score} letters.`, { force: true, interrupt: true });
      return;
    }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [running, left, score, best]);

  const start = () => { setScore(0); setLeft(ROUND); setSign(pick(null)); setRunning(true); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <SignNav />
      <div className="max-w-5xl mx-auto px-5 py-8 grid lg:grid-cols-2 gap-8 items-start">
        <CameraStage onPose={running ? handlePose : undefined} active={running} side="both" />
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[["Time", `${left}s`], ["Score", score], ["Best", best]].map(([l, v]) => (
              <div key={l} className="rounded-2xl bg-neutral-100 p-4"><p className="text-xs text-neutral-500">{l}</p><p className="text-3xl font-bold tabular-nums">{v}</p></div>
            ))}
          </div>
          {running ? (
            <SignFeedback sign={sign} result={result} hold={hold} mastered={false} />
          ) : (
            <button onClick={start} className="w-full h-16 rounded-2xl bg-neutral-900 text-white text-lg font-semibold">{left <= 0 ? "Play again" : "Start 60-second drill"}</button>
          )}
        </div>
      </div>
    </div>
  );
}