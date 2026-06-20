import { test, expect, type Page } from '@playwright/test';

// Unlock all days so any route is directly reachable.
async function unlockAll(page: Page) {
  await page.addInitScript(() => {
    const days: Record<string, { completed: boolean; bestStars: number }> = {};
    for (let i = 1; i <= 9; i++) days[String(i)] = { completed: true, bestStars: 5 };
    localStorage.setItem(
      'helmsman-progress-v1',
      JSON.stringify({ state: { days }, version: 1 }),
    );
  });
}

const primaryCheck = (page: Page) => page.locator('.checkbar button.btn--primary');

// Drive a Sequencer to a target order using its accessible move-up buttons.
// Polls between moves so it is resilient to dnd-kit reorder transitions.
async function setSequence(page: Page, targetLabels: string[]) {
  for (let i = 0; i < targetLabels.length; i++) {
    const label = targetLabels[i];
    for (let guard = 0; guard < 30; guard++) {
      const order = (await page.locator('.sequencer__label').allTextContents()).map((t) =>
        t.trim(),
      );
      const idx = order.indexOf(label);
      if (idx < 0) {
        await page.waitForTimeout(100);
        continue;
      }
      if (idx <= i) break;
      await page.getByRole('button', { name: `Move ${label} up`, exact: true }).click();
      await page.waitForTimeout(90);
    }
  }
}

test('Day 2 (Dockerfile Assembly Line) is fully playable to completion', async ({ page }) => {
  await unlockAll(page);
  await page.goto('/#/day/day02');
  await expect(page.getByRole('heading', { name: 'Dockerfile Assembly Line' })).toBeVisible();

  // Stage 1 — order the Dockerfile instructions.
  await setSequence(page, [
    'FROM node:18-alpine',
    'WORKDIR /app',
    'COPY . .',
    'RUN yarn install --production',
    'CMD ["node", "src/index.js"]',
    'EXPOSE 3000',
  ]);
  await primaryCheck(page).click(); // "Check"

  // Stage 2 — fill the build/run blanks.
  await expect(page.locator('#blank-build-context')).toBeVisible();
  await page.locator('#blank-build-context').fill('.');
  await page.locator('#blank-run-port').fill('3000');
  await primaryCheck(page).click(); // "Submit"

  await expect(page.locator('.debrief')).toContainText('Voyage complete');
});

test('Day 4 (Outage Response) quiz is fully playable to completion', async ({ page }) => {
  await unlockAll(page);
  await page.goto('/#/day/day04');
  await expect(page.getByRole('heading', { name: 'Outage Response' })).toBeVisible();

  const answers: [string, string][] = [
    ['container crashed at 3 AM', 'Restart failed workloads automatically'],
    ['Traffic is 10× normal', 'Scale horizontally to handle traffic spikes'],
    ['critical bugs', 'Roll back to a previous working version'],
    ['different IP addresses', 'Maintain stable DNS and load-balance requests'],
    ['node) in your cluster died', 'Reschedule workloads to healthy nodes'],
  ];
  for (const [promptFragment, choice] of answers) {
    const card = page.locator('fieldset.quiz__card', { hasText: promptFragment });
    await card.locator('label.quiz__choice', { hasText: choice }).click();
  }
  await primaryCheck(page).click();

  await expect(page.locator('.debrief')).toContainText('Voyage complete');
});

test('Day 10 (Harbor Partition) is fully playable to completion', async ({ page }) => {
  await unlockAll(page);
  await page.goto('/#/day/day10');
  await expect(page.getByRole('heading', { name: 'Harbor Partition' })).toBeVisible();

  // Stage 1 — sort resources into the correct namespace.
  const placements: [string, string][] = [
    ['kube-apiserver', 'kube-system'],
    ['kube-scheduler', 'kube-system'],
    ['coredns', 'kube-system'],
    ['metrics-collector', 'kube-system'],
    ['web-app', 'dev'],
    ['api-service', 'dev'],
    ['payments-svc', 'prod'],
    ['billing-svc', 'prod'],
  ];
  for (const [label, bucket] of placements) {
    const card = page.locator('.dragsort-card', { hasText: label });
    await card.getByRole('button', { name: bucket, exact: true }).click();
  }
  await primaryCheck(page).click();

  // Stage 2 — assemble DNS names (cross-namespace FQDN + same-namespace short name).
  await expect(page.locator('.day10__dns-scenarios')).toBeVisible();
  const cross = page.locator('.day10__scenario', { hasText: 'prod' }).first();
  for (const seg of ['payments-svc', 'prod', 'svc', 'cluster.local']) {
    await cross.getByRole('button', { name: seg, exact: true }).click();
  }
  const same = page.locator('.day10__scenario', { hasText: 'same namespace' }).first();
  await same.getByRole('button', { name: 'api-service', exact: true }).click();
  await primaryCheck(page).click();

  await expect(page.locator('.debrief')).toContainText('Voyage complete');
});
