import { expect, test } from '@playwright/test';

test('shared X and Y own live wheel zoom, range, reset and restored state', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?example=C05');
  await expect(page.getByLabel('X axis sharing')).toHaveValue('all');
  await expect(page.getByLabel('Y axis sharing')).toHaveValue('all');
  await page.locator('#experiment-chart').scrollIntoViewIfNeeded();
  const host = await page.locator('#experiment-chart').boundingBox();
  const grid = await page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').map((entry) => entry.name).find((name) => /\/echarts\.js\?/.test(name))!;
    const echarts = await import(url);
    return echarts.getInstanceByDom(document.getElementById('experiment-chart')).getModel().getComponent('grid', 0).coordinateSystem.getRect();
  });
  await page.mouse.move(host!.x + grid.x + grid.width / 2, host!.y + grid.y + grid.height / 2);
  await page.mouse.wheel(0, -400);
  await expect.poll(async () => page.evaluate(() => (window as any).__matrixPoc.getSnapshot().sharedAxes.x.groups.all.zoom?.start ?? 0)).toBeGreaterThan(0);
  const zoomed = await page.evaluate(() => (window as any).__matrixPoc.getSnapshot());
  const xZoom = zoomed.sharedAxes.x.groups.all.zoom;
  expect(xZoom.end - xZoom.start).toBeLessThan(100);
  expect(Object.entries(zoomed.interactive.dataZoom).filter(([key]) => key.endsWith('/x')).map(([, value]) => value)).toEqual([xZoom, xZoom, xZoom, xZoom]);

  await page.getByRole('button', { name: 'Change X range', exact: true }).click();
  const ranged = await page.evaluate(() => (window as any).__matrixPoc.getOption());
  expect(ranged.xAxis.every((axis: any) => axis.min === 4 && axis.max === 20)).toBe(true);
  expect(ranged.dataZoom.filter((zoom: any) => zoom.xAxisId?.length).every((zoom: any) => zoom.start === xZoom.start && zoom.end === xZoom.end)).toBe(true);

  await page.getByRole('button', { name: 'Export state', exact: true }).click();
  const saved = await page.getByLabel('State snapshot JSON').inputValue();
  await page.getByRole('button', { name: 'Reset example', exact: true }).click();
  await page.getByLabel('State snapshot JSON').fill(saved);
  await page.getByRole('button', { name: 'Import state', exact: true }).click();
  await expect(page.getByLabel('X axis sharing')).toHaveValue('all');
  const restored = await page.evaluate(() => (window as any).__matrixPoc.getSnapshot());
  expect(restored.sharedAxes.x.groups.all).toEqual({ range: [4, 20], zoom: xZoom });

  await page.locator('#experiment-chart').scrollIntoViewIfNeeded();
  const sharedControls = await page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').map((entry) => entry.name).find((name) => /\/echarts\.js\?/.test(name))!;
    const echarts = await import(url);
    const chart = echarts.getInstanceByDom(document.getElementById('experiment-chart'));
    const model = chart.getModel();
    const slider = model.findComponents({ mainType: 'dataZoom' }).find((component: any) => component.id === 'dataZoom/shared-x/all/slider');
    const sliderView = chart.getViewOfComponentModel(slider);
    const box = sliderView.group.getBoundingRect().clone();
    box.applyTransform(sliderView.group.getComputedTransform());
    const toolbox = chart.getViewOfComponentModel(model.getComponent('toolbox', 0));
    const reset = toolbox.group.children().find((child: any) => child.__title === 'Reset shared axes zoom');
    const resetBox = reset.getBoundingRect().clone();
    resetBox.applyTransform(reset.getComputedTransform());
    return { slider: box, reset: resetBox };
  });
  const currentHost = await page.locator('#experiment-chart').boundingBox();
  const slider = sharedControls.slider;
  await page.mouse.move(currentHost!.x + slider.x + slider.width * ((xZoom.start + xZoom.end) / 200), currentHost!.y + slider.y + slider.height / 2);
  await page.mouse.down();
  await page.mouse.move(currentHost!.x + slider.x + slider.width * ((xZoom.start + xZoom.end) / 200 + .1), currentHost!.y + slider.y + slider.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => page.evaluate(() => (window as any).__matrixPoc.getSnapshot().sharedAxes.x.groups.all.zoom.start)).not.toBe(xZoom.start);
  await page.mouse.click(currentHost!.x + sharedControls.reset.x + sharedControls.reset.width / 2, currentHost!.y + sharedControls.reset.y + sharedControls.reset.height / 2);
  const reset = await page.evaluate(() => (window as any).__matrixPoc.getSnapshot());
  expect(reset.sharedAxes.x.groups.all.zoom).toEqual({ start: 0, end: 100 });
  expect(reset.sharedAxes.y.groups.all.zoom).toEqual({ start: 0, end: 100 });

  await page.getByLabel('X axis sharing').selectOption('individual');
  await page.getByRole('button', { name: 'Change X dataZoom', exact: true }).click();
  const detached = await page.evaluate(() => (window as any).__matrixPoc.getSnapshot());
  expect(detached.sharing.dataZoomX).toBe('individual');
  expect(detached.interactive.dataZoom['row-0:column-0/x']).toEqual({ start: 20, end: 80 });
  expect(detached.interactive.dataZoom['row-0:column-1/x']).toEqual({ start: 0, end: 100 });
  expect(errors).toEqual([]);
});

test('zoom and range examples use the same axis scope and preserve independent groups', async ({ page }) => {
  await page.goto('/?example=C08');
  await expect(page.getByLabel('X axis sharing')).toHaveCount(1);
  await expect(page.getByLabel('Y axis sharing')).toHaveCount(1);
  await page.getByLabel('X axis sharing').selectOption('row');
  await page.getByRole('button', { name: 'Change X dataZoom', exact: true }).click();
  const row = await page.evaluate(() => (window as any).__matrixPoc.getSnapshot());
  expect(row.sharing.xRange).toBe('row');
  expect(row.sharing.dataZoomX).toBe('row');
  expect(row.sharedAxes.x.groups['row-0'].zoom).toEqual({ start: 20, end: 80 });
  expect(row.sharedAxes.x.groups['row-1'].zoom).toEqual({ start: 0, end: 100 });

  await page.goto('/?example=C06');
  await page.getByLabel('X axis sharing').selectOption('column');
  await page.getByRole('button', { name: 'Change X range', exact: true }).click();
  const column = await page.evaluate(() => (window as any).__matrixPoc.getOption());
  expect(column.xAxis.map((axis: any) => axis.min)).toEqual([4, 0, 4, 0]);
  expect(column.xAxis.map((axis: any) => axis.axisLabel.show)).toEqual([false, false, true, true]);
});

test('shared compound row and column groups retain positive marginal plot sizes at top and right', async ({ page }) => {
  await page.goto('/?example=P09');
  await page.getByLabel('X axis sharing').selectOption('row');
  await page.getByLabel('Y axis sharing').selectOption('column');
  await page.getByLabel('Shared X axis position').selectOption('top');
  await page.getByLabel('Shared Y axis position').selectOption('right');
  const grids = await page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').map((entry) => entry.name).find((name) => /\/echarts\.js\?/.test(name))!;
    const echarts = await import(url);
    const chart = echarts.getInstanceByDom(document.getElementById('experiment-chart'));
    return chart.getModel().findComponents({ mainType: 'grid' }).map((grid: any) => ({ id: grid.id, ...grid.coordinateSystem.getRect() }));
  });
  expect(grids.every((grid: any) => grid.width >= 24 && grid.height >= 24)).toBe(true);
});
