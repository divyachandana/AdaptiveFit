// Turns daily aggregate rows into dashboard stats, streaks and badges.
export function dayKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

export function buildStats(rows, dailyTarget) {
  const byDay = {};
  for (const r of rows) {
    const k = String(r.created_date).slice(0, 10);
    byDay[k] = (byDay[k] || 0) + (r.sum_reps_completed || 0);
  }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    last7.push({ day: d.toLocaleDateString(undefined, { weekday: "short" }), reps: byDay[dayKey(d)] || 0 });
  }
  const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  let weekReps = 0;
  for (const [k, v] of Object.entries(byDay)) if (new Date(k + "T00:00") >= weekStart) weekReps += v;

  let streak = 0;
  const cur = new Date(today);
  if (!byDay[dayKey(cur)]) cur.setDate(cur.getDate() - 1);
  while (byDay[dayKey(cur)]) { streak++; cur.setDate(cur.getDate() - 1); }

  const totalReps = Object.values(byDay).reduce((a, b) => a + b, 0);
  const goalDays = Object.values(byDay).filter(v => v >= dailyTarget).length;
  return { todayReps: byDay[dayKey(today)] || 0, weekReps, last7, streak, totalReps, goalDays, activeDays: Object.keys(byDay).length };
}

export function buildBadges(s) {
  return [
    { id: "first", label: "First Move", desc: "Complete your first rep", earned: s.totalReps >= 1 },
    { id: "goal", label: "Goal Getter", desc: "Hit your daily goal", earned: s.goalDays >= 1 },
    { id: "streak3", label: "3-Day Streak", desc: "Move 3 days in a row", earned: s.streak >= 3 },
    { id: "streak7", label: "Week Warrior", desc: "Move 7 days in a row", earned: s.streak >= 7 },
    { id: "reps100", label: "Century", desc: "100 total reps", earned: s.totalReps >= 100 },
    { id: "reps500", label: "Unstoppable", desc: "500 total reps", earned: s.totalReps >= 500 }
  ];
}

export function levelFor(totalReps) {
  const level = Math.floor(totalReps / 50) + 1;
  return { level, xp: totalReps % 50, next: 50 };
}