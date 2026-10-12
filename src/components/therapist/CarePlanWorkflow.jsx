import React from "react";
import { Check, Sparkles, ShieldCheck, Clock, X, Pencil, History } from "lucide-react";
import { WORKFLOW } from "@/lib/af/carePlanMock";

const ACTOR_STYLE = {
  "Claude agent": "bg-violet-200",
  "Voice agent": "bg-violet-200",
  Therapist: "bg-yellow-300",
  Code: "bg-neutral-200",
};

// Anbaric care-plan state machine, shown as a stepper + review card + audit trail.
// Mock only: stage changes happen in the page component.
export default function CarePlanWorkflow({ stage, plan, setPlan, marksCount, therapistName, audit, onDraft, onApprove, onReject }) {
  const idx = WORKFLOW.findIndex(s => s.id === stage);
  const editItem = (i, patch) => setPlan(p => ({ ...p, items: p.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }));

  return (
    <div className="rounded-3xl border-2 border-neutral-950 bg-white p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Anbaric workflow · care-plan</p>
          <h2 className="text-xl font-bold">AI-drafted plan, therapist approved</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full border-2 border-neutral-950 px-3 py-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Every step audited
        </span>
      </div>

      {/* Stepper */}
      <ol className="grid grid-cols-5 gap-1">
        {WORKFLOW.map((s, i) => {
          const done = i < idx, current = i === idx;
          return (
            <li key={s.id} className="flex flex-col items-center text-center gap-1.5">
              <span className={`w-9 h-9 rounded-full border-2 border-neutral-950 grid place-items-center text-sm font-bold
                ${done ? "bg-neutral-950 text-white" : current ? "bg-yellow-300" : "bg-white text-neutral-400 border-neutral-300"}`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </span>
              <span className={`text-xs font-semibold leading-tight ${i > idx ? "text-neutral-400" : ""}`}>{s.label}</span>
              <span className="text-[10px] text-neutral-500 leading-tight hidden sm:block">{s.actor}</span>
            </li>
          );
        })}
      </ol>

      {/* Stage body */}
      {(stage === "intake" || stage === "imaging") && (
        <div className="rounded-2xl bg-neutral-100 p-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm">
            {marksCount === 0 ? "Mark at least one area on the X-ray, or ask the voice agent." : `${marksCount} finding${marksCount > 1 ? "s" : ""} ready for the AI to plan from.`}
          </p>
          <button onClick={onDraft} disabled={marksCount === 0}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border-2 border-neutral-950 font-semibold bg-violet-300 hover:bg-violet-400 disabled:opacity-40 disabled:cursor-not-allowed">
            <Sparkles className="w-4 h-4" /> Draft plan with Claude
          </button>
        </div>
      )}

      {stage === "drafting" && (
        <div className="rounded-2xl bg-violet-50 border-2 border-violet-200 p-4 flex items-center gap-3">
          <span className="w-5 h-5 border-[3px] border-violet-200 border-t-violet-700 rounded-full animate-spin" />
          <p className="text-sm font-medium">Claude agent is drafting a plan from {marksCount} X-ray finding{marksCount > 1 ? "s" : ""}…</p>
        </div>
      )}

      {(stage === "review" || stage === "approved") && plan && (
        <div className="space-y-3">
          {stage === "review" && (
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800 bg-amber-100 rounded-lg px-3 py-1.5">
              <Clock className="w-4 h-4" /> Waiting on {therapistName}. Not visible to the patient yet.
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {plan.items.map((it, i) => (
              <div key={i} className="rounded-2xl bg-neutral-100 p-4 space-y-1">
                <p className="font-bold">{it.exercise}</p>
                {stage === "review" ? (
                  <label className="flex items-center gap-1.5 text-sm">
                    <Pencil className="w-3.5 h-3.5 text-neutral-500" />
                    <input value={it.dosage} onChange={(e) => editItem(i, { dosage: e.target.value })}
                      className="flex-1 bg-white rounded-md border border-neutral-300 px-2 py-0.5 font-semibold" />
                  </label>
                ) : <p className="text-sm font-semibold">{it.dosage}</p>}
                <p className="text-sm text-neutral-700">{it.rationale}</p>
              </div>
            ))}
          </div>
          <p className="text-sm rounded-2xl border-2 border-rose-200 bg-rose-50 p-3"><span className="font-bold">Safety: </span>{plan.safety}</p>
          {stage === "review" ? (
            <div className="flex gap-2 flex-wrap">
              <button onClick={onApprove} className="inline-flex items-center gap-2 h-12 px-5 rounded-xl border-2 border-neutral-950 font-semibold bg-emerald-300 hover:bg-emerald-400">
                <Check className="w-5 h-5" /> Approve & send to patient
              </button>
              <button onClick={onReject} className="inline-flex items-center gap-2 h-12 px-5 rounded-xl border-2 border-neutral-950 font-semibold bg-white hover:bg-neutral-100">
                <X className="w-5 h-5" /> Reject & redraft
              </button>
            </div>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 bg-emerald-100 rounded-lg px-3 py-1.5">
              <Check className="w-4 h-4" /> Approved by {therapistName}. Live in the patient's coach.
            </p>
          )}
          <p className="text-xs text-neutral-500">AI-generated decision support. Final clinical judgment rests with the therapist.</p>
        </div>
      )}

      {/* Audit trail */}
      <div>
        <p className="inline-flex items-center gap-1.5 text-sm font-bold mb-2"><History className="w-4 h-4" /> Audit trail</p>
        {audit.length === 0 ? <p className="text-sm text-neutral-500">No activity yet.</p> : (
          <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {[...audit].reverse().map((a, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="text-xs text-neutral-500 w-16 shrink-0 tabular-nums">{a.time}</span>
                <span className={`text-xs font-semibold rounded-md px-2 py-0.5 shrink-0 ${ACTOR_STYLE[a.actor] || "bg-neutral-200"}`}>{a.actor}</span>
                <span className="truncate">{a.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
