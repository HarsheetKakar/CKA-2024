import { test, expect, type Page } from '@playwright/test';

async function unlockAll(page: Page) {
  await page.addInitScript(() => {
    const days: Record<string, { completed: boolean; bestStars: number }> = {};
    for (let i = 1; i <= 9; i++) days[String(i)] = { completed: true, bestStars: 5 };
    localStorage.setItem('helmsman-progress-v1', JSON.stringify({ state: { days }, version: 1 }));
  });
}

const primaryCheck = (page: Page) => page.locator('.checkbar button.btn--primary');

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

test('Day 5 (Binding Magistrate) is fully playable to completion', async ({ page }) => {
  await unlockAll(page);
  await page.goto('/#/day/day05');
  await expect(page.getByRole('heading', { name: 'Binding Magistrate' })).toBeVisible();

  // Stage 1 — bind each Pending Pod to a lawful node (a known-good packing).
  const bindings: [string, string][] = [
    ['ml-trainer', 'gpu-1'],
    ['inference', 'gpu-1'],
    ['ssd-cache', 'edge-1'],
    ['web', 'edge-1'],
    ['worker', 'edge-2'],
  ];
  for (const [pod, node] of bindings) {
    await page.getByRole('button', { name: `Bind ${pod} to ${node}`, exact: true }).click();
  }
  await primaryCheck(page).click(); // "Issue bindings"

  // Stage 2 — certify the trail: assign each lifecycle step to the right component.
  await expect(page.locator('.day05__warrants')).toBeVisible();
  const certify: [string, string][] = [
    ['decide', 'Scheduler'],
    ['persist', 'API server'],
    ['store', 'etcd'],
    ['run', 'kubelet'],
    ['network', 'kube-proxy'],
  ];
  for (const [rowId, component] of certify) {
    await page.getByRole('button', { name: `${rowId}: ${component}`, exact: true }).click();
  }
  await primaryCheck(page).click(); // "Certify"

  await expect(page.locator('.debrief')).toContainText('Voyage complete');
});

test('Day 6 (Bootstrap the Cluster) is fully playable to completion', async ({ page }) => {
  await unlockAll(page);
  await page.goto('/#/day/day06');
  await expect(page.getByRole('heading', { name: 'Bootstrap the Cluster' })).toBeVisible();

  await setSequence(page, [
    'Install Docker',
    'Install kubectl',
    'Install kind',
    'Write kind.yaml config',
    'Run kind create cluster',
    'kubectl get nodes',
  ]);
  await primaryCheck(page).click();

  await page.locator('#blank-cluster-name').fill('cka-cluster');
  await page.locator('#blank-role-1').fill('control-plane');
  await page.locator('#blank-role-2').fill('worker');
  await page.locator('#blank-role-3').fill('worker');
  await primaryCheck(page).click();

  await expect(page.locator('.debrief')).toContainText('Voyage complete');
});

test('Day 7 (Manifest Builder) is fully playable to completion', async ({ page }) => {
  await unlockAll(page);
  await page.goto('/#/day/day07');
  await expect(page.getByRole('heading', { name: 'Manifest Builder' })).toBeVisible();

  // Insert the correct fragments in order (exact text avoids the kind: pod decoy).
  const lines: [string, number][] = [
    ['apiVersion: v1', 0],
    ['kind: Pod', 0],
    ['metadata:', 0],
    ['name: nginx-pod', 1],
    ['labels:', 1],
    ['env: demo', 2],
    ['type: frontend', 2],
    ['spec:', 0],
    ['containers:', 1],
    ['- name: nginx-container', 1],
    ['image: nginx', 2],
    ['ports:', 2],
    ['- containerPort: 80', 3],
  ];
  for (const [text] of lines) {
    const tile = page.locator('.yamlb__tile').filter({ has: page.getByText(text, { exact: true }) });
    await tile.dblclick();
  }

  // Set each line's indent: force to 0, then indent to target.
  for (let i = 0; i < lines.length; i++) {
    const target = lines[i][1];
    const row = page.locator('.yamlb__line').nth(i);
    const outdent = row.getByRole('button', { name: 'Outdent line' });
    for (let k = 0; k < 5; k++) {
      if (await outdent.isEnabled()) await outdent.click();
      else break;
    }
    const indent = row.getByRole('button', { name: 'Indent line' });
    for (let k = 0; k < target; k++) await indent.click();
  }

  await primaryCheck(page).click(); // "Stamp"
  await expect(page.locator('.debrief')).toContainText('Voyage complete');
});

test('Day 8 (Desired State) simulator is fully playable to completion', async ({ page }) => {
  await unlockAll(page);
  await page.goto('/#/day/day08');
  await expect(page.getByRole('heading', { name: 'Desired State' })).toBeVisible();

  // Stage 1 — dial desired to 3, then reconcile.
  const dial = page.locator('#desired-dial');
  await dial.focus();
  for (let k = 0; k < 3; k++) await dial.press('ArrowRight');
  await page.getByRole('button', { name: 'Reconcile' }).click();
  await expect(page.locator('.day08__pod')).toHaveCount(3);
  await primaryCheck(page).click();

  // Stage 2 — select correct label selectors, run rolling update, submit.
  await expect(page.getByRole('button', { name: 'Start Rolling Update' })).toBeVisible();
  await page.locator('.day08__selector-option', { hasText: 'app: nginx' }).click();
  await page.locator('.day08__selector-option', { hasText: 'env: demo' }).click();
  await page.getByRole('button', { name: 'Start Rolling Update' }).click();
  // Wait for the controller to mark the rollout complete (one tick after the last v2 flip).
  await expect(page.getByText('Rolling update finished. Check to complete.')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator('.day08__pod--v2')).toHaveCount(3);
  await primaryCheck(page).click();

  await expect(page.locator('.debrief')).toContainText('Voyage complete');
});

test('Day 9 (Wire the Traffic) is fully playable to completion', async ({ page }) => {
  await unlockAll(page);
  await page.goto('/#/day/day09');
  await expect(page.getByRole('heading', { name: 'Wire the Traffic' })).toBeVisible();

  // Stage 1 — wire the Service to the matching (app=web) pods only.
  await page.locator('.connboard__node:not(.connboard__target)').first().click();
  for (const pod of ['pod-web-1', 'pod-web-2', 'pod-web-3']) {
    await page.locator('.connboard__target', { hasText: pod }).click();
  }
  await primaryCheck(page).click();

  // Stage 2 — pick the right Service type per scenario.
  const answers: [string, string][] = [
    ['Internal cluster-only access', 'ClusterIP'],
    ['specific node port', 'NodePort'],
    ['public cloud load balancer', 'LoadBalancer'],
    ['external DNS name', 'ExternalName'],
  ];
  for (const [scenarioFragment, type] of answers) {
    const q = page.locator('.day09__question', { hasText: scenarioFragment });
    await q.locator('label.day09__option', { hasText: type }).click();
  }
  await primaryCheck(page).click();

  await expect(page.locator('.debrief')).toContainText('Voyage complete');
});
