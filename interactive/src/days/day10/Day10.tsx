import type { DayGameProps } from '../../engine/types';

// Placeholder — implemented in a later pass.
export default function Day10({ onComplete }: DayGameProps) {
  return (
    <div style={{ display: 'grid', gap: '1rem', placeItems: 'start' }}>
      <p>Day 10 puzzle is not built yet.</p>
      <button type="button" className="btn btn--primary" onClick={() => onComplete(5)}>
        Mark complete (placeholder)
      </button>
    </div>
  );
}
