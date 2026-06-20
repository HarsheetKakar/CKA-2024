import { useMemo, useRef, useState } from 'react';
import { Cpu, Gavel, MemoryStick, ShieldAlert, Tag } from 'lucide-react';
import { CheckBar } from '../../components/CheckBar';
import { StageStepper } from '../../components/StageStepper';
import { starsFromMistakes, type DayGameProps } from '../../engine/types';
import {
  clusterComponents,
  day05Copy,
  pendingPods,
  warrantRows,
  workerNodes,
  type PendingPod,
  type Taint,
  type WorkerNode,
} from '../../data/day05';
import './Day05.css';

type Tone = 'idle' | 'error' | 'success';

/** Does the Pod's nodeSelector match every label on the node? */
function selectorMatches(pod: PendingPod, node: WorkerNode): boolean {
  if (!pod.nodeSelector) return true;
  return Object.entries(pod.nodeSelector).every(([k, v]) => node.labels[k] === v);
}

/** Does the Pod tolerate the given taint (key + value + effect must all match)? */
function tolerates(pod: PendingPod, taint: Taint): boolean {
  return (pod.tolerations ?? []).some(
    (t) => t.key === taint.key && t.value === taint.value && t.effect === taint.effect,
  );
}

/** Are all of the node's NoSchedule taints tolerated by the Pod? */
function taintsCleared(pod: PendingPod, node: WorkerNode): boolean {
  return node.taints.every((t) => tolerates(pod, t));
}

