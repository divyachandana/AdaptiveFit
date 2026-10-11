import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { extractHands, HAND_CONNECTIONS, FINGER_TIP_INDEX } from "@/lib/af/handUtils";

// Vision model loaded from CDN (see index.html). MediaPipe Hands detects
// 21 landmarks per hand — enough to track individual finger extension.
// Tracks 1 or 2 hands based on the `side` prop ("left" | "right" | "both").
function waitForHandGlobals(timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function check() {
      if (window.Hands) return resolve(window.Hands);
      if (Date.now() - start > timeoutMs) return reject(new Error("Hand model failed to load. Check your connection."));
      setTimeout(check, 120);
    })();
  });
}

const CameraStage = forwardRef(function CameraStage({ onPose, highlight, active, briefing, repCount, targetReps, side = "both" }, ref) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const lastInferRef = useRef(0);
  const highlightRef = useRef(highlight);
  const onPoseRef = useRef(onPose);
  const activeRef = useRef(active);
  const sideRef = useRef(side);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => { highlightRef.current = highlight; }, [highlight]);
  useEffect(() => { onPoseRef.current = onPose; }, [onPose]);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { sideRef.current = side; }, [side]);

  useImperativeHandle(ref, () => ({
    restart: () => { lastInferRef.current = 0; }
  }), []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setStatus("loading");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        const video = videoRef.current;
        video.srcObject = stream;
        await new Promise(res => { video.onloadedmetadata = () => { video.play(); res(); }; });

        const Hands = await waitForHandGlobals();
        const hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
        });
        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 0,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        hands.onResults((results) => {
          if (cancelled) return;
          const v = videoRef.current;
          const c = canvasRef.current;
          if (!v || !c) return;
          const detected = extractHands(results, v.videoWidth || 640, v.videoHeight || 480, sideRef.current);
          drawOverlay(c, detected, highlightRef.current);
          onPoseRef.current?.(detected);
        });
        if (cancelled) return;
        detectorRef.current = hands;
        setStatus("ready");
        loop();
      } catch (e) {
        setErrorMsg(e?.message || "Camera access failed. Allow camera permission to start coaching.");
        setStatus("error");
      }
    }
    init();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const v = videoRef.current;
      if (v && v.srcObject) v.srcObject.getTracks().forEach(t => t.stop());
      if (detectorRef.current) { try { detectorRef.current.close(); } catch (_) {} detectorRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loop() {
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector) return;
    if (video.readyState >= 2 && activeRef.current) {
      const now = performance.now();
      if (now - lastInferRef.current > 90) {
        lastInferRef.current = now;
        try { await detector.send({ image: video }); } catch (_) { /* keep looping */ }
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }

  function drawOverlay(canvas, hands, hl) {
    const v = videoRef.current;
    const w = v?.videoWidth || 640, h = v?.videoHeight || 480;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    if (!hands || !hands.length) return;
    const mx = (x) => w - x; // mirror because video is mirrored on display
    for (const hand of hands) {
      const landmarks = hand.landmarks;
      const isLeft = hand.handedness === "Left";
      // Left hand = sky blue, right hand = emerald green
      const lineColor = isLeft ? "rgba(56,189,248,0.9)" : "rgba(52,211,153,0.9)";
      const dotColor = isLeft ? "rgba(125,211,252,0.95)" : "rgba(110,231,183,0.95)";
      ctx.lineWidth = 4;
      ctx.strokeStyle = lineColor;
      for (const [a, b] of HAND_CONNECTIONS) {
        const pa = landmarks[a], pb = landmarks[b];
        if (pa && pb) {
          ctx.beginPath();
          ctx.moveTo(mx(pa.x), pa.y);
          ctx.lineTo(mx(pb.x), pb.y);
          ctx.stroke();
        }
      }
      const hlIdx = hl?.part ? FINGER_TIP_INDEX[hl.part] : null;
      for (let i = 0; i < landmarks.length; i++) {
        const p = landmarks[i];
        if (!p) continue;
        const isHL = i === hlIdx;
        ctx.beginPath();
        ctx.arc(mx(p.x), p.y, isHL ? 9 : 5, 0, Math.PI * 2);
        ctx.fillStyle = isHL ? "#fbbf24" : dotColor;
        ctx.fill();
        if (isHL) {
          ctx.beginPath();
          ctx.arc(mx(p.x), p.y, 14, 0, Math.PI * 2);
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }
  }

  const sideLabel = side === "left" ? "Left hand" : side === "right" ? "Right hand" : "Both hands";

  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-900 ring-1 ring-black/10 shadow-lg">
      <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-900/70 text-white">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-sm">Loading the hand model…</p>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-900/85 text-white text-center px-6">
          <p className="text-sm font-medium">Camera unavailable</p>
          <p className="text-xs text-white/70 max-w-xs">{errorMsg}</p>
        </div>
      )}
      {status === "ready" && (
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          <span className="rounded-lg bg-black/50 text-white/90 text-xs px-2.5 py-1.5">
            {briefing ? "Listen to the instructions…" : sideLabel}
          </span>
          {side === "both" && (
            <div className="flex items-center gap-3 rounded-lg bg-black/50 text-white/90 text-xs px-2.5 py-1.5">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" />Left</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />Right</span>
            </div>
          )}
        </div>
      )}
      {repCount != null && (
        <div className="absolute top-3 right-3 flex flex-col items-center rounded-2xl bg-black/70 backdrop-blur-sm ring-1 ring-white/15 text-white px-3.5 py-2.5 pointer-events-none shadow-lg">
          <div className="text-4xl font-bold tabular-nums leading-none drop-shadow">{repCount}</div>
          <div className="text-[10px] uppercase tracking-wide text-white/60 mt-1.5">/ {targetReps || 3}</div>
        </div>
      )}
    </div>
  );
});

export default CameraStage;