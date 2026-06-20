import { useMemo, useState } from 'react';
import { CheckBar } from '../../components/CheckBar';
import { StageStepper } from '../../components/StageStepper';
import { unlockAllDays } from '../../store/progress';
import { Sequencer } from '../../engine/Sequencer';
import { shuffle } from '../../engine/shuffle';
import { starsFromMistakes, type DayGameProps } from '../../engine/types';
import { bootstrapSteps, correctBootstrapOrder, blanks } from '../../data/day06';
import './Day06.css';

type Tone = 'idle' | 'error' | 'success';

export default function Day06({ onComplete, onMistakes }: DayGameProps) {
  const bootItems = useMemo(() => shuffle(bootstrapSteps), []);
  const [bootOrder, setBootOrder] = useState<string[]>(() => bootItems.map((b) => b.id));

  const [stage, setStage] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  // Stage 1 — Sequencer (bootstrap order)
  const [bootInvalid, setBootInvalid] = useState<Set<number>>(new Set());

  // Stage 2 — Fill blanks
  const [fillAnswers, setFillAnswers] = useState<Record<string, string>>({});
  const [fillInvalid, setFillInvalid] = useState<Set<string>>(new Set());

  const [tone, setTone] = useState<Tone>('idle');
  const [message, setMessage] = useState('');

  function bump(count: number) {
    setMistakes((m) => {
      const next = m + count;
      onMistakes?.(next);
      return next;
    });
  }

  function checkBootstrapOrder() {
    const wrong: number[] = [];
    bootOrder.forEach((id, idx) => {
      if (correctBootstrapOrder[idx] !== id) {
        wrong.push(idx);
      }
    });

    if (wrong.length > 0) {
      setBootInvalid(new Set(wrong));
      bump(wrong.length);
      setTone('error');
      setMessage(`${wrong.length} step(s) out of order. Reorder and check again.`);
      return;
    }

    setBootInvalid(new Set());
    setTone('success');
    setMessage('Bootstrap sequence correct. Now fill in the cluster config.');
    setStage(1);
  }

  function checkFillBlanks() {
    const unanswered = blanks.filter((b) => !fillAnswers[b.id]?.trim());
    if (unanswered.length > 0) {
      setTone('error');
      setMessage(`Fill all blanks first — ${unanswered.length} still empty.`);
      return;
    }

    const wrong = blanks.filter((b) => {
      const ans = fillAnswers[b.id]?.trim();
      const exp = Array.isArray(b.expected) ? b.expected : [b.expected];
      return !exp.includes(ans);
    });

    if (wrong.length > 0) {
      setFillInvalid(new Set(wrong.map((b) => b.id)));
      bump(wrong.length);
      setTone('error');
      setMessage(`${wrong.length} answer(s) incorrect. Check the hints and try again.`);
      return;
    }

    setFillInvalid(new Set());
    setTone('success');
    setMessage('Cluster bootstrapped! All systems go!');
    const finalMistakes = mistakes;
    onComplete(starsFromMistakes(finalMistakes, 1));
  }

  function reset() {
    if (stage === 0) {
      setBootOrder(bootItems.map((b) => b.id));
      setBootInvalid(new Set());
    } else {
      setFillAnswers({});
      setFillInvalid(new Set());
    }
    setTone('idle');
    setMessage('');
  }

  return (
    <div className="day06">
      <StageStepper
        stages={['Order the steps', 'Fill the config']}
        current={stage}
        done={stage > 0 ? [0] : []}
        onSelect={unlockAllDays ? setStage : undefined}
      />

      {stage === 0 ? (
        <>
          <p className="day06__lede">
            To build a local Kubernetes cluster with KIND, follow the bootstrap checklist in order.
            Drag to reorder the steps.
          </p>
          <Sequencer
            items={bootItems}
            order={bootOrder}
            onReorder={setBootOrder}
            invalidPositions={bootInvalid}
            slotLabel="Step"
          />
          <CheckBar onCheck={checkBootstrapOrder} onReset={reset} tone={tone} message={message} />
        </>
      ) : (
        <>
          <p className="day06__lede">
            Now complete the KIND cluster configuration. Answer each question to finalize your
            multi-node cluster setup.
          </p>
          <div className="day06__blanks">
            {blanks.map((blank) => (
              <div
                key={blank.id}
                className={`day06__blank ${fillInvalid.has(blank.id) ? 'is-invalid' : ''}`}
              >
                <label htmlFor={blank.id} className="day06__blank-label">
                  <span className="day06__blank-prompt">{blank.prompt}</span>
                  <span className="day06__blank-hint">{blank.hint}</span>
                </label>
                <input
                  id={blank.id}
                  type="text"
                  className="day06__input"
                  value={fillAnswers[blank.id] ?? ''}
                  onChange={(e) => setFillAnswers((a) => ({ ...a, [blank.id]: e.target.value }))}
                  placeholder={blank.label}
                  disabled={false}
                />
              </div>
            ))}
          </div>
          <CheckBar
            onCheck={checkFillBlanks}
            onReset={reset}
            checkLabel="Complete"
            tone={tone}
            message={message}
          />
        </>
      )}
    </div>
  );
}
