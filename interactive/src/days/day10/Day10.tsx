import { useMemo, useState } from 'react';
import { CheckBar } from '../../components/CheckBar';
import { StageStepper } from '../../components/StageStepper';
import { unlockAllDays } from '../../store/progress';
import { DragSort } from '../../engine/DragSort';
import { shuffle } from '../../engine/shuffle';
import { starsFromMistakes, type DayGameProps } from '../../engine/types';
import { namespaceResources, namespaceBuckets, dnsScenarios } from '../../data/day10';
import './Day10.css';

type Tone = 'idle' | 'error' | 'success';

export default function Day10({ onComplete, onMistakes }: DayGameProps) {
  const [stage, setStage] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const items = useMemo(() => shuffle(namespaceResources), []);

  // Stage 1 — Namespace partitioning
  const [assignments, setAssignments] = useState<Record<string, string | null>>({});
  const [invalidIds, setInvalidIds] = useState<Set<string>>(new Set());
  const sortLocked = stage > 0;

  // Stage 2 — DNS assembly
  const [dnsAnswers, setDnsAnswers] = useState<Record<string, string[]>>({});
  const [invalidDns, setInvalidDns] = useState<Set<string>>(new Set());

  const [tone, setTone] = useState<Tone>('idle');
  const [message, setMessage] = useState('');

  function bump(count: number) {
    setMistakes((m) => {
      const next = m + count;
      onMistakes?.(next);
      return next;
    });
  }

  function checkStage1() {
    const unplaced = items.filter((i) => !assignments[i.id]);
    if (unplaced.length > 0) {
      setTone('error');
      setMessage(`Place all resources first — ${unplaced.length} still unassigned.`);
      return;
    }
    const wrong = items.filter((i) => assignments[i.id] !== i.correctNamespace);
    if (wrong.length > 0) {
      setInvalidIds(new Set(wrong.map((i) => i.id)));
      bump(wrong.length);
      setTone('error');
      setMessage(`${wrong.length} resource(s) in the wrong namespace. Re-sort and check again.`);
      return;
    }
    setInvalidIds(new Set());
    setTone('success');
    setMessage('All resources correctly partitioned! On to DNS assembly.');
    setStage(1);
  }

  function checkStage2() {
    const unanswered = dnsScenarios.filter(
      (s) => !dnsAnswers[s.id] || dnsAnswers[s.id].length === 0,
    );
    if (unanswered.length > 0) {
      setTone('error');
      setMessage(`Complete all ${dnsScenarios.length} DNS scenarios first.`);
      return;
    }

    const wrong = dnsScenarios.filter((s) => {
      const answer = dnsAnswers[s.id] || [];
      return JSON.stringify(answer) !== JSON.stringify(s.correctOrder);
    });

    if (wrong.length > 0) {
      setInvalidDns(new Set(wrong.map((s) => s.id)));
      bump(wrong.length);
      setTone('error');
      setMessage(`${wrong.length} DNS scenario(s) incorrect. Review FQDN rules.`);
      return;
    }

    setInvalidDns(new Set());
    setTone('success');
    setMessage('All DNS paths assembled correctly! Harbor gates opened.');
    const finalMistakes = mistakes + 0;
    onComplete(starsFromMistakes(finalMistakes, 1));
  }

  function reset() {
    if (stage === 0) {
      setAssignments({});
      setInvalidIds(new Set());
    } else {
      setDnsAnswers({});
      setInvalidDns(new Set());
    }
    setTone('idle');
    setMessage('');
  }

  const lockedSortIds = useMemo(
    () => (sortLocked ? new Set(items.map((i) => i.id)) : new Set<string>()),
    [sortLocked, items],
  );

  function toggleDnsSegment(scenarioId: string, segment: string) {
    setDnsAnswers((prev) => {
      const current = prev[scenarioId] || [];
      const idx = current.indexOf(segment);
      if (idx >= 0) {
        return { ...prev, [scenarioId]: current.filter((s) => s !== segment) };
      } else {
        return { ...prev, [scenarioId]: [...current, segment] };
      }
    });
  }

  function clearDns(scenarioId: string) {
    setDnsAnswers((prev) => ({ ...prev, [scenarioId]: [] }));
  }

  return (
    <div className="day10">
      <StageStepper
        stages={['Partition Resources', 'Assemble DNS Names']}
        current={stage}
        done={stage > 0 ? [0] : []}
        onSelect={unlockAllDays ? setStage : undefined}
      />

      {stage === 0 ? (
        <>
          <p className="day10__lede">
            Sort each resource into its correct <strong>namespace harbor</strong>: system components
            go to <code>kube-system</code>, dev workloads to <code>dev</code>, production to{' '}
            <code>prod</code>.
          </p>
          <DragSort
            items={items}
            buckets={namespaceBuckets}
            assignments={assignments}
            onAssign={(id, bucket) => setAssignments((a) => ({ ...a, [id]: bucket }))}
            invalidIds={invalidIds}
            lockedIds={lockedSortIds}
            poolLabel="Unassigned resources"
          />
          <CheckBar onCheck={checkStage1} onReset={reset} tone={tone} message={message} />
        </>
      ) : (
        <>
          <p className="day10__lede">
            Assemble the <strong>DNS name</strong> a pod uses to reach each service. For
            cross-namespace access, build the full FQDN. For same-namespace access, the short name
            is enough.
          </p>
          <div className="day10__dns-scenarios">
            {dnsScenarios.map((scenario) => {
              const answer = dnsAnswers[scenario.id] || [];
              const isInvalid = invalidDns.has(scenario.id);
              return (
                <div
                  key={scenario.id}
                  className={`day10__scenario ${isInvalid ? 'is-invalid' : ''}`}
                >
                  <p className="day10__scenario-desc">{scenario.description}</p>
                  <div className="day10__segment-pool" role="group" aria-label="Available segments">
                    {scenario.segments.map((seg) => (
                      <button
                        key={seg}
                        type="button"
                        className={`day10__segment ${answer.includes(seg) ? 'is-selected' : ''}`}
                        onClick={() => toggleDnsSegment(scenario.id, seg)}
                      >
                        {seg}
                      </button>
                    ))}
                  </div>
                  <div className="day10__dns-preview" aria-live="polite">
                    <code>{answer.length > 0 ? answer.join('.') : '(empty)'}</code>
                    {answer.length > 0 && (
                      <button
                        type="button"
                        className="btn btn--ghost day10__clear"
                        onClick={() => clearDns(scenario.id)}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
