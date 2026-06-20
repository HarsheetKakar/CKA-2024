/**
 * Day 03 — Dockerfile Surgery Circus.
 * A bloated single-stage Dockerfile "patient" must be refactored into a lean
 * multi-stage build by applying surgical tools. All logic here is pure so the
 * component stays a thin UI and the rules can be unit-tested.
 *
 * Cumulative-safe: Day 1–3 concepts (multi-stage builds, COPY --from, image size).
 */

export const day03Concepts = {
  allowedConcepts: [
    'container',
    'virtual-machine',
    'docker',
    'image',
    'registry',
    'daemon',
    'dockerfile',
    'build-context',
    'docker-build',
    'docker-run',
    'docker-push',
    'port-publishing',
    'multi-stage-build',
    'copy-from',
    'image-size',
  ],
  introducedConcepts: ['multi-stage-build', 'copy-from', 'image-size'],
};

/** Mutable game state — what surgery has been performed on the patient. */
export interface SurgeryState {
  /** A second `FROM` (runtime) stage exists. */
  stagesSplit: boolean;
  /** Builder stage is named `AS installer`, enabling `COPY --from=installer`. */
  builderNamed: boolean;
  /** Builder base swapped node:18 → node:18-alpine. */
  builderBaseSlim: boolean;
  /** package*.json copied + `npm ci` before the full source copy (cache-friendly). */
  cacheOrdered: boolean;
  /** apt build toolchain (build-essential, python3) removed. */
  aptRemoved: boolean;
  /** Dev dependencies (eslint, jest) removed from the builder. */
  devDepsRemoved: boolean;
  /** In-image `RUN npm test` removed. */
  testRemoved: boolean;
  /** NODE_ENV set to production (was development). */
  envProd: boolean;
  /** Runtime stage base image. 'none' until the stages are split. */
  runtimeBase: 'none' | 'fat-node' | 'nginx';
  /** `COPY --from=installer /app/build` present in the runtime stage. */
  artifactTransplanted: boolean;
  /** Runtime uses EXPOSE 80 + nginx CMD (was EXPOSE 3000 + npm start). */
  runtimeEntryFixed: boolean;
  /** MALPRACTICE: node_modules smuggled into the runtime image. */
  runtimeNodeModules: boolean;
  /** MALPRACTICE: full source `COPY . .` in the runtime image. */
  runtimeSource: boolean;
  /** MALPRACTICE: dev dependencies re-installed in the runtime image. */
  runtimeDevDeps: boolean;
}

export const initialState: SurgeryState = {
  stagesSplit: false,
  builderNamed: false,
  builderBaseSlim: false,
  cacheOrdered: false,
  aptRemoved: false,
  devDepsRemoved: false,
  testRemoved: false,
  envProd: false,
  runtimeBase: 'none',
  artifactTransplanted: false,
  runtimeEntryFixed: false,
  runtimeNodeModules: false,
  runtimeSource: false,
  runtimeDevDeps: false,
};

/** Image-size contributions in MB (simulated, not real Docker numbers). */
const SIZE = {
  fatNode: 700,
  slimNode: 170,
  nginx: 40,
  apt: 130,
  nodeModulesProd: 220,
  devDeps: 90,
  source: 25,
  buildOutput: 35,
} as const;

export const initialImageSizeMb = 1200; // ~1.2 GB single-stage patient
export const targetImageSizeMb = 140; // discharge target

/**
 * Final image size = the size of the LAST stage only. This is the core lesson:
 * once you split, builder bloat is left behind and never ships — only the
 * runtime stage's contents count.
 */
export function computeImageSize(s: SurgeryState): number {
  if (!s.stagesSplit) {
    // Single stage: everything is shipped.
    let mb = s.builderBaseSlim ? SIZE.slimNode : SIZE.fatNode;
    if (!s.aptRemoved) mb += SIZE.apt;
    mb += SIZE.nodeModulesProd;
    if (!s.devDepsRemoved) mb += SIZE.devDeps;
    mb += SIZE.source;
    mb += SIZE.buildOutput;
    return mb;
  }
  // Multi-stage: only the runtime (last) stage ships.
  let mb = s.runtimeBase === 'nginx' ? SIZE.nginx : SIZE.fatNode;
  if (s.artifactTransplanted) mb += SIZE.buildOutput;
  if (s.runtimeNodeModules) mb += SIZE.nodeModulesProd;
  if (s.runtimeDevDeps) mb += SIZE.devDeps;
  if (s.runtimeSource) mb += SIZE.source;
  return mb;
}

