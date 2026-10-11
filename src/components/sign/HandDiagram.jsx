import React from "react";

// Schematic palm-facing hand drawn from a sign's constraints.
const FINGERS = [
  { name: "index", x: 38, len: 52 }, { name: "middle", x: 52, len: 58 },
  { name: "ring", x: 66, len: 54 }, { name: "pinky", x: 80, len: 42 }
];

function state(sign, name) {
  const c = sign.curl?.[name];
  if (c === "bent") return "bent";
  if (c === "fist") return "down";
  return sign.fingers?.[name] || (c === "straight" ? "up" : "down");
}

export default function HandDiagram({ sign }) {
  const rot = sign.dir === "side" ? -90 : sign.dir === "down" ? 180 : 0;
  const spread = sign.spread ? 5 : 0;
  const thumbOut = sign.thumb === "out" || sign.gap === "open";
  return (
    <svg viewBox="0 0 120 170" className="w-28 h-40 mx-auto" style={{ transform: `rotate(${rot}deg)` }}>
      <g fill="#fde7d4" stroke="#1f1f1f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {FINGERS.map((f, i) => {
          const s = state(sign, f.name);
          const x = f.x + (i - 1.5) * spread;
          if (s === "up") return <rect key={f.name} x={x - 6} y={98 - f.len} width="12" height={f.len + 6} rx="6" />;
          if (s === "bent") return <path key={f.name} d={`M${x - 6} 100 L${x - 6} ${80} Q${x} ${66} ${x + 8} ${78}`} fill="none" strokeWidth="12" stroke="#fde7d4" />;
          return <rect key={f.name} x={x - 6} y="88" width="12" height="18" rx="6" />;
        })}
        <rect x="28" y="92" width="64" height="62" rx="16" />
        {FINGERS.map((f, i) => state(sign, f.name) === "down" && (
          <line key={f.name} x1={f.x + (i - 1.5) * spread - 5} y1="104" x2={f.x + (i - 1.5) * spread + 5} y2="104" />
        ))}
        {thumbOut
          ? <rect x="2" y="104" width="34" height="13" rx="6.5" transform="rotate(-35 30 112)" />
          : <rect x="30" y="110" width="40" height="13" rx="6.5" transform="rotate(-10 30 116)" />}
      </g>
      {sign.touch && <circle cx="34" cy="96" r="5" fill="#f59e0b" />}
    </svg>
  );
}