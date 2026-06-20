/**
 * Day 08 — ReplicaSets & Deployments → "Selector Starlock".
 *
 * Stage 1 is a real-looking Deployment manifest the player must configure: pick the right
 * `apiVersion`/`kind`/`replicas`/image/port AND a `spec.selector.matchLabels` precise enough
 * to own exactly the intended pods. Foreign pods deliberately share individual labels, so a
 * single-label selector wrongly captures them — only a precise multi-label selector works.
 * Stage 2 teaches the rolling-update surge/drain lifecycle, revisions, and rollback.
 *
 * Cumulative-safe: builds on Days 1-7 (pods, labels, manifests, declarative config).
 */

export const day08Concepts = {
  allowedConcepts: [
    'pod',
    'label',
    'manifest',
    'apiVersion',
    'kind',
    'selector',
    'replicaset',
    'deployment',
    'rollout',
    'revision',
    'rollback',
  ],
  introducedConcepts: ['replicaset', 'deployment', 'rolling-update', 'rollback'],
};

export interface LabelPair {
  key: string;
  value: string;
}

/** The Deployment's pod template labels (spec.template.metadata.labels) — fixed & visible. */
export const templateLabels: LabelPair[] = [
  { key: 'app', value: 'nginx' },
  { key: 'track', value: 'stable' },
  { key: 'tier', value: 'backend' },
];

export interface PodNode {
  id: string;
  /** `intended` pods belong to our Deployment; `foreign` pods share the namespace. */
  kind: 'intended' | 'foreign';
  /** Short note explaining why a foreign pod is a trap (shares some labels). */
  note?: string;
  labels: LabelPair[];
}

/**
 * Four intended pods carry all three template labels. Three foreign pods each SHARE one or
 * two labels with the template, so an imprecise selector captures them:
 *  - canary  shares app=nginx                       → caught by {app:nginx}
 *  - api     shares track=stable + tier=backend      → caught by {track:stable} or {tier:backend}
 *  - web     shares track=stable                      → caught by {track:stable}
 * The only selectors that own exactly the 4 intended pods are {app:nginx, track:stable}
 * (minimal) or the full {app:nginx, track:stable, tier:backend}.
 */
export const podNodes: PodNode[] = [
  {
    id: 'nginx-1',
    kind: 'intended',
    labels: [
      { key: 'app', value: 'nginx' },
      { key: 'track', value: 'stable' },
      { key: 'tier', value: 'backend' },
    ],
  },
  {
    id: 'nginx-2',
    kind: 'intended',
    labels: [
      { key: 'app', value: 'nginx' },
      { key: 'track', value: 'stable' },
      { key: 'tier', value: 'backend' },
    ],
  },
  {
    id: 'nginx-3',
    kind: 'intended',
    labels: [
      { key: 'app', value: 'nginx' },
      { key: 'track', value: 'stable' },
      { key: 'tier', value: 'backend' },
    ],
  },
  {
    id: 'nginx-4',
    kind: 'intended',
    labels: [
      { key: 'app', value: 'nginx' },
      { key: 'track', value: 'stable' },
      { key: 'tier', value: 'backend' },
    ],
  },
  {
    id: 'nginx-canary',
    kind: 'foreign',
    note: 'canary build — shares app=nginx',
    labels: [
      { key: 'app', value: 'nginx' },
      { key: 'track', value: 'canary' },
      { key: 'tier', value: 'backend' },
    ],
  },
  {
    id: 'api-7',
    kind: 'foreign',
    note: 'other app — shares track=stable & tier=backend',
    labels: [
      { key: 'app', value: 'api' },
      { key: 'track', value: 'stable' },
      { key: 'tier', value: 'backend' },
    ],
  },
  {
    id: 'web-2',
    kind: 'foreign',
    note: 'frontend — shares track=stable',
    labels: [
      { key: 'app', value: 'web' },
      { key: 'track', value: 'stable' },
      { key: 'tier', value: 'frontend' },
    ],
  },
];

export interface SelectorChip {
  id: string;
  key: string;
  value: string;
}

