/**
 * Day 04 — Replica Requiem: why we need Kubernetes.
 *
 * A ~2-minute war-room drill. The player keeps a critical service's pods alive across three
 * nodes while an escalating storm of crashes and node blackouts arrives. In MANUAL mode the
 * only tools are per-pod restarts and waiting out blackouts — the pain of standalone
 * containers. Flipping the reconciliation CONTROLLER on lets the player declare a desired
 * replica count and walk away while the loop self-heals and reschedules the pods — the moment
 * the request graph goes calm teaches declarative desired state.
 *
 * Concepts (Days 1-4, no future objects/YAML): standalone-container limits, desired state,
 * reconciliation, self-healing, rescheduling, horizontal scaling, stable load-balanced demand.
 */

export const day04Concepts = {
  allowedConcepts: [
    'container',
    'orchestrator',
    'desired-state',
    'reconciliation',
    'self-healing',
    'rescheduling',
    'scaling',
  ],
  introducedConcepts: [
    'desired-replica-count',
    'control-loop-reconcile',
    'self-healing-restart',
    'node-rescheduling',
    'horizontal-scaling',
  ],
};

export interface NodeDef {
  id: string;
  label: string;
}

/** The three nodes the pods are spread across. */
export const nodes: NodeDef[] = [
  { id: 'node-1', label: 'Node 1' },
  { id: 'node-2', label: 'Node 2' },
  { id: 'node-3', label: 'Node 3' },
];

/**
 * All tunable game constants for the drill, kept out of the component so the balance can be
 * adjusted without touching logic. Times are in ticks unless suffixed Ms.
 */
export const replicaRequiem = {
  /** Master clock: one reconcile/storm/budget step per tick. */
  tickMs: 700,

  /** Desired-replica dial bounds. The player declares intent within this range. */
  desired: { min: 0, max: 8, initial: 0 },

  /**
   * Live demand = the number of healthy pods customers need right now. Surges raise it to
   * teach horizontal scaling: the player must lift the dial above demand to stay green.
   */
  demand: { base: 3, surgePeak: 5 },

  /** Error budget / availability gauge (0-100). Hitting 0 ends the shift in failure. */
  budget: {
    start: 100,
    max: 100,
    min: 0,
    /** Drained per missing healthy pod, per tick, while below demand. */
    drainPerMissing: 7,
    /** Regained per tick while healthy pods meet or beat demand. */
    regen: 4,
    /** At/above this budget the fleet of pods counts as "calm" for the stability streak. */
    calmThreshold: 82,
  },

  /** The escalating incident storm. */
  storm: {
    /** Per-tick probability a healthy pod crashes, at the start of the shift. */
    crashBaseProb: 0.22,
    /** Added to the crash probability every tick (the swarm ramps up). */
    crashRampPerTick: 0.012,
    /** Hard cap on the crash probability. */
    crashMaxProb: 0.78,
    /** Per-tick probability a whole node blacks out (kicks in mid-shift). */
    blackoutProb: 0.06,
    /** No blackouts before this tick — let the player find their feet first. */
    blackoutAfterTick: 8,
    /** How many ticks a node stays down before power returns. */
    blackoutDuration: 6,
  },

  /**
   * Win when the controller holds the fleet calm (budget >= calmThreshold and healthy >=
   * demand) for this many consecutive ticks — the incident feed falls silent.
   */
  winStreakTicks: 9,

  /** Stars: every `starScale` starved ticks costs one star (starsFromMistakes). */
  starScale: 6,

  copy: {
    service: 'checkout',
    surge: 'Traffic surge incoming — demand is climbing. Scale the dial up!',
    win: 'The requests are absorbed and the graph goes calm. The pods hold themselves — no hands needed.',
    loseBudget: 'Error budget exhausted. The service went dark — manual toil lost the shift.',
  },
} as const;
