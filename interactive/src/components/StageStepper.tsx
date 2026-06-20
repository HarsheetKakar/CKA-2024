import { Check } from 'lucide-react';
import './StageStepper.css';

export interface StageStepperProps {
  stages: string[];
  /** Index of the active stage. */
  current: number;
  /** Indices that are fully completed. */
  done: number[];
  /**
   * When provided, stages become clickable and call this with the chosen index.
   * Used in dev preview mode (VITE_UNLOCK_ALL) to jump between sub-questions
   * without solving the earlier ones.
   */
  onSelect?: (index: number) => void;
}

export function StageStepper({ stages, current, done, onSelect }: StageStepperProps) {
  if (stages.length < 2) return null;
  return (
    <ol className="stepper" aria-label="Stages">
      {stages.map((label, i) => {
        const isDone = done.includes(i);
        const isCurrent = i === current;
        const className = `stepper__item ${isCurrent ? 'is-current' : ''} ${
          isDone ? 'is-done' : ''
        } ${onSelect ? 'is-clickable' : ''}`;
        const inner = (
          <>
            <span className="stepper__dot">
              {isDone ? <Check size={13} aria-hidden="true" /> : i + 1}
            </span>
            <span className="stepper__label">{label}</span>
          </>
        );
        return (
          <li key={label} aria-current={isCurrent ? 'step' : undefined}>
            {onSelect ? (
              <button
                type="button"
                className={className}
                onClick={() => onSelect(i)}
                title="Preview this stage"
              >
                {inner}
              </button>
            ) : (
              <span className={className}>{inner}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
