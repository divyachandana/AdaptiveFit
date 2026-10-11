import React, { useEffect, useState } from "react";
import CameraStage from "@/components/af/CameraStage";
import SignNav from "@/components/sign/SignNav";
import HandReadout from "@/components/sign/HandReadout";
import ThresholdSettings from "@/components/sign/ThresholdSettings";
import LiveCalibration from "@/components/sign/LiveCalibration";
import { SIGNS } from "@/lib/af/signs";
import { loadSamples, clearLetter, clearAll } from "@/lib/af/calibration";
import { useCalibrationRecorder } from "@/hooks/useCalibrationRecorder";
import { primeVoices } from "@/lib/af/speech";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

const STATIC = SIGNS.filter((s) => !s.motion);

export default function SignCalibrate() {
  const [samples, setSamples] = useState(loadSamples());
  const [letter, setLetter] = useState("A");
  const refresh = () => setSamples({ ...loadSamples() });
  const { handlePose, live, recording, countdown, record, frames } = useCalibrationRecorder({ onSaved: refresh });
  const [signedIn, setSignedIn] = useState(null);
  useEffect(() => {
    primeVoices();
    base44.auth.isAuthenticated().then(setSignedIn);
    window.addEventListener("calibration-synced", refresh);
    return () => window.removeEventListener("calibration-synced", refresh);
  }, []);
  const sign = STATIC.find((s) => s.letter === letter);
  const busy = countdown > 0 || recording;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <SignNav />
      <div className="max-w-5xl mx-auto px-5 py-8 grid lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <CameraStage onPose={handlePose} active side="both" />
          <div className="rounded-2xl border border-neutral-200 bg-white p-5"><HandReadout live={live} /></div>
          <LiveCalibration live={live} />
          <ThresholdSettings signedIn={signedIn} />
        </div>
        <div className="space-y-4">
          <p className="text-neutral-600">Pick a letter, make the shape, and press Record. Record each letter 2–3 times, moving your hand slightly between takes. {signedIn ? "Your recordings and thresholds are saved to your account and sync across devices." : "Your recordings and thresholds are saved on this device only."}</p>
          {signedIn === false && (
            <Link to="/login?returnTo=/signs/calibrate" className="flex items-center justify-center h-12 rounded-2xl bg-neutral-900 text-white font-semibold">Sign in to sync across devices</Link>
          )}
          <div className="grid grid-cols-6 gap-2">
            {STATIC.map((s) => (
              <button key={s.letter} onClick={() => setLetter(s.letter)} className={`h-12 rounded-xl font-bold relative ${letter === s.letter ? "bg-neutral-900 text-white" : samples[s.letter] ? "bg-emerald-100 text-emerald-900" : "bg-neutral-100"}`}>
                {s.letter}
              </button>
            ))}
          </div>
          <div className="rounded-2xl bg-neutral-900 text-white p-5 space-y-3">
            <div className="text-4xl font-bold">{letter}</div>
            <p className="text-white/70 text-sm">{sign?.tip}</p>
            <p className="text-sm">{samples[letter]?.length || 0} samples recorded</p>
            <button disabled={busy} onClick={() => record(letter)} className="w-full h-14 rounded-2xl bg-emerald-400 text-neutral-900 font-semibold disabled:opacity-60">
              {countdown > 0 ? `Get ready… ${countdown}` : recording ? `Recording ${recording.count}/${frames}` : "Record"}
            </button>
            {samples[letter] && <button onClick={() => { clearLetter(letter); refresh(); }} className="w-full h-12 rounded-2xl bg-white/10 font-medium">Clear {letter}</button>}
          </div>
          <button onClick={() => { clearAll(); refresh(); }} className="text-sm text-neutral-500 underline">Reset all calibration</button>
          <p className="text-xs text-neutral-500">J and Z are recognized by their traced motion, so they don't need recording.</p>
        </div>
      </div>
    </div>
  );
}