import { describe, expect, it } from 'vitest';
import {
  intendedPodCount,
  manifestFields,
  podMatchesSelector,
  podNodes,
  rolloutCorrectOrder,
  rolloutStartOrder,
  rolloutSteps,
  selectorChips,
  templateLabels,
  type LabelPair,
  type PodNode,
  type SelectorChip,
} from './day08';

const EXPECTED_TEMPLATE_LABELS: LabelPair[] = [
  { key: 'app', value: 'nginx' },
  { key: 'track', value: 'stable' },
  { key: 'tier', value: 'backend' },
];

const EXPECTED_INTENDED_POD_IDS = ['nginx-1', 'nginx-2', 'nginx-3', 'nginx-4'];

function hasLabel(labels: LabelPair[], expected: LabelPair): boolean {
  return labels.some((label) => label.key === expected.key && label.value === expected.value);
}

function chip(id: string): SelectorChip {
  const selected = selectorChips.find((selectorChip) => selectorChip.id === id);
  if (!selected) throw new Error(`unknown selector chip ${id}`);
  return selected;
}

function selectorFromChipIds(ids: string[]): SelectorChip[] {
  return ids.map(chip);
}

function podsOfKind(kind: PodNode['kind']): PodNode[] {
  return podNodes.filter((pod) => pod.kind === kind);
}

function matchingPodIds(kind: PodNode['kind'], chipIds: string[]): string[] {
  const selector = selectorFromChipIds(chipIds);
  return podsOfKind(kind)
    .filter((pod) => podMatchesSelector(pod, selector))
    .map((pod) => pod.id);
}

function field(id: string) {
  const selected = manifestFields.find((manifestField) => manifestField.id === id);
  if (!selected) throw new Error(`unknown manifest field ${id}`);
  return selected;
}

function expectPermutationOfStepIds(order: string[]): void {
  const stepIds = rolloutSteps.map((step) => step.id);

  expect(order).toHaveLength(stepIds.length);
  expect(new Set(order)).toEqual(new Set(stepIds));
  expect(order.every((id) => stepIds.includes(id))).toBe(true);
}

describe('day08 — Selector Starlock template and pods', () => {
  it('defines the expected pod template labels', () => {
    expect(templateLabels).toEqual(EXPECTED_TEMPLATE_LABELS);
  });

  it('has four intended pods matching the intendedPodCount', () => {
    const intendedPods = podsOfKind('intended');

    expect(intendedPodCount).toBe(4);
    expect(intendedPods).toHaveLength(intendedPodCount);
  });

  it('gives every intended pod all template labels', () => {
    const intendedPods = podsOfKind('intended');

    expect(
      intendedPods.every((pod) =>
        templateLabels.every((templateLabel) => hasLabel(pod.labels, templateLabel)),
      ),
    ).toBe(true);
  });
});

describe('day08 — selector precision invariant', () => {
  it('rejects an empty selector for every pod', () => {
    expect(podNodes.every((pod) => !podMatchesSelector(pod, []))).toBe(true);
  });

  it('shows single-label selectors capture foreign pods', () => {
    expect(matchingPodIds('foreign', ['app-nginx'])).toEqual(['nginx-canary']);
    expect(matchingPodIds('foreign', ['track-stable'])).toEqual(['api-7', 'web-2']);
    expect(matchingPodIds('foreign', ['tier-backend'])).toEqual(['nginx-canary', 'api-7']);

    expect(matchingPodIds('foreign', ['app-nginx']).length).toBeGreaterThan(0);
    expect(matchingPodIds('foreign', ['track-stable']).length).toBeGreaterThan(0);
    expect(matchingPodIds('foreign', ['tier-backend']).length).toBeGreaterThan(0);
  });

  it('matches all intended pods and zero foreign pods with the minimal precise selector', () => {
    expect(matchingPodIds('intended', ['app-nginx', 'track-stable'])).toEqual(
      EXPECTED_INTENDED_POD_IDS,
    );
    expect(matchingPodIds('foreign', ['app-nginx', 'track-stable'])).toEqual([]);
  });

  it('matches all intended pods and zero foreign pods with the full selector', () => {
    expect(matchingPodIds('intended', ['app-nginx', 'track-stable', 'tier-backend'])).toEqual(
      EXPECTED_INTENDED_POD_IDS,
    );
    expect(matchingPodIds('foreign', ['app-nginx', 'track-stable', 'tier-backend'])).toEqual([]);
  });

  it('shows app:nginx plus tier:backend still captures the canary pod', () => {
    expect(matchingPodIds('intended', ['app-nginx', 'tier-backend'])).toEqual(
      EXPECTED_INTENDED_POD_IDS,
    );
    expect(matchingPodIds('foreign', ['app-nginx', 'tier-backend'])).toEqual(['nginx-canary']);
  });

  it('matches zero pods with an empty selector', () => {
    expect(podNodes.some((pod) => podMatchesSelector(pod, selectorFromChipIds([])))).toBe(false);
  });
});

describe('day08 — manifest fields', () => {
  it('has unique manifest field ids', () => {
    const ids = manifestFields.map((manifestField) => manifestField.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('defines the expected manifest fields', () => {
    expect(manifestFields.map((manifestField) => manifestField.id)).toEqual([
      'apiVersion',
      'kind',
      'replicas',
      'image',
      'containerPort',
    ]);
  });

  it('keeps every correct manifest value among its options', () => {
    expect(
      manifestFields.every((manifestField) =>
        manifestField.options.includes(manifestField.correct),
      ),
    ).toBe(true);
  });

  it('defines the expected correct manifest values', () => {
    expect(field('replicas').correct).toBe(String(intendedPodCount));
    expect(field('apiVersion').correct).toBe('apps/v1');
    expect(field('kind').correct).toBe('Deployment');
    expect(field('image').correct).toBe('nginx:1.23.4');
    expect(field('containerPort').correct).toBe('80');
  });
});

describe('day08 — selector chips', () => {
  it('has unique selector chip ids', () => {
    const ids = selectorChips.map((selectorChip) => selectorChip.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('defines the seven selector chip ids', () => {
    expect(selectorChips.map((selectorChip) => selectorChip.id)).toEqual([
      'app-nginx',
      'app-api',
      'app-web',
      'track-stable',
      'track-canary',
      'tier-backend',
      'tier-frontend',
    ]);
  });

  it('includes the chips for the intended selector', () => {
    expect(selectorChips).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'app-nginx', key: 'app', value: 'nginx' }),
        expect.objectContaining({ id: 'track-stable', key: 'track', value: 'stable' }),
        expect.objectContaining({ id: 'tier-backend', key: 'tier', value: 'backend' }),
      ]),
    );
  });
});

describe('day08 — rollout integrity', () => {
  it('keeps correct and start orders as permutations of rollout step ids', () => {
    expectPermutationOfStepIds(rolloutCorrectOrder);
    expectPermutationOfStepIds(rolloutStartOrder);
  });

  it('starts from an order that requires reordering', () => {
    expect(rolloutStartOrder).not.toEqual(rolloutCorrectOrder);
  });

  it('has unique ids in both rollout order arrays', () => {
    expect(new Set(rolloutCorrectOrder).size).toBe(rolloutCorrectOrder.length);
    expect(new Set(rolloutStartOrder).size).toBe(rolloutStartOrder.length);
  });
});
