import { describe, expect, it } from 'vitest';
import { starsFromMistakes } from './types';
import { shuffle } from './shuffle';

describe('starsFromMistakes', () => {
  it('awards 5 stars for a flawless run', () => {
    expect(starsFromMistakes(0)).toBe(5);
  });

  it('steps down one star per mistake at scale 1', () => {
    expect(starsFromMistakes(1)).toBe(4);
    expect(starsFromMistakes(2)).toBe(3);
    expect(starsFromMistakes(4)).toBe(1);
  });

  it('never drops below 0', () => {
    expect(starsFromMistakes(5)).toBe(0);
    expect(starsFromMistakes(99)).toBe(0);
  });

  it('tolerates more mistakes per lost star at higher scale', () => {
    expect(starsFromMistakes(2, 2)).toBe(4);
    expect(starsFromMistakes(4, 2)).toBe(3);
  });
});

describe('shuffle', () => {
  it('returns a new array with the same members', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(out).not.toBe(input);
    expect([...out].sort()).toEqual([...input].sort());
  });

  it('does not mutate the input', () => {
    const input = ['a', 'b', 'c'];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });
});
