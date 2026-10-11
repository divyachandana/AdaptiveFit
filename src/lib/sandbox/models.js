// Model loaders — each returns Result<Model, Error> (from RalphMeter pattern).
// A Model is: { id, name, type, landmarkCount, loadTimeMs, detect(video), close() }
// detect(video) returns { landmarks, confidence, inferenceMs }

import { ok, err } from './result';

// ─── MoveNet Lightning (TensorFlow.js, 17 body keypoints) ───
// Loaded from CDN to avoid a build-time dependency on @mediapipe/pose
// (which @tensorflow-models/pose-detection imports statically even
// when only MoveNet is used).
export async function loadMoveNet() {
  try {
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js');
    const tf = window.tf;
    const poseDetection = window.poseDetection;
    await tf.ready();
    const start = performance.now();
    const detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
    );
    const loadTimeMs = performance.now() - start;
    return ok({
      id: 'movenet',
      name: 'MoveNet Lightning',
      type: 'full-body',
      landmarkCount: 17,
      loadTimeMs,
      async detect(video) {
        const t0 = performance.now();
        const poses = await detector.estimatePoses(video, { maxPoses: 1, flipHorizontal: false });
        const inferenceMs = performance.now() - t0;
        if (!poses.length) return { landmarks: null, confidence: 0, inferenceMs };
        const kp = poses[0].keypoints;
        const landmarks = kp.map(p => ({ x: p.x, y: p.y, score: p.score ?? 0 }));
        const conf = kp.reduce((a, p) => a + (p.score || 0), 0) / kp.length;
        return { landmarks, confidence: conf, inferenceMs };
      },
      close() { try { detector.dispose(); } catch (_) {} },
    });
  } catch (e) {
    return err(e);
  }
}

// ─── MediaPipe Hands (CDN, 21 hand landmarks) ───
export async function loadHands() {
  try {
    await waitForGlobal('Hands', 15000);
    const start = performance.now();
    const hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    let resolveResult = null;
    hands.onResults((results) => {
      if (resolveResult) {
        const r = resolveResult;
        resolveResult = null;
        r(results);
      }
    });

    const loadTimeMs = performance.now() - start;
    return ok({
      id: 'hands',
      name: 'MediaPipe Hands',
      type: 'hands',
      landmarkCount: 21,
      loadTimeMs,
      async detect(video) {
        const t0 = performance.now();
        const results = await new Promise((resolve) => {
          resolveResult = resolve;
          hands.send({ image: video });
        });
        const inferenceMs = performance.now() - t0;
        const lms = results?.multiHandLandmarks?.[0];
        if (!lms) return { landmarks: null, confidence: 0, inferenceMs };
        const landmarks = lms.map(p => ({ x: p.x, y: p.y, score: p.visibility ?? 1 }));
        return { landmarks, confidence: 1, inferenceMs };
      },
      close() { try { hands.close(); } catch (_) {} },
    });
  } catch (e) {
    return err(e);
  }
}

// ─── MediaPipe Pose Landmarker Lite (Tasks Vision, 33 body landmarks) ───
export async function loadPoseLandmarker() {
  try {
    const vision = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
    const start = performance.now();
    const fileset = await vision.FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );
    const landmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
    });
    const loadTimeMs = performance.now() - start;
    return ok({
      id: 'pose-landmarker',
      name: 'Pose Landmarker Lite',
      type: 'full-body',
      landmarkCount: 33,
      loadTimeMs,
      async detect(video) {
        const t0 = performance.now();
        const results = landmarker.detectForVideo(video, t0);
        const inferenceMs = performance.now() - t0;
        const lms = results?.landmarks?.[0];
        if (!lms) return { landmarks: null, confidence: 0, inferenceMs };
        const landmarks = lms.map(p => ({ x: p.x, y: p.y, score: p.visibility ?? 1 }));
        const conf = landmarks.reduce((a, p) => a + (p.score || 0), 0) / landmarks.length;
        return { landmarks, confidence: conf, inferenceMs };
      },
      close() { try { landmarker.close(); } catch (_) {} },
    });
  } catch (e) {
    return err(e);
  }
}

// ─── MediaPipe Hand Landmarker (Tasks Vision, 21 hand landmarks) ───
// Google's current Tasks Vision hand landmarker — the successor to the
// legacy MediaPipe Hands solution. Uses the same wasm runtime as the
// Pose Landmarker for direct comparison.
export async function loadHandLandmarker() {
  try {
    const vision = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
    const start = performance.now();
    const fileset = await vision.FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );
    const landmarker = await vision.HandLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 1,
    });
    const loadTimeMs = performance.now() - start;
    return ok({
      id: 'hand-landmarker',
      name: 'Hand Landmarker (Tasks Vision)',
      type: 'hands',
      landmarkCount: 21,
      loadTimeMs,
      async detect(video) {
        const t0 = performance.now();
        const results = landmarker.detectForVideo(video, t0);
        const inferenceMs = performance.now() - t0;
        const lms = results?.landmarks?.[0];
        if (!lms) return { landmarks: null, confidence: 0, inferenceMs };
        const landmarks = lms.map(p => ({ x: p.x, y: p.y, score: p.visibility ?? 1 }));
        return { landmarks, confidence: 1, inferenceMs };
      },
      close() { try { landmarker.close(); } catch (_) {} },
    });
  } catch (e) {
    return err(e);
  }
}

// ─── Registry ───
export const MODEL_REGISTRY = [
  { id: 'movenet', name: 'MoveNet Lightning', type: 'full-body', landmarks: 17, load: loadMoveNet },
  { id: 'hands', name: 'MediaPipe Hands (Legacy)', type: 'hands', landmarks: 21, load: loadHands },
  { id: 'hand-landmarker', name: 'Hand Landmarker (Tasks Vision)', type: 'hands', landmarks: 21, load: loadHandLandmarker },
  { id: 'pose-landmarker', name: 'Pose Landmarker Lite', type: 'full-body', landmarks: 33, load: loadPoseLandmarker },
];

// ─── Model cache — avoids redundant CDN loads when switching between
// models during benchmarking or when the router falls back. ───
const modelCache = new Map();

export async function loadModel(id) {
  if (modelCache.has(id)) return modelCache.get(id);
  const entry = MODEL_REGISTRY.find(m => m.id === id);
  if (!entry) return err(new Error(`Unknown model: ${id}`));
  const result = await entry.load();
  if (result.ok) modelCache.set(id, result);
  return result;
}

export function clearModelCache() {
  for (const model of modelCache.values()) {
    if (model && typeof model.close === 'function') {
      try { model.close(); } catch (_) {}
    }
  }
  modelCache.clear();
}

export function isModelCached(id) {
  return modelCache.has(id);
}

function waitForGlobal(name, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function check() {
      if (window[name]) return resolve(window[name]);
      if (Date.now() - start > timeoutMs) return reject(new Error(`${name} not loaded from CDN`));
      setTimeout(check, 120);
    })();
  });
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.crossOrigin = 'anonymous';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}