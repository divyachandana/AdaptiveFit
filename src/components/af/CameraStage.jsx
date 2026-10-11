import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { extractHandLandmarks, HAND_CONNECTIONS, FINGER_TIP_INDEX } from "@/lib/af/handUtils";

// Vision model loaded from CDN (see index.html). MediaPipe Hands detects
// 21 landmarks per hand — enough to track individual finger extension.
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

// CameraStage: the vision-model surface. Streams getUserMedia into a video
// element, runs MediaPipe Hands on a throttled rAF loop, draws the detected
// hand skeleton on a canvas overlay, and highlights the finger the coaching
// layer is currently correcting.
const CameraStage = forwardRef(function CameraStage({ onPose, highlight, active }, ref) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const lastInferRef = useRef(0);
  const highlightRef = useRef(highlight);
  const onPoseRef = useRef(onPose);
  const activeRef = useRef(active);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => { highlightRef.current = highlight; }, [highlight]);
  useEffect(() => { onPoseRef.current = onPose; }, [onPose]);
  useEffect(() => { activeRef.current = active; }, [active]);

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
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        hands.onResults((results) => {
          if (cancelled) return;
          const v = videoRef.current;
          const c = canvasRef.current;
          if (!v || !c) return;
          const landmarks = extractHandLandmarks(results, v.videoWidth || 640, v.videoHeight || 480);
          drawOverlay(c, landmarks, highlightRef.current);
          onPoseRef.current?.(landmarks);
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

  function drawOverlay(canvas, landmarks, hl) {
    const v = videoRef.current;
    const w = v?.videoWidth || 640, h = v?.videoHeight || 480;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    if (!landmarks) return;
    const mx = (x) => w - x; // mirror because video is mirrored on display
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(96,165,250,0.9)";
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
      ctx.fillStyle = isHL ? "#fbbf24" : "rgba(255,255,255,0.95)";
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
        <div className="absolute top-3 left-3 rounded-lg bg-black/50 text-white/90 text-xs px-2.5 py-1.5 pointer-events-none">
          Hold your hand in front of the camera
        </div>
      )}
    </div>
  );
});

export default CameraStage;