import React, { useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { speak } from "@/lib/af/speech";
import { base44 } from "@/api/base44Client";

export default function RomProgressAlert({ gains }) {
  const { toast } = useToast();
  useEffect(() => {
    if (!gains.length) return;
    const top = gains[0];
    const msg = `Great progress! Your ${top.hand.toLowerCase()} ${top.label.toLowerCase()} gained ${top.gain} degrees of movement${gains.length > 1 ? `, and ${gains.length - 1} more joint${gains.length > 2 ? "s" : ""} improved` : ""}.`;
    toast({ title: "Range of motion improved", description: msg });
    speak(msg, { force: true });
    base44.auth.isAuthenticated().then((ok) => ok && base44.functions.invoke("notifyRomProgress", { gains }));
  }, [gains, toast]);

  if (!gains.length) return null;
  return (
    <div role="status" className="rounded-2xl border-2 border-emerald-700 bg-emerald-50 p-5">
      <p className="flex items-center gap-2 font-bold text-emerald-900"><TrendingUp className="w-5 h-5" />Significant progress since your last check</p>
      <ul className="mt-3 grid sm:grid-cols-2 gap-2">
        {gains.map((g) => (
          <li key={g.hand + g.label} className="rounded-xl bg-white px-4 py-3 text-sm text-emerald-900">
            <span className="font-semibold">{g.hand} {g.label}</span>: +{g.gain}° (now {g.now}°)
          </li>
        ))}
      </ul>
    </div>
  );
}