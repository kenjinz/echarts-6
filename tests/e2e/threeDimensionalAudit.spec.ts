import { expect, test, type Page } from '@playwright/test';

async function inspect(page: Page) {
  return page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').map(e => e.name).find(n => /\/echarts\.js\?/.test(n))!;
    const ec = await import(url);
    const chart = ec.getInstanceByDom(document.getElementById('experiment-chart'));
    const model = chart.getModel();
    return {
      series: model.getSeries().filter((s: any) => s.coordinateSystem?.type === 'cartesian3D').map((s: any) => ({ id: s.id, grid: s.coordinateSystem.model.id })),
      views: model.findComponents({ mainType: 'grid3D' }).map((g: any) => {
        const v = g.coordinateSystem.viewGL.viewport;
        return { id: g.id, x: v.x, y: chart.getHeight() - v.y - v.height, width: v.width, height: v.height };
      }),
      grids: model.findComponents({ mainType: 'grid' }).map((g: any) => ({ id: g.id, ...g.coordinateSystem.getRect() })),
      cameras: chart.getOption().grid3D?.map((g: any) => g.viewControl),
      snapshot: (window as any).__matrixPoc.getSnapshot()
    };
  });
}

test('every 3D series renders in its own cell across G02–G10', async ({ page }) => {
  for (let index = 2; index <= 10; index++) {
    const id = `G${String(index).padStart(2, '0')}`;
    await page.goto(`/?example=${id}`);
    await expect(page.locator('#chart-status')).toContainText(`${id} running`);
    const state = await inspect(page);
    for (const series of state.series) expect(series.grid, `${id}: ${series.id}`).toContain(series.id.match(/row-\d+:column-\d+/)![0]);
    expect(new Set(state.series.map((s: any) => s.grid)).size).toBe(4);
  }
});

test('G07 profiles occupy separate regions from every 3D viewport', async ({ page }) => {
  await page.goto('/?example=G07');
  await expect(page.locator('#chart-status')).toContainText('G07 running');
  const state = await inspect(page);
  for (const view of state.views) for (const grid of state.grids) {
    const overlap = Math.min(view.x + view.width, grid.x + grid.width) - Math.max(view.x, grid.x) > 1 &&
      Math.min(view.y + view.height, grid.y + grid.height) - Math.max(view.y, grid.y) > 1;
    expect(overlap, `${view.id} / ${grid.id}`).toBe(false);
  }
});

test('G04 shares actual mouse rotation with its camera group', async ({ page }) => {
  await page.goto('/?example=G04');
  await page.getByLabel('Camera scope').selectOption('row');
  const before = await inspect(page);
  const view = before.views[1];
  await page.locator('#experiment-chart').scrollIntoViewIfNeeded();
  const host = (await page.locator('#experiment-chart').boundingBox())!;
  await page.mouse.move(host.x + view.x + view.width / 2, host.y + view.y + view.height / 2);
  await page.mouse.down();
  await page.mouse.move(host.x + view.x + view.width / 2 + 65, host.y + view.y + view.height / 2 + 25, { steps: 10 });
  await page.mouse.up();
  await expect.poll(async () => (await inspect(page)).cameras[1].beta).not.toBe(before.cameras[1].beta);
  await expect.poll(async () => {
    const cameras = (await inspect(page)).cameras;
    return Math.abs(cameras[0].beta - cameras[1].beta);
  }).toBeLessThan(.001);
  const after = await inspect(page);
  expect(after.cameras[2].beta).toBe(before.cameras[2].beta);
});

test('G03 rotation stays local and G09 enlarges the rotated panel with its camera', async ({ page }) => {
  for (const id of ['G03', 'G09']) {
    await page.goto(`/?example=${id}`);
    await expect(page.locator('#chart-status')).toContainText(`${id} running`);
    const before = await inspect(page);
    const view = before.views[1];
    await page.locator('#experiment-chart').scrollIntoViewIfNeeded();
    const host = (await page.locator('#experiment-chart').boundingBox())!;
    await page.mouse.move(host.x + view.x + view.width / 2, host.y + view.y + view.height / 2);
    await page.mouse.down();
    await page.mouse.move(host.x + view.x + view.width / 2 + 55, host.y + view.y + view.height / 2 + 20, { steps: 10 });
    await page.mouse.up();
    await expect.poll(async () => (await inspect(page)).cameras[1].beta).not.toBe(before.cameras[1].beta);
    expect((await inspect(page)).cameras[0].beta).toBe(before.cameras[0].beta);
    if (id === 'G09') {
      await page.getByRole('button', { name: 'Enlarge selected cell', exact: true }).click();
      const enlarged = await inspect(page);
      expect(enlarged.views).toHaveLength(1);
      expect(enlarged.views[0].id).toContain('row-0:column-1');
      expect(enlarged.cameras[0].beta).not.toBe(before.cameras[1].beta);
      await page.locator('#experiment-chart').screenshot({ path: 'evidence/3d-audit/G09-enlarged.png' });
      await page.getByRole('button', { name: 'Restore all cells', exact: true }).click();
      expect((await inspect(page)).cameras[1].beta).toBeCloseTo(enlarged.cameras[0].beta, 1);
    }
  }
});

test('G08 mixed modes keep each 2D plot outside every 3D viewport', async ({ page }) => {
  await page.goto('/?example=G08');
  await page.locator('[data-mutate-element="viewMode"]').click();
  const mixed = await inspect(page);
  expect(mixed.views).toHaveLength(3);
  expect(mixed.grids).toHaveLength(1);
  const grid = mixed.grids[0];
  for (const view of mixed.views) {
    expect(Math.min(view.x + view.width, grid.x + grid.width) - Math.max(view.x, grid.x) > 1 &&
      Math.min(view.y + view.height, grid.y + grid.height) - Math.max(view.y, grid.y) > 1).toBe(false);
  }
  await page.locator('#experiment-chart').screenshot({ path: 'evidence/3d-audit/G08-mixed.png' });
  await page.locator('[data-mutate-element="viewMode"]').click();
  expect((await inspect(page)).views).toHaveLength(4);
});

test('G10 per-panel instances match their final grid-cell dimensions', async ({ page }) => {
  await page.setViewportSize({ width: 1900, height: 1200 });
  await page.goto('/?example=G10');
  await page.getByLabel('Instance model').selectOption('per-cell');
  await expect(page.getByTestId('live-instances')).toHaveText('4');
  const panels = await page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').map(e => e.name).find(n => /\/echarts\.js\?/.test(n))!;
    const ec = await import(url);
    return [...document.querySelectorAll<HTMLElement>('.baseline-cell')].map(host => {
      const chart = ec.getInstanceByDom(host);
      return { height: host.clientHeight, width: host.clientWidth, chartHeight: chart.getHeight(), chartWidth: chart.getWidth() };
    });
  });
  for (const panel of panels) {
    expect(panel.chartHeight).toBeCloseTo(panel.height, 0);
    expect(panel.chartWidth).toBeCloseTo(panel.width, 0);
    expect(panel.height).toBeCloseTo(panels[0].height, 0);
  }
  await page.locator('#experiment-chart').screenshot({ path: 'evidence/3d-audit/G10-baseline-verified.png' });
});
