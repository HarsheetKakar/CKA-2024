import { useState } from 'react';
import { CheckBar } from '../../components/CheckBar';
import { Quiz } from '../../engine/Quiz';
import { starsFromMistakes, type DayGameProps } from '../../engine/types';
import { outageQuestions, outageScenarios } from '../../data/day04';
import './Day04.css';

type Tone = 'idle' | 'error' | 'success';

export default function Day04({ onComplete, onMistakes }: DayGameProps) {
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [mistakes, setMistakes] = useState(0);
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [tone, setTone] = useState<Tone>('idle');
  const [message, setMessage] = useState('');
  const [completed, setCompleted] = useState(false);

  function bump(count: number) {
    setMistakes((m) => {
      const next = m + count;
      onMistakes?.(next);
      return next;
    });
  }

  function check() {
    const unanswered = outageQuestions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setTone('error');
      setMessage(`Answer all incidents first — ${unanswered.length} still waiting in the harbour.`);
      return;
    }

    const wrong = outageScenarios.filter((s) => answers[s.id] !== s.correct);
    if (wrong.length > 0) {
      setInvalid(new Set(wrong.map((s) => s.id)));
      bump(wrong.length);
      setTone('error');
      setMessage(`${wrong.length} incident(s) mishandled. Try again.`);
      return;
    }

    setInvalid(new Set());
    setTone('success');
    setMessage('All incidents resolved. Harbour is stable!');
    setCompleted(true);
    const finalMistakes = mistakes;
    onComplete(starsFromMistakes(finalMistakes, 1));
  }

  function reset() {
    setAnswers({});
    setInvalid(new Set());
    setTone('idle');
    setMessage('');
  }

  return (
    <div className="day04">
      <p className="day04__lede">
        A series of outage incidents arrives at the harbour. For each crisis, choose the
        orchestrator capability that resolves it.
      </p>

      <Quiz
        questions={outageQuestions}
        answers={answers}
        onAnswer={(qid, cid) => setAnswers((a) => ({ ...a, [qid]: cid }))}
        invalidIds={invalid}
        disabled={completed}
      />

      <CheckBar
        onCheck={check}
        onReset={reset}
        checkLabel={completed ? 'Done' : 'Resolve All'}
        checkDisabled={completed}
        tone={tone}
        message={message}
      />
    </div>
  );
}
