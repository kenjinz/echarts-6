import { expect, test, type Page } from '@playwright/test';

async function layout(page: Page) {
  return page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').map((entry) => entry.name).find((name) => /\/echarts\.js\?/.test(name));
    if (!url) throw new Error('ECharts module not loaded');
    const echarts = await import(url);
    const chart = echarts.getInstanceByDom(document.getElementById('experiment-chart'));
    const model = chart.getModel();
    const rects = (kind: string) => model.findComponents({ mainType: kind }).map((component: any) => {
      const view = chart.getViewOfComponentModel(component);
      if (kind === 'toolbox') {
        // Group bounds include hidden hover labels; measure the visible icons.
        const icons = view.group.children().filter((child: any) => child.__title);
        const boxes = icons.map((icon: any) => {
          const box = icon.getBoundingRect().clone();
          box.applyTransform(icon.getComputedTransform());
          return box;
        });
        const x = Math.min(...boxes.map((box) => box.x));
        const y = Math.min(...boxes.map((box) => box.y));
        return { id: component.id, x, y, width: Math.max(...boxes.map((box) => box.x + box.width)) - x, height: Math.max(...boxes.map((box) => box.y + box.height)) - y };
      }
      const group = view.group;
      const rect = group.getBoundingRect().clone();
      rect.applyTransform(group.getComputedTransform());
      return { id: component.id, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
    return {
      grids: model.findComponents({ mainType: 'grid' }).map((grid: any) => ({ id: grid.id, ...grid.coordinateSystem.getRect() })),
      legends: rects('legend'), toolboxes: rects('toolbox'), maps: rects('visualMap'),
      option: chart.getOption()
    };
  });
}

test('detached axes stay outside plots only in C17, with borderless labels and a comparison grid', async ({ page }) => {
  for (const id of ['C05', 'C17']) {
    await page.goto(`/?example=${id}`);
    await expect(page.locator('#chart-status')).toContainText(`${id} running`);
    for (const sides of [{ x: 'bottom', y: 'left' }, { x: 'top', y: 'right' }]) {
      await page.getByLabel('Shared X axis position').selectOption(sides.x);
      await page.getByLabel('Shared Y axis position').selectOption(sides.y);
      const rendered = await layout(page);
      for (const axis of [...rendered.option.xAxis, ...rendered.option.yAxis]) {
        expect(axis.offset).toBe(id === 'C17' ? 16 : 0);
        expect(axis.splitLine.show).toBe(true);
        if (axis.axisLabel.show) expect(axis.axisTick.show).toBe(true);
      }
      const [a, b, c] = rendered.grids;
      expect(b.x - a.x - a.width).toBeCloseTo(4, 4);
      expect(c.y - a.y - a.height).toBeCloseTo(4, 4);
    }
    await page.locator('#experiment-chart').screenshot({ path: `evidence/2d-${id}-axes.png` });
  }
  await page.goto('/?example=M02');
  await expect(page.locator('#chart-status')).toContainText('M02 running');
  const matrix = (await layout(page)).option.matrix[0];
  expect(matrix.x.itemStyle.borderWidth).toBe(0);
  expect(matrix.y.itemStyle.borderWidth).toBe(0);
  expect(matrix.x.dividerLineStyle.width).toBe(0);
  expect(matrix.y.dividerLineStyle.width).toBe(0);
  expect(matrix.body.itemStyle.borderWidth).toBe(0);
  expect(matrix.backgroundStyle.borderWidth).toBe(0);
});

test('individual chart controls stay local and a second-cell toolbox zoom leaves the first cell unchanged', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?example=M02');
  await expect(page.locator('#chart-status')).toContainText('M02 running');
  const rendered = await layout(page);
  await page.locator('#experiment-chart').screenshot({ path: 'evidence/2d-individual.png' });
  expect(rendered.legends).toHaveLength(4);
  expect(rendered.toolboxes).toHaveLength(4);
  for (let index = 0; index < 4; index++) {
    const grid = rendered.grids[index];
    const legend = rendered.legends[index];
    const toolbox = rendered.toolboxes[index];
    expect(legend.y).toBeGreaterThan(grid.y + grid.height);
    expect(toolbox.y + toolbox.height).toBeLessThan(grid.y);
  }
  const host = await page.locator('#experiment-chart').boundingBox();
  const toolbox = rendered.toolboxes[1];
  await page.mouse.click(host!.x + toolbox.x + 10, host!.y + toolbox.y + 10);
  const grid = rendered.grids[1];
  await page.mouse.move(host!.x + grid.x + grid.width * .2, host!.y + grid.y + grid.height * .2);
  await page.mouse.down();
  await page.mouse.move(host!.x + grid.x + grid.width * .7, host!.y + grid.y + grid.height * .7, { steps: 8 });
  await page.mouse.up();
  const after = (await layout(page)).option.dataZoom;
  const second = after.find((zoom: any) => zoom.id === 'dataZoom/row-0:column-1/toolbox-x');
  const first = after.find((zoom: any) => zoom.id === 'dataZoom/row-0:column-0/toolbox-x');
  expect(second.end - second.start).toBeLessThan(80);
  expect(first.start).toBe(0);
  expect(first.end).toBe(100);
  expect(errors).toEqual([]);
  await page.locator('#experiment-chart').screenshot({ path: 'evidence/2d-individual.png' });
});