export interface Vital {
  id: string;
  label: string;
  /** Compact label for the sticky HUD chips. */
  short: string;
  ok: boolean;
}

/** The five vital categories the patient must satisfy to be discharged. */
export function evaluateVitals(s: SurgeryState): Vital[] {
  return [
    {
      id: 'two-stages',
      label: 'Two stages, builder named (AS installer)',
      short: '2 stages + named',
      ok: s.stagesSplit && s.builderNamed,
    },
    {
      id: 'slim-bases',
      label: 'Slim bases (node-alpine builder · nginx-alpine runtime)',
      short: 'Slim bases',
      ok: s.builderBaseSlim && s.runtimeBase === 'nginx',
    },
    {
      id: 'cache-friendly',
      label: 'Cache-friendly install (package*.json + npm ci before source)',
      short: 'Cache order',
      ok: s.cacheOrdered,
    },
    {
      id: 'builder-clean',
      label: 'Build cruft left behind (no apt toolchain, dev deps, tests; prod env)',
      short: 'No build cruft',
      ok: s.aptRemoved && s.devDepsRemoved && s.testRemoved && s.envProd,
    },
    {
      id: 'runtime-correct',
      label: 'Runtime ships only the artifact (COPY --from build + nginx entry, no cruft)',
      short: 'Clean runtime',
      ok:
        s.artifactTransplanted &&
        s.runtimeEntryFixed &&
        !s.runtimeNodeModules &&
        !s.runtimeSource &&
        !s.runtimeDevDeps,
    },
  ];
}

export function allVitalsOk(s: SurgeryState): boolean {
  return evaluateVitals(s).every((v) => v.ok);
}

export function isDischargeable(s: SurgeryState): boolean {
  return allVitalsOk(s) && computeImageSize(s) < targetImageSizeMb;
}

/** Categories used to group the tool palette in the UI. */
export type ToolCategory = 'stages' | 'builder' | 'runtime';
export type ToolKind = 'correct' | 'malpractice';

export interface SurgicalTool {
  id: string;
  label: string;
  hint: string;
  category: ToolCategory;
  kind: ToolKind;
  /**
   * Whether the tool can currently be interacted with (toggled on OR off).
   * Disabled only when its prerequisites are unmet and it isn't already active.
   */
  enabled: (s: SurgeryState) => boolean;
  /** Toggle the tool: apply its change if inactive, otherwise undo it (with cascade). */
  apply: (s: SurgeryState) => SurgeryState;
  /** True when the tool's change is currently applied (drives the "Undo" affordance). */
  active: (s: SurgeryState) => boolean;
}

