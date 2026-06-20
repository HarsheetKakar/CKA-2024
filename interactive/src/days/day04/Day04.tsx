import { useEffect, useReducer, useRef, useState } from 'react';
import { HelpCircle, Power, RotateCcw, Siren, X } from 'lucide-react';
import { starsFromMistakes, type DayGameProps } from '../../engine/types';
import { nodes, replicaRequiem } from '../../data/day04';
import './Day04.css';

const CFG = replicaRequiem;

interface Pod {
  id: string;
  nodeId: string;
  healthy: boolean;
}

type Outcome = 'won' | 'lost' | null;

interface GameState {
  running: boolean;
  finished: boolean;
  outcome: Outcome;
  controllerOn: boolean;
  desired: number;
  pods: Pod[];
  dark: Record<string, number>; // nodeId -> ticks of darkness left
  budget: number;
  demand: number;
  tick: number;
  starvedTicks: number;
  streak: number;
  nextPodId: number;
}

type Action =
  | { type: 'BEGIN' }
  | { type: 'TICK' }
  | { type: 'SET_DESIRED'; value: number }
  | { type: 'TOGGLE_CONTROLLER' }
  | { type: 'RESTART_POD'; id: string }
  | { type: 'RESET' };

function seedPods(): Pod[] {
  // Pre-existing standalone pods: base demand worth, spread across nodes.
  const count = CFG.demand.base;
  return Array.from({ length: count }, (_, i) => ({
    id: `pod-${i + 1}`,
    nodeId: nodes[i % nodes.length].id,
    healthy: true,
  }));
}

/**
 * Deterministic request demand for a given tick, so the request graph can forecast the
 * incoming load ahead of "now" with a dotted line. Must match the surge logic in TICK.
 */
function demandAt(tick: number): number {
  return tick > 0 && tick % 16 >= 10 ? CFG.demand.surgePeak : CFG.demand.base;
}

function initialState(): GameState {
  return {
    running: false,
    finished: false,
    outcome: null,
    controllerOn: false,
    desired: CFG.desired.initial,
    pods: seedPods(),
    dark: {},
    budget: CFG.budget.start,
    demand: CFG.demand.base,
    tick: 0,
    starvedTicks: 0,
    streak: 0,
    nextPodId: CFG.demand.base + 1,
  };
}

function healthyCount(pods: Pod[]): number {
  return pods.filter((p) => p.healthy).length;
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'BEGIN':
      return { ...initialState(), running: true, desired: state.desired };

    case 'RESET':
      return initialState();

    case 'SET_DESIRED':
      return { ...state, desired: action.value };

    case 'TOGGLE_CONTROLLER': {
      if (!state.running || state.finished) return state;
      return { ...state, controllerOn: !state.controllerOn };
    }

    case 'RESTART_POD': {
      if (!state.running || state.finished || state.controllerOn) return state;
      return {
        ...state,
        pods: state.pods.map((p) =>
          p.id === action.id && !p.healthy && !state.dark[p.nodeId] ? { ...p, healthy: true } : p,
        ),
      };
    }

    case 'TICK': {
      if (!state.running || state.finished) return state;

      // Work on shallow copies so we can mutate within the tick.
      const s: GameState = {
        ...state,
        pods: state.pods.map((p) => ({ ...p })),
        dark: { ...state.dark },
      };
      s.tick += 1;

      // 1. Recover nodes whose blackout has elapsed.
      for (const id of Object.keys(s.dark)) {
        s.dark[id] -= 1;
        if (s.dark[id] <= 0) {
          delete s.dark[id];
        }
      }

      // 2. Maybe black out a node (one at a time, after a grace period).
      const anyDark = Object.keys(s.dark).length > 0;
      if (s.tick >= CFG.storm.blackoutAfterTick && !anyDark && Math.random() < CFG.storm.blackoutProb) {
        const live = nodes.filter((n) => !s.dark[n.id]);
        const victim = live[Math.floor(Math.random() * live.length)];
        s.dark[victim.id] = CFG.storm.blackoutDuration;
        for (const p of s.pods) {
          if (p.nodeId === victim.id && p.healthy) {
            p.healthy = false;
          }
        }
      }

      // 3. Crashes — the swarm ramps up over the shift.
      const crashProb = Math.min(
        CFG.storm.crashBaseProb + s.tick * CFG.storm.crashRampPerTick,
        CFG.storm.crashMaxProb,
      );
      const crashes = crashProb > 0.5 ? 2 : 1;
      for (let c = 0; c < crashes; c++) {
        if (Math.random() >= crashProb) continue;
        const alive = s.pods.filter((p) => p.healthy);
        if (alive.length === 0) break;
        const victim = alive[Math.floor(Math.random() * alive.length)];
        victim.healthy = false;
      }

      // 4. Demand follows the deterministic request forecast (teach horizontal scaling).
      s.demand = demandAt(s.tick);

      // 5. Reconcile — only when the controller is declaring desired state.
      if (s.controllerOn) {
        reconcile(s);
      }

      // 6. Error budget + stability streak.
      const healthy = healthyCount(s.pods);
      if (healthy < s.demand) {
        const shortfall = s.demand - healthy;
        s.budget = Math.max(CFG.budget.min, s.budget - shortfall * CFG.budget.drainPerMissing);
        s.starvedTicks += 1;
        s.streak = 0;
      } else {
        s.budget = Math.min(CFG.budget.max, s.budget + CFG.budget.regen);
        s.streak = s.controllerOn && s.budget >= CFG.budget.calmThreshold ? s.streak + 1 : 0;
      }

      // 7. Win / lose.
      if (s.budget <= CFG.budget.min) {
        s.finished = true;
        s.outcome = 'lost';
      } else if (s.streak >= CFG.winStreakTicks) {
        s.finished = true;
        s.outcome = 'won';
      }

      return s;
    }

    default:
      return state;
  }
}

