import React from "react";

const WORDS = { up: "straight up", down: "folded down", bent: "curved", straight: "straight", fist: "curled tight" };
const THUMB = { out: "Thumb stretched out to the side", in: "Thumb tucked across the palm" };
const THUMB_AT = { side: "Thumb resting on the side of the index finger", T: "Thumb tucked between index and middle", N: "Thumb tucked between middle and ring", M: "Thumb tucked between ring and pinky", S: "Thumb wrapped across the front of the fingers" };
const DIR = { up: "Fingers point up", side: "Fingers point sideways", down: "Fingers point down" };

export function holdSteps(sign) {
  const out = [];
  const names = ["index", "middle", "ring", "pinky"];
  for (const n of names) {
    const s = sign.fingers?.[n] || sign.curl?.[n];
    if (s) out.push(`${n[0].toUpperCase() + n.slice(1)} finger ${WORDS[s]}`);
  }
  if (sign.thumb) out.push(THUMB[sign.thumb]);
  if (sign.thumbAt) out.push(THUMB_AT[sign.thumbAt]);
  if (sign.touch) out.push("Index fingertip touches the thumb tip");
  if (sign.thumbOnMiddle) out.push("Thumb tip presses the middle finger");
  if (sign.tipsOnThumb) out.push("Fingertips rest on the thumb");
  if (sign.crossed) out.push("Middle finger crosses over the index");
  if (sign.spread === true) out.push("Raised fingers spread apart");
  if (sign.spread === false) out.push("Raised fingers held together");
  if (sign.gap) out.push(sign.gap === "open" ? "Leave a gap between fingers and thumb" : "Close the gap between fingers and thumb");
  if (sign.dir) out.push(DIR[sign.dir]);
  if (sign.motion) out.push("Then trace the letter in the air");
  return out;
}

export default function HandHoldSteps({ sign }) {
  return (
    <ol className="space-y-1.5 text-left text-sm text-white/85">
      {holdSteps(sign).map((s, i) => (
        <li key={s} className="flex gap-2"><span className="w-5 h-5 shrink-0 rounded-full bg-white/15 grid place-items-center text-xs">{i + 1}</span>{s}</li>
      ))}
    </ol>
  );
}