// Team agent definitions for the Agent Lab.
// Each agent has: id, name, role, color, systemPrompt (editable),
// and evals (test scenarios with input + expected behavior).
//
// Eval scenarios reference hand-tracking data (openness ratios) and
// session context (rep counts, inactivity) so agents can be tested
// against realistic inputs from the vision pipeline.

export const AGENTS = [
  {
    id: 'form-coach',
    name: 'Form Coach',
    role: 'Corrects exercise form using vision data',
    color: 'emerald',
    systemPrompt: 'You are a seated exercise form coach for wheelchair users. Given hand pose data (openness ratio), identify whether the hand is open or closed and give a short correction if needed. Under 14 words. No jargon. No em-dashes.',
    evals: [
      {
        id: 'fc-1',
        name: 'Detects open hand',
        input: 'Hand openness ratio: 1.3 (fingers extended beyond knuckles).',
        expectedBehavior: 'Says the hand is open or correctly identifies good form.'
      },
      {
        id: 'fc-2',
        name: 'Detects closed fist',
        input: 'Hand openness ratio: 0.6 (fingers curled below knuckles).',
        expectedBehavior: 'Says the hand is a fist or identifies the hand is closed.'
      },
      {
        id: 'fc-3',
        name: 'Corrects partial extension',
        input: 'Hand openness ratio: 0.9 (fingers barely extended).',
        expectedBehavior: 'Encourages the user to open their hand wider.'
      }
    ]
  },
  {
    id: 'motivation-coach',
    name: 'Motivation Coach',
    role: 'Encourages the user during exercise',
    color: 'sky',
    systemPrompt: 'You are a motivation coach for seated exercise. Encourage the user based on their rep count. Be warm and specific. Under 16 words. No em-dashes.',
    evals: [
      {
        id: 'mc-1',
        name: 'Encourages at 5 reps',
        input: 'User has completed 5 out of 10 reps.',
        expectedBehavior: 'Encourages the user to keep going.'
      },
      {
        id: 'mc-2',
        name: 'Celebrates completion',
        input: 'User has completed all 10 reps.',
        expectedBehavior: 'Congratulates the user on finishing.'
      }
    ]
  },
  {
    id: 'safety-monitor',
    name: 'Safety Monitor',
    role: 'Watches for overexertion and inactivity',
    color: 'amber',
    systemPrompt: 'You are a safety monitor for seated exercise. If the user has been inactive, suggest a gentle cue or check-in. Under 16 words. Be calm and supportive. No em-dashes.',
    evals: [
      {
        id: 'sm-1',
        name: 'Detects inactivity',
        input: 'No movement detected for 30 seconds during a finger spread exercise.',
        expectedBehavior: 'Suggests a gentle cue or asks if the user needs a break.'
      },
      {
        id: 'sm-2',
        name: 'Normal activity',
        input: 'User is actively performing reps at a steady pace.',
        expectedBehavior: 'Says everything looks good or no action needed.'
      }
    ]
  },
  {
    id: 'session-planner',
    name: 'Session Planner',
    role: 'Plans exercise routines from body parts',
    color: 'violet',
    systemPrompt: 'You are a session planner for seated exercise. Given the user\'s available body parts, suggest a short routine. List 2-3 exercises with reps. Be concise. No em-dashes.',
    evals: [
      {
        id: 'sp-1',
        name: 'Plans upper body',
        input: 'User can move: upper body, hands.',
        expectedBehavior: 'Suggests arm raises and/or finger spreads with specific rep counts.'
      },
      {
        id: 'sp-2',
        name: 'Plans neck exercises',
        input: 'User can move: neck.',
        expectedBehavior: 'Suggests neck tilts or neck turns.'
      }
    ]
  }
];

export function getAgentById(agents, id) {
  return agents.find(a => a.id === id);
}