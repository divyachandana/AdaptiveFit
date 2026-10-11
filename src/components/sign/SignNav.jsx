import React, { useEffect } from "react";
import { syncCalibration } from "@/lib/af/calibration";
import LanguagePicker from "@/components/LanguagePicker";
import { Link, useLocation } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Learn" },
  { to: "/signs/drill", label: "Rapid drill" },
  { to: "/signs/translate", label: "Translator" },
  { to: "/signs/calibrate", label: "Calibrate" },
  { to: "/exercise", label: "Exercise coach" }
];

export default function SignNav() {
  const { pathname } = useLocation();
  useEffect(() => { syncCalibration(); }, []);
  return (
    <header className="max-w-5xl mx-auto px-5 pt-6 flex flex-wrap items-center justify-between gap-3">
      <span className="font-semibold text-neutral-900 tracking-tight">Sign Language Tutor · ASL</span>
      <nav className="flex flex-wrap items-center gap-1">
        <LanguagePicker />
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className={`px-3 py-2 rounded-lg text-sm font-medium ${pathname === l.to ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}>{l.label}</Link>
        ))}
      </nav>
    </header>
  );
}