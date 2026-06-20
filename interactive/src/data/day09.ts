/**
 * Day 09 — Kubernetes Services → "Signal Cables".
 * Cumulative-safe: Days 1-9 (Services, label selectors, ClusterIP/NodePort/LoadBalancer/ExternalName).
 */

export const day09Concepts = {
  allowedConcepts: [
    'container',
    'pod',
    'service',
    'label',
    'label-selector',
    'clusterip',
    'nodeport',
    'loadbalancer',
    'externalname',
  ],
  introducedConcepts: ['service', 'service-types', 'label-selector-binding'],
};

export interface PodNodeDef {
  id: string;
  label: string;
  labels: Record<string, string>;
}

export const servicePods: PodNodeDef[] = [
  { id: 'pod-web-1', label: 'pod-web-1', labels: { app: 'web', env: 'demo' } },
  { id: 'pod-web-2', label: 'pod-web-2', labels: { app: 'web', env: 'demo' } },
  { id: 'pod-web-3', label: 'pod-web-3', labels: { app: 'web', env: 'prod' } },
  { id: 'pod-api-1', label: 'pod-api-1', labels: { app: 'api', env: 'demo' } },
  { id: 'pod-api-2', label: 'pod-api-2', labels: { app: 'api', env: 'prod' } },
  { id: 'pod-db-1', label: 'pod-db-1', labels: { app: 'db', env: 'demo' } },
];

export const serviceSelector = { app: 'web' };

export const correctPodIds = servicePods.filter((p) => p.labels.app === 'web').map((p) => p.id);

export interface ServiceTypeQuizQuestion {
  id: string;
  scenario: string;
  correctAnswer: string;
}

export const serviceTypeQuiz: ServiceTypeQuizQuestion[] = [
  {
    id: 'q1',
    scenario: 'Internal cluster-only access to your app (no external exposure)',
    correctAnswer: 'ClusterIP',
  },
  {
    id: 'q2',
    scenario: 'Access the app on a specific node port (e.g., 30001) from outside the cluster',
    correctAnswer: 'NodePort',
  },
  {
    id: 'q3',
    scenario: 'Expose the app with a public cloud load balancer IP or domain',
    correctAnswer: 'LoadBalancer',
  },
  {
    id: 'q4',
    scenario: 'Route traffic to an external DNS name (e.g., my.api.example.com)',
    correctAnswer: 'ExternalName',
  },
];

export const serviceTypeOptions = ['ClusterIP', 'NodePort', 'LoadBalancer', 'ExternalName'];
