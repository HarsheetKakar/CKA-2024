/**
 * Day 10 — Namespaces → "Harbor Partition".
 * Cumulative-safe: Days 1-10 (namespaces, isolation, same-namespace short names, cross-namespace FQDN).
 */

export const day10Concepts = {
  allowedConcepts: [
    'container',
    'pod',
    'service',
    'namespace',
    'dns',
    'fqdn',
    'kube-system',
    'default',
  ],
  introducedConcepts: ['namespace', 'namespace-isolation', 'dns-fqdn'],
};

export interface NamespaceResourceDef {
  id: string;
  label: string;
  detail?: string;
  correctNamespace: 'kube-system' | 'dev' | 'prod';
}

export const namespaceResources: NamespaceResourceDef[] = [
  {
    id: 'kube-apiserver',
    label: 'kube-apiserver',
    detail: 'Control plane',
    correctNamespace: 'kube-system',
  },
  {
    id: 'kube-scheduler',
    label: 'kube-scheduler',
    detail: 'Control plane',
    correctNamespace: 'kube-system',
  },
  { id: 'coredns', label: 'coredns', detail: 'DNS server', correctNamespace: 'kube-system' },
  { id: 'web-app', label: 'web-app', detail: 'Frontend service', correctNamespace: 'dev' },
  { id: 'api-service', label: 'api-service', detail: 'Backend API', correctNamespace: 'dev' },
  {
    id: 'payments-svc',
    label: 'payments-svc',
    detail: 'Payment processor',
    correctNamespace: 'prod',
  },
  { id: 'billing-svc', label: 'billing-svc', detail: 'Billing service', correctNamespace: 'prod' },
  {
    id: 'metrics-collector',
    label: 'metrics-collector',
    detail: 'Monitoring',
    correctNamespace: 'kube-system',
  },
];

export const namespaceBuckets = [
  { id: 'kube-system', label: 'kube-system', hint: 'System components' },
  { id: 'dev', label: 'dev', hint: 'Development workloads' },
  { id: 'prod', label: 'prod', hint: 'Production workloads' },
];

export interface DnsScenarioDef {
  id: string;
  description: string;
  segments: string[];
  correctOrder: string[];
}

export const dnsScenarios: DnsScenarioDef[] = [
  {
    id: 'cross-ns',
    description:
      'A pod in "dev" namespace wants to reach the "payments-svc" service in "prod" namespace:',
    segments: ['payments-svc', 'prod', 'svc', 'cluster.local'],
    correctOrder: ['payments-svc', 'prod', 'svc', 'cluster.local'],
  },
  {
    id: 'same-ns',
    description: 'A pod in "dev" namespace wants to reach "api-service" in the same namespace:',
    segments: ['api-service', 'dev', 'svc', 'cluster.local'],
    correctOrder: ['api-service'],
  },
];
