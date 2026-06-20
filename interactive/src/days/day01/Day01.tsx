import { useMemo, useState } from 'react';
import { CheckBar } from '../../components/CheckBar';
import { StageStepper } from '../../components/StageStepper';
import { unlockAllDays } from '../../store/progress';
import { DragSort } from '../../engine/DragSort';
import { MatchPairs } from '../../engine/MatchPairs';
import { shuffle } from '../../engine/shuffle';
import { starsFromMistakes, type DayGameProps } from '../../engine/types';
import { archMatch, deckSort } from '../../data/day01';
import './Day01.css';

type Tone = 'idle' | 'error' | 'success';

export default function Day01({ onComplete, onMistakes }: DayGameProps) {
  // Shuffle item order once per attempt for replayability; answer keys stay fixed.
  const items = useMemo(() => shuffle(deckSort.items), []);
  const archLeft = useMemo(() => archMatch.pairs.map((p) => ({ id: p.id, label: p.term })), []);
  const archRight = useMemo(
    () => shuffle(archMatch.pairs).map((p) => ({ id: p.roleId, label: p.role })),
    [],
  );

  const [stage, setStage] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  // Stage 1 — deck sort
  const [assignments, setAssignments] = useState<Record<string, string | null>>({});
  const [sortInvalid, setSortInvalid] = useState<Set<string>>(new Set());
  const sortLocked = stage > 0;

  // Stage 2 — architecture match
  const [matches, setMatches] = useState<Record<string, string | null>>({});
  const [matchInvalid, setMatchInvalid] = useState<Set<string>>(new Set());

  const [tone, setTone] = useState<Tone>('idle');
  const [message, setMessage] = useState('');

  function bump(count: number) {
    setMistakes((m) => {
      const next = m + count;
      onMistakes?.(next);
      return next;
    });
  }

  function checkSort() {
    const unplaced = items.filter((i) => !assignments[i.id]);
    if (unplaced.length > 0) {
      setTone('error');
      setMessage(`Place all cargo first — ${unplaced.length} crate(s) still on the dock.`);
      return;
    }
    const wrong = items.filter((i) => assignments[i.id] !== i.correct);
    if (wrong.length > 0) {
      setSortInvalid(new Set(wrong.map((i) => i.id)));
      bump(wrong.length);
      setTone('error');
      setMessage(`${wrong.length} crate(s) on the wrong deck. Re-sort and check again.`);
      return;
    }
    setSortInvalid(new Set());
    setTone('success');
    setMessage('Both decks loaded correctly. On to the architecture pairs.');
    setStage(1);
  }

  function checkMatch() {
    const unmatched = archMatch.pairs.filter((p) => !matches[p.id]);
    if (unmatched.length > 0) {
      setTone('error');
      setMessage(`Match every term — ${unmatched.length} still unpaired.`);
      return;
    }
    const wrong = archMatch.pairs.filter((p) => matches[p.id] !== p.roleId);
    if (wrong.length > 0) {
      setMatchInvalid(new Set(wrong.map((p) => p.id)));
      bump(wrong.length);
      setTone('error');
      setMessage(`${wrong.length} pair(s) mismatched. Adjust and check again.`);
      return;
    }
    setMatchInvalid(new Set());
    setTone('success');
    setMessage('All hands aligned. Voyage complete!');
    const finalMistakes = mistakes + 0;
    onComplete(starsFromMistakes(finalMistakes, 2));
  }

  function reset() {
    if (stage === 0) {
      setAssignments({});
      setSortInvalid(new Set());
    } else {
      setMatches({});
      setMatchInvalid(new Set());
    }
    setTone('idle');
    setMessage('');
  }

  const lockedSortIds = useMemo(
    () => (sortLocked ? new Set(items.map((i) => i.id)) : new Set<string>()),
    [sortLocked, items],
  );

  return (
    <div className="day01">
      <StageStepper
        stages={['Sort the cargo', 'Match the crew']}
        current={stage}
        done={stage > 0 ? [0] : []}
        onSelect={unlockAllDays ? setStage : undefined}
      />

      {stage === 0 ? (
        <>
          <p className="day01__lede">
            Two ships are loading at the Sorting Yard. Send each crate to the deck it belongs on —
            the nimble <strong>Container</strong> deck or the heavy <strong>Virtual Machine</strong>{' '}
            deck.
          </p>
          <DragSort
            items={items}
            buckets={deckSort.buckets}
            assignments={assignments}
            onAssign={(id, bucket) => setAssignments((a) => ({ ...a, [id]: bucket }))}
            invalidIds={sortInvalid}
            lockedIds={lockedSortIds}
            poolLabel="Cargo waiting on the dock"
          />
          <CheckBar onCheck={checkSort} onReset={reset} tone={tone} message={message} />
        </>
      ) : (
        <>
          <p className="day01__lede">
            Now crew the <strong>Docker architecture</strong>: match each part to the job it does.
          </p>
          <MatchPairs
            left={archLeft}
            right={archRight}
            matches={matches}
            onMatch={(l, r) => setMatches((m) => ({ ...m, [l]: r }))}
            invalidIds={matchInvalid}
            leftLabel="Docker part"
            rightLabel="Its role"
          />
          <CheckBar
            onCheck={checkMatch}
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
