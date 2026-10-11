import React, { useState, useRef, useCallback, useEffect } from "react";
import AgentCard from "@/components/sandbox/AgentCard";
import HeartbeatMonitor from "@/components/sandbox/HeartbeatMonitor";
import { AGENTS } from "@/lib/sandbox/agents";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

export default function AgentLab() {
  const [agents, setAgents] = useState(() => AGENTS.map(a => ({ ...a })));
  const [evalResults, setEvalResults] = useState({});
  const [optimizingId, setOptimizingId] = useState(null);
  const [metapromptResults, setMetapromptResults] = useState({});
  const [loopState, setLoopState] = useState("idle"); // idle | running-evals | optimizing | re-running | done
  const [heartbeatStatus, setHeartbeatStatus] = useState({});
  const [lastCheck, setLastCheck] = useState(null);
  const [heartbeatEnabled, setHeartbeatEnabled] = useState(false);

  const heartbeatTimerRef = useRef(null);
  const agentsRef = useRef(agents);
  useEffect(() => { agentsRef.current = agents; }, [agents]);

  // ─── Run a single eval ───
  const runSingleEval = useCallback(async (agent, evalItem) => {
    try {
      const res = await base44.functions.invoke("runAgentEval", {
        agentPrompt: agent.systemPrompt,
        input: evalItem.input,
        expectedBehavior: evalItem.expectedBehavior,
        scenario: evalItem.name,
      });
      const data = res?.data || res;
      return {
        response: data.response,
        score: data.score,
        passed: data.passed,
        reasoning: data.reasoning,
      };
    } catch (e) {
      return { response: `Error: ${e.message}`, score: 0, passed: false, reasoning: "Function call failed" };
    }
  }, []);

  // ─── Run all evals for all agents ───
  const runAllEvals = useCallback(async () => {
    const currentAgents = agentsRef.current;
    const results = {};
    for (const agent of currentAgents) {
      results[agent.id] = {};
      for (const ev of agent.evals) {
        const result = await runSingleEval(agent, ev);
        results[agent.id][ev.id] = result;
        setEvalResults(prev => ({ ...prev, [agent.id]: { ...results[agent.id] } }));
      }
    }
    return results;
  }, [runSingleEval]);

  // ─── Optimize a single agent's prompt via metaprompting ───
  const optimizeAgent = useCallback(async (agentId) => {
    const agent = agentsRef.current.find(a => a.id === agentId);
    if (!agent) return;
    setOptimizingId(agentId);
    try {
      // Collect failed evals for this agent.
      const failed = [];
      const results = evalResults[agentId] || {};
      for (const ev of agent.evals) {
        const r = results[ev.id];
        if (r && !r.passed) {
          failed.push({
            scenario: ev.name,
            input: ev.input,
            response: r.response,
            reasoning: r.reasoning,
          });
        }
      }

      const res = await base44.functions.invoke("metaprompt", {
        role: agent.role,
        currentPrompt: agent.systemPrompt,
        evalFailures: failed,
      });
      const data = res?.data || res;

      if (data.optimizedPrompt) {
        setAgents(prev => prev.map(a =>
          a.id === agentId ? { ...a, systemPrompt: data.optimizedPrompt } : a
        ));
        setMetapromptResults(prev => ({
          ...prev,
          [agentId]: { oldPrompt: agent.systemPrompt, optimizedPrompt: data.optimizedPrompt, changes: data.changes },
        }));
      }
    } catch (e) {
      // silent — the UI stays in its current state
    } finally {
      setOptimizingId(null);
    }
  }, [evalResults]);

  // ─── Run the full loop: evals → optimize → re-eval ───
  const runLoop = useCallback(async () => {
    setLoopState("running-evals");
    const results = await runAllEvals();

    // Check for failures.
    const failedAgents = [];
    for (const agent of agentsRef.current) {
      const agentResults = results[agent.id] || {};
      const hasFailures = agent.evals.some(ev => agentResults[ev.id] && !agentResults[ev.id].passed);
      if (hasFailures) failedAgents.push(agent.id);
    }

    if (failedAgents.length === 0) {
      setLoopState("done");
      return;
    }

    // Optimize failed agents.
    setLoopState("optimizing");
    for (const agentId of failedAgents) {
      await optimizeAgent(agentId);
    }

    // Re-run evals with optimized prompts.
    setLoopState("re-running");
    await runAllEvals();
    setLoopState("done");
  }, [runAllEvals, optimizeAgent]);

  // ─── Heartbeat: run a lightweight eval for each agent ───
  const runHeartbeat = useCallback(async () => {
    const currentAgents = agentsRef.current;
    const status = {};
    for (const agent of currentAgents) {
      const start = Date.now();
      try {
        const firstEval = agent.evals[0];
        const res = await base44.functions.invoke("runAgentEval", {
          agentPrompt: agent.systemPrompt,
          input: firstEval.input,
          expectedBehavior: firstEval.expectedBehavior,
          scenario: firstEval.name,
        });
        const data = res?.data || res;
        const latencyMs = Date.now() - start;
        status[agent.id] = {
          name: agent.name,
          state: data.passed ? "healthy" : "unhealthy",
          latencyMs,
        };
      } catch (e) {
        status[agent.id] = {
          name: agent.name,
          state: "unhealthy",
          latencyMs: Date.now() - start,
        };
      }
    }
    setHeartbeatStatus(status);
    setLastCheck(new Date());
  }, []);

  // Heartbeat timer.
  useEffect(() => {
    if (!heartbeatEnabled) {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      return;
    }
    runHeartbeat();
    heartbeatTimerRef.current = setInterval(runHeartbeat, 60000);
    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [heartbeatEnabled, runHeartbeat]);

  const handlePromptChange = useCallback((agentId, newPrompt) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, systemPrompt: newPrompt } : a));
  }, []);

  const loopLabel = {
    "idle": "Run Loop",
    "running-evals": "Running evals…",
    "optimizing": "Optimizing prompts…",
    "re-running": "Re-running evals…",
    "done": "Loop complete",
  }[loopState];

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <header className="max-w-5xl mx-auto px-5 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white grid place-items-center font-bold">A</div>
          <span className="font-semibold text-neutral-900 tracking-tight">Agent Lab</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/sandbox" className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors">
            Model Sandbox →
          </Link>
          <Link to="/" className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors">
            App →
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Team Agent Evaluation Loop</h1>
          <p className="text-sm text-neutral-500 mt-1 max-w-2xl">
            Four AI coaching agents, each with eval scenarios. Run the loop to test all agents,
            optimize failed prompts via metaprompting, and re-evaluate. Heartbeat monitors agent
            health every 60 seconds.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={loopState === "idle" || loopState === "done" ? runLoop : undefined}
            disabled={loopState !== "idle" && loopState !== "done"}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loopLabel}
          </button>
          <button
            onClick={runAllEvals}
            disabled={loopState !== "idle" && loopState !== "done"}
            className="px-4 py-2.5 rounded-lg text-sm font-medium border border-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 transition-colors"
          >
            Run Evals Only
          </button>
          {loopState === "done" && (
            <button
              onClick={() => { setLoopState("idle"); setEvalResults({}); setMetapromptResults({}); }}
              className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {/* Heartbeat */}
        <HeartbeatMonitor
          heartbeatStatus={heartbeatStatus}
          lastCheck={lastCheck}
          onToggle={() => setHeartbeatEnabled(prev => !prev)}
          enabled={heartbeatEnabled}
        />

        {/* Agent cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {agents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              evalResults={evalResults}
              onPromptChange={handlePromptChange}
              onOptimize={optimizeAgent}
              optimizing={optimizingId === agent.id}
              metapromptResult={metapromptResults[agent.id]}
            />
          ))}
        </div>

        {/* Metaprompt results summary */}
        {Object.keys(metapromptResults).length > 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
            <h3 className="font-semibold text-neutral-900">Metaprompting Results</h3>
            {Object.entries(metapromptResults).map(([agentId, result]) => {
              const agent = agents.find(a => a.id === agentId);
              return (
                <div key={agentId} className="space-y-1">
                  <p className="text-sm font-medium text-neutral-700">{agent?.name}</p>
                  <p className="text-xs text-neutral-500">{result.changes}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}