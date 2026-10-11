import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { guidanceFor } from '../../shared/exerciseGuidance.ts';

// AdaptiveFit reasoning layer.
// This is the "reasoning model" in the multimodal stack: it takes the vision
// model's output (a seated upper-body pose summary) plus session context and
// decides what to do — build an adapted plan, phrase a correction, or
// summarize a session. It is intentionally narrow: the client's fast path
// (local pose math) handles routine rep counting; this function is reached
// only when the client routes a deviation or a planning/summary moment to it.

const PLANS = {
  upper_body: [
    { name: "Arm Raises", side: "both", targetReps: 3, focus: "Lift your wrists up to shoulder height, then higher if you can.", cue: "Raise your arms out to the sides" },
    { name: "Overhead Press", side: "both", targetReps: 3, focus: "Press your hands up toward the ceiling.", cue: "Press your hands overhead" },
    { name: "Bicep Curls", side: "both", targetReps: 3, focus: "Curl your fists toward your shoulders.", cue: "Curl your arms up" }
  ],
  neck: [
    { name: "Neck Tilts", side: "both", targetReps: 3, focus: "Tilt your ear toward your shoulder, keep shoulders down.", cue: "Tilt your head to the side" },
    { name: "Neck Turns", side: "both", targetReps: 3, focus: "Turn your chin toward each shoulder slowly.", cue: "Turn your head slowly" }
  ],
  hands: [
    { name: "Hand Open-Close", side: "both", targetReps: 3, focus: "Open your fingers, then make a comfortable fist.", cue: "Open and close your hands" },
    { name: "Finger Spreads", side: "both", targetReps: 3, focus: "Spread your fingers apart, then bring them together.", cue: "Spread your fingers" },
    { name: "Hook Fist", side: "both", targetReps: 3, focus: "Curl your fingertips into a hook, keep big knuckles straight.", cue: "Curl your fingertips into a hook" },
    { name: "Full Fist", side: "both", targetReps: 3, focus: "Make a gentle full fist, all joints bent, don't squeeze.", cue: "Make a gentle full fist" },
    { name: "Thumb-to-Fingertip Touch", side: "both", targetReps: 3, focus: "Touch your thumb to each fingertip, making an O.", cue: "Touch your thumb to each fingertip" },
    { name: "Knuckle Bend", side: "both", targetReps: 3, focus: "Bend the middle joints of your fingers, knuckles stay straight.", cue: "Bend your middle finger joints" }
  ]
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const task = body.task;

    if (task === "plan") {
      const parts = Array.isArray(body.bodyParts) ? body.bodyParts : [];
      const plan = [];
      const seen = new Set();
      for (const part of parts) {
        const key = part.toLowerCase();
        const group = PLANS[key] || PLANS[key.replace(" ", "_")] || PLANS[key.replace("_", " ")];
        if (group) {
          for (const ex of group) {
            const id = ex.name + ":" + ex.side;
            if (!seen.has(id)) { seen.add(id); plan.push(ex); }
          }
        }
      }
      if (plan.length === 0) plan.push(...PLANS.upper_body.slice(0, 1));

      // Reasoning model: turn the chosen movements into a warm, adaptive plan.
      const prompt = `You are an encouraging seated-exercise coach for a wheelchair user. The user can move these body parts today: ${parts.join(", ") || "upper body"}. Build a short adaptive seated exercise routine from these movements: ${plan.map(p => p.name).join(", ")}. Return JSON with a friendly one-line greeting and the ordered plan, each with a one-sentence coaching cue. Keep cues short and accessible.`;
      const schema = {
        type: "object",
        properties: {
          greeting: { type: "string" },
          exercises: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                side: { type: "string" },
                targetReps: { type: "number" },
                cue: { type: "string" },
                focus: { type: "string" }
              },
              required: ["name", "targetReps", "cue"]
            }
          }
        },
        required: ["greeting", "exercises"]
      };
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: schema
      });
      const data = res.data || res;
      // Merge any LLM tweaks back onto our safe defaults so reps stay bounded.
      const merged = (data.exercises || plan).map((e, i) => ({
        name: e.name || plan[i]?.name || "Exercise",
        side: e.side || plan[i]?.side || "both",
        targetReps: Math.min(Math.max(Number(e.targetReps) || plan[i]?.targetReps || 3, 3), 10),
        cue: e.cue || plan[i]?.cue || "",
        focus: e.focus || plan[i]?.focus || ""
      }));
      return Response.json({ greeting: data.greeting || "Let's get moving together.", exercises: merged });
    }

    if (task === "correct") {
      const exercise = body.exercise || "exercise";
      const deviation = body.deviation || "deviation detected";
      const poseSummary = body.poseSummary || "seated upper body visible";
      const recent = Array.isArray(body.recentCorrections) ? body.recentCorrections.slice(-3).join(" | ") : "";
      const prompt = `You are a seated-exercise coach for a wheelchair user. Current exercise: ${exercise}. The vision system reported this deviation: ${deviation}. Pose context: ${poseSummary}. Recent corrections already given: ${recent || "none"}. Exercise guidance: ${guidanceFor(exercise)}. Decide whether to speak a correction now (avoid nagging if it was just said). If yes, write ONE short, warm, specific correction a person with limited mobility can act on (under 14 words, no jargon). Identify the body part to highlight on screen. Return JSON.`;
      const schema = {
        type: "object",
        properties: {
          should_correct: { type: "boolean" },
          message: { type: "string" },
          body_part: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] }
        },
        required: ["should_correct"]
      };
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      const data = res.data || res;
      return Response.json({
        should_correct: !!data.should_correct,
        message: data.message || "",
        body_part: data.body_part || "",
        severity: data.severity || "low"
      });
    }

    if (task === "summary") {
      const exercises = Array.isArray(body.exercises) ? body.exercises : [];
      const totalReps = exercises.reduce((s, e) => s + (Number(e.reps) || 0), 0);
      const totalTarget = exercises.reduce((s, e) => s + (Number(e.targetReps) || 0), 0);
      const corrections = exercises.reduce((s, e) => s + (Number(e.corrections) || 0), 0);
      const duration = Number(body.durationSeconds) || 0;
      const prompt = `You are a seated-exercise coach for a wheelchair user. Summarize their session. Exercises: ${exercises.map(e => `${e.name} (${e.reps}/${e.targetReps} reps, ${e.corrections} corrections)`).join("; ")}. Total ${totalReps} reps over ${duration} seconds, ${corrections} corrections. Return JSON with: a 1-2 sentence spoken summary praising effort, a short note on what improved, and one concrete focus for next time. Warm, accessible, no jargon.`;
      const schema = {
        type: "object",
        properties: {
          summary: { type: "string" },
          highlight: { type: "string" },
          focus_next: { type: "string" }
        },
        required: ["summary", "focus_next"]
      };
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      const data = res.data || res;
      // Persist the session record to the signed-in user's history.
      try {
        const user = await base44.auth.me().catch(() => null);
        if (user) await base44.asServiceRole.entities.SessionRecord.create({
          user_id: user?.id || "",
          user_email: user?.email || "",
          body_parts: body.bodyParts || [],
          exercises: exercises.map(e => e.name),
          reps_completed: totalReps,
          target_reps: totalTarget,
          corrections_count: corrections,
          duration_seconds: duration,
          summary: data.summary || "",
          focus_next: data.focus_next || ""
        });
      } catch (_e) { /* persistence is best-effort for the demo */ }
      return Response.json({
        summary: data.summary || `You completed ${totalReps} reps. Great work.`,
        highlight: data.highlight || "",
        focus_next: data.focus_next || "Keep showing up."
      });
    }

    if (task === "converse") {
      const transcript = body.transcript || "";
      const exercise = body.exercise || "Arm Raises";
      const repCount = Number(body.repCount) || 0;
      const targetReps = Number(body.targetReps) || 10;
      const recent = Array.isArray(body.recentCorrections) ? body.recentCorrections.slice(-3).join(" | ") : "";
      const prompt = `You are a seated-exercise coach for a wheelchair user, talking with them LIVE during ${exercise}. They just said: "${transcript}". Current reps: ${repCount}/${targetReps}. Recent things you said: ${recent || "none"}. Ground any advice in this exercise guidance knowledge base: ${guidanceFor(exercise)}. If they mention pain, numbness or tingling, tell them to stop and rest. Respond conversationally in ONE short sentence (under 20 words). Be warm, specific, and encouraging. If they clearly want to stop or be done, set should_finish true. If they ask about form, reps, or anything else, answer helpfully. No jargon. No em-dashes.`;
      const schema = {
        type: "object",
        properties: {
          response: { type: "string" },
          should_finish: { type: "boolean" }
        },
        required: ["response", "should_finish"]
      };
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      const data = res.data || res;
      return Response.json({
        response: data.response || "Keep going, you're doing great.",
        should_finish: !!data.should_finish
      });
    }

    if (task === "therapistReport") {
      const sessions = (Array.isArray(body.sessions) ? body.sessions : []).slice(0, 30).map(s => ({
        date: String(s.date || "").slice(0, 10),
        exercises: (Array.isArray(s.exercises) ? s.exercises : []).slice(0, 10).map(x => String(x).slice(0, 60)),
        reps: Number(s.reps) || 0,
        target: Number(s.target) || 0,
        corrections: Number(s.corrections) || 0,
        duration: Number(s.duration) || 0
      }));
      const prompt = `You are assisting an occupational therapist reviewing a client's home seated-exercise data from an AI movement coach (hand open-close, finger spreads, left/right/both hands). Client has limited mobility. Session log (most recent first): ${JSON.stringify(sessions)}. Daily rep goal ${Number(body.dailyTarget) || 15}, weekly ${Number(body.weeklyTarget) || 60}. Write a concise clinical-style report: an overall assessment, observed trends (adherence, completion rate, form corrections, side asymmetry if visible), concerns to watch, and 3-5 recommended therapy exercises with sets/reps and rationale, gentle and appropriate for limited mobility. Note this is decision support, final judgment rests with the therapist. No em-dashes.`;
      const schema = {
        type: "object",
        properties: {
          assessment: { type: "string" },
          trends: { type: "array", items: { type: "string" } },
          concerns: { type: "array", items: { type: "string" } },
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: { exercise: { type: "string" }, dosage: { type: "string" }, rationale: { type: "string" } },
              required: ["exercise", "dosage", "rationale"]
            }
          }
        },
        required: ["assessment", "trends", "recommendations"]
      };
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      return Response.json(res.data || res);
    }

    return Response.json({ error: "Unknown task" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || "coach error" }, { status: 500 });
  }
}