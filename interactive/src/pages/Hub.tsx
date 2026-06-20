import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Anchor, Lock, RotateCcw } from 'lucide-react';
import { days } from '../days/registry';
import { isDayUnlocked, useProgress } from '../store/progress';
import { HelmCompass } from '../components/HelmCompass';
import { StarRating } from '../components/StarRating';
import './Hub.css';

export default function Hub() {
  const daysState = useProgress((s) => s.days);
  const resetAll = useProgress((s) => s.resetAll);
  const [confirming, setConfirming] = useState(false);

  const completedFlags = days.map((d) => daysState[d.id]?.completed ?? false);
  const completedCount = completedFlags.filter(Boolean).length;

  return (
    <main className="app-shell hub">
      <header className="hub__hero">
        <div className="hub__hero-text">
          <span className="tag hub__kicker">
            <Anchor size={13} aria-hidden="true" /> A Kubernetes Voyage
          </span>
          <h1 className="hub__title">Helmsman</h1>
          <p className="hub__lede">
            Kubernetes means <em>helmsman</em> — the pilot who steers the ship. Chart these ten
            ports of the CKA voyage, one interactive puzzle at a time. Each port only ever tests
            what you’ve already learned.
          </p>
          <p className="hub__progress-line">
            {completedCount === 0
              ? 'No ports charted yet — set sail from Day 1.'
              : completedCount === days.length
                ? 'Every port charted. A masterful voyage!'
                : `${completedCount} of ${days.length} ports charted.`}
          </p>
        </div>
        <div className="hub__compass">
          <HelmCompass total={days.length} completed={completedFlags} size={200} />
        </div>
      </header>

      <ol className="hub__chart">
        {days.map((d) => {
          const state = daysState[d.id];
          const unlocked = isDayUnlocked(d.id, daysState);
          const completed = state?.completed ?? false;
          const status = completed ? 'done' : unlocked ? 'open' : 'locked';

          const inner = (
            <>
              <div className="port__top">
                <span className="port__num">Day {d.id}</span>
                {status === 'locked' && <Lock size={14} aria-hidden="true" />}
                {completed && <StarRating value={state!.bestStars} size={13} />}
              </div>
              <h2 className="port__codename">{d.codename}</h2>
              <p className="port__title">{d.title}</p>
              <p className="port__topic">{d.topic}</p>
              <span className="port__cta">
                {status === 'done' ? 'Replay' : status === 'open' ? 'Set sail →' : 'Fogged in'}
              </span>
            </>
          );

          return (
            <li key={d.id} className={`port port--${status}`}>
              {unlocked ? (
                <Link className="port__link" to={`/day/${d.slug}`}>
                  {inner}
                </Link>
              ) : (
                <div className="port__link" aria-disabled="true">
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <footer className="hub__footer">
        {confirming ? (
          <div className="hub__confirm" role="alertdialog" aria-label="Confirm reset">
            <span>Reset all voyage progress? This can’t be undone.</span>
            <div className="hub__confirm-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setConfirming(false)}>
                Keep my progress
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  resetAll();
                  setConfirming(false);
                }}
              >
                Reset everything
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="hub__reset" onClick={() => setConfirming(true)}>
            <RotateCcw size={14} aria-hidden="true" /> Reset progress
          </button>
        )}
      </footer>
    </main>
  );
}
