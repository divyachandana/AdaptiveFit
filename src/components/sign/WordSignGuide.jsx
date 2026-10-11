import React from "react";
import { WORD_SIGNS } from "@/lib/af/wordSigns";

export default function WordSignGuide() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-sm font-semibold text-neutral-900 mb-3">Whole-word signs</p>
      <ul className="space-y-2">
        {WORD_SIGNS.map((w) => (
          <li key={w.word} className="text-sm">
            <span className="font-semibold text-neutral-900">{w.word}</span>
            <span className="text-neutral-600"> · {w.tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}