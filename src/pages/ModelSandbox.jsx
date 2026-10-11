import React, { useState, useRef, useCallback } from "react";
import SandboxCamera from "@/components/sandbox/SandboxCamera";
import { ComparisonTable, RouterPanel, ModelLoadError } from "@/components/sandbox/MetricsPanel";
import { createMetricsCollector } from "@/lib/sandbox/metrics";
import { MODEL_REGISTRY } from "@/lib/sandbox/models";
import { routeModel } from "@/lib/sandbox/router";
import { isOk, isErr, unwrap } from "@/lib/sandbox/result";
import { Link } from "react-router-dom";

const BENCHMARK_FRAMES = 60;

export default function ModelSandbox() {
  const [selected, setSelected] = useState(new Set(["movenet", "hands", "pose-landmarker"]));
  const [phase, setPhase] = useState("idle"); // idle | loading | running | done
  const [currentModel, setCurrentModel] = useState(null);
  const [loadedModel, setLoadedModel] = useState(null);
  const [progress, setProgress] = useState({ model: "", frame: 0, total: 0 });
  const [results, setResults] = useState({});
  const [errors, setErrors] = useState({});
  const [exerciseType, setExerciseType] = useState("hands");

  const cameraRef = useRef(null);
  const metricsRef = useRef({});
  const modelRef = useRef(null);
  const frameCountRef = useRef(0);
  const stopRef = useRef(false);

  const toggleModel = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFrame = useCallback((result) => {
    const m = modelRef.current;
    const collector = metricsRef.current[m?.id];
    if (!collector || !result) return;
    collector.recordFrame(
      result.inferenceMs,
      result.confidence,
      result.landmarks
    );
    frameCountRef.current++;
    setProgress(p => ({ ...p, frame: frameCountRef.current }));
  }, []);

  const runBenchmark = useCallback(async () => {
    if (phase === "running") {
      stopRef.current = true;
      return;
    }
    setPhase("running");
    stopRef.current = false;
    setErrors({});
    setResults({});

    for (const entry of MODEL_REGISTRY) {
      if (!selected.has(entry.id)) continue;
      if (stopRef.current) break;

      setProgress({ model: entry.name, frame: 0, total: BENCHMARK_FRAMES });
      setCurrentModel({ name: entry.name, id: entry.id });

      // Load model.
      const loadResult = await entry.load();
      if (isErr(loadResult)) {
        setErrors(prev => ({ ...prev, [entry.id]: loadResult.error }));
        continue;
      }
      const model = unwrap(loadResult, null);
      if (!model) continue;

      const collector = createMetricsCollector(model.name);
      collector.recordLoad(model.loadTimeMs);
      metricsRef.current[entry.id] = collector;
      modelRef.current = model;
      setLoadedModel(model);
      frameCountRef.current = 0;

      // Run N frames. SandboxCamera runs the model in its rAF loop;
      // we wait for frames to accumulate.
      const startWait = Date.now();
      while (frameCountRef.current < BENCHMARK_FRAMES && !stopRef.current) {
        if (Date.now() - startWait > 30000) break; // 30s timeout per model
        await sleep(100);
      }

      model.close();
      modelRef.current = null;
      setLoadedModel(null);
      setCurrentModel(null);

      const summary = collector.summary();
      setResults(prev => ({ ...prev, [entry.id]: summary }));
    }

    setPhase("done");
    setProgress({ model: "", frame: 0, total: 0 });
  }, [phase, selected]);

  const routing = routeModel(exerciseType, results);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <header className="max-w-5xl mx-auto px-5 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white grid place-items-center font-bold">S</div>
          <span className="font-semibold text-neutral-900 tracking-tight">Model Sandbox</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/agent-lab" className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors">
            Agent Lab →
          </Link>
          <Link to="/" className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors">
            App →
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Pose Model Benchmark</h1>
          <p className="text-sm text-neutral-500 mt-1 max-w-2xl">
            Load and compare vision models on the same camera feed. Measures inference time,
            confidence, landmark coverage, and stability. The router recommends the best model
            per exercise type based on measured results.
          </p>
        </div>

        {/* Model selector */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="font-semibold text-neutral-900 mb-3">Models to test</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {MODEL_REGISTRY.map(m => (
              <label
                key={m.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selected.has(m.id)
                    ? "border-blue-300 bg-blue-50/50"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(m.id)}
                  onChange={() => toggleModel(m.id)}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-medium text-sm text-neutral-900">{m.name}</div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    {m.type} · {m.landmarks} landmarks
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={runBenchmark}
              disabled={phase === "loading" || selected.size === 0}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                phase === "running"
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-neutral-900 text-white hover:bg-neutral-800"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {phase === "running" ? `Stop (${progress.frame}/${progress.total})` : `Run Benchmark (${BENCHMARK_FRAMES} frames)`}
            </button>
            {phase === "running" && (
              <span className="text-sm text-neutral-500">
                Testing <span className="font-medium text-neutral-700">{progress.model}</span>…
              </span>
            )}
          </div>
        </div>

        {/* Camera */}
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div>
            <SandboxCamera
              ref={cameraRef}
              model={loadedModel}
              onFrame={handleFrame}
              active={phase === "running"}
            />
            {phase === "running" && (
              <div className="mt-3 h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 transition-all duration-200"
                  style={{ width: `${progress.total ? (progress.frame / progress.total) * 100 : 0}%` }}
                />
              </div>
            )}
          </div>

          {/* Errors */}
          {Object.keys(errors).length > 0 && (
            <div className="space-y-2">
              {Object.entries(errors).map(([id, e]) => (
                <ModelLoadError key={id} modelId={id} error={e} />
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        {Object.keys(results).length > 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h3 className="font-semibold text-neutral-900 mb-4">Benchmark Results</h3>
            <ComparisonTable results={results} />
            <p className="text-xs text-neutral-400 mt-3">
              Green = best in that metric. Effective FPS = 1000 / avg inference. Stability = 1 - normalized jitter.
            </p>
          </div>
        )}

        {/* Router */}
        {Object.keys(results).length > 0 && (
          <RouterPanel
            routing={routing}
            exerciseType={exerciseType}
            onExerciseTypeChange={setExerciseType}
          />
        )}

        {phase === "done" && (
          <div className="text-center">
            <button
              onClick={() => { setResults({}); setPhase("idle"); }}
              className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Clear results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}