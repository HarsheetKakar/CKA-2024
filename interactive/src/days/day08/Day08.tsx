import { useState } from 'react';
import { CheckBar } from '../../components/CheckBar';
import { StageStepper } from '../../components/StageStepper';
import { unlockAllDays } from '../../store/progress';
import { Sequencer } from '../../engine/Sequencer';
import { starsFromMistakes, type DayGameProps } from '../../engine/types';
import {
  intendedPodCount,
  manifestFields,
  podMatchesSelector,
  podNodes,
  rolloutCorrectOrder,
  rolloutScenario,
  rolloutStartOrder,
  rolloutSteps,
  selectorChips,
  templateLabels,
} from '../../data/day08';
import './Day08.css';

type Tone = 'idle' | 'error' | 'success';

const fieldById = Object.fromEntries(manifestFields.map((f) => [f.id, f] as const));

/** A single editable field inside the YAML manifest. */
function YamlField({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const field = fieldById[id];
  return (
    <select
      id={`day08-${id}`}
      className={`day08__inline-select ${value === '' ? 'is-empty' : ''}`}
      aria-label={field.label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="" disabled>
        ◇ choose
      </option>
      {field.options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

export default function Day08({ onComplete, onMistakes }: DayGameProps) {
  const [stage, setStage] = useState(0);
  const [stage1Complete, setStage1Complete] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  // Stage 1 — configure the Deployment manifest
  const [fields, setFields] = useState<Record<string, string>>(
    Object.fromEntries(manifestFields.map((f) => [f.id, ''])),
  );
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());
  const [ownedPods, setOwnedPods] = useState<Set<string>>(new Set());

  // Stage 2 — rollout ordering
  const [order, setOrder] = useState<string[]>(rolloutStartOrder);
  const [invalidPositions, setInvalidPositions] = useState<Set<number>>(new Set());

  const [tone, setTone] = useState<Tone>('idle');
  const [message, setMessage] = useState('');

  function bump(count: number) {
    setMistakes((m) => {
      const next = m + count;
      onMistakes?.(next);
      return next;
    });
  }

  const selectorList = selectorChips.filter((c) => selectedChips.has(c.id));

  function setField(id: string, value: string) {
    if (stage1Complete) return;
    setFields((prev) => ({ ...prev, [id]: value }));
  }

  function toggleChip(id: string) {
    if (stage1Complete) return;
    setSelectedChips((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyManifest() {
    // Required completeness first (no penalty for an unfinished draft).
    const unset = manifestFields.find((f) => fields[f.id] === '');
    if (unset) {
      setTone('error');
      setMessage(`Set every field — "${unset.label}" is still unset.`);
      return;
    }
    if (selectorList.length === 0) {
      setTone('error');
      setMessage('spec.selector.matchLabels is empty — a Deployment selector is required.');
      return;
    }

    const owned = new Set(
      podNodes.filter((p) => podMatchesSelector(p, selectorList)).map((p) => p.id),
    );
    setOwnedPods(owned);

    const intendedOwned = podNodes.filter((p) => p.kind === 'intended' && owned.has(p.id)).length;
    const foreignOwned = podNodes.filter((p) => p.kind === 'foreign' && owned.has(p.id)).length;

    const issues: string[] = [];
    let problems = 0;

    for (const f of manifestFields) {
      if (fields[f.id] !== f.correct) {
        problems += 1;
        issues.push(f.hint);
      }
    }
    if (intendedOwned < intendedPodCount) {
      problems += 1;
      issues.push(
        `Selector owns only ${intendedOwned}/${intendedPodCount} nginx pods — matchLabels must match the template labels (${templateLabels
          .map((l) => `${l.key}=${l.value}`)
          .join(', ')}).`,
      );
    }
    if (foreignOwned > 0) {
      problems += 1;
      issues.push(
        `Selector also captured ${foreignOwned} foreign pod(s) that merely share a label — tighten matchLabels so the ReplicaSet owns only its own pods.`,
      );
    }

    if (problems > 0) {
      bump(problems);
      setTone('error');
      setMessage(
        `${problems} issue(s) blocking apply. ${issues[0]}${
          issues.length > 1 ? ` (+${issues.length - 1} more)` : ''
        }`,
      );
      return;
    }

    setStage1Complete(true);
    setTone('success');
    setMessage(
      `Manifest applied — the ReplicaSet locked onto all ${intendedPodCount} nginx pods, zero foreign. Now sequence the rollout.`,
    );
    setStage(1);
  }

  function checkRollout() {
    if (completed) return;
    if (!stage1Complete) {
      setTone('error');
      setMessage('Apply a valid manifest in Stage 1 before sequencing the rollout.');
      return;
    }

    const wrong = new Set<number>();
    for (let i = 0; i < rolloutCorrectOrder.length; i++) {
      if (order[i] !== rolloutCorrectOrder[i]) wrong.add(i);
    }

    if (wrong.size > 0) {
      setInvalidPositions(wrong);
      bump(wrong.size);
      setTone('error');
      setMessage(
        `${wrong.size} step(s) out of order. A safe rollout surges a new pod up before draining an old one.`,
      );
      return;
    }

    setInvalidPositions(new Set());
    setCompleted(true);
    setTone('success');
    setMessage('Zero-downtime rollout and clean rollback — the fleet held desired state throughout.');
    onComplete(starsFromMistakes(mistakes, 2));
  }

  function reset() {
    if (stage === 0) {
      setFields(Object.fromEntries(manifestFields.map((f) => [f.id, ''])));
      setSelectedChips(new Set());
      setOwnedPods(new Set());
    } else {
      setOrder(rolloutStartOrder);
      setInvalidPositions(new Set());
    }
    setTone('idle');
    setMessage('');
  }

  return (
    <div className="day08">
      <StageStepper
        stages={['Configure the Deployment', 'Sequence the Rollout']}
        current={stage}
        done={stage1Complete ? [0] : []}
        onSelect={unlockAllDays ? setStage : undefined}
      />

      {stage === 0 ? (
        <div className="day08__stage">
          <p className="day08__lede">
            Configure the <strong>Deployment</strong> manifest below. Pick a valid{' '}
            <code>apiVersion</code>, <code>kind</code>, <code>replicas</code>, image and port — then
            build a <code>selector.matchLabels</code> precise enough to own <strong>all four</strong>{' '}
            nginx pods and <strong>none</strong> of the look-alike pods that merely share a label.
          </p>

          <div className="day08__namespace">
            <span className="day08__pool-title">Pods already in the namespace</span>
            <div className="day08__constellation" aria-label="Pods in the namespace">
              {podNodes.map((p) => {
                const owned = ownedPods.has(p.id);
                const correct = owned && p.kind === 'intended';
                const wrong = owned && p.kind === 'foreign';
                return (
                  <div
                    key={p.id}
                    className={`day08__pod is-${p.kind} ${owned ? 'is-owned' : ''} ${
                      correct ? 'is-correct' : ''
                    } ${wrong ? 'is-wrong' : ''} ${
                      stage1Complete && p.kind === 'intended' ? 'is-locked' : ''
                    }`}
                  >
                    <span className="day08__pod-id">{p.id}</span>
                    <span className="day08__pod-labels">
                      {p.labels.map((l) => `${l.key}=${l.value}`).join(' · ')}
                    </span>
                    {p.note && <span className="day08__pod-note">{p.note}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="day08__editor">
            <pre className="day08__manifest" aria-label="Deployment manifest">
              <code>
                <span className="day08__yaml-line">
                  <span className="day08__yaml-key">apiVersion:</span>{' '}
                  <YamlField
                    id="apiVersion"
                    value={fields.apiVersion}
                    onChange={(v) => setField('apiVersion', v)}
                    disabled={stage1Complete}
                  />
                </span>
                <span className="day08__yaml-line">
                  <span className="day08__yaml-key">kind:</span>{' '}
                  <YamlField
                    id="kind"
                    value={fields.kind}
                    onChange={(v) => setField('kind', v)}
                    disabled={stage1Complete}
                  />
                </span>
                <span className="day08__yaml-line">
                  <span className="day08__yaml-key">metadata:</span>
                </span>
                <span className="day08__yaml-line day08__yaml-line--i1">
                  <span className="day08__yaml-key">name:</span> nginx
                </span>
                <span className="day08__yaml-line">
                  <span className="day08__yaml-key">spec:</span>
                </span>
                <span className="day08__yaml-line day08__yaml-line--i1">
                  <span className="day08__yaml-key">replicas:</span>{' '}
                  <YamlField
                    id="replicas"
                    value={fields.replicas}
                    onChange={(v) => setField('replicas', v)}
                    disabled={stage1Complete}
                  />
                </span>
                <span className="day08__yaml-line day08__yaml-line--i1">
                  <span className="day08__yaml-key">selector:</span>
                </span>
                <span className="day08__yaml-line day08__yaml-line--i2">
                  <span className="day08__yaml-key">matchLabels:</span>
                </span>
                <span className="day08__yaml-line day08__yaml-line--i3 day08__yaml-line--slot">
                  {selectorList.length === 0 ? (
                    <span className="day08__slot-empty"># ← add matchLabels from the pool below</span>
                  ) : (
                    selectorList.map((c) => (
                      <span key={c.id} className="day08__yaml-pair">
                        {c.key}: {c.value}
                      </span>
                    ))
                  )}
                </span>
                <span className="day08__yaml-line day08__yaml-line--i1">
                  <span className="day08__yaml-key">template:</span>
                </span>
                <span className="day08__yaml-line day08__yaml-line--i2">
                  <span className="day08__yaml-key">metadata:</span>
                </span>
                <span className="day08__yaml-line day08__yaml-line--i3">
                  <span className="day08__yaml-key">labels:</span>
                </span>
                {templateLabels.map((l) => (
                  <span
                    key={l.key}
                    className="day08__yaml-line day08__yaml-line--i4 day08__yaml-template"
                  >
                    {l.key}: {l.value}
                  </span>
                ))}
                <span className="day08__yaml-line day08__yaml-line--i2">
                  <span className="day08__yaml-key">spec:</span>
                </span>
                <span className="day08__yaml-line day08__yaml-line--i3">
                  <span className="day08__yaml-key">containers:</span>
                </span>
                <span className="day08__yaml-line day08__yaml-line--i3">
                  <span className="day08__yaml-key">- name:</span> nginx
                </span>
                <span className="day08__yaml-line day08__yaml-line--i4">
                  <span className="day08__yaml-key">image:</span>{' '}
                  <YamlField
                    id="image"
                    value={fields.image}
                    onChange={(v) => setField('image', v)}
                    disabled={stage1Complete}
                  />
                </span>
                <span className="day08__yaml-line day08__yaml-line--i4">
                  <span className="day08__yaml-key">ports:</span>
                </span>
                <span className="day08__yaml-line day08__yaml-line--i4">
                  <span className="day08__yaml-key">- containerPort:</span>{' '}
                  <YamlField
                    id="containerPort"
                    value={fields.containerPort}
                    onChange={(v) => setField('containerPort', v)}
                    disabled={stage1Complete}
                  />
                </span>
              </code>
            </pre>

            <div className="day08__pool-panel">
              <span className="day08__pool-title">matchLabels pool</span>
              <div className="day08__pool" role="group" aria-label="Candidate matchLabels">
                {selectorChips.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`day08__chip-btn ${selectedChips.has(c.id) ? 'is-on' : ''}`}
                    aria-pressed={selectedChips.has(c.id)}
                    disabled={stage1Complete}
                    onClick={() => toggleChip(c.id)}
                  >
                    {c.key}: {c.value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <CheckBar
            onCheck={applyManifest}
            onReset={reset}
            checkLabel="Apply"
            checkDisabled={stage1Complete}
            tone={tone}
            message={message}
          />
        </div>
      ) : (
        <div className="day08__stage">
          <p className="day08__lede">
            Drive a zero-downtime rollout from <code>{rolloutScenario.fromImage}</code> to{' '}
            <code>{rolloutScenario.toImage}</code> at{' '}
            <code>replicas: {rolloutScenario.replicas}</code>,{' '}
            <code>maxSurge: {rolloutScenario.maxSurge}</code>,{' '}
            <code>maxUnavailable: {rolloutScenario.maxUnavailable}</code> — then roll back. Order the
            steps the controller must take.
          </p>
          <Sequencer
            items={rolloutSteps}
            order={order}
            onReorder={setOrder}
            invalidPositions={invalidPositions}
            locked={completed}
            slotLabel="Step"
          />
          <CheckBar
            onCheck={checkRollout}
            onReset={reset}
            checkLabel="Submit"
            checkDisabled={completed}
            tone={tone}
            message={message}
          />
        </div>
      )}
    </div>
  );
}
