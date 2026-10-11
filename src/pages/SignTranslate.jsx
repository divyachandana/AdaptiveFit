import React, { useEffect } from "react";
import { Volume2, Delete, Space, Trash2 } from "lucide-react";
import CameraStage from "@/components/af/CameraStage";
import SignNav from "@/components/sign/SignNav";
import { useSignTranslator } from "@/hooks/useSignTranslator";
import WordSuggestions from "@/components/sign/WordSuggestions";
import WordSignGuide from "@/components/sign/WordSignGuide";
import { primeVoices } from "@/lib/af/speech";

export default function SignTranslate() {
  const { handlePose, text, words, currentWord, live, hold, actions } = useSignTranslator();
  useEffect(() => { primeVoices(); }, []);
  const btn = "h-14 rounded-2xl font-semibold flex items-center justify-center gap-2";

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <SignNav />
      <div className="max-w-5xl mx-auto px-5 py-8 grid lg:grid-cols-2 gap-8 items-start">
        <CameraStage onPose={handlePose} active side="both" />
        <div className="space-y-4">
          <div className="rounded-3xl bg-neutral-900 text-white p-6 flex items-center gap-6">
            <div className={`font-bold text-center ${live?.length > 1 ? "text-3xl min-w-20" : "text-7xl w-20"}`}>{live || "–"}</div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest text-white/50">Detecting</p>
              <div className="h-3 rounded-full bg-white/15 mt-2 overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: `${hold * 100}%` }} /></div>
            </div>
          </div>
          <div className="min-h-32 rounded-2xl border-2 border-neutral-900 bg-white p-5 text-3xl font-semibold tracking-wide break-words">
            {text || <span className="text-neutral-400 text-lg font-normal">Hold a sign for one second to type it. Drop your hand to finish a word and hear it spoken.</span>}
          </div>
          <WordSuggestions prefix={currentWord} words={words} onPick={actions.complete} />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={actions.speakAll} className={`${btn} bg-neutral-900 text-white`}><Volume2 className="w-5 h-5" />Speak</button>
            <button onClick={actions.space} className={`${btn} bg-neutral-100`}><Space className="w-5 h-5" />Space</button>
            <button onClick={actions.backspace} className={`${btn} bg-neutral-100`}><Delete className="w-5 h-5" />Delete</button>
            <button onClick={actions.clear} className={`${btn} bg-neutral-100`}><Trash2 className="w-5 h-5" />Clear</button>
          </div>
          <p className="text-xs text-neutral-500">Recognizes all 26 letters. Trace J with your pinky and Z with your index finger.</p>
          <WordSignGuide />
        </div>
      </div>
    </div>
  );
}