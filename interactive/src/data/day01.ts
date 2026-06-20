/**
 * Day 01 — Docker Fundamentals → "Sorting Yard".
 * Cumulative-safe: Day 1 concepts only (containers vs VMs, Docker architecture).
 */

export const day01Concepts = {
  allowedConcepts: ['container', 'virtual-machine', 'docker', 'image', 'registry', 'daemon'],
  introducedConcepts: ['container', 'virtual-machine', 'docker-architecture'],
};

export interface SortItemDef {
  id: string;
  label: string;
  detail?: string;
  correct: 'container' | 'vm';
}

export const deckSort = {
  buckets: [
    { id: 'container', label: 'Container deck', hint: 'Shares the host kernel' },
    { id: 'vm', label: 'Virtual Machine deck', hint: 'Runs a full guest OS' },
  ],
  items: [
    { id: 'kernel', label: 'Shares the host OS kernel', correct: 'container' },
    { id: 'guestos', label: 'Each instance ships its own guest OS', correct: 'vm' },
    { id: 'light', label: 'Lightweight — measured in MBs', correct: 'container' },
    { id: 'heavy', label: 'Heavyweight — measured in GBs', correct: 'vm' },
    { id: 'fast', label: 'Starts in seconds', correct: 'container' },
    { id: 'boot', label: 'Boots like a full computer', correct: 'vm' },
    { id: 'ns', label: 'Isolated via namespaces & cgroups', correct: 'container' },
    { id: 'hyper', label: 'Isolated via a hypervisor', correct: 'vm' },
  ] satisfies SortItemDef[],
};

export interface ArchPair {
  id: string;
  term: string;
  roleId: string;
  role: string;
}

export const archMatch = {
  pairs: [
    {
      id: 'client',
      term: 'Docker client',
      roleId: 'r-client',
      role: 'Sends commands you type (the docker CLI)',
    },
    { id: 'daemon', term: 'Docker daemon', roleId: 'r-daemon', role: 'Builds and runs containers' },
    { id: 'image', term: 'Image', roleId: 'r-image', role: 'Read-only template for a container' },
    { id: 'registry', term: 'Registry', roleId: 'r-registry', role: 'Stores and shares images' },
    {
      id: 'container',
      term: 'Container',
      roleId: 'r-container',
      role: 'A running instance of an image',
    },
  ] satisfies ArchPair[],
};
