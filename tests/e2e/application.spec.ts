import { expect, test } from '@playwright/test';

import { EXAMPLES } from '../../src/app/experimentRegistry';

test('browses all examples and exposes runtime sharing controls', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('/?example=M02');

  await expect(page.getByTestId('example-button')).toHaveCount(66);
  await expect(page.getByTestId('example-id')).toHaveText('M02');
  await expect(page.getByTestId('echarts-version')).toContainText('6.1.0');
  await expect(page.getByTestId('init-count')).toHaveText('1');
  await expect(page.getByTestId('live-instances')).toHaveText('1');
  await expect(page.locator('#experiment-chart canvas')).toHaveCount(1);

  await page.getByTestId('example-button').filter({ hasText: 'C06' }).click();
  await expect(page.getByTestId('example-id')).toHaveText('C06');
  const xZoomScope = page.getByLabel('X dataZoom scope');
  await expect(xZoomScope.locator('option')).toHaveText([
    'Individual', 'All cells', 'Per row', 'Per column'
  ]);
  await xZoomScope.selectOption('row');
  await expect(page.getByTestId('sharing-summary')).toContainText('dataZoomX: row');

  await page.getByTestId('example-button').filter({ hasText: 'P04' }).click();
  await expect(page.getByLabel('X range scope')).toBeDisabled();
  await expect(page.getByText('Fixed: shared within each logical cell').first()).toBeVisible();

  await page.getByTestId('example-button').filter({ hasText: 'P09' }).click();
  await expect(page.getByLabel('Main ↔ top X range and zoom')).toBeDisabled();
  await expect(page.getByLabel('Main ↔ right Y range and zoom')).toBeDisabled();

  expect(consoleErrors).toEqual([]);
});

test('resets an example and exports a non-empty image', async ({ page }) => {
  await page.goto('/?example=C14');
  await page.getByRole('button', { name: 'Enlarge selected cell' }).click();
  await expect(page.getByTestId('enlarged-cell')).not.toHaveText('None');
  await page.getByRole('button', { name: 'Reset example' }).click();
  await expect(page.getByTestId('enlarged-cell')).toHaveText('None');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export image' }).click();
  const image = await download;
  expect(image.suggestedFilename()).toMatch(/C14.*\.png$/);
});

test('loads every registered example without page or console errors', async ({ page }) => {
  test.setTimeout(120_000);
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  for (const example of EXAMPLES) {
    await page.goto(`/?example=${example.id}`);
    await expect(page.getByTestId('example-id')).toHaveText(example.id);
    await expect(page.locator('#chart-status')).toContainText(`${example.id} running`);
  }

  expect(consoleErrors).toEqual([]);
});

test('restores state, switches renderer, and cleans up baseline instances', async ({ page }) => {
  await page.goto('/?example=R01');
  await page.getByLabel('Legend selection scope').selectOption('row');
  await page.getByRole('button', { name: 'Export state' }).click();
  const exported = await page.getByLabel('State snapshot JSON').inputValue();
  expect(exported).toContain('legendSelection');

  await page.getByRole('button', { name: 'Reset example' }).click();
  await page.getByLabel('State snapshot JSON').fill(exported);
  await page.getByRole('button', { name: 'Import state' }).click();
  await expect(page.getByTestId('sharing-summary')).toContainText('legendSelection: row');

  await page.goto('/?example=M02');
  await page.getByLabel('Renderer').selectOption('svg');
  await expect(page.locator('#experiment-chart svg')).toHaveCount(1);
  await expect(page.locator('#experiment-chart canvas')).toHaveCount(0);

  await page.goto('/?example=R04');
  await expect(page.getByTestId('init-count')).toHaveText('4');
  await expect(page.getByTestId('live-instances')).toHaveText('4');
  await page.getByTestId('example-button').filter({ hasText: 'M02' }).click();
  await expect(page.getByTestId('live-instances')).toHaveText('1');
  await expect(page.locator('#experiment-chart canvas')).toHaveCount(1);
});

test('renders the absolute multi-grid3D fallback with observable WebGL resources', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/?example=G02');
  await expect(page.locator('#chart-status')).toContainText('G02 running');
  await expect(page.locator('#experiment-chart canvas')).toHaveCount(1);
  await expect(page.locator('#webgl-count')).not.toHaveText('0');
  expect(errors).toEqual([]);
});

