// Mock data for the therapist Care Plan Studio.
// UI-only for now: in the real build these come from the Anbaric "care-plan"
// state machine (jobs, Await approvals, audit trail, voice agent).

// Regions a therapist can mark on an X-ray, mapped to exercises the app already counts.
export const REGIONS = [
  { id: "fingers", label: "Fingers / MCP joints", exercises: ["Knuckle Bend", "Finger Lifts", "Tabletop"] },
  { id: "thumb", label: "Thumb (CMC)", exercises: ["Thumb Opposition", "C-Grip"] },
  { id: "wrist", label: "Wrist", exercises: ["Wrist Flex & Extend", "Wrist Rotations", "Wrist Deviation"] },
  { id: "forearm", label: "Forearm", exercises: ["Palm Flip"] },
  { id: "shoulder", label: "Shoulder", exercises: ["Arm Raises", "Overhead Press"] },
  { id: "neck", label: "Cervical spine", exercises: ["Neck Tilts", "Neck Turns"] },
];

export const SEVERITY = [
  { id: "mild", label: "Mild", reps: "2 sets of 8", color: "bg-emerald-300" },
  { id: "moderate", label: "Moderate", reps: "2 sets of 5, pain-free range", color: "bg-yellow-300" },
  { id: "severe", label: "Severe", reps: "1 set of 3, assisted", color: "bg-rose-300" },
];

// Workflow states of the Anbaric care-plan machine.
export const WORKFLOW = [
  { id: "intake", label: "Intake", actor: "Code" },
  { id: "imaging", label: "X-ray marked", actor: "Therapist" },
  { id: "drafting", label: "AI drafts plan", actor: "Claude agent" },
  { id: "review", label: "Therapist review", actor: "Await · Therapist" },
  { id: "approved", label: "Sent to patient", actor: "Code" },
];

// Mock "drafting" step: turns therapist marks into a plan.
export function draftPlan(marks) {
  const items = [];
  const seen = new Set();
  for (const m of marks) {
    const region = REGIONS.find(r => r.id === m.region);
    const sev = SEVERITY.find(s => s.id === m.severity);
    if (!region || !sev) continue;
    for (const ex of region.exercises.slice(0, m.severity === "severe" ? 1 : 2)) {
      if (seen.has(ex)) continue;
      seen.add(ex);
      items.push({
        exercise: ex,
        dosage: sev.reps,
        rationale: `Targets ${region.label.toLowerCase()} (marker #${m.n}${m.note ? `: ${m.note}` : ""}).`,
      });
    }
  }
  return {
    items,
    safety: marks.some(m => m.severity === "severe")
      ? "Severe finding marked: keep all movements assisted and stop at any pain."
      : "Stay in a pain-free range. Stop if swelling or sharp pain appears.",
  };
}

// Scripted voice-agent conversation (mock).
export function voiceScript(patientName) {
  return [
    { who: "agent", text: `Hi Doctor. I've loaded ${patientName}'s chart and last 7 sessions. What would you like to do?` },
    { who: "doc", text: "Summarize her progress this week." },
    { who: "agent", text: "She completed 4 of 7 days. Right-hand reps are up 30%, but form corrections are still high on Hand Open-Close." },
    { who: "doc", text: "Draft a plan from the X-ray markers and keep it gentle." },
    { who: "agent", text: "Done. I drafted a plan from your markers. It's waiting for your approval in the review step." },
  ];
}

export const now = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
