import React, { useState, useEffect } from "react";
import { ALL_SCENARIOS, PRIORITY_LABELS, PRIORITY_STYLES } from "@/lib/sandbox/scenarios";
import { base44 } from "@/api/base44Client";

// ScenarioEditor: team-facing review and update of exercise scenario
// definitions. Reads the base catalog, overlays any saved edits from
// the TrackingScenario entity, and lets team members update instructions,
// tracking notes, and review status. Clinician-configured scenarios are
// read-only with a visible warning.
export default function ScenarioEditor() {
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [draftField, setDraftField] = useState({});

  useEffect(() => {
    loadEdits();
  }, []);

  async function loadEdits() {
    try {
      const page = await base44.entities.TrackingScenario.filter({}, { limit: 100 });
      const map = {};
      for (const rec of page.items || []) {
        map[rec.exercise_id] = rec;
      }
      setEdits(map);
    } catch (_) {
      // entity may be empty or unavailable
    } finally {
      setLoading(false);
    }
  }

  const selected = ALL_SCENARIOS.find(s => s.id === selectedId);
  const savedEdit = selectedId ? edits[selectedId] : null;
  const isClinician = selected?.releasePriority === "clinician_configured";

  function startEdit(field, value) {
    setDraftField({ field, value });
  }

  async function saveField() {
    if (!selected || !draftField.field) return;
    setSaving(true);
    const record = {
      exercise_id: selected.id,
      name: selected.name,
      movement_description: selected.userInstruction,
      user_instruction: selected.userInstruction,
      game_interaction: selected.gameInteraction,
      release_priority: selected.releasePriority,
      tracking_category: selected.trackingCategory,
      tracking_notes: selected.trackingNotes,
      review_status: savedEdit?.review_status || "draft",
      content_version: (savedEdit?.content_version || 1) + 1,
      [draftField.field]: draftField.value,
    };
    try {
      if (savedEdit?.id) {
        await base44.entities.TrackingScenario.update(savedEdit.id, { [draftField.field]: draftField.value, content_version: record.content_version });
      } else {
        const created = await base44.entities.TrackingScenario.create(record);
        if (created) setEdits(prev => ({ ...prev, [selected.id]: created }));
      }
      setDraftField({});
      await loadEdits();
    } catch (e) {
      // branch may refuse writes
    } finally {
      setSaving(false);
    }
  }

  async function setReviewStatus(status) {
    if (!selected || !savedEdit) return;
    setSaving(true);
    try {
      await base44.entities.TrackingScenario.update(savedEdit.id, {
        review_status: status,
        content_version: (savedEdit.content_version || 1) + 1,
      });
      await loadEdits();
    } catch (_) {
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-neutral-400">Loading scenario definitions…</div>;
  }

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6">
      {/* Scenario list */}
      <div className="space-y-1.5">
        {ALL_SCENARIOS.map(s => {
          const edit = edits[s.id];
          const isSelected = s.id === selectedId;
          return (
            <button
              key={s.id}
              onClick={() => { setSelectedId(s.id); setDraftField({}); }}
              className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                isSelected ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-neutral-900 truncate">{s.name}</span>
                {edit && (
                  <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded ${
                    edit.review_status === "reviewed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {edit.review_status === "reviewed" ? "Reviewed" : "Draft"}
                  </span>
                )}
              </div>
              <span className={`inline-block text-[9px] mt-1 px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[s.releasePriority]}`}>
                {PRIORITY_LABELS[s.releasePriority]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail / editor */}
      <div>
        {!selected ? (
          <div className="text-sm text-neutral-400 p-8 text-center border border-dashed border-neutral-200 rounded-xl">
            Select a scenario to review or edit its definition
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
            {isClinician && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm text-rose-700">
                This is a clinician-configured scenario. It is read-only and unavailable for ordinary benchmark testing.
              </div>
            )}

            <div>
              <h3 className="font-semibold text-neutral-900">{selected.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[selected.releasePriority]}`}>
                  {PRIORITY_LABELS[selected.releasePriority]}
                </span>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wide">{selected.trackingCategory}</span>
                {savedEdit && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    savedEdit.review_status === "reviewed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {savedEdit.review_status === "reviewed" ? "Reviewed" : "Draft"}
                  </span>
                )}
              </div>
            </div>

            <EditField
              label="User instruction"
              baseValue={selected.userInstruction}
              savedValue={savedEdit?.user_instruction}
              disabled={isClinician}
              editing={draftField.field === "user_instruction"}
              draftValue={draftField.field === "user_instruction" ? draftField.value : ""}
              onStartEdit={(v) => startEdit("user_instruction", v)}
              onDraftChange={(v) => setDraftField({ field: "user_instruction", value: v })}
              onSave={saveField}
              onCancel={() => setDraftField({})}
              saving={saving}
            />

            <EditField
              label="Game interaction"
              baseValue={selected.gameInteraction}
              savedValue={savedEdit?.game_interaction}
              disabled={isClinician}
              editing={draftField.field === "game_interaction"}
              draftValue={draftField.field === "game_interaction" ? draftField.value : ""}
              onStartEdit={(v) => startEdit("game_interaction", v)}
              onDraftChange={(v) => setDraftField({ field: "game_interaction", value: v })}
              onSave={saveField}
              onCancel={() => setDraftField({})}
              saving={saving}
            />

            <EditField
              label="Tracking notes"
              baseValue={selected.trackingNotes}
              savedValue={savedEdit?.tracking_notes}
              disabled={isClinician}
              editing={draftField.field === "tracking_notes"}
              draftValue={draftField.field === "tracking_notes" ? draftField.value : ""}
              onStartEdit={(v) => startEdit("tracking_notes", v)}
              onDraftChange={(v) => setDraftField({ field: "tracking_notes", value: v })}
              onSave={saveField}
              onCancel={() => setDraftField({})}
              saving={saving}
            />

            {savedEdit && !isClinician && (
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                <span className="text-xs text-neutral-500">Review status:</span>
                <button
                  onClick={() => setReviewStatus("draft")}
                  disabled={saving || savedEdit.review_status === "draft"}
                  className="text-xs px-2 py-1 rounded border border-neutral-200 hover:border-neutral-300 disabled:opacity-40"
                >
                  Draft
                </button>
                <button
                  onClick={() => setReviewStatus("reviewed")}
                  disabled={saving || savedEdit.review_status === "reviewed"}
                  className="text-xs px-2 py-1 rounded border border-neutral-200 hover:border-neutral-300 disabled:opacity-40"
                >
                  Reviewed
                </button>
              </div>
            )}

            {!savedEdit && !isClinician && (
              <p className="text-xs text-neutral-400">No team edits yet. Edit a field above to create a reviewed version.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EditField({ label, baseValue, savedValue, disabled, editing, draftValue, onStartEdit, onDraftChange, onSave, onCancel, saving }) {
  const displayValue = savedValue || baseValue;
  if (disabled) {
    return (
      <div>
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</label>
        <p className="text-sm text-neutral-700 mt-1">{displayValue}</p>
      </div>
    );
  }
  if (editing) {
    return (
      <div>
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</label>
        <textarea
          value={draftValue}
          onChange={e => onDraftChange(e.target.value)}
          rows={3}
          className="w-full mt-1 text-sm rounded-lg border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-400"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={onSave}
            disabled={saving}
            className="text-xs px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={onCancel}
            disabled={saving}
            className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-neutral-300 disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</label>
      <div className="flex items-start justify-between gap-2 mt-1">
        <p className="text-sm text-neutral-700">{displayValue}</p>
        <button
          onClick={() => onStartEdit(displayValue)}
          className="shrink-0 text-xs text-neutral-400 hover:text-neutral-700"
        >
          Edit
        </button>
      </div>
      {savedValue && savedValue !== baseValue && (
        <p className="text-[11px] text-neutral-400 mt-1">Base: {baseValue}</p>
      )}
    </div>
  );
}