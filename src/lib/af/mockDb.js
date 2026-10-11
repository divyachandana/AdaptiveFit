// Temporary hackathon data layer backed by JSON files.
// Swap these async functions for real database / AI calls later — callers won't change.
import users from "@/data/users.json";
import therapists from "@/data/therapists.json";

function withDates(s, i) {
  const d = new Date(); d.setDate(d.getDate() - s.days_ago); d.setHours(10, 0, 0, 0);
  return { ...s, id: `s${i}`, created_date: d.toISOString() };
}

export async function listTherapists() { return therapists; }
export async function getTherapist(id) { return therapists.find(t => t.id === id) || null; }
export async function listPatients(therapistId) { return users.filter(u => !therapistId || u.therapist_id === therapistId); }

export async function getPatient(id) {
  const u = users.find(x => x.id === id);
  if (!u) return null;
  const sessions = u.sessions.map(withDates).sort((a, b) => b.created_date.localeCompare(a.created_date));
  // rows shaped like the database daily aggregate, so dashboard stats work unchanged
  const byDay = {};
  for (const s of sessions) { const k = s.created_date.slice(0, 10); byDay[k] = (byDay[k] || 0) + s.reps_completed; }
  const rows = Object.entries(byDay).map(([k, v]) => ({ created_date: k, sum_reps_completed: v }));
  return { ...u, sessions, rows };
}