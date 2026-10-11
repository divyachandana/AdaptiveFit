import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Metaprompting: uses an LLM to optimize an agent's system prompt
// based on eval failures. This is "prompt generation by LLM" —
// the meta-level prompt engineers the agent-level prompt.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { role, currentPrompt, evalFailures } = body;

    const failures = Array.isArray(evalFailures) ? evalFailures : [];
    const failureText = failures.length > 0
      ? failures.map(f =>
          `- Scenario: ${f.scenario || 'unknown'}\n  Input: ${f.input || 'n/a'}\n  Agent said: ${f.response || 'n/a'}\n  Issue: ${f.reasoning || 'failed eval'}`
        ).join('\n')
      : 'No specific failures recorded. Improve clarity and specificity.';

    const prompt = `You are a prompt engineer for AI exercise coach agents. Improve this system prompt.

Agent role: ${role || 'exercise coach'}

Current system prompt:
${currentPrompt || '(empty)'}

Evaluation failures:
${failureText}

Rewrite the system prompt to address these failures. Keep it under 200 words, clear, specific, and actionable. Return the improved prompt and a brief summary of what changed.`;

    const schema = {
      type: "object",
      properties: {
        optimizedPrompt: { type: "string" },
        changes: { type: "string" }
      },
      required: ["optimizedPrompt", "changes"]
    };

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    const data = res.data || res;
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message || "metaprompt error" }, { status: 500 });
  }
}