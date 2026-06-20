/**
 * Day 06 — Bootstrap the Cluster: KIND (Kubernetes in Docker).
 * Concepts (Days 1-6): KIND, Docker, kubectl, cluster config, multi-node, node roles.
 */

export const day06Concepts = {
  allowedConcepts: [
    'kind',
    'kubernetes-in-docker',
    'docker',
    'kubectl',
    'cluster',
    'nodes',
    'control-plane',
    'worker',
  ],
  introducedConcepts: ['kind-bootstrap', 'local-cluster', 'node-roles'],
};

export interface BootstrapStep {
  id: string;
  label: string;
  detail?: string;
}

export const bootstrapSteps: BootstrapStep[] = [
  {
    id: 'step-docker',
    label: 'Install Docker',
    detail: 'KIND runs Kubernetes inside Docker containers',
  },
  {
    id: 'step-kubectl',
    label: 'Install kubectl',
    detail: 'The CLI tool to talk to your cluster',
  },
  {
    id: 'step-kind',
    label: 'Install kind',
    detail: 'The tool that creates a local Kubernetes cluster',
  },
  {
    id: 'step-config',
    label: 'Write kind.yaml config',
    detail: 'Define nodes and their roles (control-plane, worker)',
  },
  {
    id: 'step-create',
    label: 'Run kind create cluster',
    detail: 'Spin up your local cluster',
  },
  {
    id: 'step-verify',
    label: 'kubectl get nodes',
    detail: 'Verify all nodes are ready',
  },
];

export const correctBootstrapOrder = [
  'step-docker',
  'step-kubectl',
  'step-kind',
  'step-config',
  'step-create',
  'step-verify',
];

export interface FillBlank {
  id: string;
  label: string;
  expected: string | string[];
  prompt: string;
  hint: string;
}

/**
 * Fill-in-the-blank questions. `expected` is a string or array of acceptable answers.
 * For the cluster name: "cka-cluster" is standard (from the task.md it's cka-cluster2, but cka-cluster is reasonable).
 * For node roles: control-plane and worker (twice).
 */
export const blanks: FillBlank[] = [
  {
    id: 'blank-cluster-name',
    label: 'Cluster Name',
    expected: ['cka-cluster', 'cka-cluster2', 'my-cluster', 'kindcluster'],
    prompt:
      'In the command `kind create cluster --config kind.yaml --name ____`, what name would you choose?',
    hint: 'A short, hyphenated name like "cka-cluster"',
  },
  {
    id: 'blank-role-1',
    label: 'First Node Role',
    expected: 'control-plane',
    prompt: 'What role should the first node have?',
    hint: 'The node that coordinates the cluster (hint: "control-plane")',
  },
  {
    id: 'blank-role-2',
    label: 'Second Node Role',
    expected: 'worker',
    prompt: 'What role should the second node have?',
    hint: '"worker" nodes run your apps',
  },
  {
    id: 'blank-role-3',
    label: 'Third Node Role',
    expected: 'worker',
    prompt: 'What role should the third node have?',
    hint: '"worker" nodes run your apps',
  },
];
