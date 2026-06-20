import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
import type { ComponentType } from 'react';
import type { DayGameProps } from '../engine/types';

afterEach(cleanup);

// Eagerly load every day component's default export and mount it to catch
// runtime errors (bad data references, primitive misuse) the type-check can't see.
const modules = import.meta.glob('./day*/Day*.tsx', { eager: true }) as Record<
  string,
  { default: ComponentType<DayGameProps> }
>;

describe('day components render', () => {
  const entries = Object.entries(modules).sort(([a], [b]) => a.localeCompare(b));
  // Only the top-level DayNN.tsx files (skip any helper components in day folders).
  const dayEntries = entries.filter(([path]) => /\/day\d+\/Day\d+\.tsx$/.test(path));

  it('discovers all ten day components', () => {
    expect(dayEntries.length).toBe(10);
  });

  for (const [path, mod] of dayEntries) {
    it(`${path} mounts without crashing`, () => {
      const Comp = mod.default;
      const { unmount } = render(
        createElement(Comp, {
          onComplete: vi.fn(),
          reducedMotion: true,
          onMistakes: vi.fn(),
        }),
      );
      unmount();
    });
  }
});
