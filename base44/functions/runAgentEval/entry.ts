import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// runAgentEval: two-step LLM-as-judge evaluation.
// Step 1: Run the agent (its system prompt + eval input) → get response.
// Step 2: Score the response against expected behavior → pass/fail + score.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { agentPrompt, input, expectedBehavior, scenario } = body;

    // Step 1: Run the agent.
    const fullPrompt = `${agentPrompt}\n\nInput: ${input}\n\nRespond in one short sentence.`;
    const agentRes = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: fullPrompt });
    const agentResponse = typeof agentRes === 'string'
      ? agentRes
      : (agentRes.data || JSON.stringify(agentRes));

    // Step 2: Judge the response.
    const judgePrompt = `You are an evaluator scoring an AI exercise coach agent's response.

Scenario: ${scenario || 'general'}
Input given to agent: ${input || 'n/a'}
Expected behavior: ${expectedBehavior || 'responds helpfully'}
Agent's response: "${agentResponse}"

Score from 0 to 10. A score of 7 or higher is a pass. Return JSON with the numeric score, boolean passed, and brief reasoning (one sentence).`;

    const judgeSchema = {
      type: "object",
      properties: {
        score: { type: "number" },
        passed: { type: "boolean" },
        reasoning: { type: "string" }
      },
      required: ["score", "passed", "reasoning"]
    };

    const judgeRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: judgePrompt,
      response_json_schema: judgeSchema
    });
    const judgeData = judgeRes.data || judgeRes;

    return Response.json({
      response: agentResponse,
      score: judgeData.score,
      passed: judgeData.passed,
      reasoning: judgeData.reasoning
    });
  } catch (error) {
    return Response.json({ error: error.message || "eval error" }, { status: 500 });
  }
}