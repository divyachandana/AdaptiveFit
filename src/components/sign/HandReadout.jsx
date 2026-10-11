import React from "react";

const Row = ({ k, v }) => (
  <div className="flex justify-between py-1 border-b border-neutral-100 last:border-0">
    <span className="text-neutral-500">{k}</span><span className="font-medium text-neutral-900">{String(v)}</span>
  </div>
);

export default function HandReadout({ live }) {
  if (!live) return <p className="text-sm text-neutral-500">Show your hand to see what the camera reads.</p>;
  const r = live.reading;
  return (
    <div className="text-sm">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-5xl font-bold">{live.guess || "–"}</span>
        <span className="text-neutral-500">
          {live.match ? `matches your recording (distance ${live.match.distance.toFixed(2)})` : "from built-in rules"}
        </span>
      </div>
      {Object.keys(r.fingers).map((f) => <Row key={f} k={f} v={`${r.fingers[f]} · ${r.curl[f]}`} />)}
      <Row k="thumb" v={`${r.thumb} · ${r.thumbAt}`} />
      <Row k="pointing" v={r.dir} />
      <Row k="spread / crossed" v={`${r.spread} / ${r.crossed}`} />
    </div>
  );
}