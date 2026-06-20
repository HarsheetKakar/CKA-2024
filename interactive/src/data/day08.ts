/**
 * Day 08 — ReplicaSet & Deployment → "Fleet Commander".
 * Cumulative-safe: Days 1-8 (desired vs actual state, self-healing, label selectors, rolling updates).
 */

export const day08Concepts = {
  allowedConcepts: [
    'container',
    'pod',
    'replicaset',
    'deployment',
    'desired-state',
    'actual-state',
    'self-healing',
    'label-selector',
    'rolling-update',
  ],
  introducedConcepts: ['desired-state', 'self-healing', 'label-selector', 'rolling-update'],
};

export interface PodDef {
  id: string;
  version: string;
  healthy: boolean;
  labels: Record<string, string>;
}

export const initialPodLabels = { app: 'nginx', env: 'demo' };

export const labelSelectorQuestion = {
  prompt: 'Which label selector matches the nginx pods?',
  options: [
    { id: 'app-nginx', label: 'app: nginx', correct: true },
    { id: 'app-web', label: 'app: web', correct: false },
    { id: 'env-demo', label: 'env: demo', correct: true },
    { id: 'type-frontend', label: 'type: frontend', correct: false },
  ],
};

export const desiredReplicasTarget = 3;
export const rollingUpdateTargetVersion = 'v2';
