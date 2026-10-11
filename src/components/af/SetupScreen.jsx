import React, { useState } from "react";
import { Accessibility, Camera, ArrowRight, Mic, MicOff, CheckCircle2, Sparkles } from "lucide-react";
import GoalProgress from "@/components/af/GoalProgress";
import ExerciseBuilder from "@/components/af/ExerciseBuilder";
import { ROUTINES } from "@/lib/af/exercises";
import { customRoutines, saveCustomExercise } from "@/lib/af/customExercises";

export default function SetupScreen({ onStart, voiceSupported, routine, onSelectRoutine, goal, goalProgress }) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const routines = [...ROUTINES, ...customRoutines()];

  const handleBuilt = (exercise) => {
    const saved = saveCustomExercise(exercise);
    setBuilderOpen(false);
    onSelectRoutine({
      id: `custom_${String(saved.name).replace(/\s+/g, "_").toLowerCase()}`,
      name: saved.name,
      description: saved.focus,
      bodyPart: "hands",
      custom: true,
      exercises: [{ name: saved.name, side: saved.side }]
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <div className="flex items-center gap-2 text-emerald-600 mb-3">
        <Accessibility className="w-5 h-5" />
        <span className="text-sm font-semibold tracking-wide uppercase">AdaptiveFit</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 leading-tight">
        Choose your routine and <span className="text-emerald-600">start moving</span>.
      </h1>
      <p className="mt-3 text-neutral-600 text-base leading-relaxed">
        Pick a hand exercise routine below. Your coach tracks your fingers, counts reps, and talks with you out loud.
      </p>

      {goal && (
        <div className="mt-6">
          <GoalProgress
            todayReps={goalProgress.todayReps}
            weekReps={goalProgress.weekReps}
            dailyTarget={goal.daily_reps_target}
            weeklyTarget={goal.weekly_reps_target}
          />
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">Routines</h2>
        <button
          onClick={() => setBuilderOpen(true)}
          className="w-full mb-3 text-left rounded-2xl p-4 bg-gradient-to-r from-emerald-500 to-sky-500 text-white flex items-center gap-3 hover:opacity-95 transition-opacity"
        >
          <Sparkles className="w-5 h-5 shrink-0" />
          <div>
            <h3 className="font-semibold">Create your own exercise</h3>
            <p className="text-sm text-white/85">Talk to the coach and design a custom movement.</p>
          </div>
        </button>
        <div className="grid sm:grid-cols-2 gap-3">
          {ROUTINES.map(r => (
            <button
              key={r.id}
              onClick={() => onSelectRoutine(r)}
              className={`text-left rounded-2xl p-4 ring-1 transition-all ${
                routine?.id === r.id
                  ? "bg-neutral-900 text-white ring-neutral-900"
                  : "bg-white text-neutral-900 ring-black/5 hover:ring-neutral-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">{r.name}</h3>
                {routine?.id === r.id && <CheckCircle2 className="w-5 h-5" />}
              </div>
              <p className={`text-sm ${routine?.id === r.id ? "text-white/70" : "text-neutral-500"}`}>
                {r.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.exercises.map((ex, i) => (
                  <span
                    key={i}
                    className={`text-xs rounded-full px-2 py-0.5 ${
                      routine?.id === r.id ? "bg-white/15 text-white/80" : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {ex.name} · {ex.side}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={`mt-6 rounded-2xl p-4 ring-1 flex items-start gap-3 ${voiceSupported ? "bg-sky-50 ring-sky-100" : "bg-amber-50 ring-amber-100"}`}>
        {voiceSupported ? <Mic className="w-5 h-5 text-sky-600 mt-0.5 shrink-0" /> : <MicOff className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />}
        <div className="text-sm">
          <p className={`font-semibold ${voiceSupported ? "text-sky-900" : "text-amber-900"}`}>
            {voiceSupported ? "Voice conversation ready" : "Voice not available in this browser"}
          </p>
          {voiceSupported ? (
            <p className="text-sky-700 mt-1">We'll ask for microphone permission when you start. Then it's hands-free — just talk to your coach.</p>
          ) : (
            <p className="text-amber-700 mt-1">Try Chrome or Edge for two-way voice. The camera and on-screen coaching still work.</p>
          )}
        </div>
      </div>

      <button
        onClick={onStart}
        disabled={!routine}
        className="mt-8 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 text-white px-7 py-4 text-base font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Camera className="w-5 h-5" />
        {routine ? `Start ${routine.name}` : "Select a routine"}
        <ArrowRight className="w-5 h-5" />
      </button>

      {builderOpen && (
        <ExerciseBuilder
          voiceSupported={voiceSupported}
          onClose={() => setBuilderOpen(false)}
          onBuilt={handleBuilt}
        />
      )}
    </div>
  );
}