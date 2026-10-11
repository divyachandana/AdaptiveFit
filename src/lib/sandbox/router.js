// Model router — inspired by Route.X's piece-based composition model.
// Given an exercise type and measured metrics, recommends the best model
// with a transparent, weighted scoring breakdown, and provides a fallback
// chain so the app degrades gracefully when the top model fails.

// Configurable weight profiles per tracking category.
// Load time is now a factor — models that initialize faster improve UX.
export const WEIGHT_PROFILES = {
  hand: { speed: 0.35, confidence: 0.30, stability: 0.20, loadTime: 0.15 },
  pose: { speed: 0.40, confidence: 0.30, stability: 0.20, loadTime: 0.10 },
  default: { speed: 0.35, confidence: 0.35, stability: 0.20, loadTime: 0.10 },
};

function getWeights(trackingCategory) {
  return WEIGHT_PROFILES[trackingCategory] || WEIGHT_PROFILES.default;
}

// Minimum confidence threshold — models below this are penalized.
const MIN_CONFIDENCE = 0.3;

export function routeModel(trackingCategory, metricsByModel) {
  const entries = Object.entries(metricsByModel).filter(([, m]) => m && m.frameCount > 0);
  if (!entries.length) {
    return { recommendation: null, reason: 'No benchmark data yet. Run a benchmark first.' };
  }

  const isHandExercise = trackingCategory === 'hand';
  const weights = getWeights(trackingCategory);

  // Filter to models eligible for this exercise category.
  const eligible = isHandExercise
    ? entries.filter(([id]) => id === 'hands' || id === 'hand-landmarker')
    : entries.filter(([id]) => id !== 'hands' && id !== 'hand-landmarker');

  if (!eligible.length) {
    return {
      recommendation: null,
      reason: isHandExercise
        ? 'No hand-tracking model was benchmarked. Load a hand model and run a benchmark.'
        : 'No full-body model was benchmarked. Load MoveNet or Pose Landmarker and run a benchmark.',
    };
  }

  // Score each model: weighted combination of speed, confidence, stability, and load time.
  const scored = eligible.map(([id, m]) => {
    const speedScore = m.avgInferenceMs > 0 ? Math.min(100, 1000 / m.avgInferenceMs) : 0;
    const confScore = (m.avgConfidence || 0) * 100;
    const stabScore = (m.stabilityScore || 0) * 100;
    // Load time score: 500ms = 100, 5000ms+ = 0 (linear scale, clamped).
    const loadScore = m.loadTimeMs != null
      ? Math.max(0, Math.min(100, 100 - (m.loadTimeMs - 500) / 45))
      : 50;

    // Penalize models below the minimum confidence threshold.
    const confPenalty = (m.avgConfidence || 0) < MIN_CONFIDENCE
      ? (1 - (m.avgConfidence || 0) / MIN_CONFIDENCE) * 30
      : 0;

    const raw = speedScore * weights.speed
      + confScore * weights.confidence
      + stabScore * weights.stability
      + loadScore * weights.loadTime;
    const total = Math.max(0, raw - confPenalty);

    return {
      id,
      name: m.name,
      total: Math.round(total * 10) / 10,
      speedScore: Math.round(speedScore * 10) / 10,
      confScore: Math.round(confScore * 10) / 10,
      stabScore: Math.round(stabScore * 10) / 10,
      loadScore: Math.round(loadScore * 10) / 10,
      avgInferenceMs: m.avgInferenceMs,
      loadTimeMs: m.loadTimeMs,
    };
  });

  scored.sort((a, b) => b.total - a.total);

  return {
    recommendation: scored[0].id,
    name: scored[0].name,
    reason: `Best overall score (${scored[0].total}/100). Speed: ${scored[0].speedScore}, Confidence: ${scored[0].confScore}, Stability: ${scored[0].stabScore}, Load: ${scored[0].loadScore}. Avg inference: ${scored[0].avgInferenceMs}ms.`,
    scores: scored,
    weights,
    // Fallback chain: ranked models to try in order if the top pick fails at runtime.
    fallbackChain: scored.map(s => s.id),
  };
}