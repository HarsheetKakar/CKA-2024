import { useEffect, useRef, useState } from 'react';
import { BookOpen, ClipboardList, Lightbulb, Timer } from 'lucide-react';
import { StarRating } from './StarRating';
import './ObjectivePanel.css';

export interface ObjectivePanelProps {
  objective: string;
  hints: string[];
  readmeUrl: string;
  taskUrl: string;
  bestStars?: number;
  mistakes?: number;
  /** Bump this key to restart the elapsed timer (e.g. on "reset day"). */
  attemptKey?: number;
  /** Freeze the timer (e.g. once the day is complete). */
  frozen?: boolean;
}

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ObjectivePanel({
  objective,
  hints,
  readmeUrl,
  taskUrl,
  bestStars,
  mistakes,
  attemptKey = 0,
  frozen = false,
}: ObjectivePanelProps) {
  const [revealed, setRevealed] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    setRevealed(0);
    startRef.current = Date.now();
    setElapsed(0);
  }, [attemptKey]);

  useEffect(() => {
    if (frozen) return;
    const id = window.setInterval(() => setElapsed(Date.now() - startRef.current), 1000);
    return () => window.clearInterval(id);
  }, [frozen, attemptKey]);

  return (
    <aside className="objpanel" aria-label="Ship's Log">
      <header className="objpanel__head">
        <span className="tag">Ship's Log</span>
        <div className="objpanel__meters">
          <span className="objpanel__meter" title="Elapsed time">
            <Timer size={14} aria-hidden="true" />
            <span className="mono">{formatElapsed(elapsed)}</span>
          </span>
          {typeof mistakes === 'number' && (
            <span
              className={`objpanel__meter ${mistakes > 0 ? 'is-warn' : ''}`}
              title="Mistakes at last check"
            >
              ✕ <span className="mono">{mistakes}</span>
            </span>
          )}
        </div>
      </header>

      <section className="objpanel__section">
        <h2 className="objpanel__title">
          <ClipboardList size={16} aria-hidden="true" /> Objective
        </h2>
        <p className="objpanel__objective">{objective}</p>
      </section>

      {typeof bestStars === 'number' && bestStars > 0 && (
        <section className="objpanel__section objpanel__best">
          <span>Best</span>
          <StarRating value={bestStars} size={15} />
        </section>
      )}

      <section className="objpanel__section">
        <h2 className="objpanel__title">
          <Lightbulb size={16} aria-hidden="true" /> Hints
        </h2>
        <ul className="objpanel__hints">
          {hints.slice(0, revealed).map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
        {revealed < hints.length ? (
          <button
            type="button"
            className="btn btn--ghost objpanel__hint-btn"
            onClick={() => setRevealed((r) => r + 1)}
          >
            Reveal a hint ({hints.length - revealed} left)
          </button>
        ) : (
          hints.length > 0 && <p className="objpanel__hint-done">All hints revealed.</p>
        )}
        <p className="objpanel__hint-note">Hints are free — they never cost you stars.</p>
      </section>

      <footer className="objpanel__links">
        <a href={readmeUrl} target="_blank" rel="noreferrer">
          <BookOpen size={14} aria-hidden="true" /> Lesson notes
        </a>
        <a href={taskUrl} target="_blank" rel="noreferrer">
          <ClipboardList size={14} aria-hidden="true" /> Original task
        </a>
      </footer>
    </aside>
  );
}
