import { lazy } from 'react';
import type { DayMeta } from '../engine/types';

const REPO = 'https://github.com/piyushsachdeva/CKA-2024/blob/main/Resources';

/**
 * Central, eagerly-indexed day metadata. Components are lazily imported so each
 * day code-splits. Heavy puzzle content/answers live in src/data/dayNN.ts.
 */
export const days: DayMeta[] = [
  {
    id: 1,
    slug: 'day01',
    title: 'Docker Fundamentals',
    codename: 'Sorting Yard',
    topic: 'Containers vs VMs · Docker architecture',
    objective:
      'Sort each cargo crate onto the Container deck or the Virtual Machine deck, then match every Docker architecture term to the role it plays.',
    hints: [
      'Containers share the host OS kernel; virtual machines each ship a full guest OS.',
      'Lightweight, seconds-to-start, isolated by namespaces/cgroups → container. Heavyweight, boots like a computer, isolated by a hypervisor → VM.',
      'The daemon builds and runs containers; the client just sends it commands; the registry stores images.',
    ],
    readmeUrl: `${REPO}/Day01/README.md`,
    taskUrl: `${REPO}/Day01/task.md`,
    component: lazy(() => import('./day01/Day01')),
  },
  {
    id: 2,
    slug: 'day02',
    title: 'Dockerize an Application',
    codename: 'Dockerfile Assembly Line',
    topic: 'Dockerfile instructions · build & run',
    objective:
      'Reorder the Dockerfile instructions into a valid build sequence, then fill the missing tokens in the build and run commands.',
    hints: [
      'A Dockerfile always begins with FROM — you cannot build on top of nothing.',
      'Set the working directory and copy the source in before you install dependencies.',
      'docker build needs the build context (the current directory), and -p maps host:container ports.',
    ],
    readmeUrl: `${REPO}/Day02/readme.md`,
    taskUrl: `${REPO}/Day02/task.md`,
    component: lazy(() => import('./day02/Day02')),
  },
  {
    id: 3,
    slug: 'day03',
    title: 'Multi-Stage Builds',
    codename: 'Dockerfile Surgery Circus',
    topic: 'Multi-stage builds · COPY --from · leaving build cruft behind',
    objective:
      'Operate on a bloated single-stage Dockerfile: split it into builder and runtime stages, leave build cruft behind, and COPY --from only the built artifact to shrink the final image under target — without committing malpractice.',
    hints: [
      'Split into two stages so the heavy builder is discarded — only the last (runtime) stage ships.',
      'Name the builder AS installer so COPY --from=installer can pull just /app/build.',
      'Serve the static build from a slim nginx base; leave node_modules, dev deps, and the apt toolchain behind.',
    ],
    readmeUrl: `${REPO}/Day03/readme.md`,
    taskUrl: `${REPO}/Day03/task.md`,
    component: lazy(() => import('./day03/Day03')),
  },
  {
    id: 4,
    slug: 'day04',
    title: 'Why Kubernetes?',
    codename: 'Replica Requiem',
    topic: 'Desired state · self-healing · why orchestration',
    objective:
      'Keep the checkout fleet alive through an escalating storm of crashes and dock blackouts. Restarting every sunk ship by hand (standalone toil) is a losing battle — declare a desired replica count and switch the reconciliation controller on so the fleet self-heals and reschedules itself, until the incident feed falls silent.',
    hints: [
      'Standalone containers do not restart themselves — in manual mode every crash is your problem.',
      'Declare a desired replica count and turn the controller on; the reconcile loop heals and reschedules to match it.',
      'Keep desired above live demand — surges need more replicas, and the controller scales to whatever you declare.',
    ],
    readmeUrl: `${REPO}/Day04/readme.md`,
    taskUrl: `${REPO}/Day04/task.md`,
    component: lazy(() => import('./day04/Day04')),
  },
  {
    id: 5,
    slug: 'day05',
    title: 'Kubernetes Architecture',
    codename: 'Binding Magistrate',
    topic: 'Scheduler vs kubelet · component roles',
    objective:
      'Sit as the kube-scheduler: bind each Pending Pod to a worker node that satisfies its resource requests, nodeSelector, and taints/tolerations. Then certify the bind→run trail by assigning each lifecycle step to the one component responsible — proving the scheduler only decides, only the API server talks to etcd, and the kubelet runs the Pod.',
    hints: [
      'A binding is lawful only if the node has enough free CPU/memory, carries every label in the Pod\u2019s nodeSelector, and the Pod tolerates each of the node\u2019s NoSchedule taints.',
      'The GPU node is tainted, so only Pods that tolerate gpu=true:NoSchedule may land there; the SSD Pod must go to the node labelled disktype=ssd.',
      'The scheduler only picks a node and writes a binding through the API server. The API server persists it to etcd, and the kubelet on that node pulls the image and starts the containers.',
    ],
    readmeUrl: `${REPO}/Day05/readme.md`,
    taskUrl: `${REPO}/Day05/task.md`,
    component: lazy(() => import('./day05/Day05')),
  },
  {
    id: 6,
    slug: 'day06',
    title: 'Install a Cluster Locally (KIND)',
    codename: 'Bootstrap the Cluster',
    topic: 'KIND prerequisites · cluster config',
    objective:
      'Order the bootstrap checklist, then complete the kind create command and the node roles in the cluster config.',
    hints: [
      'KIND runs Kubernetes in Docker, so Docker must be installed before kind itself.',
      'You need kubectl to talk to the cluster once it exists.',
      'A multi-node config has one control-plane role and one or more worker roles.',
    ],
    readmeUrl: `${REPO}/Day06/readme.md`,
    taskUrl: `${REPO}/Day06/task.md`,
    component: lazy(() => import('./day06/Day06')),
  },
  {
    id: 7,
    slug: 'day07',
    title: 'Pods',
    codename: 'Manifest Builder',
    topic: 'Pod manifest anatomy',
    objective:
      'Assemble a valid Pod manifest from fragment tiles. Malformed or wrong-kind tiles are rejected — place and indent only the keys a Pod really needs.',
    hints: [
      'A Pod manifest uses apiVersion: v1 and kind: Pod (capital P).',
      'metadata holds the name and labels; spec holds the containers list.',
      'Each container needs a name, an image, and its containerPort under ports.',
    ],
    readmeUrl: `${REPO}/Day07/readme.md`,
    taskUrl: `${REPO}/Day07/task.md`,
    component: lazy(() => import('./day07/Day07')),
  },
  {
    id: 8,
    slug: 'day08',
    title: 'ReplicaSets & Deployments',
    codename: 'Selector Starlock',
    topic: 'Selectors · rolling updates · rollback',
    objective:
      'Forge a Deployment whose selector.matchLabels locks the ReplicaSet onto its own pods — right apiVersion, no foreign pods — then sequence a zero-downtime rollout from v1 to v2 and roll back to revision 1.',
    hints: [
      'A Deployment uses apiVersion: apps/v1; with v1 the API server rejects it.',
      'spec.selector.matchLabels must match the pod template labels (and nothing else) or the ReplicaSet owns the wrong pods — or none at all.',
      'With maxUnavailable 0 you surge a new pod up before draining an old one; rollback re-scales the previous revision’s ReplicaSet.',
    ],
    readmeUrl: `${REPO}/Day08/readme.md`,
    taskUrl: `${REPO}/Day08/task.md`,
    component: lazy(() => import('./day08/Day08')),
  },
  {
    id: 9,
    slug: 'day09',
    title: 'Services',
    codename: 'Wire the Traffic',
    topic: 'Service types · label selectors',
    objective:
      'Wire each Service to the pods whose labels match its selector, then choose the right Service type to satisfy each access scenario.',
    hints: [
      'A Service binds to pods by matching its selector against pod labels — wrong labels reject the cable.',
      'ClusterIP is internal-only; NodePort exposes a port on each node; LoadBalancer gives a public address.',
      'ExternalName maps a Service to an external DNS name rather than to pods.',
    ],
    readmeUrl: `${REPO}/Day09/readme.md`,
    taskUrl: `${REPO}/Day09/task.md`,
    component: lazy(() => import('./day09/Day09')),
  },
  {
    id: 10,
    slug: 'day10',
    title: 'Namespaces',
    codename: 'Harbor Partition',
    topic: 'Isolation · cross-namespace DNS',
    objective:
      'Sort resources into the correct namespace harbours, then assemble the DNS name a pod uses to reach a Service in another namespace.',
    hints: [
      'System components live in kube-system; your app workloads go in dev or prod.',
      'Within the same namespace a Service is reachable by its short name alone.',
      'Across namespaces the form is service.namespace.svc.cluster.local.',
    ],
    readmeUrl: `${REPO}/Day10/readme.md`,
    taskUrl: `${REPO}/Day10/task.md`,
    component: lazy(() => import('./day10/Day10')),
  },
];

export const dayBySlug = (slug: string): DayMeta | undefined => days.find((d) => d.slug === slug);

export const dayById = (id: number): DayMeta | undefined => days.find((d) => d.id === id);
