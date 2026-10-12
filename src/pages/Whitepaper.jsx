import React, { useEffect, useState } from "react";
import { Check, Activity, Mic, Hand, Brain, Camera, Heart, Zap, ArrowRight } from "lucide-react";

const SECTIONS = [
  { id: "problem", label: "The Problem" },
  { id: "solution", label: "The Solution" },
  { id: "features", label: "Key Features" },
  { id: "architecture", label: "Architecture" },
  { id: "technology", label: "Technology Stack" },
  { id: "impact", label: "Impact" },
  { id: "roadmap", label: "Roadmap" },
];

const FEATURES = [
  { icon: Hand, title: "Real-Time Hand Tracking", desc: "MediaPipe Hands detects 21 landmarks per hand, tracking individual finger extension, flexion, and spread with sub-100ms inference latency." },
  { icon: Mic, title: "Two-Way Voice Coaching", desc: "Continuous, hands-free conversation via the Web Speech API. The microphone never mutes during coaching, with echo filtering to prevent the coach from hearing itself." },
  { icon: Brain, title: "Dual-Path Reasoning", desc: "A local fast-path counts reps and fires instant cues, while an LLM reasoning layer provides warmer, context-aware corrections when deviations persist." },
  { icon: Activity, title: "Adaptive Rep Counting", desc: "Scale-invariant finger-openness ratios track reps regardless of hand size or distance from the camera, with proactive inactivity cues if movement stops." },
  { icon: Heart, title: "Accessibility-First Design", desc: "Large touch targets, high contrast, voice-first interaction, and minimal fine-motor reliance throughout the entire experience." },
  { icon: Zap, title: "Session Intelligence", desc: "Each session generates a personalized summary with stats, coaching highlights, and a recommended focus for the next workout." },
];

const ARCH_STEPS = [
  { num: "01", title: "Vision Capture", desc: "getUserMedia streams the camera into a video element at 640×480, mirrored for natural user interaction." },
  { num: "02", title: "Landmark Detection", desc: "MediaPipe Hands runs on a throttled rAF loop (90ms cadence) to extract 21 hand landmarks per frame." },
  { num: "03", title: "Local Fast Path", desc: "Finger-openness ratios and rep-state machines count reps and fire instant spoken cues for clear form deviations." },
  { num: "04", title: "LLM Reasoning Path", desc: "Persistent deviations route to the adaptiveCoach backend function for warmer, context-aware corrections with severity scoring." },
  { num: "05", title: "Voice Conversation", desc: "SpeechRecognition transcribes user speech continuously, filtering coach echo and detecting natural-language commands like 'I'm done' or 'keep going'." },
  { num: "06", title: "Session Summary", desc: "On completion, the LLM generates a personalized recap saved to the SessionRecord entity with stats and next-session focus." },
];

const TECH_STACK = [
  { name: "MediaPipe Hands", role: "21-landmark hand pose detection", pinned: "v0.4.1675469240" },
  { name: "Web Speech API", role: "SpeechRecognition + SpeechSynthesis" },
  { name: "React + Tailwind", role: "Responsive, accessible UI" },
  { name: "Base44 LLM Backend", role: "adaptiveCoach reasoning function" },
  { name: "Vite + CDN Loading", role: "Minimal bundle, fast load" },
];

const ROADMAP = [
  { phase: "Current", items: ["Finger spread exercises with full voice coaching", "Dual-path vision + LLM correction", "Session summaries with next-focus recommendations", "Model sandbox for benchmarking tracking models"] },
  { phase: "Next", items: ["Full-body pose tracking (MediaPipe Pose Landmarker)", "Seated arm raises, elbow bends, and neck mobility exercises", "Multi-exercise session planning from body-part selection", "Progress tracking across sessions with trend visualization"] },
  { phase: "Future", items: ["Native iOS/Android build with push notifications", "Wearable integration for heart-rate-informed pacing", "Caregiver dashboard for remote monitoring", "Multi-language voice coaching"] },
];

