// Custom exercises created by the voice agent. Stored as a JSON file in
// localStorage (no DB) and injected into the live EXERCISE_LIBRARY at runtime
// so the existing rep-tracking and session flow can run them unchanged.

import { EXERCISE_LIBRARY } from "@/lib/af/exercises";

const KEY = "af_custom_exercises_v1";

function normalizeExercise(ex) {
  const detect = ex.detect === "thumbTouch" ? "thumbTouch"
    : ex.detect === "fingerSpread" ? "fingerSpread" : null;
  return {
    id: ex.id || String(ex.name || "custom").replace(/\s+/g, "_").toLowerCase(),
    type: detect ? "pose" : "rhythm",
    sides: ["left", "right", "both"],
    side: ex.side || "both",
    defaultReps: Math.min(Math.max(Number(ex.defaultReps) || 3, 1), 10),
    cue: ex.cue || ex.name || "Custom exercise",
    focus: ex.focus || ex.cue || "",
    detect,
    group: "custom"
  };
}

export function listCustomExercises() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch (_) {
    return [];
  }
}

export function loadCustomExercises() {
  const list = listCustomExercises();
  for (const ex of list) {
    if (ex && ex.name) EXERCISE_LIBRARY[ex.name] = normalizeExercise(ex);
  }
  return list;
}

export function saveCustomExercise(ex) {
  const norm = normalizeExercise(ex);
  const list = listCustomExercises().filter(e => e.name !== norm.name);
  list.push(norm);
  localStorage.setItem(KEY, JSON.stringify(list));
  EXERCISE_LIBRARY[norm.name] = norm;
  return norm;
}

// Single-exercise routines derived from saved custom exercises, shown in setup.
export function customRoutines() {
  return listCustomExercises().map(ex => ({
    id: `custom_${String(ex.name).replace(/\s+/g, "_").toLowerCase()}`,
    name: ex.name,
    description: ex.focus || ex.cue,
    bodyPart: "hands",
    custom: true,
    exercises: [{ name: ex.name, side: ex.side || "both" }]
  }));
}

// Inject any previously saved custom exercises on load.
loadCustomExercises();