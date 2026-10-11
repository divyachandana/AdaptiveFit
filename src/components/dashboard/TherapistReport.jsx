import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, Sparkles } from "lucide-react";
import SessionTable from "@/components/dashboard/SessionTable";

export default function TherapistReport({ sessions, stats, goal }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const avgCompletion = sessions.length
    ? Math.round(sessions.reduce((s, x) => s + (x.target_reps ? Math.min(1, x.reps_completed / x.target_reps) : 0), 0) / sessions.length * 100) : 0;

  async function generate() {
    setLoading(true);
    const res = await base44.functions.invoke("adaptiveCoach", {
      task: "therapistReport",
      dailyTarget: goal?.daily_reps_target, weeklyTarget: goal?.weekly_reps_target,
      sessions: sessions.map(s => ({ date: s.created_date, exercises: s.exercises, reps: s.reps_completed, target: s.target_reps, corrections: s.corrections_count, duration: s.duration_seconds }))
    });
    setReport(res.data);
    setLoading(false);
  }

  return (
    <section className="rounded-3xl border-2 border-neutral-950 bg-white p-6 print:border-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-2xl font-bold">Occupational Therapist Report</h2><p className="text-sm text-neutral-600">Generated {new Date().toLocaleDateString()}</p></div>
        <div className="flex gap-2 print:hidden">
          <Button onClick={generate} disabled={loading || !sessions.length} className="h-12 px-5 text-base">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} {report ? "Regenerate" : "Generate recommendations"}
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="h-12 px-5 text-base border-2 border-neutral-950"><Printer className="w-5 h-5" /> Print</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
        {[["Sessions", sessions.length], ["Active days", stats.activeDays], ["Avg completion", avgCompletion + "%"], ["Days at goal", stats.goalDays]].map(([l, v]) => (
          <div key={l} className="rounded-2xl bg-neutral-100 p-4"><p className="text-xs uppercase tracking-wide text-neutral-600">{l}</p><p className="text-3xl font-bold tabular-nums">{v}</p></div>
        ))}
      </div>
      {report && (
        <div className="space-y-5 mb-6">
          <div><h3 className="font-bold text-lg">Assessment</h3><p className="text-neutral-800">{report.assessment}</p></div>
          {[["Trends", report.trends], ["Concerns", report.concerns]].map(([t, list]) => list?.length ? (
            <div key={t}><h3 className="font-bold text-lg">{t}</h3><ul className="list-disc pl-5 text-neutral-800">{list.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
          ) : null)}
          <div>
            <h3 className="font-bold text-lg mb-2">Recommended exercises</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {report.recommendations?.map((r, i) => (
                <div key={i} className="rounded-2xl border-2 border-neutral-950 p-4"><p className="font-bold">{r.exercise}</p><p className="text-sm font-semibold">{r.dosage}</p><p className="text-sm text-neutral-700 mt-1">{r.rationale}</p></div>
              ))}
            </div>
          </div>
          <p className="text-xs text-neutral-500">AI-generated decision support. Final clinical judgment rests with the therapist.</p>
        </div>
      )}
      <h3 className="font-bold text-lg mb-2">Session log</h3>
      <SessionTable sessions={sessions} />
    </section>
  );
}