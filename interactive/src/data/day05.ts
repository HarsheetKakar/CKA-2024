/**
 * Day 05 — Build the Bridge: Kubernetes architecture.
 * Concepts (Days 1-5): control-plane vs worker; API server, scheduler, etcd, controller-manager,
 * kubelet, kube-proxy, container runtime; request flow.
 */

export const day05Concepts = {
  allowedConcepts: [
    'kubernetes',
    'control-plane',
    'worker-node',
    'api-server',
    'scheduler',
    'etcd',
    'controller-manager',
    'kubelet',
    'kube-proxy',
    'container-runtime',
  ],
  introducedConcepts: ['control-plane-bridge', 'worker-deck', 'request-flow'],
};

export interface NodeComponent {
  id: string;
  label: string;
  detail?: string;
  correct: 'control-plane' | 'worker';
}

export const nodeComponents: NodeComponent[] = [
  {
    id: 'comp-api-server',
    label: 'API server',
    detail: 'Listens for kubectl commands',
    correct: 'control-plane',
  },
  {
    id: 'comp-scheduler',
    label: 'Scheduler',
    detail: 'Picks which node gets the next workload',
    correct: 'control-plane',
  },
  {
    id: 'comp-etcd',
    label: 'etcd',
    detail: 'Database storing the cluster state',
    correct: 'control-plane',
  },
  {
    id: 'comp-controller-manager',
    label: 'Controller Manager',
    detail: 'Runs control loops (self-healing)',
    correct: 'control-plane',
  },
  {
    id: 'comp-kubelet',
    label: 'kubelet',
    detail: 'Node agent running containers',
    correct: 'worker',
  },
  {
    id: 'comp-kube-proxy',
    label: 'kube-proxy',
    detail: 'Wires up networking and load-balancing',
    correct: 'worker',
  },
  {
    id: 'comp-runtime',
    label: 'Container Runtime',
    detail: 'Runs the actual containers (Docker, etc)',
    correct: 'worker',
  },
];

export interface FlowStep {
  id: string;
  label: string;
  detail?: string;
}

export const flowSteps: FlowStep[] = [
  {
    id: 'flow-kubectl',
    label: 'kubectl apply (your command)',
    detail: 'You send a manifest to the cluster',
  },
  {
    id: 'flow-api-server',
    label: 'API Server receives the request',
    detail: 'Accepts your manifest',
  },
  {
    id: 'flow-auth',
    label: 'Authentication & validation',
    detail: 'Check permissions and manifest syntax',
  },
  {
    id: 'flow-etcd',
    label: 'etcd stores desired state',
    detail: 'Persist the config to the database',
  },
  {
    id: 'flow-scheduler',
    label: 'Scheduler assigns a node',
    detail: 'Picks best node for the pod',
  },
  {
    id: 'flow-kubelet',
    label: 'kubelet receives instructions',
    detail: 'Node agent on the chosen node',
  },
  {
    id: 'flow-container-runtime',
    label: 'Container Runtime launches the container',
    detail: 'Docker or containerd starts the app',
  },
  {
    id: 'flow-kube-proxy',
    label: 'kube-proxy wires networking',
    detail: 'Pod gets an IP and load-balancing',
  },
];

export const correctFlowOrder = [
  'flow-kubectl',
  'flow-api-server',
  'flow-auth',
  'flow-etcd',
  'flow-scheduler',
  'flow-kubelet',
  'flow-container-runtime',
  'flow-kube-proxy',
];
