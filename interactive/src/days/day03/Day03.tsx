import { useMemo, useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { CheckBar } from '../../components/CheckBar';
import { starsFromMistakes, type DayGameProps } from '../../engine/types';
import {
  initialState,
  tools,
  computeImageSize,
  evaluateVitals,
  isDischargeable,
  renderDockerfile,
  initialImageSizeMb,
  targetImageSizeMb,
  targetDockerfile,
  type SurgeryState,
  type SurgicalTool,
  type ToolCategory,
} from '../../data/day03';
import './Day03.css';

type Tone = 'idle' | 'error' | 'success';

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  stages: 'Stage structure',
  builder: 'Builder hygiene',
  runtime: 'Runtime stage',
};

const CATEGORY_ORDER: ToolCategory[] = ['stages', 'builder', 'runtime'];

const CRUFT_PATTERNS = [
  'apt-get',
  '--save-dev',
  'npm test',
  'NODE_ENV=development',
  'EXPOSE 3000',
  '"npm","start"',
  'node_modules',
];

function isCruftLine(text: string, stage: 'builder' | 'runtime'): boolean {
  if (CRUFT_PATTERNS.some((p) => text.includes(p))) return true;
  if (text === 'FROM node:18 AS deployer') return true;
  if (stage === 'runtime' && text === 'COPY . .') return true;
  return false;
}

