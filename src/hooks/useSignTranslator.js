import { useRef, useState, useCallback } from "react";
import { classifySign } from "@/lib/af/signClassifier";
import { SIGNS, readHand, motionProgress } from "@/lib/af/signs";
import { speak } from "@/lib/af/speech";

const HOLD = 10;      // frames a letter must be held (~1s)
const RELEASE = 4;    // frames of a different/no sign before a letter can repeat
const SPACE_MS = 1800; // no hand this long = end of word
const TRAIL = 24;     // fingertip points kept for motion letters

const J = SIGNS.find((x) => x.letter === "J");
const Z = SIGNS.find((x) => x.letter === "Z");
const shapeOf = (f) =>
  f.index === "down" && f.middle === "down" && f.ring === "down" && f.pinky === "up" ? J :
  f.index === "up" && f.middle === "down" && f.ring === "down" && f.pinky === "down" ? Z : null;

export function useSignTranslator() {
  const [text, setText] = useState("");
  const [words, setWords] = useState([]);
  const [live, setLive] = useState(null);
  const [hold, setHold] = useState(0);
  const s = useRef({ cand: null, n: 0, armed: true, off: 0, lastSeen: 0, word: "", trail: [], motion: null, motionAt: 0 });

  const commitWord = useCallback((override) => {
    const w = (override || s.current.word).toUpperCase();
    if (!w) return;
    speak(w.toLowerCase(), { force: true, interrupt: true });
    s.current.word = "";
    setWords((ws) => [...ws, w]);
    setText((t) => t + " ");
  }, []);

  const addLetter = useCallback((letter, replaceLast) => {
    const st = s.current;
    if (replaceLast) st.word = st.word.slice(0, -1);
    st.word += letter;
    setText((t) => (replaceLast ? t.slice(0, -1) : t) + letter);
    speak(letter, { force: true, minGapMs: 0 });
  }, []);

  const trackMotion = useCallback((lm) => {
    const st = s.current;
    const sign = shapeOf(readHand(lm).fingers);
    if (!sign) { st.trail = []; st.motion = null; return null; }
    if (st.motion !== sign) { st.trail = []; st.motion = sign; }
    const p = lm[sign.motion.tip];
    st.trail = [...st.trail, { x: p.x, y: p.y }].slice(-TRAIL);
    const palm = Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y);
    if (Date.now() - st.motionAt > 1500 && motionProgress(sign, st.trail, palm) >= 1) {
      st.motionAt = Date.now();
      st.trail = [];
      return sign.letter;
    }
    return null;
  }, []);

  const handlePose = useCallback((hands) => {
    const st = s.current;
    const now = Date.now();
    const lm = hands?.[0]?.landmarks;
    if (hands?.length) st.lastSeen = now;
    else if (st.word && now - st.lastSeen > SPACE_MS) commitWord();

    // Motion letters: a traced J/Z replaces the I/static letter typed while holding the shape.
    const moved = lm ? trackMotion(lm) : null;
    if (moved) {
      const last = st.word.slice(-1);
      addLetter(moved, !st.armed && (last === "I" || last === "D" || last === "L" || last === "Z" || last === "J"));
      st.armed = false; st.n = HOLD;
      setLive(moved);
      return;
    }

    const letter = classifySign(lm, hands?.[0]?.handedness);
    setLive(letter);
    if (!letter || letter !== st.cand) {
      st.off += 1;
      if (st.off >= RELEASE) st.armed = true;
      st.cand = letter; st.n = letter ? 1 : 0;
      setHold(0);
      return;
    }
    st.off = 0;
    st.n += 1;
    setHold(st.armed ? Math.min(st.n / HOLD, 1) : 0);
    if (st.armed && st.n >= HOLD) {
      st.armed = false;
      addLetter(letter);
    }
  }, [commitWord, trackMotion, addLetter]);

  const actions = {
    space: () => commitWord(),
    complete: (w) => {
      const rest = w.toUpperCase().slice(s.current.word.length);
      setText((t) => t + rest);
      commitWord(w);
    },
    backspace: () => { s.current.word = s.current.word.slice(0, -1); setText((t) => t.slice(0, -1)); },
    clear: () => { s.current.word = ""; setText(""); setWords([]); },
    speakAll: () => text.trim() && speak(text.trim().toLowerCase(), { force: true, interrupt: true })
  };

  const currentWord = text.split(" ").pop() || "";
  return { handlePose, text, words, currentWord, live, hold, actions };
}