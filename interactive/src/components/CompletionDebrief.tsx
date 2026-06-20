import { Link } from 'react-router-dom';
import { BookOpen, RotateCcw } from 'lucide-react';
import { StarRating } from './StarRating';
import './CompletionDebrief.css';

export interface CompletionDebriefProps {
  open: boolean;
  stars: number;
  title: string;
  codename: string;
  readmeUrl: string;
  nextDaySlug: string | null;
  nextDayUnlocked: boolean;
  onReplay: () => void;
}

const PRAISE: Record<number, string> = {
  5: 'Flawless passage. The harbour master salutes you.',
  4: 'A clean run with barely a ripple.',
  3: 'Safely docked — a few course corrections along the way.',
  2: 'You made port, though the crossing was choppy.',
  1: 'Battered but berthed. Worth another voyage.',
  0: 'You reached the dock. Chart it again for a cleaner line.',
};

export function CompletionDebrief({
  open,
  stars,
  title,
  codename,
  readmeUrl,
  nextDaySlug,
  nextDayUnlocked,
  onReplay,
}: CompletionDebriefProps) {
  if (!open) return null;
  return (
    <div className="debrief" role="dialog" aria-modal="true" aria-labelledby="debrief-title">
      <div className="debrief__card">
        <span className="tag">Voyage complete</span>
        <h2 id="debrief-title" className="debrief__title">
          {codename}
        </h2>
        <p className="debrief__subtitle">{title}</p>

        <div className="debrief__stars">
          <StarRating value={stars} size={30} label={`Earned ${stars} of 5 stars`} />
        </div>
        <p className="debrief__praise">{PRAISE[stars] ?? PRAISE[0]}</p>

        <a className="debrief__notes" href={readmeUrl} target="_blank" rel="noreferrer">
          <BookOpen size={15} aria-hidden="true" /> Revisit the lesson notes
        </a>

        <div className="debrief__actions">
          <button type="button" className="btn btn--ghost" onClick={onReplay}>
            <RotateCcw size={15} aria-hidden="true" /> Replay
          </button>
          <Link className="btn btn--ghost" to="/">
            Voyage chart
          </Link>
          {nextDaySlug && nextDayUnlocked && (
            <Link className="btn btn--primary" to={`/day/${nextDaySlug}`}>
              Next port →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
