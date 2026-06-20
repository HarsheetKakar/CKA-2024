import { useMemo, useState } from 'react';
import { CheckBar } from '../../components/CheckBar';
import { StageStepper } from '../../components/StageStepper';
import { unlockAllDays } from '../../store/progress';
import { DragSort } from '../../engine/DragSort';
import { Sequencer } from '../../engine/Sequencer';
import { shuffle } from '../../engine/shuffle';
import { starsFromMistakes, type DayGameProps } from '../../engine/types';
import { nodeComponents, flowSteps, correctFlowOrder } from '../../data/day05';
import './Day05.css';

type Tone = 'idle' | 'error' | 'success';

export default function Day05({ onComplete, onMistakes }: DayGameProps) {
  const dragItems = useMemo(() => shuffle(nodeComponents), []);
  const flowItems = useMemo(() => shuffle(flowSteps), []);
  const [flowOrder, setFlowOrder] = useState<string[]>(() => flowItems.map((f) => f.id));

  const [stage, setStage] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  // Stage 1 — DragSort (node components)
  const [assignments, setAssignments] = useState<Record<string, string | null>>({});
  const [dragInvalid, setDragInvalid] = useState<Set<string>>(new Set());

  // Stage 2 — Sequencer (flow order)
  const [flowInvalid, setFlowInvalid] = useState<Set<number>>(new Set());

  const [tone, setTone] = useState<Tone>('idle');
  const [message, setMessage] = useState('');

  function bump(count: number) {
    setMistakes((m) => {
      const next = m + count;
      onMistakes?.(next);
      return next;
    });
  }

  function checkDragSort() {
    const unplaced = dragItems.filter((i) => !assignments[i.id]);
    if (unplaced.length > 0) {
      setTone('error');
      setMessage(`Assign all components first — ${unplaced.length} still unplaced.`);
      return;
    }

    const wrong = dragItems.filter((i) => assignments[i.id] !== i.correct);
    if (wrong.length > 0) {
      setDragInvalid(new Set(wrong.map((i) => i.id)));
      bump(wrong.length);
      setTone('error');
      setMessage(`${wrong.length} component(s) on the wrong node. Rearrange and check again.`);
      return;
    }

    setDragInvalid(new Set());
    setTone('success');
    setMessage('Bridge architecture complete. Now trace the request flow.');
    setStage(1);
  }

  function checkFlowOrder() {
    const wrong: number[] = [];
    flowOrder.forEach((id, idx) => {
      if (correctFlowOrder[idx] !== id) {
        wrong.push(idx);
      }
    });

    if (wrong.length > 0) {
      setFlowInvalid(new Set(wrong));
      bump(wrong.length);
      setTone('error');
      setMessage(`${wrong.length} step(s) out of order. Reorder and check again.`);
      return;
    }

    setFlowInvalid(new Set());
    setTone('success');
    setMessage('Request flows perfectly. Bridge is built!');
    const finalMistakes = mistakes;
    onComplete(starsFromMistakes(finalMistakes, 2));
  }

  function reset() {
    if (stage === 0) {
      setAssignments({});
      setDragInvalid(new Set());
    } else {
      setFlowOrder(flowItems.map((f) => f.id));
      setFlowInvalid(new Set());
    }
    setTone('idle');
    setMessage('');
  }

  return (
    <div className="day05">
      <StageStepper
        stages={['Assign components', 'Trace the flow']}
        current={stage}
        done={stage > 0 ? [0] : []}
        onSelect={unlockAllDays ? setStage : undefined}
      />

      {stage === 0 ? (
        <>
          <p className="day05__lede">
            A Kubernetes cluster has a <strong>Control-Plane (bridge)</strong> coordinating
            requests, and <strong>Worker nodes (deck)</strong> running workloads. Drag each
            component to its correct node.
          </p>
          <DragSort
            items={dragItems}
            buckets={[
              {
                id: 'control-plane',
                label: 'Control-Plane (Bridge)',
                hint: 'Commands and decisions',
              },
              { id: 'worker', label: 'Worker Node (Deck)', hint: 'Runs the containers' },
            ]}
            assignments={assignments}
            onAssign={(id, bucket) => setAssignments((a) => ({ ...a, [id]: bucket }))}
            invalidIds={dragInvalid}
            poolLabel="Components waiting to be assigned"
          />
          <CheckBar onCheck={checkDragSort} onReset={reset} tone={tone} message={message} />
        </>
      ) : (
        <>
          <p className="day05__lede">
            When you run <code>kubectl apply</code>, the cluster springs into action. Order the
            steps of this magical request flow.
          </p>
          <Sequencer
            items={flowItems}
            order={flowOrder}
            onReorder={setFlowOrder}
            invalidPositions={flowInvalid}
            slotLabel="Step"
          />
          <CheckBar
            onCheck={checkFlowOrder}
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
