import { useMemo, useState } from 'react';
import { CheckBar } from '../../components/CheckBar';
import { StageStepper } from '../../components/StageStepper';
import { Sequencer } from '../../engine/Sequencer';
import { shuffle } from '../../engine/shuffle';
import { starsFromMistakes, type DayGameProps } from '../../engine/types';
import {
  dockerfileInstructions,
  buildAndRunBlanks,
  correctDockerfileOrder,
} from '../../data/day02';
import './Day02.css';

type Tone = 'idle' | 'error' | 'success';

export default function Day02({ onComplete, onMistakes }: DayGameProps) {
  const items = useMemo(
    () =>
      dockerfileInstructions.items.map((item) => ({
        id: item.id,
        label: item.label,
        detail: item.detail,
      })),
    [],
  );

  const [stage, setStage] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  // Stage 1 — dockerfile sequencer
  const [dockerOrder, setDockerOrder] = useState<string[]>(() => shuffle(items.map((i) => i.id)));
  const [dockerInvalid, setDockerInvalid] = useState<Set<number>>(new Set());
  const dockerLocked = stage > 0;

  // Stage 2 — fill blanks
  const [blanks, setBlanks] = useState<Record<string, string>>({});
  const [blanksInvalid, setBlanksInvalid] = useState<Set<string>>(new Set());

  const [tone, setTone] = useState<Tone>('idle');
  const [message, setMessage] = useState('');

  function bump(count: number) {
    setMistakes((m) => {
      const next = m + count;
      onMistakes?.(next);
      return next;
    });
  }

  function checkDocker() {
    if (dockerOrder.join(',') !== correctDockerfileOrder.join(',')) {
      const wrongIndices = new Set<number>();
      dockerOrder.forEach((id, i) => {
        if (id !== correctDockerfileOrder[i]) {
          wrongIndices.add(i);
        }
      });
      setDockerInvalid(wrongIndices);
      bump(wrongIndices.size);
      setTone('error');
      setMessage(
        `${wrongIndices.size} instruction(s) in the wrong position. Reorder and try again.`,
      );
      return;
    }
    setDockerInvalid(new Set());
    setTone('success');
    setMessage('Dockerfile is in order! Now fill in the missing tokens.');
    setStage(1);
  }

  function checkBlanks() {
    const unanswered = buildAndRunBlanks.items.filter((b) => !blanks[b.id]);
    if (unanswered.length > 0) {
      setTone('error');
      setMessage(`Fill in all blanks first — ${unanswered.length} still empty.`);
      return;
    }

    const wrong = buildAndRunBlanks.items.filter((b) => {
      const trimmed = blanks[b.id]?.trim().toLowerCase();
      const expected = b.answer.toLowerCase();
      return trimmed !== expected;
    });

    if (wrong.length > 0) {
      setBlanksInvalid(new Set(wrong.map((b) => b.id)));
      bump(wrong.length);
      setTone('error');
      setMessage(`${wrong.length} token(s) incorrect. Check the hints and try again.`);
      return;
    }

    setBlanksInvalid(new Set());
    setTone('success');
    setMessage('Perfect! Assembly line complete.');
    const finalMistakes = mistakes + 0;
    onComplete(starsFromMistakes(finalMistakes, 2));
  }

  function reset() {
    if (stage === 0) {
      setDockerOrder(shuffle(items.map((i) => i.id)));
      setDockerInvalid(new Set());
    } else {
      setBlanks({});
      setBlanksInvalid(new Set());
    }
    setTone('idle');
    setMessage('');
  }

  return (
    <div className="day02">
      <StageStepper
        stages={['Order the instructions', 'Fill the blanks']}
        current={stage}
        done={stage > 0 ? [0] : []}
      />

      {stage === 0 ? (
        <>
          <p className="day02__lede">
            The Dockerfile is a recipe for building Docker images. Place these instructions in the
            correct order to build the container.
          </p>
          <Sequencer
            items={items}
            order={dockerOrder}
            onReorder={setDockerOrder}
            invalidPositions={dockerInvalid}
            locked={dockerLocked}
            slotLabel="Instruction"
          />
          <CheckBar onCheck={checkDocker} onReset={reset} tone={tone} message={message} />
        </>
      ) : (
        <>
          <p className="day02__lede">
            Now fill in the missing tokens from the build and run commands. Each blank is a single
            value.
          </p>
          <div className="day02__blanks">
            {buildAndRunBlanks.items.map((blank) => (
              <div key={blank.id} className="day02__blank-group">
                <label htmlFor={`blank-${blank.id}`} className="day02__blank-label">
                  <code>{blank.before}</code>
                  <span className="day02__blank-slot" aria-label="blank"></span>
                  <code>{blank.after}</code>
                </label>
                <input
                  id={`blank-${blank.id}`}
                  type="text"
                  className={`day02__blank-input ${blanksInvalid.has(blank.id) ? 'is-invalid' : ''}`}
                  value={blanks[blank.id] ?? ''}
                  onChange={(e) => setBlanks((b) => ({ ...b, [blank.id]: e.target.value }))}
                  placeholder={blank.hint || 'Enter the token'}
                  disabled={false}
                />
              </div>
            ))}
          </div>
          <CheckBar
            onCheck={checkBlanks}
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