export const tools: SurgicalTool[] = [
  // ---- Stage structure ----
  {
    id: 'split-stages',
    label: 'Split into two stages',
    hint: 'Add a separate runtime FROM so builder bloat can be left behind.',
    category: 'stages',
    kind: 'correct',
    active: (s) => s.stagesSplit,
    enabled: () => true,
    apply: (s) =>
      s.stagesSplit
        ? {
            ...s,
            stagesSplit: false,
            runtimeBase: 'none',
            artifactTransplanted: false,
            runtimeEntryFixed: false,
            runtimeNodeModules: false,
            runtimeSource: false,
            runtimeDevDeps: false,
          }
        : { ...s, stagesSplit: true, runtimeBase: 'none' },
  },
  {
    id: 'name-builder',
    label: 'Name the builder AS installer',
    hint: 'COPY --from needs a named stage to pull artifacts across.',
    category: 'stages',
    kind: 'correct',
    active: (s) => s.builderNamed,
    enabled: () => true,
    apply: (s) =>
      s.builderNamed
        ? { ...s, builderNamed: false, artifactTransplanted: false }
        : { ...s, builderNamed: true },
  },
  // ---- Builder hygiene ----
  {
    id: 'slim-builder-base',
    label: 'Slim the builder base (node:18 → node:18-alpine)',
    hint: 'A smaller build base speeds builds and shrinks the toolchain.',
    category: 'builder',
    kind: 'correct',
    active: (s) => s.builderBaseSlim,
    enabled: () => true,
    apply: (s) => ({ ...s, builderBaseSlim: !s.builderBaseSlim }),
  },
  {
    id: 'cache-reorder',
    label: 'Copy package*.json + npm ci before source',
    hint: 'Install deps before copying source so code edits keep the cached layer.',
    category: 'builder',
    kind: 'correct',
    active: (s) => s.cacheOrdered,
    enabled: () => true,
    apply: (s) => ({ ...s, cacheOrdered: !s.cacheOrdered }),
  },
  {
    id: 'remove-apt',
    label: 'Excise the apt build toolchain',
    hint: 'build-essential & python3 are only needed to compile, not to run.',
    category: 'builder',
    kind: 'correct',
    active: (s) => s.aptRemoved,
    enabled: () => true,
    apply: (s) => ({ ...s, aptRemoved: !s.aptRemoved }),
  },
  {
    id: 'remove-dev-deps',
    label: 'Remove dev dependencies (eslint, jest)',
    hint: 'Dev tooling never belongs in a shipped image.',
    category: 'builder',
    kind: 'correct',
    active: (s) => s.devDepsRemoved,
    enabled: () => true,
    apply: (s) => ({ ...s, devDepsRemoved: !s.devDepsRemoved }),
  },
  {
    id: 'remove-test',
    label: 'Remove the in-image RUN npm test',
    hint: 'Run tests in CI, not inside the production image build.',
    category: 'builder',
    kind: 'correct',
    active: (s) => s.testRemoved,
    enabled: () => true,
    apply: (s) => ({ ...s, testRemoved: !s.testRemoved }),
  },
  {
    id: 'env-prod',
    label: 'Set ENV NODE_ENV=production',
    hint: 'Production builds drop dev-only behaviour and bloat.',
    category: 'builder',
    kind: 'correct',
    active: (s) => s.envProd,
    enabled: () => true,
    apply: (s) => ({ ...s, envProd: !s.envProd }),
  },
  // ---- Runtime ----
  {
    id: 'graft-nginx',
    label: 'Graft slim runtime base (nginx:1.27-alpine)',
    hint: 'Serve the static build from a tiny nginx image.',
    category: 'runtime',
    kind: 'correct',
    active: (s) => s.runtimeBase === 'nginx',
    enabled: (s) => s.stagesSplit,
    apply: (s) => ({ ...s, runtimeBase: s.runtimeBase === 'nginx' ? 'none' : 'nginx' }),
  },
  {
    id: 'transplant-build',
    label: 'Transplant /app/build via COPY --from=installer',
    hint: 'Pull ONLY the built output into the runtime image.',
    category: 'runtime',
    kind: 'correct',
    active: (s) => s.artifactTransplanted,
    enabled: (s) => s.stagesSplit && (s.artifactTransplanted || s.builderNamed),
    apply: (s) => ({ ...s, artifactTransplanted: !s.artifactTransplanted }),
  },
  {
    id: 'fix-entry',
    label: 'Fix runtime entry (EXPOSE 80 + nginx CMD)',
    hint: 'Static site is served by nginx on port 80, not npm start on 3000.',
    category: 'runtime',
    kind: 'correct',
    active: (s) => s.runtimeEntryFixed,
    enabled: (s) => s.stagesSplit,
    apply: (s) => ({ ...s, runtimeEntryFixed: !s.runtimeEntryFixed }),
  },
  // ---- Malpractice (toggle on = +1 mistake; toggle off = undo, no decrement) ----
  {
    id: 'mal-node-modules',
    label: 'Smuggle node_modules into runtime',
    hint: 'MALPRACTICE: ships hundreds of MB of dependencies you do not need.',
    category: 'runtime',
    kind: 'malpractice',
    enabled: (s) => s.stagesSplit,
    active: (s) => s.runtimeNodeModules,
    apply: (s) => ({ ...s, runtimeNodeModules: !s.runtimeNodeModules }),
  },
  {
    id: 'mal-source',
    label: 'COPY . . full source into runtime',
    hint: 'MALPRACTICE: leaks source and bloats the final image.',
    category: 'runtime',
    kind: 'malpractice',
    enabled: (s) => s.stagesSplit,
    active: (s) => s.runtimeSource,
    apply: (s) => ({ ...s, runtimeSource: !s.runtimeSource }),
  },
  {
    id: 'mal-fat-node',
    label: 'Graft fat node:18 runtime base',
    hint: 'MALPRACTICE: a full node base is huge for serving static files.',
    category: 'runtime',
    kind: 'malpractice',
    enabled: (s) => s.stagesSplit,
    active: (s) => s.runtimeBase === 'fat-node',
    apply: (s) => ({ ...s, runtimeBase: s.runtimeBase === 'fat-node' ? 'none' : 'fat-node' }),
  },
  {
    id: 'mal-dev-deps',
    label: 'Re-install dev deps in runtime',
    hint: 'MALPRACTICE: eslint/jest have no place in a runtime image.',
    category: 'runtime',
    kind: 'malpractice',
    enabled: (s) => s.stagesSplit,
    active: (s) => s.runtimeDevDeps,
    apply: (s) => ({ ...s, runtimeDevDeps: !s.runtimeDevDeps }),
  },
];

