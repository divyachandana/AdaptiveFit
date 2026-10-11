import { useState, useRef, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { recognitionSupported, createRecognition } from "@/lib/af/voiceRecognition";
import { speak, isCoachEcho, stopSpeaking } from "@/lib/af/speech";

// useExerciseBuilder: a two-way voice loop for designing a custom exercise.
// Routes the conversation to the adaptiveCoach "buildExercise" task (Claude),
// speaks the reply, and surfaces the finished exercise when ready. The mic
// is started by an explicit user tap (a gesture the browser requires) rather
// than on mount, so recognition actually starts. Falls back to text input.

export function useExerciseBuilder() {
  const supported = recognitionSupported();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState([]);
  const [coachResponse, setCoachResponse] = useState("");
  const [thinking, setThinking] = useState(false);
  const [exercise, setExercise] = useState(null);
  const [micError, setMicError] = useState("");

  const recRef = useRef(null);
  const inflightRef = useRef(false);
  const messagesRef = useRef([]);
  const transcriptCbRef = useRef(null);

  const send = useCallback(async (history) => {
    inflightRef.current = true;
    setThinking(true);
    try {
      const res = await base44.functions.invoke("adaptiveCoach", {
        task: "buildExercise",
        messages: history
      });
      const data = res?.data || res;
      const reply = data?.response || "What movement would you like to practice?";
      setCoachResponse(reply);
      speak(reply, { force: true, interrupt: true });
      const newHistory = [...history, { role: "assistant", content: reply }];
      messagesRef.current = newHistory;
      setMessages(newHistory);
      if (data?.ready && data?.exercise) setExercise(data.exercise);
    } catch (_) {
      const fallback = "Sorry, I missed that. What movement would you like to try?";
      setCoachResponse(fallback);
      speak(fallback, { force: true, interrupt: true });
    } finally {
      inflightRef.current = false;
      setThinking(false);
      setTranscript("");
    }
  }, []);

  const handleTranscript = useCallback((text, isFinal) => {
    if (isCoachEcho(text)) return;
    if (!isFinal) { setTranscript(text); return; }
    setTranscript(text);
    if (inflightRef.current) return;
    const history = [...messagesRef.current, { role: "user", content: text }];
    send(history);
  }, [send]);

  useEffect(() => { transcriptCbRef.current = handleTranscript; }, [handleTranscript]);

  // Greet on open (TTS is unlocked by the click that opened the panel).
  const greet = useCallback(() => { send([]); }, [send]);

  // Start the mic from an explicit tap (browser requires a user gesture).
  const startListening = useCallback(() => {
    if (!supported) return;
    setMicError("");
    if (recRef.current) { try { recRef.current.stop(); } catch (_) {} recRef.current = null; }
    const rec = createRecognition({
      onResult: (t, f) => transcriptCbRef.current?.(t, f),
      onError: (err) => setMicError(
        err === "not-allowed" || err === "service-not-allowed"
          ? "blocked"
          : err || "unavailable"
      )
    });
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [supported]);

  const stopListening = useCallback(() => {
    if (recRef.current) { recRef.current.stop(); recRef.current = null; }
    setListening(false);
    stopSpeaking();
  }, []);

  const sendText = useCallback((text) => {
    if (!text.trim() || inflightRef.current) return;
    const history = [...messagesRef.current, { role: "user", content: text.trim() }];
    send(history);
  }, [send]);

  const clearExercise = useCallback(() => setExercise(null), []);

  useEffect(() => () => stopListening(), [stopListening]);

  return {
    supported, listening, transcript, messages, coachResponse, thinking, exercise, micError,
    greet, startListening, stopListening, sendText, clearExercise
  };
}