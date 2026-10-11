import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { History as HistoryIcon, ArrowLeft, Clock, Repeat, CheckCircle } from "lucide-react";

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const page = await base44.entities.SessionRecord.filter(
        {},
        { sort: "-created_date", limit: 50 }
      );
      setSessions(page?.items || []);
    } catch (e) {
      setError(e?.message || "Failed to load session history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <header className="max-w-3xl mx-auto px-5 pt-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Coach</span>
        </Link>
        <Link to="/dashboard" className="text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
          Charts
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white grid place-items-center">
            <HistoryIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Session History</h1>
            <p className="text-sm text-neutral-500">Your past exercise sessions</p>
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
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
            <p className="text-sm text-neutral-400 mb-1">No sessions yet</p>
            <p className="text-xs text-neutral-400">Complete a session to start building your history.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SessionCard({ session }) {
  const date = new Date(session.created_date);
  const dateLabel = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timeLabel = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const mins = session.duration_seconds ? Math.round(session.duration_seconds / 60) : 0;
  const secs = session.duration_seconds ? session.duration_seconds % 60 : 0;
  const durationLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-neutral-900">{dateLabel}</span>
            <span className="text-xs text-neutral-400">{timeLabel}</span>
          </div>
          {session.exercises?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {session.exercises.map((ex, i) => (
                <span key={i} className="inline-flex items-center text-xs bg-neutral-100 text-neutral-600 rounded-full px-2.5 py-0.5">
                  {ex}
                </span>
              ))}
            </div>
          )}
          {session.summary && (
            <p className="text-xs text-neutral-500 line-clamp-2">{session.summary}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <Repeat className="w-4 h-4 text-neutral-400" />
            <span className="text-lg font-bold tabular-nums text-neutral-900">{session.reps_completed || 0}</span>
            <span className="text-xs text-neutral-400">reps</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-xs tabular-nums text-neutral-500">{durationLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}