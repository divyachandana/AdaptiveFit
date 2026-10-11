import React from "react";
import { Link } from "react-router-dom";
import { BellRing } from "lucide-react";

const REMINDER_HOUR = 18; // 6 PM local time

export default function GoalReminder({ todayReps, target }) {
  if (new Date().getHours() < REMINDER_HOUR || todayReps >= target) return null;
  const left = target - todayReps;
  return (
    <div role="alert" className="rounded-3xl border-2 border-neutral-950 bg-yellow-300 p-5 flex flex-wrap items-center gap-4">
      <BellRing className="w-8 h-8 shrink-0" />
      <div className="flex-1 min-w-[200px]">
        <p className="text-lg font-bold">Just {left} reps to go today!</p>
        <p className="text-sm">A few gentle moves before the day ends will keep your streak going.</p>
      </div>
      <Link to="/" className="h-12 px-5 inline-flex items-center rounded-xl bg-neutral-950 text-white font-semibold">Start a session</Link>
    </div>
  );
}