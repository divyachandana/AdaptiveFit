import { useRef, useState, useCallback } from "react";
import { classifySign } from "@/lib/af/signClassifier";
import { speak } from "@/lib/af/speech";

const HOLD = 10;      // frames a letter must be held (~1s)
const RELEASE = 4;    // frames of a different/no sign before a letter can repeat
const SPACE_MS = 1800; // no hand this long = end of word

export function useSignTranslator() {
  const [text, setText] = useState("");
  const [live, setLive] = useState(null);
  const [hold, setHold] = useState(0);
  const s = useRef({ cand: null, n: 0, armed: true, off: 0, lastSeen: 0, word: "" });

  const commitWord = useCallback(() => {
    const w = s.current.word;
    if (!w) return;
    speak(w.toLowerCase(), { force: true });
    s.current.word = "";
    setText((t) => t + " ");
  }, []);

  const handlePose = useCallback((hands) => {
    const st = s.current;
    const now = Date.now();
    const letter = classifySign(hands?.[0]?.landmarks);
    if (hands?.length) st.lastSeen = now;
    else if (st.word && now - st.lastSeen > SPACE_MS) commitWord();
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
      st.word += letter;
      setText((t) => t + letter);
      speak(letter, { force: true, minGapMs: 0 });
    }
  }, [commitWord]);

  const actions = {
    space: commitWord,
    backspace: () => { s.current.word = s.current.word.slice(0, -1); setText((t) => t.slice(0, -1)); },
    clear: () => { s.current.word = ""; setText(""); },
    speakAll: () => text.trim() && speak(text.trim().toLowerCase(), { force: true, interrupt: true })
  };

  return { handlePose, text, live, hold, actions };
}