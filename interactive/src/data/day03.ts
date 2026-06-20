/**
 * Day 03 — Two-Stage Refinery.
 * Cumulative-safe: Day 1–3 concepts (multi-stage builds, COPY --from, optimizing image size).
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

export interface InstructionItem {
  id: string;
  label: string;
  detail?: string;
}

export interface StageBucket {
  id: string;
  label: string;
  hint?: string;
}

export const stageInstructions = {
  items: [
    { id: 'installer-from', label: 'FROM node:18-alpine AS installer', detail: 'Set builder base' },
    {
      id: 'installer-workdir',
      label: 'WORKDIR /app',
      detail: 'Set builder working directory',
    },
    {
      id: 'installer-copy-pkg',
      label: 'COPY package*.json ./',
      detail: 'Copy package files',
    },
    { id: 'installer-npm-install', label: 'RUN npm install', detail: 'Install all dependencies' },
    { id: 'installer-copy-src', label: 'COPY . .', detail: 'Copy source code' },
    { id: 'installer-npm-build', label: 'RUN npm run build', detail: 'Build the app' },
    { id: 'deployer-from', label: 'FROM nginx:latest AS deployer', detail: 'Set final base' },
    {
      id: 'deployer-copy',
      label: 'COPY --from=installer /app/build /usr/share/nginx/html',
      detail: 'Copy only built output',
    },
  ] satisfies InstructionItem[],
};

export const stageBuckets = {
  items: [
    { id: 'builder', label: 'Builder stage', hint: 'Used for building only' },
    { id: 'shipping', label: 'Shipping stage', hint: 'The final image' },
  ] satisfies StageBucket[],
};

export const correctStageAssignments: Record<string, string> = {
  'installer-from': 'builder',
  'installer-workdir': 'builder',
  'installer-copy-pkg': 'builder',
  'installer-npm-install': 'builder',
  'installer-copy-src': 'builder',
  'installer-npm-build': 'builder',
  'deployer-from': 'shipping',
  'deployer-copy': 'shipping',
};

export interface Artifact {
  id: string;
  label: string;
  detail?: string;
}

export interface ArtifactBucket {
  id: string;
  label: string;
  hint?: string;
}

export const artifacts = {
  items: [
    { id: 'node-modules', label: 'node_modules', detail: 'Dependencies folder' },
    { id: 'source-code', label: 'Source code (src/)', detail: 'Original code files' },
    { id: 'build-output', label: '/app/build output', detail: 'Compiled app' },
  ] satisfies Artifact[],
};

export const artifactBuckets = {
  items: [
    { id: 'ship', label: 'Ship it', hint: 'Include in final image' },
    { id: 'leave', label: 'Leave behind', hint: 'Discard after building' },
  ] satisfies ArtifactBucket[],
};

export const correctArtifactAssignments: Record<string, string> = {
  'node-modules': 'leave',
  'source-code': 'leave',
  'build-output': 'ship',
};