test('shared plots retain a four-pixel gap with outer axes after resize, renderer switch and state import', async ({ page }) => {
  await page.goto('/?example=C04');
  await page.getByLabel('X axis sharing').selectOption('all');
  await page.getByLabel('Y axis sharing').selectOption('all');
  for (const renderer of ['canvas', 'svg']) {
    await page.getByLabel('Renderer').selectOption(renderer);
    for (const sides of [{ x: 'bottom', y: 'left' }, { x: 'top', y: 'right' }]) {
      await page.getByLabel('Shared X axis position').selectOption(sides.x);
      await page.getByLabel('Shared Y axis position').selectOption(sides.y);
      const rendered = await layout(page);
      const [a, b, c] = rendered.grids;
      expect(b.x - (a.x + a.width)).toBeCloseTo(4, 4);
      expect(c.y - (a.y + a.height)).toBeCloseTo(4, 4);
      expect(rendered.option.xAxis.map((axis: any) => axis.axisLabel.show)).toEqual(sides.x === 'top' ? [true, true, false, false] : [false, false, true, true]);
      expect(rendered.option.yAxis.map((axis: any) => axis.axisLabel.show)).toEqual(sides.y === 'left' ? [true, false, true, false] : [false, true, false, true]);
    }
  }
  await page.setViewportSize({ width: 1000, height: 850 });
  await expect.poll(async () => {
    const [a, b, c] = (await layout(page)).grids;
    return Math.max(Math.abs(b.x - (a.x + a.width) - 4), Math.abs(c.y - (a.y + a.height) - 4));
  }).toBeLessThan(.01);
  await page.getByRole('button', { name: 'Export state', exact: true }).click();
  const state = await page.getByLabel('State snapshot JSON').inputValue();
  await page.getByRole('button', { name: 'Reset example' }).click();
  await page.getByLabel('State snapshot JSON').fill(state);
  await page.getByRole('button', { name: 'Import state', exact: true }).click();
  await expect(page.getByLabel('Shared X axis position')).toHaveValue('top');
  await expect(page.getByLabel('Shared Y axis position')).toHaveValue('right');
  await page.locator('#experiment-chart').screenshot({ path: 'evidence/2d-shared.png' });
});

test('individual continuous and piecewise visual maps remain beside their plots', async ({ page }) => {
  for (const id of ['S04', 'S05']) {
    await page.goto(`/?example=${id}`);
    await expect(page.locator('#chart-status')).toContainText(`${id} running`);
    const rendered = await layout(page);
    await page.locator('#experiment-chart').screenshot({ path: `evidence/2d-${id}.png` });
    expect(rendered.maps).toHaveLength(4);
    for (let index = 0; index < 4; index++) {
      const map = rendered.maps[index];
      const grid = rendered.grids[index];
      expect(map.x).toBeGreaterThanOrEqual(grid.x + grid.width);
      expect(map.y).toBeGreaterThan(grid.y - 15);
      expect(map.y + map.height).toBeLessThan(rendered.legends[index].y);
    }
    await page.locator('#experiment-chart').screenshot({ path: `evidence/2d-${id}.png` });
  }
});