export default function Day03({ onComplete, onMistakes, reducedMotion }: DayGameProps) {
  const [state, setState] = useState<SurgeryState>(initialState);
  const [mistakes, setMistakes] = useState(0);
  const [tone, setTone] = useState<Tone>('idle');
  const [message, setMessage] = useState('');
  const [discharged, setDischarged] = useState(false);

  const size = useMemo(() => computeImageSize(state), [state]);
  const vitals = useMemo(() => evaluateVitals(state), [state]);
  const dockerfile = useMemo(() => renderDockerfile(state), [state]);

  const underTarget = size < targetImageSizeMb;
  const meterPercent = Math.max(4, Math.min(100, Math.round((size / initialImageSizeMb) * 100)));

  function applyTool(tool: SurgicalTool) {
    if (discharged || !tool.enabled(state)) return;
    const turningOn = !tool.active(state);
    const next = tool.apply(state);

    if (tool.kind === 'malpractice') {
      if (turningOn) {
        setMistakes((m) => {
          const v = m + 1;
          onMistakes?.(v);
          return v;
        });
        setTone('error');
        setMessage(`🤡 HONK! Malpractice: ${tool.hint.replace('MALPRACTICE: ', '')}`);
      } else {
        setTone('idle');
        setMessage('Cruft removed from the runtime — good catch.');
      }
    } else {
      setTone('idle');
      setMessage(
        turningOn
          ? 'Applied — watch the size meter & Dockerfile. Click the card again to undo.'
          : 'Reverted that change.',
      );
    }
    setState(next);
  }

  function check() {
    if (!state.stagesSplit) {
      setTone('error');
      setMessage('The patient is still a single stage. Split it so build bloat can be left behind.');
      return;
    }
    const failing = vitals.filter((v) => !v.ok);
    if (failing.length > 0) {
      setTone('error');
      setMessage(
        `Not ready for discharge — ${failing.length} vital(s) still red. Keep operating.`,
      );
      return;
    }
    if (!isDischargeable(state)) {
      setTone('error');
      setMessage(
        `Vitals green but the image is still ${size} MB (target < ${targetImageSizeMb} MB). Trim the runtime.`,
      );
      return;
    }
    setTone('success');
    setMessage(
      `Discharged! You shrank the patient from ${initialImageSizeMb} MB to ${size} MB. 🎉`,
    );
    setDischarged(true);
    onComplete(starsFromMistakes(mistakes, 1));
  }

  function reset() {
    setState(initialState);
    setMistakes(0);
    onMistakes?.(0);
    setTone('idle');
    setMessage('');
    setDischarged(false);
  }

  const toolsByCategory = (cat: ToolCategory) => tools.filter((t) => t.category === cat);

  return (
    <div className={`day03${reducedMotion ? ' day03--reduced' : ''}`}>
      <p className="day03__lede">
        🎪 <strong>Surgery Circus:</strong> refactor the bloated single-stage patient (
        <strong>{initialImageSizeMb} MB</strong>) into a lean <strong>multi-stage build</strong> —
        all five vitals green and the final image under <strong>{targetImageSizeMb} MB</strong>.
        Every tool is a <strong>toggle</strong>: click to apply and watch the size meter &amp;
        Dockerfile react, then click again to undo. Avoid the red <strong>malpractice</strong>{' '}
        tools.
      </p>

      <div className="day03__hud">
        <div className="day03__meter">
          <div className="day03__meter-head">
            <span>Final image size</span>
            <span
              className={`day03__meter-value${underTarget ? ' is-under' : ' is-over'}`}
              aria-live="polite"
            >
              {size} MB
            </span>
          </div>
          <div className="day03__meter-bar">
            <div
              className={`day03__meter-fill${underTarget ? ' is-under' : ' is-over'}`}
              style={{ width: `${meterPercent}%` }}
              role="progressbar"
              aria-valuenow={size}
              aria-valuemin={0}
              aria-valuemax={initialImageSizeMb}
              aria-label={`Final image size ${size} megabytes`}
            />
            <span
              className="day03__meter-target"
              style={{ left: `${(targetImageSizeMb / initialImageSizeMb) * 100}%` }}
              aria-hidden="true"
            />
          </div>
          <p className="day03__meter-caption">
            Target: &lt; {targetImageSizeMb} MB · Mistakes: {mistakes}
          </p>
        </div>

        <ul className="day03__vital-list" aria-label="Patient vitals">
          {vitals.map((v) => (
            <li
              key={v.id}
              className={`day03__vital${v.ok ? ' is-ok' : ' is-pending'}`}
              title={v.label}
            >
              {v.ok ? (
                <CheckCircle2 size={15} aria-hidden="true" />
              ) : (
                <Circle size={15} aria-hidden="true" />
              )}
              <span>{v.short}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="day03__theatre">
        <div className="day03__palette" aria-label="Surgical tools">
          {CATEGORY_ORDER.map((cat) => (
            <div key={cat} className="day03__tool-group">
              <h4 className="day03__tool-group-title">{CATEGORY_LABELS[cat]}</h4>
              <div className="day03__tool-grid">
                {toolsByCategory(cat).map((tool) => {
                  const enabled = tool.enabled(state) && !discharged;
                  const active = tool.active?.(state) ?? false;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      className={`day03__tool day03__tool--${tool.kind}${active ? ' is-active' : ''}`}
                      onClick={() => applyTool(tool)}
                      disabled={!enabled}
                      title={tool.hint}
                    >
                      <span className="day03__tool-label">
                        {active ? `Undo: ${tool.label}` : tool.label}
                      </span>
                      <span className="day03__tool-hint">{tool.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <section className="day03__patient" aria-label="Dockerfile patient">
          <div className="day03__stage">
            <h3 className="day03__stage-title">
              {state.stagesSplit ? 'Builder stage' : 'Single stage (the patient)'}
            </h3>
            <pre className="day03__code">
              {dockerfile.builder.map((line, i) => (
                <code
                  key={`b-${i}`}
                  className={`day03__line${isCruftLine(line, 'builder') ? ' day03__line--cruft' : ''}`}
                >
                  {line}
                </code>
              ))}
            </pre>
          </div>

          {dockerfile.runtime && (
            <div className="day03__stage day03__stage--runtime">
              <h3 className="day03__stage-title">Runtime stage (the final image)</h3>
              <pre className="day03__code">
                {dockerfile.runtime.map((line, i) => (
                  <code
                    key={`r-${i}`}
                    className={`day03__line${isCruftLine(line, 'runtime') ? ' day03__line--cruft' : ''}`}
                  >
                    {line}
                  </code>
                ))}
              </pre>
            </div>
          )}
        </section>
      </div>

      <details className="day03__reference">
        <summary>Surgeon's reference (optimized Dockerfile)</summary>
        <pre className="day03__code">
          {targetDockerfile.split('\n').map((line, i) => (
            <code key={`t-${i}`} className="day03__line">
              {line}
            </code>
          ))}
        </pre>
      </details>

      <CheckBar onCheck={check} onReset={reset} checkLabel="Close up" tone={tone} message={message} />
    </div>
  );
}
