import { useState } from 'react';
import { CheckBar } from '../../components/CheckBar';
import { YamlBuilder, type YamlLine, type InsertResult } from '../../engine/YamlBuilder';
import { starsFromMistakes, type DayGameProps } from '../../engine/types';
import { manifestFragments, expectedManifest } from '../../data/day07';
import './Day07.css';

type Tone = 'idle' | 'error' | 'success';

export default function Day07({ onComplete, onMistakes }: DayGameProps) {
  const [lines, setLines] = useState<YamlLine[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [tone, setTone] = useState<Tone>('idle');
  const [message, setMessage] = useState('');
  const [locked, setLocked] = useState(false);

  const fragments = manifestFragments.map((f) => ({ id: f.id, text: f.text }));

  function bump(count: number) {
    setMistakes((m) => {
      const next = m + count;
      onMistakes?.(next);
      return next;
    });
  }

  function handleAttemptInsert(fragmentId: string): InsertResult {
    const def = manifestFragments.find((f) => f.id === fragmentId);
    if (!def) return { ok: false, reason: 'Unknown fragment.' };
    if (!def.valid) {
      bump(1);
      return { ok: false, reason: def.rejectReason };
    }
    return { ok: true };
  }

  function check() {
    if (lines.length === 0) {
      setTone('error');
      setMessage('The manifest is empty. Start building by inserting fragments.');
      return;
    }
    if (lines.length < expectedManifest.length) {
      setTone('error');
      setMessage(
        `Manifest incomplete — expected ${expectedManifest.length} lines, found ${lines.length}.`,
      );
      return;
    }
    const wrong: number[] = [];
    for (let i = 0; i < expectedManifest.length; i++) {
      const expected = expectedManifest[i];
      const actual = lines[i];
      if (
        !actual ||
        actual.fragmentId !== expected.fragmentId ||
        actual.indent !== expected.indent
      ) {
        wrong.push(i + 1);
      }
    }
    if (wrong.length > 0) {
      bump(wrong.length);
      setTone('error');
      setMessage(
        `${wrong.length} line(s) incorrect (order or indent). Review lines: ${wrong.join(', ')}.`,
      );
      return;
    }
    setTone('success');
    setMessage('Manifest is correct! Stamped VALID and ready for departure.');
    setLocked(true);
    const finalMistakes = mistakes + 0;
    onComplete(starsFromMistakes(finalMistakes, 1));
  }

  function reset() {
    setLines([]);
    setTone('idle');
    setMessage('');
  }

  return (
    <div className="day07">
      <p className="day07__lede">
        Assemble a valid <strong>Pod manifest</strong> by dragging YAML fragments into place. Watch
        out for decoy tiles — they will be rejected with a reason when you try to insert them.
      </p>
      <YamlBuilder
        fragments={fragments}
        lines={lines}
        onChange={setLines}
        onAttemptInsert={handleAttemptInsert}
        allowReuse={false}
        indentUnit={2}
        maxIndent={3}
        locked={locked}
      />
      <CheckBar onCheck={check} onReset={reset} checkLabel="Stamp" tone={tone} message={message} />
    </div>
  );
}
