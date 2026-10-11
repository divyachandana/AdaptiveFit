import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { base44 } from "@/api/base44Client";
import { Activity, ArrowLeft, TrendingUp, Target, Clock } from "lucide-react";

export default function Dashboard() {
  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [totals, setTotals] = useState({ reps: 0, sessions: 0, minutes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [dailyAgg, weeklyAgg, countResult] = await Promise.all([
        base44.entities.SessionRecord.aggregate({
          dateBucket: { field: "created_date", unit: "day" },
          sum: ["reps_completed"],
          sort: "date",
          limit: 30
        }),
        base44.entities.SessionRecord.aggregate({
          dateBucket: { field: "created_date", unit: "week" },
          sum: ["reps_completed"],
          sort: "date",
          limit: 12
        }),
        base44.entities.SessionRecord.count({})
      ]);

      const rows = (dailyAgg?.rows || []).map(r => ({
        date: r._id?.date || r.date || r._id,
        reps: r.sum_reps_completed || 0,
        sessions: r.count || 0
      }));
      setDailyData(rows);

      const weekRows = (weeklyAgg?.rows || []).map(r => ({
        date: r._id?.date || r.date || r._id,
        reps: r.sum_reps_completed || 0,
        sessions: r.count || 0
      }));
      setWeeklyData(weekRows);

      const totalReps = rows.reduce((s, r) => s + r.reps, 0);
      setTotals({
        reps: totalReps,
        sessions: countResult || 0,
        minutes: 0
      });
    } catch (e) {
      setError(e?.message || "Failed to load progress data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const dailyChart = dailyData.map(d => {
    const date = new Date(d.date);
    return {
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      reps: d.reps
    };
  });

  const weeklyChart = weeklyData.map(d => {
    const date = new Date(d.date);
    return {
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      reps: d.reps
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <header className="max-w-5xl mx-auto px-5 pt-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Coach</span>
        </Link>
        <span className="text-xs text-neutral-400 hidden sm:block">Your Progress</span>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white grid place-items-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Exercise Progress</h1>
            <p className="text-sm text-neutral-500">Daily reps completed over time</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard icon={TrendingUp} label="Total Reps" value={totals.reps} />
              <StatCard icon={Target} label="Sessions" value={totals.sessions} />
              <StatCard icon={Clock} label="Avg Reps / Session" value={totals.sessions > 0 ? Math.round(totals.reps / totals.sessions) : 0} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-neutral-700 mb-4">Daily Reps</h2>
                {dailyChart.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={dailyChart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
                        formatter={(v) => [`${v} reps`, "Completed"]}
                      />
                      <Bar dataKey="reps" fill="#111111" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-neutral-700 mb-4">Weekly Reps</h2>
                {weeklyChart.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={weeklyChart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
                        formatter={(v) => [`${v} reps`, "Completed"]}
                      />
                      <Bar dataKey="reps" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-neutral-400 mb-1">No sessions yet</p>
      <p className="text-xs text-neutral-400">Complete a session to see your progress here.</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-neutral-100 grid place-items-center">
        <Icon className="w-5 h-5 text-neutral-700" />
      </div>
      <div>
        <div className="text-2xl font-bold tabular-nums text-neutral-900">{value}</div>
        <div className="text-xs text-neutral-500">{label}</div>
      </div>
    </div>
  );
}