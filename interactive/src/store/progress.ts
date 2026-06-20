import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DayProgress {
  completed: boolean;
  bestStars: number;
}

interface ProgressState {
  days: Record<number, DayProgress>;
  /** Record a finished attempt. Completion sticks; bestStars only ever rises. */
  recordResult: (dayId: number, stars: number) => void;
  /** Clear all saved progress (confirmed action in the UI). */
  resetAll: () => void;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      days: {},
      recordResult: (dayId, stars) =>
        set((state) => {
          const prev = state.days[dayId];
          const bestStars = Math.max(prev?.bestStars ?? 0, stars);
          return {
            days: {
              ...state.days,
              [dayId]: { completed: true, bestStars },
            },
          };
        }),
      resetAll: () => set({ days: {} }),
    }),
    {
      name: 'helmsman-progress-v1',
      version: 1,
    },
  ),
);

/** Dev-only override: VITE_UNLOCK_ALL=true unlocks every day for previewing pages. */
export const unlockAllDays = import.meta.env.VITE_UNLOCK_ALL === 'true';

/** A day is unlocked when the previous day is completed. Day 1 is always open. */
export function isDayUnlocked(dayId: number, days: Record<number, DayProgress>): boolean {
  if (unlockAllDays) return true;
  if (dayId <= 1) return true;
  return days[dayId - 1]?.completed ?? false;
}
