import { describe, expect, it } from 'vitest';
import {
  initialState,
  tools,
  computeImageSize,
  evaluateVitals,
  isDischargeable,
  renderDockerfile,
  initialImageSizeMb,
  targetImageSizeMb,
  type SurgeryState,
  type SurgicalTool,
} from './day03';

function tool(id: string): SurgicalTool {
  const t = tools.find((x) => x.id === id);
  if (!t) throw new Error(`unknown tool ${id}`);
  return t;
}

function applyAll(ids: string[]): SurgeryState {
  return ids.reduce((s, id) => tool(id).apply(s), initialState);
}

const WINNING_SEQUENCE = [
  'split-stages',
  'name-builder',
  'slim-builder-base',
  'cache-reorder',
  'remove-apt',
  'remove-dev-deps',
  'remove-test',
  'env-prod',
  'graft-nginx',
  'transplant-build',
  'fix-entry',
];

describe('day03 — Dockerfile Surgery Circus logic', () => {
  it('starts as a ~1.2 GB single-stage patient', () => {
    expect(computeImageSize(initialState)).toBe(initialImageSizeMb);
    expect(renderDockerfile(initialState).runtime).toBeNull();
    expect(evaluateVitals(initialState).every((v) => !v.ok)).toBe(true);
  });

  it('the winning sequence discharges the patient under target', () => {
    const final = applyAll(WINNING_SEQUENCE);
    expect(evaluateVitals(final).every((v) => v.ok)).toBe(true);
    expect(computeImageSize(final)).toBeLessThan(targetImageSizeMb);
    expect(isDischargeable(final)).toBe(true);
  });

  it('splitting leaves builder bloat behind (size drops without touching builder)', () => {
    const split = applyAll(['split-stages']);
    expect(computeImageSize(split)).toBeLessThan(initialImageSizeMb);
  });

  it('malpractice tools inflate the runtime and block discharge', () => {
    const base = applyAll(WINNING_SEQUENCE);
    const smuggled = tool('mal-node-modules').apply(base);
    expect(computeImageSize(smuggled)).toBeGreaterThan(computeImageSize(base));
    expect(isDischargeable(smuggled)).toBe(false);
    // toggling the same malpractice tool again undoes the harm
    const undone = tool('mal-node-modules').apply(smuggled);
    expect(isDischargeable(undone)).toBe(true);
  });

  it('transplant requires a named builder stage', () => {
    expect(tool('transplant-build').enabled(applyAll(['split-stages']))).toBe(false);
    expect(tool('transplant-build').enabled(applyAll(['split-stages', 'name-builder']))).toBe(true);
  });

  it('runtime tools stay disabled until the stages are split', () => {
    expect(tool('graft-nginx').enabled(initialState)).toBe(false);
    expect(tool('transplant-build').enabled(initialState)).toBe(false);
  });

  it('every tool toggles: applying then re-applying restores the prior flag', () => {
    const slim = tool('slim-builder-base').apply(initialState);
    expect(slim.builderBaseSlim).toBe(true);
    expect(tool('slim-builder-base').active(slim)).toBe(true);
    const undone = tool('slim-builder-base').apply(slim);
    expect(undone.builderBaseSlim).toBe(false);
  });

  it('un-splitting cascades away all runtime work', () => {
    const built = applyAll(['split-stages', 'name-builder', 'graft-nginx', 'transplant-build']);
    expect(built.artifactTransplanted).toBe(true);
    const unsplit = tool('split-stages').apply(built);
    expect(unsplit.stagesSplit).toBe(false);
    expect(unsplit.runtimeBase).toBe('none');
    expect(unsplit.artifactTransplanted).toBe(false);
  });
});