test('applies value changes to exactly the cells selected by sharing scope', async ({ page }) => {
  await page.goto('/?example=C02');
  await page.getByLabel('X range scope').selectOption('row');
  await page.getByRole('button', { name: 'Change X range' }).click();
  await page.getByRole('button', { name: 'Export state' }).click();
  const state = JSON.parse(await page.getByLabel('State snapshot JSON').inputValue());

  expect(state.interactive.axisRanges['row-0:column-0'].x).toEqual([4, 20]);
  expect(state.interactive.axisRanges['row-0:column-1'].x).toEqual([4, 20]);
  expect(state.interactive.axisRanges['row-1:column-0']).toBeUndefined();

  await page.goto('/?example=G04');
  await page.getByLabel('Camera scope').selectOption('all');
  await page.getByRole('button', { name: 'Change Camera' }).click();
  await page.getByRole('button', { name: 'Export state' }).click();
  const cameraState = JSON.parse(await page.getByLabel('State snapshot JSON').inputValue());
  expect(Object.keys(cameraState.interactive.camera)).toHaveLength(4);
  expect(cameraState.interactive.camera['row-1:column-1'].beta).toBeCloseTo(55, 8);
});

test('captures an actual dataZoom action before rebuilding the matrix', async ({ page }) => {
  await page.goto('/?example=C06');
  await page.evaluate(() => {
    const harness = (window as unknown as {
      __matrixPoc: { dispatchAction(action: { type: string; dataZoomId: string; start: number; end: number }): void }
    }).__matrixPoc;
    harness.dispatchAction({
      type: 'dataZoom',
      dataZoomId: 'dataZoom/group-0/x/native',
      start: 23,
      end: 77
    });
  });
  await page.getByRole('button', { name: 'Enlarge selected cell' }).click();
  await page.getByRole('button', { name: 'Export state' }).click();
  const state = JSON.parse(await page.getByLabel('State snapshot JSON').inputValue());
  expect(state.interactive.dataZoom['row-0:column-0/x']).toEqual({ start: 23, end: 77 });
});

test('synchronizes G07 marginal zoom to its 3D main axis immediately', async ({ page }) => {
  await page.goto('/?example=G07');
  await page.evaluate(() => {
    const harness = (window as unknown as {
      __matrixPoc: { dispatchAction(action: { type: string; dataZoomId: string; start: number; end: number }): void }
    }).__matrixPoc;
    harness.dispatchAction({
      type: 'dataZoom',
      dataZoomId: 'dataZoom/row-0:column-0/fixed-x',
      start: 25,
      end: 75
    });
  });

  await expect.poll(async () => page.evaluate(() => {
    const option = (window as unknown as {
      __matrixPoc: { getOption(): { xAxis3D?: { id?: string; min?: number; max?: number }[] } }
    }).__matrixPoc.getOption();
    const axis = option.xAxis3D?.find((entry) => entry.id === 'xAxis3D/row-0:column-0/main');
    return [axis?.min, axis?.max];
  })).toEqual([-3, 3]);
});

test('switches G10 between one GL instance and a live per-cell baseline', async ({ page }) => {
  await page.goto('/?example=G10');
  await expect(page.getByTestId('live-instances')).toHaveText('1');
  const oneContextCount = Number(await page.locator('#webgl-count').textContent());

  await page.getByLabel('Instance model').selectOption('per-cell');
  await expect(page.getByTestId('live-instances')).toHaveText('4');
  await expect.poll(async () => Number(await page.locator('#webgl-count').textContent()))
    .toBeGreaterThan(oneContextCount);

  await page.getByLabel('Instance model').selectOption('one');
  await expect(page.getByTestId('live-instances')).toHaveText('1');
  await expect.poll(async () => Number(await page.locator('#webgl-count').textContent()))
    .toBeLessThanOrEqual(oneContextCount);
});

test('rejects an imported snapshot with an unknown example ID', async ({ page }) => {
  await page.goto('/?example=R01');
  await page.getByRole('button', { name: 'Export state' }).click();
  const state = JSON.parse(await page.getByLabel('State snapshot JSON').inputValue());
  state.exampleId = 'NOT-A-REAL-EXAMPLE';
  await page.getByLabel('State snapshot JSON').fill(JSON.stringify(state));
  await page.getByRole('button', { name: 'Import state' }).click();
  await expect(page.locator('#chart-status')).toContainText('Unknown example');
});