/** Drive the actual pods toward the declared desired count: self-heal, reschedule, scale. */
function reconcile(s: GameState): void {
  const live = nodes.filter((n) => !s.dark[n.id]).map((n) => n.id);
  if (live.length === 0) return;
  let liveIdx = 0;
  const nextLive = () => {
    const id = live[liveIdx % live.length];
    liveIdx += 1;
    return id;
  };

  let healthy = healthyCount(s.pods);

  // Self-heal crashed pods (rescheduling them onto a live node) up to desired.
  for (const p of s.pods) {
    if (healthy >= s.desired) break;
    if (!p.healthy) {
      p.healthy = true;
      p.nodeId = nextLive();
      healthy += 1;
    }
  }
  // Scale up: spawn new pods if still short of desired.
  while (healthy < s.desired) {
    s.pods.push({ id: `pod-${s.nextPodId++}`, nodeId: nextLive(), healthy: true });
    healthy += 1;
  }
  // Scale down: retire extra healthy pods above desired.
  if (healthy > s.desired) {
    let remove = healthy - s.desired;
    for (let i = s.pods.length - 1; i >= 0 && remove > 0; i--) {
      if (s.pods[i].healthy) {
        s.pods.splice(i, 1);
        remove -= 1;
      }
    }
  }
}

