/**
 * Day 05 — Binding Magistrate: Kubernetes architecture.
 *
 * You play the kube-scheduler. Stage 1 ("The Bench") is a constraint-satisfaction puzzle:
 * bind each Pending Pod to a worker node that satisfies resource fit, nodeSelector, and
 * taints/tolerations — the real predicates a scheduler runs. Stage 2 ("Certify the trail")
 * pins down who-does-what across the bind→run lifecycle, targeting the classic confusions:
 * the scheduler only decides (it does not run pods), only the API server talks to etcd,
 * the kubelet runs containers, and kube-proxy wires networking.
 */

export const day05Concepts = {
  allowedConcepts: [
    'kubernetes',
    'control-plane',
    'worker-node',
    'scheduler',
    'api-server',
    'etcd',
    'kubelet',
    'kube-proxy',
    'binding',
    'resource-requests',
    'node-selector',
    'taints-tolerations',
  ],
  introducedConcepts: ['scheduling-predicates', 'binding-through-apiserver', 'component-roles'],
};

/** A NoSchedule taint a node carries; a Pod needs a matching toleration to land there. */
export interface Taint {
  key: string;
  value: string;
  effect: 'NoSchedule';
}

export interface WorkerNode {
  id: string;
  name: string;
  /** Allocatable CPU in whole cores. */
  cpu: number;
  /** Allocatable memory in Gi. */
  mem: number;
  labels: Record<string, string>;
  taints: Taint[];
}

export interface PendingPod {
  id: string;
  name: string;
  /** Requested CPU in whole cores. */
  cpu: number;
  /** Requested memory in Gi. */
  mem: number;
  /** Every key/value here must be present on the chosen node's labels. */
  nodeSelector?: Record<string, string>;
  /** Taints this Pod tolerates (key+value+effect must match the node's taint). */
  tolerations?: Taint[];
  /** Short human reason shown as a hint on the card. */
  note: string;
}

export const workerNodes: WorkerNode[] = [
  {
    id: 'node-edge-1',
    name: 'edge-1',
    cpu: 4,
    mem: 8,
    labels: { disktype: 'ssd' },
    taints: [],
  },
  {
    id: 'node-edge-2',
    name: 'edge-2',
    cpu: 4,
    mem: 8,
    labels: {},
    taints: [],
  },
  {
    id: 'node-gpu-1',
    name: 'gpu-1',
    cpu: 8,
    mem: 16,
    labels: { gpu: 'true' },
    taints: [{ key: 'gpu', value: 'true', effect: 'NoSchedule' }],
  },
];

export const pendingPods: PendingPod[] = [
  {
    id: 'pod-ml-trainer',
    name: 'ml-trainer',
    cpu: 4,
    mem: 8,
    nodeSelector: { gpu: 'true' },
    tolerations: [{ key: 'gpu', value: 'true', effect: 'NoSchedule' }],
    note: 'Needs a GPU node and tolerates its taint.',
  },
  {
    id: 'pod-inference',
    name: 'inference',
    cpu: 4,
    mem: 8,
    tolerations: [{ key: 'gpu', value: 'true', effect: 'NoSchedule' }],
    note: 'Tolerates the GPU taint; heavy CPU/mem request.',
  },
  {
    id: 'pod-ssd-cache',
    name: 'ssd-cache',
    cpu: 2,
    mem: 4,
    nodeSelector: { disktype: 'ssd' },
    note: 'Must land on an SSD-backed node.',
  },
  {
    id: 'pod-web',
    name: 'web',
    cpu: 2,
    mem: 4,
    note: 'No special requirements — any node with room.',
  },
  {
    id: 'pod-worker',
    name: 'worker',
    cpu: 2,
    mem: 4,
    note: 'No special requirements — any node with room.',
  },
];

/**
 * Stage 2 — attribution rows. Each lifecycle action maps to exactly one component id.
 * Targets the misconceptions: scheduler decides (≠ runs), only the API server persists to
 * etcd, the kubelet starts containers, kube-proxy wires networking.
 */
export interface ClusterComponent {
  id: string;
  label: string;
}

export const clusterComponents: ClusterComponent[] = [
  { id: 'scheduler', label: 'Scheduler' },
  { id: 'apiserver', label: 'API server' },
  { id: 'etcd', label: 'etcd' },
  { id: 'kubelet', label: 'kubelet' },
  { id: 'kube-proxy', label: 'kube-proxy' },
];

export interface WarrantRow {
  id: string;
  action: string;
  answer: string;
}

export const warrantRows: WarrantRow[] = [
  {
    id: 'decide',
    action: 'Pick which node a Pending Pod should run on.',
    answer: 'scheduler',
  },
  {
    id: 'persist',
    action: "Persist the scheduler's binding to etcd — the only component that talks directly to etcd.",
    answer: 'apiserver',
  },
  {
    id: 'store',
    action: "Store the cluster's desired state as key/value data.",
    answer: 'etcd',
  },
  {
    id: 'run',
    action: "Pull the image and start the Pod's containers on the node.",
    answer: 'kubelet',
  },
  {
    id: 'network',
    action: 'Program node networking so the new Pod is reachable via its Service.',
    answer: 'kube-proxy',
  },
];

export const day05Copy = {
  lede:
    'Pending Pods are queued at the bench. As the kube-scheduler, read each Pod\u2019s demands, ' +
    'inspect the worker nodes, and issue a binding to a node that fits. You never run the Pod \u2014 ' +
    'once your binding lands, the node\u2019s kubelet starts it.',
  benchDone: 'Every Pod is lawfully bound. Now certify who carries out each step.',
  certifyDone: 'Bindings issued and the trail certified. Court adjourned.',
};
