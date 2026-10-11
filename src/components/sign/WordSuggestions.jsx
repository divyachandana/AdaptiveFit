import React from "react";
import { suggestWords } from "@/lib/af/words";

export default function WordSuggestions({ prefix, words, onPick }) {
  const suggestions = suggestWords(prefix);
  return (
    <div className="space-y-3">
      {suggestions.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Tap to finish the word</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((w) => (
              <button key={w} onClick={() => onPick(w)} className="h-12 px-5 rounded-xl bg-emerald-100 text-emerald-900 text-lg font-semibold">
                {w}
              </button>
            ))}
          </div>
        </div>
      )}
      {words.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Words spelled</p>
          <div className="flex flex-wrap gap-2">
            {words.map((w, i) => (
              <span key={i} className="px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-800 font-medium">{w.toLowerCase()}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}