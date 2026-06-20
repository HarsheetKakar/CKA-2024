import { useMemo, useState } from 'react';
import { CheckBar } from '../../components/CheckBar';
import { StageStepper } from '../../components/StageStepper';
import { DragSort } from '../../engine/DragSort';
import { starsFromMistakes, type DayGameProps } from '../../engine/types';
import {
  stageInstructions,
  stageBuckets,
  correctStageAssignments,
  artifacts,
  artifactBuckets,
  correctArtifactAssignments,
} from '../../data/day03';
import './Day03.css';

type Tone = 'idle' | 'error' | 'success';

export default function Day03({ onComplete, onMistakes }: DayGameProps) {
  const instructionItems = useMemo(() => stageInstructions.items, []);
  const bucketItems = useMemo(() => stageBuckets.items, []);
  const artifactItems = useMemo(() => artifacts.items, []);
  const artifactBucketItems = useMemo(() => artifactBuckets.items, []);

  const [stage, setStage] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  // Stage 1 — assign instructions to builder/shipping
  const [stageAssignments, setStageAssignments] = useState<Record<string, string | null>>({});
  const [stageInvalid, setStageInvalid] = useState<Set<string>>(new Set());
  const stageLocked = stage > 0;

  // Stage 2 — assign artifacts to ship/leave
  const [artifactAssignments, setArtifactAssignments] = useState<Record<string, string | null>>({});
  const [artifactInvalid, setArtifactInvalid] = useState<Set<string>>(new Set());

  const [tone, setTone] = useState<Tone>('idle');
  const [message, setMessage] = useState('');

  // Calculate image size ratio: fully correct = 100% reduction, missing = less reduction
  const shippedCount = artifactItems.filter((a) => artifactAssignments[a.id] === 'ship').length;
  const correctShipped = artifactItems.filter(
    (a) => correctArtifactAssignments[a.id] === 'ship',
  ).length;
  const sizePercent =
    correctShipped > 0 ? Math.max(30, 100 - (shippedCount === correctShipped ? 70 : 35)) : 100;

  function bump(count: number) {
    setMistakes((m) => {
      const next = m + count;
      onMistakes?.(next);
      return next;
    });
  }

  function checkStages() {
    const unassigned = instructionItems.filter((i) => !stageAssignments[i.id]);
    if (unassigned.length > 0) {
      setTone('error');
      setMessage(`Assign all instructions first — ${unassigned.length} still unplaced.`);
      return;
    }

    const wrong = instructionItems.filter(
      (i) => stageAssignments[i.id] !== correctStageAssignments[i.id],
    );
    if (wrong.length > 0) {
      setStageInvalid(new Set(wrong.map((i) => i.id)));
      bump(wrong.length);
      setTone('error');
      setMessage(`${wrong.length} instruction(s) in the wrong stage. Reconsider and try again.`);
      return;
    }

    setStageInvalid(new Set());
    setTone('success');
    setMessage('Stages are correct! Now choose which artifacts to ship.');
    setStage(1);
  }

  function checkArtifacts() {
    const unassigned = artifactItems.filter((a) => !artifactAssignments[a.id]);
    if (unassigned.length > 0) {
      setTone('error');
      setMessage(`Decide on all artifacts first — ${unassigned.length} still unplaced.`);
      return;
    }

    const wrong = artifactItems.filter(
      (a) => artifactAssignments[a.id] !== correctArtifactAssignments[a.id],
    );
    if (wrong.length > 0) {
      setArtifactInvalid(new Set(wrong.map((a) => a.id)));
      bump(wrong.length);
      setTone('error');
      setMessage(`${wrong.length} artifact(s) in the wrong bin. Reconsider and try again.`);
      return;
    }

    setArtifactInvalid(new Set());
    setTone('success');
    setMessage('Perfect! Image is optimized for shipping.');
    const finalMistakes = mistakes + 0;
    onComplete(starsFromMistakes(finalMistakes, 2));
  }

  function reset() {
    if (stage === 0) {
      setStageAssignments({});
      setStageInvalid(new Set());
    } else {
      setArtifactAssignments({});
      setArtifactInvalid(new Set());
    }
    setTone('idle');
    setMessage('');
  }

  return (
    <div className="day03">
      <StageStepper
        stages={['Split the stages', 'Choose artifacts']}
        current={stage}
        done={stage > 0 ? [0] : []}
      />

      {stage === 0 ? (
        <>
          <p className="day03__lede">
            A multi-stage Dockerfile uses multiple <code>FROM</code> instructions. Assign each
            instruction to the <strong>Builder stage</strong> (for compilation) or the{' '}
            <strong>Shipping stage</strong> (for the final image).
          </p>
          <DragSort
            items={instructionItems}
            buckets={bucketItems}
            assignments={stageAssignments}
            onAssign={(id, bucket) => setStageAssignments((a) => ({ ...a, [id]: bucket }))}
            invalidIds={stageInvalid}
            lockedIds={stageLocked ? new Set(instructionItems.map((i) => i.id)) : new Set()}
            poolLabel="Instructions to assign"
          />
          <CheckBar onCheck={checkStages} onReset={reset} tone={tone} message={message} />
        </>
      ) : (
        <>
          <p className="day03__lede">
            The builder stage creates the application; the shipping stage is the final image. Decide
            which artifacts should be shipped in the final image and which should be left behind to
            save space.
          </p>
          <div className="day03__size-meter">
            <div className="day03__size-label">
              <span>Final image size:</span>
              <span className="day03__size-percent">{sizePercent}%</span>
            </div>
            <div className="day03__size-bar">
              <div
                className="day03__size-fill"
                style={{ width: `${sizePercent}%` }}
                role="progressbar"
                aria-valuenow={sizePercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Image size reduced to ${sizePercent}%`}
              ></div>
            </div>
          </div>
          <DragSort
            items={artifactItems}
            buckets={artifactBucketItems}
            assignments={artifactAssignments}
            onAssign={(id, bucket) => setArtifactAssignments((a) => ({ ...a, [id]: bucket }))}
            invalidIds={artifactInvalid}
            lockedIds={new Set()}
            poolLabel="Artifacts to assign"
          />
          <CheckBar
            onCheck={checkArtifacts}
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
