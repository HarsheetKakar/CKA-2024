import { test, expect, type Page } from '@playwright/test';

// Helpers to solve Day 1 deterministically (answers come from src/data/day01.ts).
async function assignCrate(page: Page, label: string, bucket: string) {
  const card = page.locator('.dragsort-card', { hasText: label });
  await card.getByRole('button', { name: bucket, exact: true }).click();
}

async function matchPair(page: Page, term: string, role: string) {
  // Match by exact label text to avoid substring collisions (e.g. "Container"
  // also appears inside "Builds and runs containers").
  const left = page
    .locator('.matchpairs__left')
    .filter({ has: page.getByText(term, { exact: true }) });
  await left.click();
  const right = page
    .locator('.matchpairs__right')
    .filter({ has: page.getByText(role, { exact: true }) });
  await right.click();
}

async function solveDay1(page: Page) {
  // Stage 1 — sort crates onto the correct deck.
  await assignCrate(page, 'Shares the host OS kernel', 'Container deck');
  await assignCrate(page, 'Each instance ships its own guest OS', 'Virtual Machine deck');
  await assignCrate(page, 'Lightweight — measured in MBs', 'Container deck');
  await assignCrate(page, 'Heavyweight — measured in GBs', 'Virtual Machine deck');
  await assignCrate(page, 'Starts in seconds', 'Container deck');
  await assignCrate(page, 'Boots like a full computer', 'Virtual Machine deck');
  await assignCrate(page, 'Isolated via namespaces & cgroups', 'Container deck');
  await assignCrate(page, 'Isolated via a hypervisor', 'Virtual Machine deck');
  await page.getByRole('button', { name: 'Check' }).click();

  // Stage 2 — match Docker architecture terms to roles (exact role text).
  await expect(page.locator('.matchpairs')).toBeVisible();
  await matchPair(page, 'Docker client', 'Sends commands you type (the docker CLI)');
  await matchPair(page, 'Docker daemon', 'Builds and runs containers');
  await matchPair(page, 'Image', 'Read-only template for a container');
  await matchPair(page, 'Registry', 'Stores and shares images');
  await matchPair(page, 'Container', 'A running instance of an image');
  await page.getByRole('button', { name: 'Submit' }).click();
}

test('Day 1 is solvable and shows the completion debrief', async ({ page }) => {
  await page.goto('/#/day/day01');
  await expect(page.getByRole('heading', { name: 'Sorting Yard' })).toBeVisible();
  await solveDay1(page);
  await expect(page.locator('.debrief')).toBeVisible();
  await expect(page.locator('.debrief')).toContainText('Voyage complete');
});

test('REGRESSION: clicking "Next port" does NOT auto-complete Day 2', async ({ page }) => {
  await page.goto('/#/day/day01');
  await solveDay1(page);
  await expect(page.locator('.debrief')).toBeVisible();

  await page.getByRole('link', { name: /Next port/ }).click();

  // We should now be on Day 2, freshly playable — NOT showing a completion debrief.
  await expect(page).toHaveURL(/#\/day\/day02/);
  await expect(page.getByRole('heading', { name: 'Dockerfile Assembly Line' })).toBeVisible();
  await expect(page.locator('.debrief')).toHaveCount(0);
  // The interactive stage must be present (a Check button to submit an answer).
  await expect(page.getByRole('button', { name: 'Check' })).toBeVisible();
});