export default function Day04({ onComplete, onMistakes }: DayGameProps) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [showHelp, setShowHelp] = useState(true);
  const completedRef = useRef(false);

  // Master clock — only ticks while a shift is live. Cleaned up on stop/unmount.
  useEffect(() => {
    if (!state.running || state.finished) return;
    const interval = setInterval(() => dispatch({ type: 'TICK' }), CFG.tickMs);
    return () => clearInterval(interval);
  }, [state.running, state.finished]);

  // Mirror the running mistake tally to the Ship's Log.
  useEffect(() => {
    onMistakes?.(state.starvedTicks);
  }, [state.starvedTicks, onMistakes]);

  // Award stars exactly once, only on a win.
  useEffect(() => {
    if (state.finished && state.outcome === 'won' && !completedRef.current) {
      completedRef.current = true;
      onComplete(starsFromMistakes(state.starvedTicks, CFG.starScale));
    }
  }, [state.finished, state.outcome, state.starvedTicks, onComplete]);

  const healthy = healthyCount(state.pods);
  const budgetPct = (state.budget / CFG.budget.max) * 100;
  const budgetTone = state.budget < 34 ? 'crit' : state.budget < 67 ? 'warn' : 'ok';
  const meetsDemand = healthy >= state.demand;

  const crashedOnLiveNode = state.pods.some((p) => !p.healthy && !state.dark[p.nodeId]);

  function liveStatus(): { tone: 'idle'; text: string } {
    if (!state.controllerOn) {
      if (crashedOnLiveNode) {
        return {
          tone: 'idle',
          text: '⚠ Crashed pods! Click “Restart” on each one — or set Desired replicas above Demand and flip the Controller ON to automate it.',
        };
      }
      return {
        tone: 'idle',
        text: '① Drag “Desired replicas” above Demand, then ② click “Controller OFF” to switch it ON. Manual restarts alone can’t win.',
      };
    }
    if (state.desired < state.demand) {
      return {
        tone: 'idle',
        text: `Desired (${state.desired}) is below Demand (${state.demand}) — raise the dial so the controller keeps enough pods running.`,
      };
    }
    return {
      tone: 'idle',
      text: `✓ Controller is holding the line. Stay hands-off and hold the calm streak to ${CFG.winStreakTicks} to win.`,
    };
  }

  const status =
    state.outcome === 'won'
      ? { tone: 'success' as const, text: CFG.copy.win }
      : state.outcome === 'lost'
        ? { tone: 'error' as const, text: CFG.copy.loseBudget }
        : !state.running
          ? { tone: 'idle' as const, text: 'Read the briefing below, then press “Begin shift”.' }
          : liveStatus();

  return (
    <div className="day04">
      {/* Console: request graph on top of the error-budget telemetry + controls */}
      <div className="day04__console">
        <RequestGraph tick={state.tick} healthy={healthy} demand={state.demand} />

        <div className="day04__gauges">
          <div className={`day04__gauge day04__gauge--${budgetTone}`}>
            <div className="day04__gauge-head">
              <span>Error budget</span>
              <span aria-live="polite">{Math.round(state.budget)}%</span>
            </div>
            <div className="day04__gauge-bar">
              <div className="day04__gauge-fill" style={{ width: `${budgetPct}%` }} aria-hidden="true" />
            </div>
          </div>

          <div className="day04__stat">
            <span className="day04__stat-label">Demand</span>
            <span className="day04__stat-value">{state.demand}</span>
          </div>
          <div className={`day04__stat ${meetsDemand ? 'is-ok' : 'is-short'}`}>
            <span className="day04__stat-label">Healthy</span>
            <span className="day04__stat-value">{healthy}</span>
          </div>
          <div className="day04__stat">
            <span className="day04__stat-label">Calm streak</span>
            <span className="day04__stat-value">
              {state.streak}/{CFG.winStreakTicks}
            </span>
          </div>
        </div>

        <div className="day04__controls">
          <label htmlFor="day04-desired" className="day04__dial-label">
            Desired replicas
          </label>
          <input
            id="day04-desired"
            type="range"
            className="day04__dial"
            min={CFG.desired.min}
            max={CFG.desired.max}
            value={state.desired}
            disabled={state.finished}
            onChange={(e) => dispatch({ type: 'SET_DESIRED', value: Number(e.target.value) })}
          />
          <span className="day04__dial-value" aria-live="polite">
            {state.desired}
          </span>

          {!state.running ? (
            <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'BEGIN' })}>
              <Siren size={15} aria-hidden="true" /> Begin shift
            </button>
          ) : (
            <button
              type="button"
              className={`btn ${state.controllerOn ? 'btn--primary' : 'btn--ghost'} day04__controller-btn`}
              onClick={() => dispatch({ type: 'TOGGLE_CONTROLLER' })}
              disabled={state.finished}
              aria-pressed={state.controllerOn}
            >
              <Power size={15} aria-hidden="true" />
              Controller {state.controllerOn ? 'ON' : 'OFF'}
            </button>
          )}

          {(state.running || state.finished) && (
            <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'RESET' })}>
              <RotateCcw size={15} aria-hidden="true" /> Reset
            </button>
          )}

          <button
            type="button"
            className="btn btn--ghost day04__help-btn"
            onClick={() => setShowHelp(true)}
          >
            <HelpCircle size={15} aria-hidden="true" /> How to play
          </button>
        </div>
      </div>

      {/* Nodes + pods */}
      <div className="day04__nodes" aria-label="Nodes and pods">
        {nodes.map((node) => {
          const dark = Boolean(state.dark[node.id]);
          const podsHere = state.pods.filter((p) => p.nodeId === node.id);
          return (
            <div key={node.id} className={`day04__node ${dark ? 'is-dark' : ''}`}>
              <div className="day04__node-head">
                <span>{node.label}</span>
                {dark && <span className="day04__node-flag">BLACKOUT</span>}
              </div>
              <div className="day04__slots">
                {podsHere.length === 0 && <span className="day04__empty">—</span>}
                {podsHere.map((p) => (
                  <div
                    key={p.id}
                    className={`day04__pod ${p.healthy ? 'is-healthy' : 'is-crashed'}`}
                    aria-label={`${p.id} ${p.healthy ? 'healthy' : 'crashed'} on ${node.label}`}
                  >
                    <span className="day04__pod-id">{p.id}</span>
                    {!p.healthy && !state.controllerOn && (
                      <button
                        type="button"
                        className="day04__restart"
                        onClick={() => dispatch({ type: 'RESTART_POD', id: p.id })}
                        disabled={dark || state.finished}
                        title={dark ? 'Node is down — cannot restart here' : 'Restart pod'}
                      >
                        Restart
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status */}
      <p className={`day04__status day04__status--${status.tone}`} role="status" aria-live="polite">
        {status.text}
      </p>

      {showHelp && (
        <div
          className="day04__overlay"
          role="dialog"
          aria-modal="true"
          aria-label="How to play"
          onClick={() => setShowHelp(false)}
        >
          <div className="day04__modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="day04__modal-close"
              onClick={() => setShowHelp(false)}
              aria-label="Close how to play"
            >
              <X size={18} aria-hidden="true" />
            </button>
            <h3 className="day04__briefing-title">How to play</h3>
            <ol className="day04__steps">
              <li>
                Press <strong>Begin shift</strong>. Pods start crashing and a node can black out,
                taking its pods down.
              </li>
              <li>
                <strong>Manual mode (controller OFF):</strong> click <strong>Restart</strong> on each
                crashed pod yourself. As the storm ramps, this becomes impossible — that&rsquo;s the
                pain of standalone containers.
              </li>
              <li>
                <strong>Go declarative:</strong> drag <strong>Desired replicas</strong> above the live{' '}
                <strong>Demand</strong>, then click <strong>Controller OFF → ON</strong>.
              </li>
              <li>
                The reconciliation loop now <strong>self-heals</strong> crashed pods and{' '}
                <strong>reschedules</strong> them off blacked-out nodes automatically. Keep your hands
                off and hold the <strong>calm streak</strong> to {CFG.winStreakTicks} to win.
              </li>
            </ol>
            <p className="day04__legend">
              <strong>Demand</strong> = healthy pods the incoming requests need now (the dotted line on
              the graph forecasts surges) · <strong>Healthy</strong> = pods currently running · keep
              Healthy ≥ Demand or the budget drains.
            </p>
            <button type="button" className="btn btn--primary" onClick={() => setShowHelp(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const GRAPH_PAST = 12;
const GRAPH_FUTURE = 8;

/**
 * Request-rate graph: a stepped line of incoming request demand. Everything left of "now"
 * is solid (already happened); everything right is a dotted forecast so the player can see
 * surges coming and scale ahead of them. A dashed line marks current healthy pod capacity.
 */
function RequestGraph({ tick, healthy, demand }: { tick: number; healthy: number; demand: number }) {
  const span = GRAPH_PAST + GRAPH_FUTURE;
  const startTick = tick - GRAPH_PAST;
  const yMax = CFG.demand.surgePeak + 1;

  const W = 240;
  const H = 84;
  const padL = 6;
  const padR = 6;
  const padT = 10;
  const padB = 16;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const x = (i: number) => padL + (i / span) * plotW;
  const y = (v: number) => padT + plotH - (v / yMax) * plotH;

  function stepPath(a: number, b: number): string {
    const pts: [number, number][] = [];
    for (let i = a; i < b; i++) {
      const yy = y(demandAt(startTick + i));
      pts.push([x(i), yy]);
      pts.push([x(i + 1), yy]);
    }
    if (pts.length === 0) return '';
    return `M ${pts[0][0]} ${pts[0][1]} ` + pts.slice(1).map((p) => `L ${p[0]} ${p[1]}`).join(' ');
  }

  const pastD = stepPath(0, GRAPH_PAST);
  const futureD = stepPath(GRAPH_PAST, span);
  const nowX = x(GRAPH_PAST);
  const capY = y(Math.min(healthy, yMax));
  const capShort = healthy < demand;

  return (
    <figure className="day04__graph" aria-label="Incoming request rate graph">
      <figcaption className="day04__graph-cap">
        <span>Incoming requests</span>
        <span className="day04__graph-legend">
          <i className="is-solid" /> so far
          <i className="is-dotted" /> forecast
          <i className="is-cap" /> pod capacity
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="day04__graph-svg" preserveAspectRatio="none" role="img">
        {/* capacity (healthy pods) */}
        <line
          x1={padL}
          x2={W - padR}
          y1={capY}
          y2={capY}
          className={`day04__cap-line ${capShort ? 'is-short' : ''}`}
        />
        {/* forecast (future) */}
        <path d={futureD} className="day04__req-future" />
        {/* actual (past) */}
        <path d={pastD} className="day04__req-past" />
        {/* now marker */}
        <line x1={nowX} x2={nowX} y1={padT - 4} y2={H - padB + 2} className="day04__now-line" />
        <text x={nowX} y={H - 4} className="day04__now-label" textAnchor="middle">
          now
        </text>
        <text x={W - padR} y={H - 4} className="day04__future-label" textAnchor="end">
          incoming →
        </text>
      </svg>
    </figure>
  );
}
