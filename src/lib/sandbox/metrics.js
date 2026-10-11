// Metrics collector — inspired by RalphMeter's benchmark comparison engine.
// Tracks per-model inference timing, confidence, landmark coverage, and stability.
// Each metric is collected per-frame and summarized into a comparable score.

export function createMetricsCollector(modelName) {
  return {
    name: modelName,
    loadTimeMs: null,
    inferenceTimes: [],
    confidences: [],
    landmarkCounts: [],
    jitterSamples: [],
    frameCount: 0,
    errorCount: 0,
    _lastLandmarks: null,

    recordLoad(ms) {
      this.loadTimeMs = Math.round(ms);
    },

    recordFrame(inferenceMs, confidence, landmarks) {
      this.inferenceTimes.push(inferenceMs);
      this.confidences.push(confidence);
      const count = landmarks ? landmarks.length : 0;
      this.landmarkCounts.push(count);

      // Stability: frame-to-frame landmark displacement (jitter).
      // Lower jitter = more stable tracking.
      if (this._lastLandmarks && landmarks) {
        let totalDelta = 0;
        let pairs = 0;
        const minLen = Math.min(landmarks.length, this._lastLandmarks.length);
        for (let i = 0; i < minLen; i++) {
          const a = landmarks[i];
          const b = this._lastLandmarks[i];
          if (a && b && a.score > 0.3 && b.score > 0.3) {
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            totalDelta += Math.sqrt(dx * dx + dy * dy);
            pairs++;
          }
        }
        if (pairs > 0) this.jitterSamples.push(totalDelta / pairs);
      }
      this._lastLandmarks = landmarks;
      this.frameCount++;
    },

    recordError() {
      this.errorCount++;
    },

    summary() {
      const times = this.inferenceTimes;
      const sorted = [...times].sort((a, b) => a - b);
      const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
      const p50 = sorted.length ? sorted[Math.floor(sorted.length * 0.5)] : 0;
      const p95 = sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] : 0;
      const avgConf = this.confidences.length
        ? this.confidences.reduce((a, b) => a + b, 0) / this.confidences.length
        : 0;
      const avgLM = this.landmarkCounts.length
        ? this.landmarkCounts.reduce((a, b) => a + b, 0) / this.landmarkCounts.length
        : 0;
      const avgJitter = this.jitterSamples.length
        ? this.jitterSamples.reduce((a, b) => a + b, 0) / this.jitterSamples.length
        : 0;

      return {
        name: this.name,
        loadTimeMs: this.loadTimeMs,
        frameCount: this.frameCount,
        avgInferenceMs: round2(avg),
        p50Ms: round2(p50),
        p95Ms: round2(p95),
        effectiveFPS: avg > 0 ? round1(1000 / avg) : 0,
        avgConfidence: round3(avgConf),
        avgLandmarks: round1(avgLM),
        // Stability: 1 - normalized jitter (0 = very jittery, 1 = very stable)
        stabilityScore: round2(Math.max(0, 1 - Math.min(avgJitter * 20, 1))),
        errorRate: this.frameCount > 0 ? round3(this.errorCount / this.frameCount) : 0,
      };
    },

    reset() {
      this.loadTimeMs = null;
      this.inferenceTimes = [];
      this.confidences = [];
      this.landmarkCounts = [];
      this.jitterSamples = [];
      this.frameCount = 0;
      this.errorCount = 0;
      this._lastLandmarks = null;
    },
  };
}

function round2(n) { return Math.round(n * 100) / 100; }
function round3(n) { return Math.round(n * 1000) / 1000; }
function round1(n) { return Math.round(n * 10) / 10; }