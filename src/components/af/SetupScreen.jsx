import React from "react";
import { BODY_PARTS } from "@/lib/af/exercises";
import { Accessibility, Camera, ArrowRight } from "lucide-react";

export default function SetupScreen({ selected, onToggle, onStart, loading }) {
  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <div className="flex items-center gap-2 text-emerald-600 mb-3">
        <Accessibility className="w-5 h-5" />
        <span className="text-sm font-semibold tracking-wide uppercase">AdaptiveFit</span>
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 leading-tight">
        A seated exercise coach that <span className="text-emerald-600">sees you</span> and <span className="text-sky-600">talks back</span>.
      </h1>
      <p className="mt-4 text-neutral-600 text-lg leading-relaxed">
        Built for wheelchair users. Your camera watches your upper body, an AI reasons about your
        seated pose, and the coach speaks corrections out loud — adapting to whatever you can move today.
      </p>

      <div className="mt-8">
        <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          What can you move today?
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          {BODY_PARTS.map((p) => {
            const on = selected.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => onToggle(p.id)}
                className={`text-left rounded-2xl p-4 border-2 transition-all duration-200 ${
                  on ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <div className="text-3xl mb-2">{p.emoji}</div>
                <div className="font-semibold text-neutral-900">{p.label}</div>
                <div className={`mt-1 text-xs font-medium ${on ? "text-emerald-600" : "text-neutral-400"}`}>
                  {on ? "Selected" : "Tap to include"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={onStart}
        disabled={selected.length === 0 || loading}
        className="mt-8 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 text-white px-7 py-4 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Building your plan…
          </>
        ) : (
          <>
            <Camera className="w-5 h-5" />
            Start my session
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
      {selected.length === 0 && (
        <p className="mt-3 text-sm text-neutral-400">Select at least one body part to begin.</p>
      )}
    </div>
  );
}