export interface DockerfileRender {
  builder: string[];
  runtime: string[] | null;
}

/** Derive the displayed Dockerfile text from the current surgical state. */
export function renderDockerfile(s: SurgeryState): DockerfileRender {
  const builder: string[] = [];
  const builderFrom = s.builderBaseSlim ? 'node:18-alpine' : 'node:18';
  builder.push(`FROM ${builderFrom}${s.builderNamed ? ' AS installer' : ''}`);
  builder.push('WORKDIR /app');

  if (s.cacheOrdered) {
    builder.push('COPY package*.json ./');
    builder.push('RUN npm ci');
    if (!s.aptRemoved)
      builder.push('RUN apt-get update && apt-get install -y build-essential python3');
    if (!s.devDepsRemoved) builder.push('RUN npm install --save-dev eslint jest');
    builder.push('COPY . .');
    builder.push('RUN npm run build');
  } else {
    if (!s.aptRemoved)
      builder.push('RUN apt-get update && apt-get install -y build-essential python3');
    builder.push('COPY . .');
    builder.push('RUN npm install');
    if (!s.devDepsRemoved) builder.push('RUN npm install --save-dev eslint jest');
    builder.push('RUN npm run build');
  }
  if (!s.testRemoved) builder.push('RUN npm test');
  builder.push(`ENV NODE_ENV=${s.envProd ? 'production' : 'development'}`);

  if (!s.stagesSplit) {
    builder.push('EXPOSE 3000');
    builder.push('CMD ["npm","start"]');
    return { builder, runtime: null };
  }

  const runtime: string[] = [];
  const runtimeFrom =
    s.runtimeBase === 'nginx'
      ? 'nginx:1.27-alpine'
      : s.runtimeBase === 'fat-node'
        ? 'node:18'
        : '«graft a runtime base»';
  runtime.push(`FROM ${runtimeFrom} AS deployer`);
  if (s.runtimeNodeModules)
    runtime.push('COPY --from=installer /app/node_modules /usr/share/nginx/html/node_modules');
  if (s.runtimeDevDeps) runtime.push('RUN npm install --save-dev eslint jest');
  if (s.runtimeSource) runtime.push('COPY . .');
  if (s.artifactTransplanted)
    runtime.push('COPY --from=installer /app/build /usr/share/nginx/html');
  if (s.runtimeEntryFixed) {
    runtime.push('EXPOSE 80');
    runtime.push('CMD ["nginx","-g","daemon off;"]');
  } else {
    runtime.push('EXPOSE 3000');
    runtime.push('CMD ["npm","start"]');
  }
  return { builder, runtime };
}

/** Reference solution shown in the "Surgeon's reference" panel. */
export const targetDockerfile = `# ---- builder ----
FROM node:18-alpine AS installer
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime ----
FROM nginx:1.27-alpine AS deployer
COPY --from=installer /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]`;
