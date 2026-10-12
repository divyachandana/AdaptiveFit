import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX, Bot, Send } from "lucide-react";
import { voiceScript } from "@/lib/af/carePlanMock";

// Mock Anbaric voice agent for therapists. Plays a scripted conversation so the
// flow can be demoed; the real one would be an Anbaric agent actor with
// speech in/out. When the script asks for a plan, it calls onDraftRequest.
export default function VoiceAgentPanel({ patientName, onDraftRequest, onLog }) {
  const [lines, setLines] = useState([]);
  const [listening, setListening] = useState(false);
  const [speak, setSpeak] = useState(true);
  const [typed, setTyped] = useState("");
  const timers = useRef([]);
  const endRef = useRef(null);
  // Scripted lines fire from timers, so read the latest callbacks through refs.
  const draftRef = useRef(onDraftRequest);
  const logRef = useRef(onLog);
  draftRef.current = onDraftRequest;
  logRef.current = onLog;

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => { clear(); window.speechSynthesis?.cancel(); }, []);
  useEffect(() => { stop(); setLines([]); }, [patientName]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [lines]);

  const say = (text) => {
    if (!speak || !window.speechSynthesis) return;
    try { window.speechSynthesis.speak(new SpeechSynthesisUtterance(text)); } catch { /* demo only */ }
  };

  const push = (line) => {
    setLines(prev => [...prev, line]);
    if (line.who === "agent") say(line.text);
    if (line.who === "doc" && /plan/i.test(line.text)) {
      logRef.current?.("Voice agent", "Started plan draft from voice command");
      draftRef.current?.();
    }
  };

  const start = () => {
    clear();
    setLines([]);
    setListening(true);
    onLog?.("Voice agent", `Voice session started for ${patientName}`);
    voiceScript(patientName).forEach((line, i) => {
      timers.current.push(setTimeout(() => push(line), 900 + i * 2600));
    });
    timers.current.push(setTimeout(() => setListening(false), 900 + voiceScript(patientName).length * 2600));
  };

  const stop = () => { clear(); setListening(false); window.speechSynthesis?.cancel(); };

  const sendTyped = (e) => {
    e.preventDefault();
    if (!typed.trim()) return;
    const text = typed.trim();
    setTyped("");
    push({ who: "doc", text });
    timers.current.push(setTimeout(() => push({
      who: "agent",
      text: /plan/i.test(text) ? "Drafting a plan from your X-ray markers now. It will wait for your approval." : "Noted. I've added that to the patient's chart.",
    }), 1200));
  };

  return (
    <div className="rounded-3xl border-2 border-neutral-950 bg-neutral-950 text-white p-6 flex flex-col gap-4 min-h-[420px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-yellow-300"><Bot className="w-4 h-4" /> Anbaric voice agent</p>
          <h2 className="text-xl font-bold mt-1">Talk to the chart</h2>
          <p className="text-sm text-neutral-400">Ask for progress, dictate notes, or say "draft a plan".</p>
        </div>
        <button onClick={() => { setSpeak(s => !s); window.speechSynthesis?.cancel(); }} aria-label={speak ? "Mute agent voice" : "Unmute agent voice"}
          className="w-10 h-10 rounded-xl border border-neutral-700 grid place-items-center hover:bg-neutral-800">
          {speak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 max-h-72 pr-1">
        {lines.length === 0 && (
          <p className="text-sm text-neutral-500 italic">Press the mic to start a demo conversation about {patientName}.</p>
        )}
        {lines.map((l, i) => (
          <div key={i} className={`flex ${l.who === "doc" ? "justify-end" : "justify-start"}`}>
            <p className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${l.who === "doc" ? "bg-yellow-300 text-neutral-950" : "bg-neutral-800"}`}>{l.text}</p>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={listening ? stop : start} aria-label={listening ? "Stop listening" : "Start listening"}
          className={`relative w-14 h-14 shrink-0 rounded-full grid place-items-center border-2 ${listening ? "bg-rose-500 border-rose-300" : "bg-yellow-300 text-neutral-950 border-yellow-200"}`}>
          {listening && <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-40" />}
          {listening ? <MicOff className="w-6 h-6 relative" /> : <Mic className="w-6 h-6" />}
        </button>
        <form onSubmit={sendTyped} className="flex-1 flex gap-2">
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Or type to the agent…"
            className="flex-1 h-11 rounded-xl bg-neutral-800 border border-neutral-700 px-3 text-sm placeholder:text-neutral-500" />
          <button type="submit" aria-label="Send" className="w-11 h-11 rounded-xl bg-neutral-800 border border-neutral-700 grid place-items-center hover:bg-neutral-700"><Send className="w-4 h-4" /></button>
        </form>
      </div>
      {listening && <p className="text-xs text-rose-300 -mt-2">Listening… (demo script)</p>}
    </div>
  );
}
