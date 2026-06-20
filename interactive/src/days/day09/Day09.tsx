import { useMemo, useState } from 'react';
import { CheckBar } from '../../components/CheckBar';
import { StageStepper } from '../../components/StageStepper';
import { unlockAllDays } from '../../store/progress';
import { ConnectionBoard, type Connection } from '../../engine/ConnectionBoard';
import { starsFromMistakes, type DayGameProps } from '../../engine/types';
import {
  servicePods,
  correctPodIds,
  serviceTypeQuiz,
  serviceTypeOptions,
  serviceSelector,
} from '../../data/day09';
import './Day09.css';

type Tone = 'idle' | 'error' | 'success';

export default function Day09({ onComplete, onMistakes }: DayGameProps) {
  const [stage, setStage] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  // Stage 1 — Connection board
  const [connections, setConnections] = useState<Connection[]>([]);
  const [invalidPairs, setInvalidPairs] = useState<Set<string>>(new Set());

  // Stage 2 — Quiz
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [invalidAnswers, setInvalidAnswers] = useState<Set<string>>(new Set());

  const [tone, setTone] = useState<Tone>('idle');
  const [message, setMessage] = useState('');

  const sources = useMemo(
    () => [
      {
        id: 'svc',
        label: 'Service',
        detail: `selector: app=${serviceSelector.app}`,
      },
    ],
    [],
  );

  const targets = useMemo(
    () =>
      servicePods.map((p) => ({
        id: p.id,
        label: p.label,
        detail: `labels: ${Object.entries(p.labels)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')}`,
      })),
    [],
  );

  function bump(count: number) {
    setMistakes((m) => {
      const next = m + count;
      onMistakes?.(next);
      return next;
    });
  }

  function checkStage1() {
    const connectedPods = connections.map((c) => c.target);
    const wrongConnections = connectedPods.filter((id) => !correctPodIds.includes(id));
    const missingConnections = correctPodIds.filter((id) => !connectedPods.includes(id));

    if (wrongConnections.length > 0 || missingConnections.length > 0) {
      const invalidKeys = wrongConnections.map((id) => `svc|${id}`);
      setInvalidPairs(new Set(invalidKeys));
      bump(wrongConnections.length + missingConnections.length);
      setTone('error');
      setMessage(
        `${wrongConnections.length} wrong connection(s), ${missingConnections.length} missing. Only wire pods matching the selector.`,
      );
      return;
    }

    setInvalidPairs(new Set());
    setTone('success');
    setMessage('Service wired correctly! On to the type quiz.');
    setStage(1);
  }

  function checkStage2() {
    const unanswered = serviceTypeQuiz.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setTone('error');
      setMessage(`Answer all ${serviceTypeQuiz.length} scenarios first.`);
      return;
    }

    const wrong = serviceTypeQuiz.filter((q) => answers[q.id] !== q.correctAnswer);
    if (wrong.length > 0) {
      setInvalidAnswers(new Set(wrong.map((q) => q.id)));
      bump(wrong.length);
      setTone('error');
      setMessage(`${wrong.length} scenario(s) incorrect. Review the Service types.`);
      return;
    }

    setInvalidAnswers(new Set());
    setTone('success');
    setMessage('All scenarios matched correctly! Traffic routed with precision.');
    const finalMistakes = mistakes + 0;
    onComplete(starsFromMistakes(finalMistakes, 1));
  }

  function reset() {
    if (stage === 0) {
      setConnections([]);
      setInvalidPairs(new Set());
    } else {
      setAnswers({});
      setInvalidAnswers(new Set());
    }
    setTone('idle');
    setMessage('');
  }

  return (
    <div className="day09">
      <StageStepper
        stages={['Wire the Service', 'Service Type Quiz']}
        current={stage}
        done={stage > 0 ? [0] : []}
        onSelect={unlockAllDays ? setStage : undefined}
      />

      {stage === 0 ? (
        <>
          <p className="day09__lede">
            Connect the <strong>Service</strong> to the pods whose labels match its{' '}
            <code>selector: app={serviceSelector.app}</code>. Only wire the matching pods — wrong
            connections will be flagged.
          </p>
          <ConnectionBoard
            sources={sources}
            targets={targets}
            connections={connections}
            onConnect={(s, t) => setConnections((prev) => [...prev, { source: s, target: t }])}
            onDisconnect={(s, t) =>
              setConnections((prev) => prev.filter((c) => !(c.source === s && c.target === t)))
            }
            invalidPairs={invalidPairs}
            sourceLabel="Service"
            targetLabel="Pods"
          />
          <CheckBar onCheck={checkStage1} onReset={reset} tone={tone} message={message} />
        </>
      ) : (
        <>
          <p className="day09__lede">
            For each access scenario, pick the correct <strong>Service type</strong>:
          </p>
          <div className="day09__quiz">
            {serviceTypeQuiz.map((q) => (
              <div
                key={q.id}
                className={`day09__question ${invalidAnswers.has(q.id) ? 'is-invalid' : ''}`}
              >
                <p className="day09__scenario">{q.scenario}</p>
                <div
                  className="day09__options"
                  role="group"
                  aria-label={`Answer for ${q.scenario}`}
                >
                  {serviceTypeOptions.map((opt) => (
                    <label key={opt} className="day09__option">
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <CheckBar
            onCheck={checkStage2}
            onReset={reset}
            checkLabel="Submit"
            tone={tone}
            message={message}
          />
        </>
      )}
    </div>
  );
}
