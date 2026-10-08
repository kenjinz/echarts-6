import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

test('captures representative layout and mode evidence', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?example=M02');
  await expect(page.locator('#chart-status')).toContainText('M02 running');
  await page.screenshot({ path: 'evidence/screenshots/M02-wide.png', fullPage: true });

  await page.setViewportSize({ width: 900, height: 650 });
  await page.screenshot({ path: 'evidence/screenshots/M09-constrained.png', fullPage: true });

  await page.goto('/?example=C06');
  await page.getByLabel('X axis sharing').selectOption('row');
  await page.screenshot({ path: 'evidence/screenshots/C06-row-sharing.png', fullPage: true });

  await page.goto('/?example=C14');
  await page.getByRole('button', { name: 'Enlarge selected cell' }).click();
  await page.screenshot({ path: 'evidence/screenshots/C14-enlarged.png', fullPage: true });

  await page.goto('/?example=P05');
  await page.screenshot({ path: 'evidence/screenshots/P05-sparse-compound.png', fullPage: true });

  await page.goto('/?example=G02');
  await expect(page.locator('#webgl-count')).not.toHaveText('0');
  await page.screenshot({ path: 'evidence/screenshots/G02-grid3D-fallback.png', fullPage: true });

  await page.goto('/?example=G08');
  await page.screenshot({ path: 'evidence/screenshots/G08-3d.png', fullPage: true });
  await page.getByLabel('Selected-cell view mode').selectOption('2d');
  await page.screenshot({ path: 'evidence/screenshots/G08-2d.png', fullPage: true });
});

test('survives repeated lifecycle, rapid scopes, resize, and empty-grid transitions', async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/?example=R05');
  for (let index = 0; index < 20; index += 1) {
    await page.getByRole('button', { name: 'Run example' }).click();
  }
  await expect(page.getByTestId('live-instances')).toHaveText('1');
  await expect(page.locator('#experiment-chart canvas')).toHaveCount(1);

  await page.goto('/?example=R06');
  const xScope = page.getByLabel('X axis sharing');
  for (const value of ['all', 'row', 'column', 'individual', 'all', 'individual']) {
    await xScope.selectOption(value);
  }
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 900, height: 650 },
    { width: 390, height: 844 },
    { width: 1200, height: 800 }
  ]) {
    await page.setViewportSize(viewport);
  }
  await page.getByRole('button', { name: 'Remove all cells' }).click();
  await expect(page.locator('#chart-status')).toContainText('No logical cells');
  await page.getByRole('button', { name: 'Restore default cells' }).click();
  await expect(page.getByTestId('live-instances')).toHaveText('1');
  expect(errors).toEqual([]);
});

test('writes durable option and measurement evidence for representative families', async ({ page }) => {
  test.setTimeout(90_000);
  await mkdir('evidence/options', { recursive: true });
  await mkdir('evidence/measurements', { recursive: true });

  for (const id of ['M02', 'C06', 'S04', 'P08', 'G02', 'G06', 'G10', 'R04']) {
    await page.goto(`/?example=${id}`);
    await expect(page.locator('#chart-status')).toContainText(`${id} running`);
    const option = await page.evaluate(() => (
      window as unknown as { __matrixPoc: { getOption(): unknown } }
    ).__matrixPoc.getOption());
    await writeFile(`evidence/options/${id}.json`, JSON.stringify(option, null, 2), 'utf8');
  }

  await page.goto('/?example=R07');
  const comparisons = [];
  for (const size of [1, 2, 3, 5]) {
    await page.getByLabel('Instance model').selectOption('one');
    await page.locator('select[data-common=rows]').selectOption(String(size));
    await page.locator('select[data-common=columns]').selectOption(String(size));
    await page.getByRole('button', { name: 'Start measurement' }).click();
    const oneInstance = {
      model: 'one matrix instance',
      summary: await page.locator('#measurement-summary').textContent(),
      instances: await page.getByTestId('live-instances').textContent(),
      canvases: await page.locator('#canvas-count').textContent(),
      domNodes: await page.locator('#dom-count').textContent()
    };
    await page.getByLabel('Instance model').selectOption('per-cell');
    await expect(page.getByTestId('live-instances')).toHaveText(String(size * size));
    await page.getByRole('button', { name: 'Start measurement' }).click();
    const perCell = {
      model: 'one instance per cell',
      summary: await page.locator('#measurement-summary').textContent(),
      instances: await page.getByTestId('live-instances').textContent(),
      canvases: await page.locator('#canvas-count').textContent(),
      domNodes: await page.locator('#dom-count').textContent()
    };
    comparisons.push({ size: `${size}x${size}`, oneInstance, perCell });
  }
  await writeFile(
    'evidence/measurements/R07.json',
    JSON.stringify({ capturedAt: new Date().toISOString(), comparisons }, null, 2),
    'utf8'
  );
});
