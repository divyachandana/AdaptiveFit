import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { extractKeypoints } from "@/lib/af/poseUtils";

// Vision model loaded from CDN (see index.html). Avoids bundling the large
// TF.js + MoveNet packages, so the app shell renders instantly.
function waitForVisionGlobals(timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function check() {
      if (window.tf && window.poseDetection) return resolve({ tf: window.tf, poseDetection: window.poseDetection });
      if (Date.now() - start > timeoutMs) return reject(new Error("Vision model failed to load. Check your connection."));
      setTimeout(check, 120);
    })();
  });
}

// CameraStage: the vision-model surface. Streams getUserMedia into a hidden
// video element, runs MoveNet (lightning) on a throttled rAF loop, draws the
// detected upper-body skeleton on a canvas overlay, and highlights the body
// part the reasoning layer is currently correcting.
const CONNECTIONS = [
  ["leftShoulder", "rightShoulder"],
  ["leftShoulder", "leftElbow"], ["leftElbow", "leftWrist"],
  ["rightShoulder", "rightElbow"], ["rightElbow", "rightWrist"],
  ["leftShoulder", "leftHip"], ["rightShoulder", "rightHip"],
  ["nose", "leftEye"], ["nose", "rightEye"],
  ["leftEye", "leftEar"], ["rightEye", "rightEar"]
];

const HIGHLIGHT_COLORS = {
  left: "#34d399", right: "#34d399", shoulders: "#fbbf24",
  spine: "#f87171", default: "#60a5fa"
};

const CameraStage = forwardRef(function CameraStage({ onPose, highlight, active }, ref) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const lastInferRef = useRef(0);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");

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

        const { tf, poseDetection } = await waitForVisionGlobals();
        await tf.setBackend("webgl");
        await tf.ready();
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );
        if (cancelled) { detector.dispose(); return; }
        detectorRef.current = detector;
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
      if (detectorRef.current) { try { detectorRef.current.dispose(); } catch (_) {} detectorRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loop() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const detector = detectorRef.current;
    if (!video || !canvas || !detector) return;
    if (video.readyState >= 2 && active) {
      const now = performance.now();
      if (now - lastInferRef.current > 90) { // ~11fps inference
        lastInferRef.current = now;
        try {
          const poses = await detector.estimatePoses(video, { flipHorizontal: true });
          drawOverlay(video, canvas, poses);
          if (poses && poses[0]) onPose(poses[0]);
          else onPose(null);
        } catch (_) { /* keep looping on a bad frame */ }
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }

  function drawOverlay(video, canvas, poses) {
    const w = video.videoWidth || 640, h = video.videoHeight || 480;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    const pose = poses && poses[0];
    if (!pose) return;
    const k = extractKeypoints(pose, 0.3);
    // mirror x because video is mirrored on display
    const mx = (x) => w - x;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(96,165,250,0.9)";
    for (const [a, b] of CONNECTIONS) {
      const pa = k[a], pb = k[b];
      if (pa && pb) {
        ctx.beginPath();
        ctx.moveTo(mx(pa.x), pa.y);
        ctx.lineTo(mx(pb.x), pb.y);
        ctx.stroke();
      }
    }
    const hl = highlight?.part;
    const hlColor = HIGHLIGHT_COLORS[hl] || HIGHLIGHT_COLORS.default;
    for (const name of Object.keys(k)) {
      const p = k[name];
      if (!p) continue;
      const isHL = hl && (hl === "shoulders" && (name === "leftShoulder" || name === "rightShoulder")
        || hl === "spine" && (name === "nose" || name === "leftShoulder" || name === "rightShoulder")
        || (hl === "left" && name.startsWith("left"))
        || (hl === "right" && name.startsWith("right")));
      ctx.beginPath();
      ctx.arc(mx(p.x), p.y, isHL ? 9 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isHL ? hlColor : "rgba(255,255,255,0.95)";
      ctx.fill();
      if (isHL) {
        ctx.beginPath();
        ctx.arc(mx(p.x), p.y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = hlColor;
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
          <p className="text-sm">Loading the vision model…</p>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-900/85 text-white text-center px-6">
          <p className="text-sm font-medium">Camera unavailable</p>
          <p className="text-xs text-white/70 max-w-xs">{errorMsg}</p>
        </div>
      )}
    </div>
  );
});

export default CameraStage;