export default function Whitepaper() {
  const [activeSection, setActiveSection] = useState("problem");
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <video
            src="https://media.base44.com/videos/public/6acbcb036c4b21c6fdd3e3d6/bf9686fef_AdaptiveFit_Hero.mp4"
            autoPlay
            muted
            loop
            playsInline
            onCanPlay={() => setVideoLoaded(true)}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/70 to-neutral-950/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/40" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/20 px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-white/90">AI-Powered Seated Exercise Coach</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
              Inclusive<span className="text-emerald-400">Move</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed mb-8 max-w-xl">
              A multimodal AI movement coach that uses real-time vision and voice guidance
              to provide personalized physical therapy for individuals with limited mobility.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#problem" className="inline-flex items-center gap-2 rounded-full bg-white text-neutral-950 px-6 py-3 font-semibold text-sm hover:bg-white/90 transition">
                Explore the Whitepaper <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#features" className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/20 text-white px-6 py-3 font-semibold text-sm hover:bg-white/15 transition">
                Key Features
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Side Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between h-14 overflow-x-auto gap-6 scrollbar-hide">
            <span className="text-sm font-bold text-white/90 whitespace-nowrap">InclusiveMove</span>
            <div className="flex gap-1">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition ${
                    activeSection === s.id ? "bg-white/15 text-white" : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Problem */}
      <section id="problem" className="py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">The Problem</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-8 leading-tight">
            About 80 million people need a wheelchair. Exercise access remains a barrier.
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              { stat: "80M", label: "People likely to need a wheelchair, about 1% of the world's population", source: "WHO", href: "https://www.who.int/teams/health-product-policy-and-standards/assistive-and-medical-technology/assistive-technology/wheelchair-services" },
              { stat: "47%", label: "Of U.S. adults with disabilities (ages 18 to 64) get no aerobic physical activity", source: "CDC, 2014", href: "https://archive.cdc.gov/www_cdc_gov/media/releases/2014/p0506-disability-activity.html" },
              { stat: "3x", label: "Working-age adults with disabilities are 3 times as likely as adults without disabilities to have heart disease, stroke, diabetes, or cancer", source: "CDC, 2014", href: "https://archive.cdc.gov/www_cdc_gov/media/releases/2014/p0506-disability-activity.html" },
            ].map((c) => (
              <div key={c.stat} className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6">
                <div className="text-4xl font-bold text-emerald-400">{c.stat}</div>
                <p className="text-sm text-white/60 mt-2 leading-relaxed">{c.label}</p>
                <a href={c.href} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-emerald-400/80 hover:text-emerald-300 underline underline-offset-2 mt-3">Source: {c.source}</a>
              </div>
            ))}
          </div>
          <p className="text-lg text-white/70 leading-relaxed mt-12 max-w-3xl">
            Existing fitness apps assume standing mobility and full-body movement. Physical therapy
            is expensive, infrequent, and rarely available at home. Individuals with limited mobility
            need a coach that works from a seated position, adapts to their capabilities, and is available
            on demand, hands-free.
          </p>
        </div>
      </section>

      {/* Solution */}
      <section id="solution" className="py-24 px-6 md:px-12 bg-gradient-to-b from-neutral-950 to-neutral-900">
        <div className="max-w-5xl mx-auto">
          <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">The Solution</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-8 leading-tight">
            A multimodal AI coach that sees your hands, hears your voice, and adapts in real time.
          </h2>
          <p className="text-lg text-white/70 leading-relaxed max-w-3xl mb-12">
            InclusiveMove combines computer vision for pose tracking with natural language understanding
            for conversational coaching. The system runs entirely in the browser, requires no wearable
            sensors, and guides users through seated exercises with spoken rep counting, form corrections,
            and two-way conversation.
          </p>
          <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <Camera className="w-8 h-8 text-emerald-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Vision-Led Coaching</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  MediaPipe Hands tracks 21 landmarks per hand in real time, measuring finger extension,
                  flexion, and spread to count reps and detect form deviations, all without any sensors
                  or wearables.
                </p>
              </div>
              <div>
                <Mic className="w-8 h-8 text-emerald-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Voice-First Interaction</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  The microphone stays on for the entire session. Users talk naturally to the coach,
                  ask questions, and say "I'm done" or "keep going" to control the flow without touching
                  the screen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Key Features</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-12 leading-tight">
            Six capabilities that make coaching accessible.
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6 hover:bg-white/[0.07] transition group">
                <div className="w-12 h-12 rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/20 grid place-items-center mb-4 group-hover:scale-110 transition">
                  <f.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="py-24 px-6 md:px-12 bg-gradient-to-b from-neutral-900 to-neutral-950">
        <div className="max-w-5xl mx-auto">
          <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Architecture</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-12 leading-tight">
            Dual-path reasoning: instant local cues, intelligent LLM corrections.
          </h2>
          <div className="space-y-4">
            {ARCH_STEPS.map((step) => (
              <div key={step.num} className="flex gap-6 items-start rounded-2xl bg-white/5 ring-1 ring-white/10 p-6 hover:bg-white/[0.07] transition">
                <div className="text-2xl font-bold text-emerald-400/60 tabular-nums w-12 shrink-0">{step.num}</div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section id="technology" className="py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Technology Stack</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-12 leading-tight">
            Built on proven, accessible, browser-native technologies.
          </h2>
          <div className="rounded-2xl ring-1 ring-white/10 overflow-hidden">
            {TECH_STACK.map((t, i) => (
              <div key={t.name} className={`flex items-center justify-between px-6 py-5 ${i !== TECH_STACK.length - 1 ? "border-b border-white/10" : ""} ${i % 2 === 0 ? "bg-white/[0.03]" : ""}`}>
                <div>
                  <div className="font-semibold text-white">{t.name}</div>
                  <div className="text-sm text-white/50 mt-0.5">{t.role}</div>
                </div>
                {t.pinned && (
                  <span className="text-xs font-mono text-emerald-400/70 bg-emerald-400/10 rounded-full px-3 py-1">{t.pinned}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section id="impact" className="py-24 px-6 md:px-12 bg-gradient-to-b from-neutral-950 to-neutral-900">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Impact</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-8 leading-tight">
            Independence, dignity, and consistency in every session.
          </h2>
          <p className="text-lg text-white/70 leading-relaxed max-w-3xl mx-auto mb-12">
            Every design decision prioritizes the user's autonomy. No caregiver required. No wearables
            to charge. No complex setup. Open the app, hold up a hand, and begin.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Check, title: "Works at Home", desc: "Seated exercises with just a webcam and speakers." },
              { icon: Brain, title: "Always Adapting", desc: "LLM reasoning tailors corrections to each session." },
              { icon: Heart, title: "Built for Dignity", desc: "Voice-first, hands-free, judgment-free coaching." },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-8">
                <c.icon className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{c.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Roadmap</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-12 leading-tight">
            From hand exercises to full-body mobility.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {ROADMAP.map((phase) => (
              <div key={phase.phase} className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6">
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${phase.phase === "Current" ? "text-emerald-400" : phase.phase === "Next" ? "text-sky-400" : "text-white/40"}`}>
                  {phase.phase}
                </h3>
                <ul className="space-y-3">
                  {phase.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-white/60 leading-relaxed">
                      <span className="text-emerald-400/60 shrink-0">▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-400 grid place-items-center font-bold text-neutral-950">A</div>
            <span className="font-semibold text-white/90">InclusiveMove</span>
          </div>
          <p className="text-sm text-white/40">AI-powered seated exercise coach · Vision + Voice + Reasoning</p>
        </div>
      </footer>
    </div>
  );
}