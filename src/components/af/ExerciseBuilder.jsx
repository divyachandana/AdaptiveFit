import React, { useEffect, useRef, useState } from "react";
import { useExerciseBuilder } from "@/hooks/useExerciseBuilder";
import { Mic, MicOff, Send, X, Sparkles, Check, Loader2 } from "lucide-react";

const DETECT_LABEL = {
  fingerSpread: "Hand tracking (camera counts reps)",
  thumbTouch: "Thumb-touch tracking",
  none: "Timed hold (no camera counting)"
};

export default function ExerciseBuilder({ voiceSupported, onClose, onBuilt }) {
  const {
    supported, listening, transcript, messages, coachResponse, thinking, exercise,
    startConversation, stop, sendText, clearExercise
  } = useExerciseBuilder();
  const [text, setText] = useState("");
  const logRef = useRef(null);

  useEffect(() => {
    if (voiceSupported && supported) startConversation();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, coachResponse, thinking]);

  const submit = (e) => {
    e.preventDefault();
    sendText(text);
    setText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white grid place-items-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-900 leading-tight">Design your exercise</h2>
              <p className="text-xs text-neutral-500">Talk to the coach or type below</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation log */}
        <div ref={logRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-neutral-50">
          {messages.length === 0 && !thinking && (
            <p className="text-sm text-neutral-400 italic">
              {voiceSupported && supported ? "Listening… tell the coach what you want to work on." : "Type what you want to work on below."}
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                m.role === "user"
                  ? "bg-neutral-900 text-white rounded-br-sm"
                  : "bg-white text-neutral-800 ring-1 ring-black/5 rounded-bl-sm"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Coach is thinking…</span>
            </div>
          )}
          {transcript && !thinking && (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl px-3.5 py-2 text-sm bg-neutral-200 text-neutral-500 italic">
                {transcript}
              </div>
            </div>
          )}
        </div>

        {/* Exercise preview */}
        {exercise && (
          <div className="px-5 py-4 border-t border-neutral-100 bg-white">
            <div className="rounded-2xl bg-emerald-50 ring-1 ring-emerald-100 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-emerald-900">{exercise.name}</h3>
              </div>
              <p className="text-sm text-emerald-800">{exercise.focus}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                <span className="rounded-full bg-white px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-200 capitalize">{exercise.side} hand</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-200">{exercise.defaultReps} reps</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-200">{DETECT_LABEL[exercise.detect] || "Timed"}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onBuilt(exercise)}
                  className="flex-1 rounded-xl bg-emerald-600 text-white text-sm font-semibold py-2.5 hover:bg-emerald-700 transition-colors"
                >
                  Use this exercise
                </button>
                <button
                  onClick={clearExercise}
                  className="rounded-xl bg-white text-emerald-700 ring-1 ring-emerald-200 text-sm font-semibold px-4 py-2.5 hover:bg-emerald-50 transition-colors"
                >
                  Refine
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="px-5 py-4 border-t border-neutral-100 bg-white">
          <form onSubmit={submit} className="flex items-center gap-2">
            {voiceSupported && supported && (
              <button
                type="button"
                onClick={listening ? stop : startConversation}
                className={`shrink-0 w-11 h-11 rounded-xl grid place-items-center transition-colors ${
                  listening ? "bg-red-500 text-white" : "bg-neutral-900 text-white"
                }`}
                title={listening ? "Stop listening" : "Start listening"}
              >
                {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your answer…"
              className="flex-1 rounded-xl bg-neutral-100 px-4 py-3 text-sm outline-none focus:ring-2 ring-emerald-400"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="shrink-0 w-11 h-11 rounded-xl bg-neutral-900 text-white grid place-items-center disabled:opacity-40"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}