/**
 * Day 02 — Dockerfile Assembly Line.
 * Cumulative-safe: Day 1–2 concepts (Dockerfile instructions, build context, docker build/run/push, port publishing).
 */

export const day02Concepts = {
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
  ],
  introducedConcepts: ['dockerfile', 'docker-build', 'port-publishing'],
};

export interface DockerfileInstruction {
  id: string;
  label: string;
  detail?: string;
}

export const dockerfileInstructions = {
  items: [
    { id: 'from', label: 'FROM node:18-alpine', detail: 'Set base image' },
    { id: 'workdir', label: 'WORKDIR /app', detail: 'Set working directory' },
    { id: 'copy', label: 'COPY . .', detail: 'Copy all files into container' },
    {
      id: 'run',
      label: 'RUN yarn install --production',
      detail: 'Install production dependencies',
    },
    { id: 'cmd', label: 'CMD ["node", "src/index.js"]', detail: 'Set default command' },
    { id: 'expose', label: 'EXPOSE 3000', detail: 'Document the port' },
  ] satisfies DockerfileInstruction[],
};

export const correctDockerfileOrder = ['from', 'workdir', 'copy', 'run', 'cmd', 'expose'];

export interface BlankFill {
  id: string;
  command: string;
  before: string;
  blank: string;
  after: string;
  answer: string;
  hint?: string;
}

export const buildAndRunBlanks = {
  items: [
    {
      id: 'build-context',
      command: 'docker build',
      before: 'docker build -t day02-todo',
      blank: '',
      after: '',
      answer: '.',
      hint: 'The current directory is the build context',
    },
    {
      id: 'run-port',
      command: 'docker run',
      before: 'docker run -dp',
      blank: '',
      after: ':3000 image',
      answer: '3000',
      hint: 'What port should the host listen on?',
    },
  ] satisfies BlankFill[],
};
