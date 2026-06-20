import { Suspense, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { dayBySlug, dayById } from '../days/registry';
import { isDayUnlocked, useProgress } from '../store/progress';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { ObjectivePanel } from '../components/ObjectivePanel';
import { CompletionDebrief } from '../components/CompletionDebrief';
import './DayPage.css';

export default function DayPage() {
  const { slug = '' } = useParams();
  const meta = dayBySlug(slug);
  const daysState = useProgress((s) => s.days);
  const recordResult = useProgress((s) => s.recordResult);
  const reducedMotion = useReducedMotion();

  const [attemptKey, setAttemptKey] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [debrief, setDebrief] = useState<{ open: boolean; stars: number }>({
    open: false,
    stars: 0,
  });

  if (!meta) {
    return (
      <main className="app-shell daypage__missing">
        <h1>Unknown port</h1>
        <p>That day isn’t on the chart.</p>
        <Link className="btn btn--ghost" to="/">
          <ArrowLeft size={15} aria-hidden="true" /> Back to the voyage chart
        </Link>
      </main>
    );
  }

  const unlocked = isDayUnlocked(meta.id, daysState);
  const best = daysState[meta.id]?.bestStars ?? 0;
  const Game = meta.component;
  const next = dayById(meta.id + 1);

  function handleComplete(stars: number) {
    recordResult(meta!.id, stars);
    setDebrief({ open: true, stars });
  }

  function replay() {
    setDebrief({ open: false, stars: 0 });
    setMistakes(0);
    setAttemptKey((k) => k + 1);
  }

  if (!unlocked) {
    return (
      <main className="app-shell daypage__missing">
        <span className="daypage__locked-badge">
          <Lock size={28} aria-hidden="true" />
        </span>
        <h1>This port is fogged in</h1>
        <p>
          Complete <strong>Day {meta.id - 1}</strong> to chart a course to {meta.codename}.
        </p>
        <Link className="btn btn--primary" to="/">
          <ArrowLeft size={15} aria-hidden="true" /> Back to the voyage chart
        </Link>
      </main>
    );
  }

  return (
    <main className="app-shell daypage">
      <header className="daypage__head">
        <Link className="daypage__back" to="/">
          <ArrowLeft size={16} aria-hidden="true" /> Voyage chart
        </Link>
        <div className="daypage__titles">
          <span className="daypage__daynum">Day {meta.id}</span>
          <h1 className="daypage__codename">{meta.codename}</h1>
          <p className="daypage__lesson">
            {meta.title} · <span className="daypage__topic">{meta.topic}</span>
          </p>
        </div>
      </header>

      <div className="daypage__layout">
        <section className="daypage__console" aria-label={`${meta.codename} game stage`}>
          <Suspense fallback={<div className="daypage__loading">Charting the course…</div>}>
            <Game
              key={attemptKey}
              onComplete={handleComplete}
              reducedMotion={reducedMotion}
              onMistakes={setMistakes}
            />
          </Suspense>
        </section>

        <ObjectivePanel
          objective={meta.objective}
          hints={meta.hints}
          readmeUrl={meta.readmeUrl}
          taskUrl={meta.taskUrl}
          bestStars={best}
          mistakes={mistakes}
          attemptKey={attemptKey}
          frozen={debrief.open}
        />
      </div>

      <CompletionDebrief
        open={debrief.open}
        stars={debrief.stars}
        title={meta.title}
        codename={meta.codename}
        readmeUrl={meta.readmeUrl}
        nextDaySlug={next?.slug ?? null}
        nextDayUnlocked={next ? true : false}
        onReplay={replay}
      />
    </main>
  );
}