test('compound controls clear the marginal plots and main zoom preserves independent marginal axes', async ({ page }) => {
  for (const id of ['P04', 'P06', 'P11']) {
    await page.goto(`/?example=${id}`);
    await expect(page.locator('#chart-status')).toContainText(`${id} running`);
    const rendered = await layout(page);
    for (let cell = 0; cell < 4; cell++) {
      const [main, top, right] = rendered.grids.slice(cell * 3, cell * 3 + 3);
      const toolbox = rendered.toolboxes[cell];
      expect(toolbox.y + toolbox.height).toBeLessThan(top.y);
      expect(top.y + top.height).toBeLessThan(main.y);
      expect(main.y + main.height).toBeLessThan(rendered.legends[cell].y);
      if (id === 'P11') expect(rendered.maps[cell].x).toBeGreaterThan(right.x + right.width);
    }
    await page.locator('#experiment-chart').screenshot({ path: `evidence/2d-${id}.png` });
  }
  await page.evaluate(() => {
    (window as any).__matrixPoc.dispatchAction({ type: 'dataZoom', dataZoomId: 'dataZoom/row-0:column-0/toolbox-x', start: 20, end: 70 });
  });
  const option = (await layout(page)).option;
  const changed = option.dataZoom.filter((zoom: any) => zoom.start !== 0 || zoom.end !== 100);
  expect(changed.length).toBeGreaterThan(0);
  expect(changed.every((zoom: any) => !zoom.xAxisId?.includes('xAxis/row-0:column-0/right'))).toBe(true);
});

test('larger independent matrices retain room for plots and local controls', async ({ page }) => {
  await page.goto('/?example=M02');
  await page.locator('[data-common="rows"]').selectOption('5');
  await page.locator('[data-common="columns"]').selectOption('5');
  const rendered = await layout(page);
  expect(rendered.grids).toHaveLength(25);
  expect(rendered.grids.every((grid: any) => grid.width > 100 && grid.height > 100)).toBe(true);
  for (let index = 0; index < 25; index++) {
    expect(rendered.legends[index].y).toBeGreaterThan(rendered.grids[index].y + rendered.grids[index].height);
    expect(rendered.toolboxes[index].y + rendered.toolboxes[index].height).toBeLessThan(rendered.grids[index].y);
  }
});

test('enlarged compound subregions remain separate and clear of controls', async ({ page }) => {
  await page.goto('/?example=P06');
  await page.getByRole('button', { name: 'Enlarge selected cell', exact: true }).click();
  const rendered = await layout(page);
  const [main, top, right] = rendered.grids;
  expect(top.y + top.height).toBeLessThan(main.y);
  expect(main.x + main.width).toBeLessThan(right.x);
  expect(main.y).toBeCloseTo(right.y, 4);
  expect(top.y).toBeGreaterThan(rendered.toolboxes[0].y + rendered.toolboxes[0].height);
});

test('row and column sharing packs each comparison group without interior axes', async ({ page }) => {
  await page.goto('/?example=C04');
  for (const scope of ['row', 'column']) {
    await page.getByLabel('X axis sharing').selectOption(scope);
    await page.getByLabel('Y axis sharing').selectOption(scope);
    const rendered = await layout(page);
    const [a, b, c] = rendered.grids;
    if (scope === 'row') {
      expect(b.x - (a.x + a.width)).toBeCloseTo(4, 4);
      expect(rendered.option.yAxis[1].axisLabel.show).toBe(false);
    }
    else {
      expect(c.y - (a.y + a.height)).toBeCloseTo(4, 4);
      expect(rendered.option.xAxis[0].axisLabel.show).toBe(false);
    }
  }
});
