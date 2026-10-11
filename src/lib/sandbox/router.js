// Model router — inspired by Route.X's piece-based composition model.
// Given an exercise type and measured metrics, recommends the best model
// with a transparent, weighted scoring breakdown.

export function routeModel(trackingCategory, metricsByModel) {
  const entries = Object.entries(metricsByModel).filter(([, m]) => m && m.frameCount > 0);
  if (!entries.length) {
    return { recommendation: null, reason: 'No benchmark data yet. Run a benchmark first.' };
  }

  const isHandExercise = trackingCategory === 'hand';

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

  // Score each model: weighted combination of speed, confidence, and stability.
  const WEIGHTS = { speed: 0.4, confidence: 0.35, stability: 0.25 };
  const scored = eligible.map(([id, m]) => {
    const speedScore = m.avgInferenceMs > 0 ? Math.min(100, 1000 / m.avgInferenceMs) : 0;
    const confScore = (m.avgConfidence || 0) * 100;
    const stabScore = (m.stabilityScore || 0) * 100;
    const total = speedScore * WEIGHTS.speed + confScore * WEIGHTS.confidence + stabScore * WEIGHTS.stability;
    return {
      id,
      name: m.name,
      total: Math.round(total * 10) / 10,
      speedScore: Math.round(speedScore * 10) / 10,
      confScore: Math.round(confScore * 10) / 10,
      stabScore: Math.round(stabScore * 10) / 10,
      avgInferenceMs: m.avgInferenceMs,
    };
  });

  scored.sort((a, b) => b.total - a.total);
  const best = scored[0];

  return {
    recommendation: best.id,
    name: best.name,
    reason: `Best overall score (${best.total}/100). Speed: ${best.speedScore}, Confidence: ${best.confScore}, Stability: ${best.stabScore}. Avg inference: ${best.avgInferenceMs}ms.`,
    scores: scored,
    weights: WEIGHTS,
  };
}