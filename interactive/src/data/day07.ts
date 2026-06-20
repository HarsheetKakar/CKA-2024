/**
 * Day 07 — Pod Manifest Anatomy → "Shipping Manifest".
 * Cumulative-safe: Days 1-7 concepts (imperative vs declarative, Pod manifest structure).
 */

export const day07Concepts = {
  allowedConcepts: [
    'container',
    'docker',
    'pod',
    'manifest',
    'apiVersion',
    'kind',
    'metadata',
    'spec',
    'label',
  ],
  introducedConcepts: ['pod-manifest', 'declarative-config'],
};

export interface ManifestFragmentDef {
  id: string;
  text: string;
  /** True if this is a correct fragment; false for decoys. */
  valid: boolean;
  /** Rejection reason for decoys. */
  rejectReason?: string;
}

/**
 * Target manifest (from Day 7 readme.md):
 * apiVersion: v1
 * kind: Pod
 * metadata:
 *   name: nginx-pod
 *   labels:
 *     env: demo
 *     type: frontend
 * spec:
 *   containers:
 *     - name: nginx-container
 *       image: nginx
 *       ports:
 *         - containerPort: 80
 */

export const manifestFragments: ManifestFragmentDef[] = [
  // Correct fragments
  { id: 'api-v1', text: 'apiVersion: v1', valid: true },
  { id: 'kind-pod', text: 'kind: Pod', valid: true },
  { id: 'meta', text: 'metadata:', valid: true },
  { id: 'name', text: 'name: nginx-pod', valid: true },
  { id: 'labels', text: 'labels:', valid: true },
  { id: 'env', text: 'env: demo', valid: true },
  { id: 'type', text: 'type: frontend', valid: true },
  { id: 'spec', text: 'spec:', valid: true },
  { id: 'containers', text: 'containers:', valid: true },
  { id: 'cname', text: '- name: nginx-container', valid: true },
  { id: 'image', text: 'image: nginx', valid: true },
  { id: 'ports', text: 'ports:', valid: true },
  { id: 'cport', text: '- containerPort: 80', valid: true },

  // Decoy fragments
  {
    id: 'kind-deploy',
    text: 'kind: Deployment',
    valid: false,
    rejectReason: 'A Pod uses kind: Pod, not Deployment.',
  },
  {
    id: 'api-apps',
    text: 'apiVersion: apps/v1',
    valid: false,
    rejectReason: 'Pods use apiVersion: v1, not apps/v1.',
  },
  {
    id: 'kind-lowercase',
    text: 'kind: pod',
    valid: false,
    rejectReason: 'Resource kinds are case-sensitive — use kind: Pod (capital P).',
  },
];

export interface ManifestLineDef {
  fragmentId: string;
  indent: number;
}

export const expectedManifest: ManifestLineDef[] = [
  { fragmentId: 'api-v1', indent: 0 },
  { fragmentId: 'kind-pod', indent: 0 },
  { fragmentId: 'meta', indent: 0 },
  { fragmentId: 'name', indent: 1 },
  { fragmentId: 'labels', indent: 1 },
  { fragmentId: 'env', indent: 2 },
  { fragmentId: 'type', indent: 2 },
  { fragmentId: 'spec', indent: 0 },
  { fragmentId: 'containers', indent: 1 },
  { fragmentId: 'cname', indent: 1 },
  { fragmentId: 'image', indent: 2 },
  { fragmentId: 'ports', indent: 2 },
  { fragmentId: 'cport', indent: 3 },
];