/** Every label key:value present across the pods is a candidate matchLabel. */
export const selectorChips: SelectorChip[] = [
  { id: 'app-nginx', key: 'app', value: 'nginx' },
  { id: 'app-api', key: 'app', value: 'api' },
  { id: 'app-web', key: 'app', value: 'web' },
  { id: 'track-stable', key: 'track', value: 'stable' },
  { id: 'track-canary', key: 'track', value: 'canary' },
  { id: 'tier-backend', key: 'tier', value: 'backend' },
  { id: 'tier-frontend', key: 'tier', value: 'frontend' },
];

export const intendedPodCount = podNodes.filter((p) => p.kind === 'intended').length;

/**
 * Manifest fields the player must configure (rendered as inline <select>s in the YAML).
 * Each has an `id` (used for the control), an ordered option list, and the correct value.
 */
export interface ManifestField {
  id: string;
  label: string;
  options: string[];
  correct: string;
  /** Human explanation shown when this field is wrong on Apply. */
  hint: string;
}

export const manifestFields: ManifestField[] = [
  {
    id: 'apiVersion',
    label: 'apiVersion',
    options: ['v1', 'apps/v1', 'extensions/v1beta1'],
    correct: 'apps/v1',
    hint: 'Deployments live in the apps/v1 API group — v1 and the removed extensions/v1beta1 are rejected.',
  },
  {
    id: 'kind',
    label: 'kind',
    options: ['Pod', 'ReplicaSet', 'Deployment', 'StatefulSet'],
    correct: 'Deployment',
    hint: 'You are declaring a Deployment, which manages ReplicaSets for you.',
  },
  {
    id: 'replicas',
    label: 'replicas',
    options: ['2', '3', '4', '5', '6'],
    correct: String(intendedPodCount),
    hint: `Desired state is ${intendedPodCount} replicas — one per intended pod the ReplicaSet must hold.`,
  },
  {
    id: 'image',
    label: 'image',
    options: ['nginx', 'nginx:latest', 'nginx:1.23.4'],
    correct: 'nginx:1.23.4',
    hint: 'Pin an explicit, immutable tag (nginx:1.23.4) — bare nginx / :latest are non-deterministic.',
  },
  {
    id: 'containerPort',
    label: 'containerPort',
    options: ['80', '443', '8080'],
    correct: '80',
    hint: 'The nginx container listens on port 80.',
  },
];

/** Label-selector AND semantics: pod matches iff selector non-empty and pod carries all pairs. */
export function podMatchesSelector(pod: PodNode, selector: SelectorChip[]): boolean {
  if (selector.length === 0) return false;
  return selector.every((s) => pod.labels.some((l) => l.key === s.key && l.value === s.value));
}

export const apiVersionOptions = ['v1', 'apps/v1', 'extensions/v1beta1'] as const;
export const correctApiVersion = 'apps/v1';

/** The rolling-update scenario the Stage 2 ordering must respect. */
export const rolloutScenario = {
  replicas: intendedPodCount,
  maxSurge: 1,
  maxUnavailable: 0,
  fromImage: 'nginx:1.23.4',
  toImage: 'nginx:1.25.3',
};

export interface RolloutStep {
  id: string;
  label: string;
  detail: string;
}

export const rolloutSteps: RolloutStep[] = [
  {
    id: 'set-image',
    label: 'Update the pod template image to v2',
    detail: 'Creates revision 2 — a brand-new ReplicaSet for the new image',
  },
  {
    id: 'surge-up',
    label: 'Surge up a new v2 pod',
    detail: 'maxSurge: 1 — the new ReplicaSet scales up before the old one scales down',
  },
  {
    id: 'drain-old',
    label: 'Drain an old v1 pod',
    detail: 'maxUnavailable: 0 — the old ReplicaSet scales down only after the v2 pod is Ready',
  },
  {
    id: 'rollout-complete',
    label: 'Rollout complete: all replicas on v2',
    detail: 'Revision 2 is recorded, with your change-cause annotation',
  },
  {
    id: 'rollback',
    label: 'Roll back to revision 1',
    detail: 'The Deployment scales revision 1’s ReplicaSet back up, creating v1 pods again',
  },
];

/** The single correct execution order (surge-first, since maxUnavailable is 0). */
export const rolloutCorrectOrder: string[] = [
  'set-image',
  'surge-up',
  'drain-old',
  'rollout-complete',
  'rollback',
];

/** A fixed scrambled starting order so the player must reorder (never equals the solution). */
export const rolloutStartOrder: string[] = [
  'rollback',
  'drain-old',
  'rollout-complete',
  'set-image',
  'surge-up',
];
