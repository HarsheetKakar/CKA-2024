import type { ComponentType, LazyExoticComponent } from 'react';

/**
 * A single problem found when the player presses "Check".
 * `id` ties the issue back to the offending item/slot so the UI can highlight it.
 */
export interface ValidationIssue {
  id: string;
  message: string;
}

/**
 * The shared validation contract. Every primitive / day reports through this shape.
 * Validation runs ONLY on an explicit "Check" / "Submit" action.
 */
export interface GameResult {
  correct: boolean;
  mistakes: ValidationIssue[];
  /** Identifiers of sections/rounds the player has fully cleared (for multi-stage days). */
  completedSections?: string[];
}

/**
 * Stars (0–5) from accuracy only. 0 mistakes = 5★ (flawless), then step down.
 * `scale` lets bigger puzzles tolerate more mistakes per lost star.
 *   stars = 5 - ceil(mistakes / scale), floored at 0.
 */
export function starsFromMistakes(mistakes: number, scale = 1): number {
  if (mistakes <= 0) return 5;
  return Math.max(0, 5 - Math.ceil(mistakes / scale));
}

/** Props every day-game component receives from the DayPage console shell. */
export interface DayGameProps {
  /** Call when the player successfully finishes the whole day. Pass earned stars (0–5). */
  onComplete: (stars: number) => void;
  /** Mirror of prefers-reduced-motion; days should honor this for orchestrated motion. */
  reducedMotion: boolean;
  /** Report the current running mistake tally so the Ship's Log can display it (optional). */
  onMistakes?: (count: number) => void;
}

/** Cheap, eagerly-indexed metadata for a day. Heavy puzzle content lives in data/dayNN.ts. */
export interface DayMeta {
  /** 1-based day number. */
  id: number;
  /** Folder/route slug, e.g. "day01". */
  slug: string;
  /** Real lesson title, e.g. "Docker Fundamentals". */
  title: string;
  /** Game codename, e.g. "Sorting Yard". */
  codename: string;
  /** One-line topic descriptor. */
  topic: string;
  /** Objective text, sourced from the day's task.md. */
  objective: string;
  /** On-demand hints (free, no star penalty), revealed one at a time in the Ship's Log. */
  hints: string[];
  /** Link back to the real lesson notes in the repo. */
  readmeUrl: string;
  /** Link to the day's hands-on task in the repo. */
  taskUrl: string;
  /** Lazily-imported game component so routing code-splits per day. */
  component: LazyExoticComponent<ComponentType<DayGameProps>>;
}
