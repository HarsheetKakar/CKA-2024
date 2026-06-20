import { useState, useEffect } from 'react';
import { CheckBar } from '../../components/CheckBar';
import { StageStepper } from '../../components/StageStepper';
import { unlockAllDays } from '../../store/progress';
import { starsFromMistakes, type DayGameProps } from '../../engine/types';
import {
  desiredReplicasTarget,
  initialPodLabels,
  labelSelectorQuestion,
  type PodDef,
} from '../../data/day08';
import './Day08.css';

type Tone = 'idle' | 'error' | 'success';

let podIdCounter = 0;

export default function Day08({ onComplete, onMistakes }: DayGameProps) {
  const [stage, setStage] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  // Stage 1 — Reconciliation
  const [desired, setDesired] = useState(0);
  const [pods, setPods] = useState<PodDef[]>([]);
  const [needsReconcile, setNeedsReconcile] = useState(false);
  const [reconcileAcknowledged, setReconcileAcknowledged] = useState(false);

  // Stage 2 — Rolling update
  const [selectedSelectors, setSelectedSelectors] = useState<Set<string>>(new Set());
  const [rollingInProgress, setRollingInProgress] = useState(false);
  const [rollingComplete, setRollingComplete] = useState(false);
  const [availabilityDips, setAvailabilityDips] = useState(0);

  const [tone, setTone] = useState<Tone>('idle');
  const [message, setMessage] = useState('');

  const actual = pods.filter((p) => p.healthy).length;

  function bump(count: number) {
    setMistakes((m) => {
      const next = m + count;
      onMistakes?.(next);
      return next;
    });
  }

  function createPod(version: string): PodDef {
    return {
      id: `pod-${++podIdCounter}`,
      version,
      healthy: true,
      labels: { ...initialPodLabels },
    };
  }

  function reconcile() {
    setPods((prev) => {
      const healthy = prev.filter((p) => p.healthy);
      if (healthy.length < desired) {
        const needed = desired - healthy.length;
        const newPods = Array.from({ length: needed }, () => createPod('v1'));
        return [...prev, ...newPods];
      } else if (healthy.length > desired) {
        const excess = healthy.length - desired;
        const toRemove = healthy.slice(0, excess).map((p) => p.id);
        return prev.filter((p) => !toRemove.includes(p.id));
      }
      return prev;
    });
    setNeedsReconcile(false);
  }

  useEffect(() => {
    if (stage === 0) {
      const healthy = pods.filter((p) => p.healthy).length;
      if (healthy !== desired) {
        setNeedsReconcile(true);
      } else {
        setNeedsReconcile(false);
      }
    }
  }, [desired, pods, stage]);

  function sinkPod(id: string) {
    setPods((prev) => prev.map((p) => (p.id === id ? { ...p, healthy: false } : p)));
    setNeedsReconcile(true);
    setReconcileAcknowledged(false);
  }

  function checkStage1() {
    if (actual !== desiredReplicasTarget) {
      setTone('error');
      setMessage(
        `Actual replicas (${actual}) does not match desired (${desiredReplicasTarget}). Adjust the dial and reconcile.`,
      );
      return;
    }
    if (!reconcileAcknowledged) {
      setTone('error');
      setMessage(
        'Demonstrate self-healing: sink a pod, then reconcile to restore the desired count.',
      );
      return;
    }
    setTone('success');
    setMessage('Desired state achieved and self-healing demonstrated! On to rolling updates.');
    setStage(1);
  }

  function checkStage2() {
    const correctSelectors = labelSelectorQuestion.options
      .filter((o) => o.correct)
      .map((o) => o.id);
    const wrongSelectors = Array.from(selectedSelectors).filter(
      (s) => !correctSelectors.includes(s),
    );
    const missingSelectors = correctSelectors.filter((s) => !selectedSelectors.has(s));

    if (wrongSelectors.length > 0 || missingSelectors.length > 0) {
      bump(wrongSelectors.length + missingSelectors.length);
      setTone('error');
      setMessage('Label selector incorrect. Select all and only matching selectors.');
      return;
    }

    if (!rollingComplete) {
      setTone('error');
      setMessage('Complete the rolling update first (all pods should be v2).');
      return;
    }

    setTone('success');
    setMessage('Rolling update complete with zero downtime! Fleet upgraded successfully.');
    const finalMistakes = mistakes + availabilityDips;
    onComplete(starsFromMistakes(finalMistakes, 1));
  }

  function startRollingUpdate() {
    setRollingInProgress(true);
    setMessage('Rolling update in progress...');
    let currentPods = [...pods];
    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= currentPods.length) {
        clearInterval(interval);
        setRollingComplete(true);
        setRollingInProgress(false);
        setMessage('Rolling update finished. Check to complete.');
        return;
      }
      const pod = currentPods[idx];
      if (pod.version === 'v1') {
        currentPods = currentPods.map((p) => (p.id === pod.id ? { ...p, version: 'v2' } : p));
        setPods([...currentPods]);
        const healthyCount = currentPods.filter((p) => p.healthy).length;
        if (healthyCount < desiredReplicasTarget - 1) {
          setAvailabilityDips((d) => d + 1);
          bump(1);
        }
      }
      idx++;
    }, 800);
  }

  function reset() {
    if (stage === 0) {
      setDesired(0);
      setPods([]);
      setNeedsReconcile(false);
      setReconcileAcknowledged(false);
    } else {
      setSelectedSelectors(new Set());
      setRollingInProgress(false);
      setRollingComplete(false);
      setAvailabilityDips(0);
    }
    setTone('idle');
    setMessage('');
  }

  function toggleSelector(id: string) {
    setSelectedSelectors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="day08">
      <StageStepper
        stages={['Desired State', 'Rolling Update']}
        current={stage}
        done={stage > 0 ? [0] : []}
        onSelect={unlockAllDays ? setStage : undefined}
      />

      {stage === 0 ? (
        <>
          <p className="day08__lede">
            Set the <strong>desired replica count</strong> to {desiredReplicasTarget}. The
            controller will spawn pods to match. Then sink a pod to test self-healing — the
            controller should recreate it automatically.
          </p>

          <div className="day08__controls">
            <label htmlFor="desired-dial" className="day08__label">
              Desired replicas:
            </label>
            <input
              id="desired-dial"
              type="range"
              min="0"
              max="5"
              value={desired}
              onChange={(e) => setDesired(Number(e.target.value))}
              className="day08__dial"
            />
            <span className="day08__dial-value" aria-live="polite">
              {desired}
            </span>
          </div>

          <div className="day08__gauge">
            <div className="day08__gauge-label">Actual: {actual}</div>
            <div className="day08__gauge-bar">
              <div
                className="day08__gauge-fill"
                style={{ width: `${(actual / 5) * 100}%` }}
                aria-hidden="true"
              />
            </div>
          </div>

          {needsReconcile && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                reconcile();
                setReconcileAcknowledged(true);
              }}
            >
              Reconcile
            </button>
          )}

          <div className="day08__fleet" aria-label="Pod fleet">
            {pods.map((p) => (
              <div
                key={p.id}
                className={`day08__pod ${p.healthy ? '' : 'is-sunk'}`}
                aria-label={`${p.id} (${p.version}, ${p.healthy ? 'healthy' : 'sunk'})`}
              >
                <span className="day08__pod-label">{p.id}</span>
                <span className="day08__pod-version">{p.version}</span>
                {p.healthy && (
                  <button
                    type="button"
                    className="day08__sink-btn"
                    onClick={() => sinkPod(p.id)}
                    aria-label={`Sink ${p.id}`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <CheckBar onCheck={checkStage1} onReset={reset} tone={tone} message={message} />
        </>
      ) : (
        <>
          <p className="day08__lede">
            Select the correct <strong>label selector(s)</strong> that match the nginx pods, then
            perform a <strong>rolling update</strong> from v1 → v2 without dropping below{' '}
            {desiredReplicasTarget - 1} available replicas.
          </p>

          <fieldset className="day08__selector-group">
            <legend>Label selectors:</legend>
            {labelSelectorQuestion.options.map((opt) => (
              <label key={opt.id} className="day08__selector-option">
                <input
                  type="checkbox"
                  checked={selectedSelectors.has(opt.id)}
                  onChange={() => toggleSelector(opt.id)}
                  disabled={rollingInProgress || rollingComplete}
                />
                <code>{opt.label}</code>
              </label>
            ))}
          </fieldset>

          <button
            type="button"
            className="btn btn--primary"
            onClick={startRollingUpdate}
            disabled={rollingInProgress || rollingComplete || selectedSelectors.size === 0}
          >
            Start Rolling Update
          </button>

          <div className="day08__fleet" aria-label="Pod fleet">
            {pods.map((p) => (
              <div
                key={p.id}
                className={`day08__pod day08__pod--${p.version} ${p.healthy ? '' : 'is-sunk'}`}
                aria-label={`${p.id} (${p.version}, ${p.healthy ? 'healthy' : 'sunk'})`}
              >
                <span className="day08__pod-label">{p.id}</span>
                <span className="day08__pod-version">{p.version}</span>
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
