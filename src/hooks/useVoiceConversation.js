import { useState, useRef, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { recognitionSupported, createRecognition } from "@/lib/af/voiceRecognition";
import { speak, onSpeechEvent } from "@/lib/af/speech";

// useVoiceConversation: the two-way voice loop.
// Listens continuously (browser SpeechRecognition), transcribes the user's
// speech, routes it to the adaptiveCoach "converse" task for a conversational
// LLM response, speaks that response, then resumes listening. Pauses
// recognition while the coach speaks (via onSpeechEvent) so the coach never
// transcribes its own voice. Detects "I'm done" locally for instant finish,
// and lets the LLM detect other finish phrasing.

const FINISH_PHRASES = [
  "i'm done", "im done", "i am done", "that's enough", "thats enough",
  "i'm finished", "im finished", "let's stop", "lets stop", "let us stop",
  "stop now", "end it", "we're done", "were done", "finish", "all done",
  "i want to stop", "i wanna stop", "that's it", "thats it for today"
];

export function useVoiceConversation({ exerciseRef, repCountRef, onUserSaysFinish }) {
  const [supported] = useState(() => recognitionSupported());
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [coachResponse, setCoachResponse] = useState("");
  const [thinking, setThinking] = useState(false);

  const recRef = useRef(null);
  const activeRef = useRef(false);
  const inflightRef = useRef(false);
  const recentRef = useRef([]);
  const finishCbRef = useRef(onUserSaysFinish);
  const transcriptCbRef = useRef(null);

  useEffect(() => { finishCbRef.current = onUserSaysFinish; }, [onUserSaysFinish]);

  const handleTranscript = useCallback(async (text, isFinal) => {
    if (!isFinal) {
      setTranscript(text);
      return;
    }
    setTranscript(text);

    // Local finish detection (instant, no LLM round-trip).
    if (FINISH_PHRASES.some(p => text.toLowerCase().includes(p))) {
      finishCbRef.current?.();
      return;
    }

    if (inflightRef.current) return;
    inflightRef.current = true;
    setThinking(true);
    try {
      const res = await base44.functions.invoke("adaptiveCoach", {
        task: "converse",
        transcript: text,
        exercise: exerciseRef.current?.name || "Arm Raises",
        repCount: repCountRef.current || 0,
        targetReps: exerciseRef.current?.targetReps || 10,
        recentCorrections: recentRef.current.slice(-3)
      });
      const data = res?.data || res;
      if (data?.should_finish) {
        finishCbRef.current?.();
        return;
      }
      const reply = data?.response || "Keep going, you're doing great.";
      recentRef.current.push(reply);
      setCoachResponse(reply);
      speak(reply, { force: true, interrupt: true });
    } catch (_) {
      const fallback = "Keep going, you're doing great.";
      setCoachResponse(fallback);
      speak(fallback, { force: true, interrupt: true });
    } finally {
      inflightRef.current = false;
      setThinking(false);
      setTranscript("");
    }
  }, [exerciseRef, repCountRef]);

  useEffect(() => { transcriptCbRef.current = handleTranscript; }, [handleTranscript]);

  const start = useCallback(() => {
    if (!supported || recRef.current) return;
    activeRef.current = true;
    const rec = createRecognition({
      onResult: (text, isFinal) => transcriptCbRef.current?.(text, isFinal),
      onError: () => {}
    });
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [supported]);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (recRef.current) { recRef.current.stop(); recRef.current = null; }
    setListening(false);
    setTranscript("");
    setThinking(false);
    setCoachResponse("");
  }, []);

  // Pause/resume recognition when the coach speaks.
  useEffect(() => {
    if (!supported) return;
    const unsub = onSpeechEvent((evt) => {
      const rec = recRef.current;
      if (!rec || !activeRef.current) return;
      if (evt === "start") { rec.pauseForSpeech(); setListening(false); }
      else if (evt === "end") { rec.resumeAfterSpeech(); setListening(true); }
    });
    return unsub;
  }, [supported]);

  useEffect(() => () => stop(), [stop]);

  return { supported, listening, transcript, coachResponse, thinking, start, stop };
}