export default function Day05({ onComplete, onMistakes }: DayGameProps) {
  const pods = useMemo(() => pendingPods, []);
  const rows = useMemo(() => warrantRows, []);

  const [stage, setStage] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  // Stage 1 — bindings: podId -> nodeId (or undefined while pending).
  const [bindings, setBindings] = useState<Record<string, string | undefined>>({});
  const [badPods, setBadPods] = useState<Set<string>>(new Set());
  const [overNodes, setOverNodes] = useState<Set<string>>(new Set());

  // Stage 2 — attribution: rowId -> componentId.
  const [picks, setPicks] = useState<Record<string, string | undefined>>({});
  const [badRows, setBadRows] = useState<Set<string>>(new Set());

  const [tone, setTone] = useState<Tone>('idle');
  const [message, setMessage] = useState('');
  const completedRef = useRef(false);

  function bump(count: number) {
    setMistakes((m) => {
      const next = m + count;
      onMistakes?.(next);
      return next;
    });
  }

  // Live remaining capacity per node, given current bindings (display only).
  const remaining = useMemo(() => {
    const rem: Record<string, { cpu: number; mem: number }> = {};
    for (const n of workerNodes) rem[n.id] = { cpu: n.cpu, mem: n.mem };
    for (const pod of pods) {
      const nodeId = bindings[pod.id];
      if (nodeId && rem[nodeId]) {
        rem[nodeId].cpu -= pod.cpu;
        rem[nodeId].mem -= pod.mem;
      }
    }
    return rem;
  }, [bindings, pods]);

  function bind(podId: string, nodeId: string) {
    if (stage !== 0) return;
    setBindings((b) => ({ ...b, [podId]: nodeId }));
    setBadPods((s) => {
      if (!s.has(podId)) return s;
      const next = new Set(s);
      next.delete(podId);
      return next;
    });
    setTone('idle');
    setMessage('');
  }

  function checkBench() {
    const unbound = pods.filter((p) => !bindings[p.id]);
    if (unbound.length > 0) {
      setTone('error');
      setMessage(`Bind every Pod first — ${unbound.length} still pending at the bench.`);
      return;
    }

    // Per-node aggregate load (order-independent capacity check).
    const load: Record<string, { cpu: number; mem: number; pods: string[] }> = {};
    for (const n of workerNodes) load[n.id] = { cpu: 0, mem: 0, pods: [] };
    for (const pod of pods) {
      const nodeId = bindings[pod.id]!;
      load[nodeId].cpu += pod.cpu;
      load[nodeId].mem += pod.mem;
      load[nodeId].pods.push(pod.id);
    }

    const invalid = new Set<string>();
    const over = new Set<string>();
    let selectorTaintViolations = 0;

    for (const pod of pods) {
      const node = workerNodes.find((n) => n.id === bindings[pod.id])!;
      if (!selectorMatches(pod, node) || !taintsCleared(pod, node)) {
        invalid.add(pod.id);
        selectorTaintViolations += 1;
      }
    }
    for (const n of workerNodes) {
      if (load[n.id].cpu > n.cpu || load[n.id].mem > n.mem) {
        over.add(n.id);
        for (const pid of load[n.id].pods) invalid.add(pid);
      }
    }

    if (invalid.size > 0) {
      setBadPods(invalid);
      setOverNodes(over);
      bump(invalid.size);
      const parts: string[] = [];
      if (selectorTaintViolations > 0) {
        parts.push(
          `${selectorTaintViolations} Pod(s) on a node that fails their nodeSelector or taint`,
        );
      }
      if (over.size > 0) {
        parts.push(`${over.size} node(s) over capacity`);
      }
      setTone('error');
      setMessage(`Unlawful bindings: ${parts.join(' · ')}. Rebind and check again.`);
      return;
    }

    setBadPods(new Set());
    setOverNodes(new Set());
    setTone('success');
    setMessage(day05Copy.benchDone);
    setStage(1);
  }

  function pickComponent(rowId: string, componentId: string) {
    if (stage !== 1) return;
    setPicks((p) => ({ ...p, [rowId]: componentId }));
    setBadRows((s) => {
      if (!s.has(rowId)) return s;
      const next = new Set(s);
      next.delete(rowId);
      return next;
    });
    setTone('idle');
    setMessage('');
  }

  function checkCertify() {
    const unanswered = rows.filter((r) => !picks[r.id]);
    if (unanswered.length > 0) {
      setTone('error');
      setMessage(`Assign a component to every step — ${unanswered.length} still blank.`);
      return;
    }

    const wrong = new Set(rows.filter((r) => picks[r.id] !== r.answer).map((r) => r.id));
    if (wrong.size > 0) {
      setBadRows(wrong);
      bump(wrong.size);
      setTone('error');
      setMessage(`${wrong.size} step(s) assigned to the wrong component. Reassign and certify again.`);
      return;
    }

    setBadRows(new Set());
    setTone('success');
    setMessage(day05Copy.certifyDone);
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete(starsFromMistakes(mistakes, 2));
    }
  }

  function reset() {
    if (stage === 0) {
      setBindings({});
      setBadPods(new Set());
      setOverNodes(new Set());
    } else {
      setPicks({});
      setBadRows(new Set());
    }
    setTone('idle');
    setMessage('');
  }

  return (
    <div className="day05">
      <StageStepper
        stages={['Issue bindings', 'Certify the trail']}
        current={stage}
        done={stage > 0 ? [0] : []}
      />

      {stage === 0 ? (
        <>
          <p className="day05__lede">{day05Copy.lede}</p>

          <div className="day05__nodes" aria-label="Worker nodes">
            {workerNodes.map((node) => {
              const rem = remaining[node.id];
              const over = overNodes.has(node.id) || rem.cpu < 0 || rem.mem < 0;
              return (
                <div key={node.id} className={`day05__node ${over ? 'is-over' : ''}`}>
                  <div className="day05__node-head">
                    <span className="day05__node-name">{node.name}</span>
                    {over && <span className="day05__node-flag">OVER CAPACITY</span>}
                  </div>
                  <div className="day05__node-cap">
                    <span className="day05__cap">
                      <Cpu size={13} aria-hidden="true" /> {rem.cpu}/{node.cpu} CPU
                    </span>
                    <span className="day05__cap">
                      <MemoryStick size={13} aria-hidden="true" /> {rem.mem}/{node.mem} Gi
                    </span>
                  </div>
                  <div className="day05__node-meta">
                    {Object.entries(node.labels).length === 0 && node.taints.length === 0 && (
                      <span className="day05__meta-none">no labels · no taints</span>
                    )}
                    {Object.entries(node.labels).map(([k, v]) => (
                      <span key={k} className="day05__chip day05__chip--label">
                        <Tag size={11} aria-hidden="true" /> {k}={v}
                      </span>
                    ))}
                    {node.taints.map((t) => (
                      <span key={t.key} className="day05__chip day05__chip--taint">
                        <ShieldAlert size={11} aria-hidden="true" /> {t.key}={t.value}:{t.effect}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="day05__docket" aria-label="Pending Pods">
            {pods.map((pod) => {
              const boundTo = bindings[pod.id];
              const boundNode = workerNodes.find((n) => n.id === boundTo);
              const bad = badPods.has(pod.id);
              return (
                <div
                  key={pod.id}
                  className={`day05__pod ${bad ? 'is-bad' : ''} ${boundTo ? 'is-bound' : ''}`}
                >
                  <div className="day05__pod-head">
                    <span className="day05__pod-name">{pod.name}</span>
                    <span className="day05__pod-status">
                      {boundNode ? `bound → ${boundNode.name}` : 'Pending'}
                    </span>
                  </div>
                  <div className="day05__pod-req">
                    <span className="day05__cap">
                      <Cpu size={12} aria-hidden="true" /> {pod.cpu}
                    </span>
                    <span className="day05__cap">
                      <MemoryStick size={12} aria-hidden="true" /> {pod.mem}Gi
                    </span>
                    {pod.nodeSelector &&
                      Object.entries(pod.nodeSelector).map(([k, v]) => (
                        <span key={k} className="day05__chip day05__chip--label">
                          <Tag size={11} aria-hidden="true" /> needs {k}={v}
                        </span>
                      ))}
                    {pod.tolerations?.map((t) => (
                      <span key={t.key} className="day05__chip day05__chip--tol">
                        <ShieldAlert size={11} aria-hidden="true" /> tolerates {t.key}={t.value}
                      </span>
                    ))}
                  </div>
                  <p className="day05__pod-note">{pod.note}</p>
                  <div className="day05__bind-row" role="group" aria-label={`Bind ${pod.name}`}>
                    {workerNodes.map((node) => (
                      <button
                        key={node.id}
                        type="button"
                        className={`day05__bind-btn ${boundTo === node.id ? 'is-active' : ''}`}
                        aria-label={`Bind ${pod.name} to ${node.name}`}
                        aria-pressed={boundTo === node.id}
                        onClick={() => bind(pod.id, node.id)}
                      >
                        {node.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <CheckBar
            onCheck={checkBench}
            onReset={reset}
            checkLabel="Issue bindings"
            tone={tone}
            message={message}
          />
        </>
      ) : (
        <>
          <p className="day05__lede">
            The bindings are issued. Now certify the trail: assign each step of the bind→run
            lifecycle to the one component responsible. The scheduler only decides — it never
            runs Pods or writes to etcd itself.
          </p>

          <div className="day05__warrants" aria-label="Lifecycle steps">
            {rows.map((row) => {
              const pick = picks[row.id];
              const bad = badRows.has(row.id);
              return (
                <div key={row.id} className={`day05__warrant ${bad ? 'is-bad' : ''}`}>
                  <p className="day05__warrant-action">{row.action}</p>
                  <div
                    className="day05__warrant-opts"
                    role="group"
                    aria-label={`Component for: ${row.action}`}
                  >
                    {clusterComponents.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`day05__opt ${pick === c.id ? 'is-active' : ''}`}
                        aria-label={`${row.id}: ${c.label}`}
                        aria-pressed={pick === c.id}
                        onClick={() => pickComponent(row.id, c.id)}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <CheckBar
            onCheck={checkCertify}
            onReset={reset}
            checkLabel="Certify"
            tone={tone}
            message={message}
          >
            <span className="day05__gavel" aria-hidden="true">
              <Gavel size={15} />
            </span>
          </CheckBar>
        </>
      )}
    </div>
  );
}
