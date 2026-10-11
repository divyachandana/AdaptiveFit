import React from "react";
import { Accessibility, Camera, ArrowRight, Mic, MicOff } from "lucide-react";

export default function SetupScreen({ onStart, voiceSupported }) {
  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <div className="flex items-center gap-2 text-emerald-600 mb-3">
        <Accessibility className="w-5 h-5" />
        <span className="text-sm font-semibold tracking-wide uppercase">AdaptiveFit</span>
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 leading-tight">
        A seated exercise coach that <span className="text-emerald-600">sees your hand</span> and <span className="text-sky-600">talks back</span>.
      </h1>
      <p className="mt-4 text-neutral-600 text-lg leading-relaxed">
        Today's exercise: <strong className="text-neutral-900">Finger Spreads</strong>. Hold your hand in front of
        the camera, open it wide, then make a fist. Your coach tracks each finger, counts your reps, and talks with
        you out loud. Just speak — ask if your form is right, how many you've done, or say "I'm done" when you're finished.
      </p>

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
        className="mt-8 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 text-white px-7 py-4 text-base font-semibold hover:bg-neutral-800 transition-colors"
      >
        <Camera className="w-5 h-5" />
        Start Finger Spreads
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}