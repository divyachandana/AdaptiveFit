import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, LayoutDashboard } from "lucide-react";
import { listTherapists, listPatients } from "@/lib/af/mockDb";
import { draftPlan, now } from "@/lib/af/carePlanMock";
import XrayAnnotator from "@/components/therapist/XrayAnnotator";
import VoiceAgentPanel from "@/components/therapist/VoiceAgentPanel";
import CarePlanWorkflow from "@/components/therapist/CarePlanWorkflow";

export default function TherapistPortal() {
  const [therapists, setTherapists] = useState([]);
  const [tid, setTid] = useState("t1");
  const [patients, setPatients] = useState([]);
  const [pid, setPid] = useState(null);

  // Care Plan Studio state (per selected patient; mock Anbaric job)
  const [images, setImages] = useState([]);
  const [marks, setMarks] = useState([]);
  const [stage, setStage] = useState("intake");
  const [plan, setPlan] = useState(null);
  const [audit, setAudit] = useState([]);
  const draftTimer = useRef(null);

  useEffect(() => { listTherapists().then(setTherapists); }, []);
  useEffect(() => { listPatients(tid).then(ps => { setPatients(ps); setPid(ps[0]?.id ?? null); }); }, [tid]);

  const t = therapists.find(x => x.id === tid);
  const p = patients.find(x => x.id === pid);

  const log = (actor, text) => setAudit(a => [...a, { time: now(), actor, text }]);

  // New patient → new care-plan job
  useEffect(() => {
    clearTimeout(draftTimer.current);
    setImages([]); setMarks([]); setPlan(null); setStage("intake");
    setAudit(p ? [{ time: now(), actor: "Code", text: `Care-plan job opened for ${p.name}` }] : []);
  }, [pid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimeout(draftTimer.current), []);
  useEffect(() => { if (marks.length && stage === "intake") setStage("imaging"); }, [marks.length, stage]);

  const startDraft = () => {
    if (stage === "drafting" || stage === "review") return;
    // No markers yet (e.g. voice request) → fall back to one generic finding.
    const source = marks.length ? marks : [{ n: 1, region: "fingers", severity: "moderate", note: p?.condition }];
    setStage("drafting");
    log("Claude agent", `Drafting plan from ${source.length} finding${source.length > 1 ? "s" : ""}`);
    draftTimer.current = setTimeout(() => {
      const draft = draftPlan(source);
      setPlan(draft);
      setStage("review");
      log("Claude agent", `Drafted ${draft.items.length} exercises. Awaiting therapist approval`);
    }, 1800);
  };

  const approve = () => {
    setStage("approved");
    log("Therapist", `${t?.name ?? "Therapist"} approved the plan`);
    log("Code", `Plan sent to ${p?.name}'s coach`);
  };

  const reject = () => {
    setPlan(null);
    setStage(marks.length ? "imaging" : "intake");
    log("Therapist", `${t?.name ?? "Therapist"} rejected the draft`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-5 py-8 space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 h-12 px-4 rounded-xl border-2 border-neutral-950 font-semibold"><ArrowLeft className="w-5 h-5" /> Back to coach</Link>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <h1 className="text-4xl font-bold tracking-tight">Therapist portal</h1>
          <span className="text-xs font-semibold rounded-full bg-neutral-950 text-white px-3 py-1">Powered by Anbaric</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {therapists.map(x => (
            <button key={x.id} onClick={() => setTid(x.id)}
              className={`h-12 px-4 rounded-xl border-2 border-neutral-950 font-semibold ${x.id === tid ? "bg-neutral-950 text-white" : "bg-white"}`}>{x.name}</button>
          ))}
        </div>
        {t && <p className="text-neutral-700">{t.specialty} · {t.clinic}</p>}

        {/* Patients */}
        <div className="grid sm:grid-cols-2 gap-4">
          {patients.map(x => (
            <div key={x.id} className={`rounded-3xl border-2 border-neutral-950 p-5 flex items-center justify-between gap-3 transition-colors ${x.id === pid ? "bg-yellow-300" : "bg-white"}`}>
              <button onClick={() => setPid(x.id)} className="text-left flex-1">
                <p className="text-xl font-bold">{x.name}</p>
                <p className="text-sm text-neutral-700">{x.age} · {x.condition}</p>
                <p className="text-sm mt-1">{x.sessions.length} sessions · goal {x.goal.daily_reps_target}/day</p>
              </button>
              <Link to={`/dashboard?patient=${x.id}`} aria-label={`Open ${x.name}'s dashboard`}
                className="inline-flex items-center gap-1 h-10 px-3 rounded-xl border-2 border-neutral-950 bg-white text-sm font-semibold hover:bg-neutral-100">
                <LayoutDashboard className="w-4 h-4" /> <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* Care Plan Studio */}
        {p && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Care plan studio · {p.name}</h2>
            <div className="grid lg:grid-cols-[1fr_380px] gap-4 items-start">
              <div className="space-y-4 min-w-0">
                <XrayAnnotator images={images} setImages={setImages} marks={marks} setMarks={setMarks} onLog={log} />
                <CarePlanWorkflow stage={stage} plan={plan} setPlan={setPlan} marksCount={marks.length}
                  therapistName={t?.name ?? "the therapist"} audit={audit}
                  onDraft={startDraft} onApprove={approve} onReject={reject} />
              </div>
              <div className="lg:sticky lg:top-4">
                <VoiceAgentPanel patientName={p.name} onDraftRequest={startDraft} onLog={log} />
              </div>
            </div>
          </section>
        )}

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
