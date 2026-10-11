import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CameraStage from "@/components/af/CameraStage";
import JointReport from "@/components/af/JointReport";
import { useMobilityCheck } from "@/hooks/useMobilityCheck";
import { syncMobility, limitedJoints, personalizedRoutine } from "@/lib/af/mobility";
import { primeVoices } from "@/lib/af/speech";

export default function MobilityCheck() {
  const { start, handlePose, step, steps, holding, result } = useMobilityCheck();
  const [saved, setSaved] = useState(null);
  useEffect(() => { primeVoices(); syncMobility().then(setSaved); }, []);
  const profile = result || saved;
  const limited = profile ? limitedJoints(profile) : [];
  const routine = profile ? personalizedRoutine(profile) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-5xl mx-auto px-5 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Joint mobility check</h1>
          <Link to="/exercise" className="h-11 px-4 inline-flex items-center rounded-xl border-2 border-neutral-900 text-sm font-semibold">Back to exercises</Link>
        </div>
        <p className="text-neutral-600">The coach measures all 15 joints in each hand while you open wide and make a fist, then fits your exercises to your range.</p>
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <CameraStage onPose={handlePose} active side="both" />
          <div className="rounded-2xl bg-white ring-1 ring-black/5 p-5 space-y-4">
            <ol className="space-y-2">
              {steps.map((s, i) => (
                <li key={s.id} className={`rounded-xl px-4 py-3 text-sm ${step === i ? "bg-neutral-900 text-white" : step > i ? "bg-emerald-50 text-emerald-800" : "bg-neutral-100 text-neutral-600"}`}>{i + 1}. {s.say}</li>
              ))}
            </ol>
            <button onClick={start} disabled={holding} className="w-full h-14 rounded-2xl bg-neutral-900 text-white font-semibold disabled:opacity-50">
              {holding ? "Measuring… hold still" : profile ? "Run the check again" : "Start mobility check"}
            </button>
            {routine && (
              <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="font-semibold">{limited.length ? `${limited.length} joint${limited.length > 1 ? "s" : ""} with limited movement` : "Full range in every joint"}</p>
                <p className="mt-1">{routine.description}. Reps now count within your own range.</p>
                <Link to="/exercise" className="mt-3 inline-flex h-11 px-4 items-center rounded-xl bg-emerald-700 text-white font-semibold">Use my fitted routine</Link>
              </div>
            )}
          </div>
        </div>
        {profile && <JointReport profile={profile} />}
      </div>
    </div>
  );
}