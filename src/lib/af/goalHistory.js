import { base44 } from "@/api/base44Client";
import { dayKey } from "@/lib/af/dashboardStats";

// Records today's daily target once per day (updates it if the goal changed).
export async function logTodayGoal(userId, target) {
  const date = dayKey(new Date());
  const res = await base44.entities.DailyGoalLog.filter({ created_by_id: userId, date }, { limit: 1 });
  const existing = res.items?.[0];
  if (!existing) await base44.entities.DailyGoalLog.create({ date, daily_reps_target: target });
  else if (existing.daily_reps_target !== target) await base44.entities.DailyGoalLog.update(existing.id, { daily_reps_target: target });
}

// Returns { "YYYY-MM-DD": target } for the user's logged days since `since`.
export async function loadGoalHistory(userId, since) {
  const res = await base44.entities.DailyGoalLog.filter(
    { created_by_id: userId, date: { $gte: dayKey(since) } },
    { sort: "date", limit: 400, fields: ["date", "daily_reps_target"] }
  );
  return Object.fromEntries((res.items || []).map(r => [r.date, r.daily_reps_target]));
}