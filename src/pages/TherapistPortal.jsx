import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { listTherapists, listPatients } from "@/lib/af/mockDb";

export default function TherapistPortal() {
  const [therapists, setTherapists] = useState([]);
  const [tid, setTid] = useState("t1");
  const [patients, setPatients] = useState([]);

  useEffect(() => { listTherapists().then(setTherapists); }, []);
  useEffect(() => { listPatients(tid).then(setPatients); }, [tid]);
  const t = therapists.find(x => x.id === tid);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="max-w-5xl mx-auto px-5 py-8 space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 h-12 px-4 rounded-xl border-2 border-neutral-950 font-semibold"><ArrowLeft className="w-5 h-5" /> Back to coach</Link>
        <h1 className="text-4xl font-bold tracking-tight">Therapist portal</h1>
        <div className="flex flex-wrap gap-2">
          {therapists.map(x => (
            <button key={x.id} onClick={() => setTid(x.id)}
              className={`h-12 px-4 rounded-xl border-2 border-neutral-950 font-semibold ${x.id === tid ? "bg-neutral-950 text-white" : "bg-white"}`}>{x.name}</button>
          ))}
        </div>
        {t && <p className="text-neutral-700">{t.specialty} · {t.clinic}</p>}
        <div className="grid sm:grid-cols-2 gap-4">
          {patients.map(p => (
            <Link key={p.id} to={`/dashboard?patient=${p.id}`} className="rounded-3xl border-2 border-neutral-950 bg-white p-6 flex items-center justify-between hover:bg-yellow-300 transition-colors">
              <div>
                <p className="text-xl font-bold">{p.name}</p>
                <p className="text-sm text-neutral-700">{p.age} · {p.condition}</p>
                <p className="text-sm mt-1">{p.sessions.length} sessions · goal {p.goal.daily_reps_target}/day</p>
              </div>
              <ChevronRight className="w-6 h-6" />
            </Link>
          ))}
        </div>
        {t && (
          <div className="rounded-3xl border-2 border-neutral-950 bg-white p-6">
            <h2 className="text-xl font-bold mb-3">Your suggested exercises</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {t.suggested_exercises.map((r, i) => (
                <div key={i} className="rounded-2xl bg-neutral-100 p-4"><p className="font-bold">{r.exercise}</p><p className="text-sm font-semibold">{r.dosage}</p><p className="text-sm text-neutral-700">{r.rationale}</p></div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}