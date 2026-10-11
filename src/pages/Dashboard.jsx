import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2 } from "lucide-react";
import { buildStats } from "@/lib/af/dashboardStats";
import { getPatient } from "@/lib/af/mockDb";
import RingStat from "@/components/dashboard/RingStat";
import WeekChart from "@/components/dashboard/WeekChart";
import Rewards from "@/components/dashboard/Rewards";
import TherapistReport from "@/components/dashboard/TherapistReport";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const patientId = new URLSearchParams(window.location.search).get("patient");
      if (patientId) {
        const p = await getPatient(patientId);
        if (p) { setData({ goal: p.goal, stats: buildStats(p.rows, p.goal.daily_reps_target), sessions: p.sessions, patient: p }); return; }
      }
      const since = new Date(); since.setHours(0, 0, 0, 0); since.setDate(since.getDate() - 60);
      const me = await base44.auth.me();
      const [goalRes, agg, recent] = await Promise.all([
        base44.entities.Goal.filter({ created_by_id: me.id }, { limit: 1 }),
        base44.entities.SessionRecord.aggregate({ query: { user_id: me.id, created_date: { $gte: since.toISOString() } }, dateBucket: { field: "created_date", unit: "day" }, sum: "reps_completed", limit: 100 }),
        base44.entities.SessionRecord.filter({ user_id: me.id }, { sort: "-created_date", limit: 30 })
      ]);
      const goal = goalRes.items?.[0] || { daily_reps_target: 15, weekly_reps_target: 60 };
      setData({ goal, stats: buildStats(agg.rows || [], goal.daily_reps_target), sessions: recent.items || [] });
    })();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="max-w-5xl mx-auto px-5 py-8 space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <Link to="/" className="inline-flex items-center gap-2 h-12 px-4 rounded-xl border-2 border-neutral-950 font-semibold"><ArrowLeft className="w-5 h-5" /> Back to coach</Link>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">{data?.patient ? `${data.patient.name}'s progress` : "Your progress"}</h1>
        {data?.patient && <p className="text-neutral-700 -mt-4">{data.patient.condition} · <Link to="/therapist" className="underline font-semibold print:hidden">All patients</Link></p>}
        {!data ? (
          <div className="py-24 grid place-items-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4 print:hidden">
              <RingStat label="Today" value={data.stats.todayReps} target={data.goal.daily_reps_target} />
              <RingStat label="This week" value={data.stats.weekReps} target={data.goal.weekly_reps_target} />
            </div>
            <div className="print:hidden"><WeekChart data={data.stats.last7} dailyTarget={data.goal.daily_reps_target} /></div>
            <div className="print:hidden"><Rewards stats={data.stats} /></div>
            <TherapistReport sessions={data.sessions} stats={data.stats} goal={data.goal} />
          </>
        )}
      </div>
    </div>
  );
}