import React, { useRef, useState } from "react";
import { Upload, X, MousePointerClick, ImageIcon } from "lucide-react";
import { REGIONS, SEVERITY } from "@/lib/af/carePlanMock";

// Therapist uploads an X-ray, clicks to drop numbered markers on problem areas,
// then tags each marker with a region, severity and a note.
// Images stay in the browser (object URLs); nothing is uploaded yet.
export default function XrayAnnotator({ images, setImages, marks, setMarks, onLog }) {
  const inputRef = useRef(null);
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);

  const addFiles = (files) => {
    const list = Array.from(files || []).filter(f => f.type.startsWith("image/"));
    if (!list.length) return;
    const next = list.map(f => ({ name: f.name, url: URL.createObjectURL(f) }));
    setImages(prev => [...prev, ...next]);
    setActive(images.length);
    list.forEach(f => onLog?.("Therapist", `Uploaded X-ray "${f.name}"`));
  };

  const removeImage = (i) => {
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setMarks(prev => prev.filter(m => m.image !== i).map(m => (m.image > i ? { ...m, image: m.image - 1 } : m)));
    setActive(0);
  };

  const onImageClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const n = (marks.reduce((max, m) => Math.max(max, m.n), 0) || 0) + 1;
    setMarks(prev => [...prev, { n, image: active, x, y, region: "fingers", severity: "moderate", note: "" }]);
    onLog?.("Therapist", `Marked area #${n} on X-ray`);
  };

  const update = (n, patch) => setMarks(prev => prev.map(m => (m.n === n ? { ...m, ...patch } : m)));
  const remove = (n) => setMarks(prev => prev.filter(m => m.n !== n));
  const img = images[active];
  const shown = marks.filter(m => m.image === active);

  return (
    <div className="rounded-3xl border-2 border-neutral-950 bg-white p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">X-ray review</h2>
          <p className="text-sm text-neutral-600">Upload imaging, then click to mark the areas that need work.</p>
        </div>
        <button onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border-2 border-neutral-950 font-semibold bg-yellow-300 hover:bg-yellow-400">
          <Upload className="w-4 h-4" /> Upload X-ray
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((im, i) => (
            <div key={im.url} className="relative shrink-0">
              <button onClick={() => setActive(i)}
                className={`w-20 h-20 rounded-xl overflow-hidden border-2 ${i === active ? "border-neutral-950" : "border-neutral-300"}`}>
                <img src={im.url} alt={im.name} className="w-full h-full object-cover" />
              </button>
              <button onClick={() => removeImage(i)} aria-label="Remove image"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-neutral-950 text-white grid place-items-center"><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      )}

      {img ? (
        <div className="relative rounded-2xl overflow-hidden bg-neutral-950 cursor-crosshair select-none" onClick={onImageClick}>
          <img src={img.url} alt={img.name} className="w-full max-h-[480px] object-contain" draggable={false} />
          {shown.map(m => {
            const sev = SEVERITY.find(s => s.id === m.severity);
            return (
              <span key={m.n} style={{ left: `${m.x}%`, top: `${m.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-neutral-950 ${sev?.color} font-bold text-sm grid place-items-center shadow-lg`}>
                {m.n}
              </span>
            );
          })}
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 text-xs font-semibold bg-white/90 rounded-lg px-2 py-1">
            <MousePointerClick className="w-3.5 h-3.5" /> Click to add a marker
          </span>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          className={`w-full h-56 rounded-2xl border-2 border-dashed grid place-items-center text-neutral-600 ${dragging ? "border-neutral-950 bg-yellow-50" : "border-neutral-400 bg-neutral-50"}`}>
          <span className="flex flex-col items-center gap-2">
            <ImageIcon className="w-8 h-8" />
            <span className="font-semibold">Drop X-ray images here</span>
            <span className="text-xs">PNG or JPG · stays on this device in the demo</span>
          </span>
        </button>
      )}

      {marks.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Findings ({marks.length})</p>
          {marks.map(m => (
            <div key={m.n} className="grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_11rem_9rem_1fr_auto] gap-2 items-center rounded-2xl bg-neutral-100 p-2">
              <span className={`w-8 h-8 rounded-full border-2 border-neutral-950 grid place-items-center font-bold text-sm ${SEVERITY.find(s => s.id === m.severity)?.color}`}>{m.n}</span>
              <select value={m.region} onChange={(e) => update(m.n, { region: e.target.value })}
                className="h-10 rounded-lg border-2 border-neutral-950 bg-white px-2 text-sm font-medium">
                {REGIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              <select value={m.severity} onChange={(e) => update(m.n, { severity: e.target.value })}
                className="h-10 rounded-lg border-2 border-neutral-950 bg-white px-2 text-sm font-medium col-start-2 sm:col-start-auto">
                {SEVERITY.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <input value={m.note} onChange={(e) => update(m.n, { note: e.target.value })} placeholder="Note, e.g. joint space narrowing"
                className="h-10 rounded-lg border-2 border-neutral-950 bg-white px-3 text-sm col-span-2 sm:col-span-1 col-start-2 sm:col-start-auto" />
              <button onClick={() => remove(m.n)} aria-label={`Remove marker ${m.n}`}
                className="w-9 h-9 rounded-lg hover:bg-neutral-200 grid place-items-center row-start-1 col-start-3 sm:row-start-auto sm:col-start-auto"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
