import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";

// SandboxCamera: manages the camera stream and runs a model on each frame.
// When `model` is set, calls model.detect(video) per frame and reports
// results via onFrame. Draws a simple skeleton overlay from landmarks.
const SandboxCamera = forwardRef(function SandboxCamera({ model, onFrame, active }, ref) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const modelRef = useRef(model);
  const onFrameRef = useRef(onFrame);
  const activeRef = useRef(active);
  const [status, setStatus] = useState("idle"); // idle | ready | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => { modelRef.current = model; }, [model]);
  useEffect(() => { onFrameRef.current = onFrame; }, [onFrame]);
  useEffect(() => { activeRef.current = active; }, [active]);

  useImperativeHandle(ref, () => ({
    getVideo: () => videoRef.current,
  }), []);

  // Start camera once.
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        const video = videoRef.current;
        video.srcObject = stream;
        await new Promise(res => { video.onloadedmetadata = () => { video.play(); res(); }; });
        if (cancelled) return;
        setStatus("ready");
        loop();
      } catch (e) {
        setErrorMsg(e?.message || "Camera access failed.");
        setStatus("error");
      }
    }
    init();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const v = videoRef.current;
      if (v && v.srcObject) v.srcObject.getTracks().forEach(t => t.stop());
    };
  }, []);

  async function loop() {
    const video = videoRef.current;
    if (!video) return;
    const m = modelRef.current;
    if (video.readyState >= 2 && activeRef.current && m) {
      try {
        const result = await m.detect(video);
        drawOverlay(canvasRef.current, result.landmarks, video);
        onFrameRef.current?.(result);
      } catch (_) {
        // keep looping on inference errors
      }
    } else if (video.readyState >= 2) {
      drawOverlay(canvasRef.current, null, video);
    }
    rafRef.current = requestAnimationFrame(loop);
  }

  function drawOverlay(canvas, landmarks, video) {
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    if (!canvas) return;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    if (!landmarks) return;
    const mx = (x) => w - x; // mirror
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      if (!p || p.score < 0.2) continue;
      ctx.beginPath();
      ctx.arc(mx(p.x), p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(96,165,250,0.9)";
      ctx.fill();
    }
  }

  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-900 ring-1 ring-black/10 shadow-lg">
      <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {status === "idle" && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 text-white">
          <p className="text-sm">Starting camera…</p>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-900/85 text-white text-center px-6">
          <p className="text-sm font-medium">Camera unavailable</p>
          <p className="text-xs text-white/70 max-w-xs">{errorMsg}</p>
        </div>
      )}
      {status === "ready" && !model && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
          <p className="text-sm">Select a model and start a benchmark</p>
        </div>
      )}
      {status === "ready" && model && (
        <div className="absolute top-3 left-3 rounded-lg bg-black/60 text-white/90 text-xs px-2.5 py-1.5 pointer-events-none">
          {model.name}
        </div>
      )}
    </div>
  );
});

export default SandboxCamera;