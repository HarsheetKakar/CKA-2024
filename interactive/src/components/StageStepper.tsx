import { Check } from 'lucide-react';
import './StageStepper.css';

export interface StageStepperProps {
  stages: string[];
  /** Index of the active stage. */
  current: number;
  /** Indices that are fully completed. */
  done: number[];
}

export function StageStepper({ stages, current, done }: StageStepperProps) {
  if (stages.length < 2) return null;
  return (
    <ol className="stepper" aria-label="Stages">
      {stages.map((label, i) => {
        const isDone = done.includes(i);
        const isCurrent = i === current;
        return (
          <li
            key={label}
            className={`stepper__item ${isCurrent ? 'is-current' : ''} ${isDone ? 'is-done' : ''}`}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span className="stepper__dot">
              {isDone ? <Check size={13} aria-hidden="true" /> : i + 1}
            </span>
            <span className="stepper__label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
