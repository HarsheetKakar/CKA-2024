/**
 * Day 04 — Outage Response: orchestrator capabilities.
 * Concepts (Days 1-4): standalone container limits, what an orchestrator adds.
 * Capabilities (no YAML, no future objects): self-healing, horizontal scaling, rollback,
 * service discovery/load-balancing, rescheduling.
 */

export const day04Concepts = {
  allowedConcepts: [
    'container',
    'orchestrator',
    'self-healing',
    'scaling',
    'rollback',
    'discovery',
  ],
  introducedConcepts: [
    'self-healing-restart',
    'horizontal-scaling',
    'rollback-previous',
    'service-discovery',
    'node-rescheduling',
  ],
};

export interface OutageScenario {
  id: string;
  scenario: string;
  prompt: string;
  choices: { id: string; label: string }[];
  correct: string;
}

const capabilities = [
  { id: 'cap-self-heal', label: 'Restart failed workloads automatically' },
  { id: 'cap-scale', label: 'Scale horizontally to handle traffic spikes' },
  { id: 'cap-rollback', label: 'Roll back to a previous working version' },
  { id: 'cap-discovery', label: 'Maintain stable DNS and load-balance requests' },
  { id: 'cap-reschedule', label: 'Reschedule workloads to healthy nodes' },
];

export const outageScenarios: OutageScenario[] = [
  {
    id: 'q-crash',
    scenario: '📡 3 AM emergency alert',
    prompt: 'Your app container crashed at 3 AM on a Friday. What should the orchestrator do?',
    choices: [capabilities[0], capabilities[1], capabilities[3], capabilities[4]],
    correct: 'cap-self-heal',
  },
  {
    id: 'q-traffic',
    scenario: '🎉 Black Friday begins',
    prompt: 'Traffic is 10× normal. Your app is drowned. What helps most?',
    choices: [capabilities[0], capabilities[1], capabilities[2], capabilities[3]],
    correct: 'cap-scale',
  },
  {
    id: 'q-buggy',
    scenario: '🔴 Release goes wrong',
    prompt: 'You deployed a new version, but it has critical bugs. How do you recover quickly?',
    choices: [capabilities[1], capabilities[2], capabilities[3], capabilities[4]],
    correct: 'cap-rollback',
  },
  {
    id: 'q-addresses',
    scenario: '🔗 Discovery chaos',
    prompt: 'Your service instances keep getting different IP addresses. Clients lose track. How?',
    choices: [capabilities[0], capabilities[2], capabilities[3], capabilities[4]],
    correct: 'cap-discovery',
  },
  {
    id: 'q-node-fail',
    scenario: '💀 Node failure',
    prompt:
      'A server (node) in your cluster died, taking all its workloads with it. What saves you?',
    choices: [capabilities[1], capabilities[2], capabilities[3], capabilities[4]],
    correct: 'cap-reschedule',
  },
];

export const outageQuestions = outageScenarios.map((s) => ({
  id: s.id,
  scenario: s.scenario,
  prompt: s.prompt,
  choices: s.choices,
}));
