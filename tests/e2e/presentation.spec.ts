import { expect, test } from '@playwright/test';
import { LESSONS } from '../../src/presentation/catalog';

test('starts with twenty guided lessons and opens source-specific variants', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('lesson-button')).toHaveCount(20);
  await expect(page.getByTestId('lesson-id')).toHaveText('D01');
  await expect(page.getByTestId('example-id')).toHaveText('M02');
  await page.getByTestId('lesson-button').filter({ hasText: 'D04' }).click();
  await page.getByLabel('Lesson variant').selectOption('C07');
  await expect(page).toHaveURL(/lesson=D04&example=C07/);
  await expect(page.locator('#guide-steps li')).toHaveCount(3);
  await expect(page.getByLabel('Y linked zoom scope')).toBeVisible();
  await expect(page.getByLabel('X linked zoom scope')).toHaveCount(0);
  await expect(page.locator('#guide-limitation')).not.toBeEmpty();
  await expect(page.getByTestId('live-instances')).toHaveText('1');
});

test('retains the existing engineering entry point and labels', async ({ page }) => {
  await page.goto('/?example=C06');
  await expect(page.getByTestId('example-button')).toHaveCount(66);
  await expect(page.getByTestId('lesson-button')).toHaveCount(0);
  await expect(page.getByLabel('X dataZoom scope')).toBeVisible();
  await expect(page.locator('#lesson-guide')).toBeHidden();
});

test('opens every guided lesson with the correct default source', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const lesson of LESSONS) {
    await page.goto(`/?lesson=${lesson.id}`);
    await expect(page.getByTestId('lesson-id')).toHaveText(lesson.id);
    await expect(page.getByTestId('example-id')).toHaveText(lesson.variants[0].exampleId);
    await expect(page.locator('#chart-status')).toContainText(`${lesson.variants[0].exampleId} running`);
    await expect(page.locator('#guide-expected')).not.toBeEmpty();
    await expect(page.locator('#guide-status')).toContainText('acceptance review pending');
  }
  expect(errors).toEqual([]);
});

test('search preserves chart state and history changes reset source state', async ({ page }) => {
  await page.goto('/?lesson=D04&example=C06');
  await page.getByLabel('X linked zoom scope').selectOption('row');
  await page.getByRole('button', { name: 'Change X linked zoom', exact: true }).click();
  const before = await page.evaluate(() => (window as any).__matrixPoc.getSnapshot());
  await page.locator('#example-search').fill('no-such-lesson');
  await expect(page.getByText('No lessons match this search.')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__matrixPoc.getSnapshot())).toEqual(before);
  await page.getByRole('button', { name: 'Next lesson', exact: true }).click();
  await expect(page).toHaveURL(/lesson=D05&example=C09/);
  await page.goBack();
  await expect(page).toHaveURL(/lesson=D04&example=C06/);
  await expect(page.getByLabel('X linked zoom scope')).toHaveValue('individual');
  await page.goForward();
  await expect(page.getByTestId('lesson-id')).toHaveText('D05');
  await page.getByRole('button', { name: 'Reset example', exact: true }).click();
  await expect(page.getByTestId('lesson-id')).toHaveText('D05');
});

test('mode-only switches preserve interaction state and independent search text', async ({ page }) => {
  await page.goto('/?lesson=D04&example=C06');
  await page.getByLabel('X linked zoom scope').selectOption('column');
  await page.getByRole('button', { name: 'Change X linked zoom', exact: true }).click();
  await page.locator('#example-search').fill('zoom');
  const before = await page.evaluate(() => (window as any).__matrixPoc.getSnapshot());
  const initCount = await page.getByTestId('init-count').textContent();
  await page.getByLabel('Catalog view').selectOption('engineering');
  await expect(page.locator('#example-search')).toHaveValue('');
  await expect(page.getByLabel('X dataZoom scope')).toHaveValue('column');
  await page.locator('#example-search').fill('C06');
  await page.getByLabel('Catalog view').selectOption('guided');
  await expect(page.locator('#example-search')).toHaveValue('zoom');
  expect(await page.evaluate(() => (window as any).__matrixPoc.getSnapshot())).toEqual(before);
  await expect(page.getByTestId('init-count')).toHaveText(initCount!);
});

test('imports preserve P12 dimensions and invalid imports preserve the active route', async ({ page }) => {
  await page.goto('/?lesson=D13&example=P12');
  const imported = await page.evaluate(() => (window as any).__matrixPoc.getSnapshot());
  imported.rows = 1;
  imported.columns = 3;
  await page.locator('#technical-details > summary').click();
  await page.getByLabel('State snapshot JSON').fill(JSON.stringify(imported));
  await page.getByRole('button', { name: 'Import state', exact: true }).click();
  await expect(page.getByTestId('lesson-id')).toHaveText('D13');
  await expect.poll(async () => (await page.evaluate(() => (window as any).__matrixPoc.getSnapshot())).rows).toBe(1);
  const activeUrl = page.url();
  const before = await page.evaluate(() => (window as any).__matrixPoc.getSnapshot());
  await page.getByLabel('State snapshot JSON').fill('{');
  await page.getByRole('button', { name: 'Import state', exact: true }).click();
  await expect(page.locator('#chart-status')).toHaveClass(/is-error/);
  expect(page.url()).toBe(activeUrl);
  expect(await page.evaluate(() => (window as any).__matrixPoc.getSnapshot())).toEqual(before);
});

test('the newest lesson wins when a prior GL module request completes late', async ({ page }) => {
  await page.goto('/');
  let release!: () => void;
  let requested!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const observed = new Promise<void>(resolve => { requested = resolve; });
  await page.route('**/*echarts-gl*', async route => {
    requested();
    await gate;
    await route.continue();
  });
  const glResponse = page.waitForResponse(response => response.url().includes('echarts-gl'));
  await page.getByTestId('lesson-button').filter({ hasText: 'D14' }).click();
  await observed;
  await page.getByTestId('lesson-button').filter({ hasText: 'D01' }).click();
  release();
  await (await glResponse).finished();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('#chart-status')).toContainText('M02 running');
  await expect(page.getByTestId('lesson-id')).toHaveText('D01');
  await expect(page).toHaveURL(/lesson=D01&example=M02/);
  await expect(page.getByTestId('live-instances')).toHaveText('1');
  await expect(page.locator('#experiment-chart canvas')).toHaveCount(1);
});

test('snapshot imports retain a matching lesson and expose unrelated sources in engineering', async ({ page }) => {
  await page.goto('/?lesson=D04&example=C06');
  const initial = await page.evaluate(() => (window as any).__matrixPoc.getSnapshot());
  await page.locator('#technical-details > summary').click();
  initial.exampleId = 'C07';
  await page.getByLabel('State snapshot JSON').fill(JSON.stringify(initial));
  await page.getByRole('button', { name: 'Import state', exact: true }).click();
  await expect(page).toHaveURL(/lesson=D04&example=C07/);
  initial.exampleId = 'R01';
  await page.getByLabel('State snapshot JSON').fill(JSON.stringify(initial));
  await page.getByRole('button', { name: 'Import state', exact: true }).click();
  await expect(page).toHaveURL(/\?example=R01$/);
  await expect(page.getByTestId('example-button')).toHaveCount(66);
});

test('imported mixed dimensional modes survive guided initialization', async ({ page }) => {
  await page.goto('/?lesson=D16&example=G08');
  await expect(page.locator('#chart-status')).toContainText('G08 running');
  const imported = await page.evaluate(() => (window as any).__matrixPoc.getSnapshot());
  imported.interactive.viewMode['row-0:column-0'] = '2d';
  await page.locator('#technical-details > summary').click();
  await page.getByLabel('State snapshot JSON').fill(JSON.stringify(imported));
  await page.getByRole('button', { name: 'Import state', exact: true }).click();
  await expect(page.getByLabel('Selected-cell view mode')).toHaveValue('2d');
  expect((await page.evaluate(() => (window as any).__matrixPoc.getSnapshot())).interactive.viewMode).toEqual(imported.interactive.viewMode);
});

test('failed GL loading reports an error and allows another lesson', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.route('**/*echarts-gl*', route => route.abort());
  await page.getByTestId('lesson-button').filter({ hasText: 'D14' }).click();
  await expect(page.locator('#chart-status')).toHaveClass(/is-error/);
  await page.getByTestId('lesson-button').filter({ hasText: 'D01' }).click();
  await expect(page.locator('#chart-status')).toContainText('M02 running');
  expect(errors).toEqual([]);
});

test('regenerating data keeps secondary controls in the advanced disclosure', async ({ page }) => {
  await page.goto('/?lesson=D10&example=S10');
  await page.getByRole('button', { name: 'Regenerate data', exact: true }).click();
  await expect(page.getByText('Advanced chart settings', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Deterministic seed')).toBeHidden();
});

test('guided row zoom changes only the selected row', async ({ page }) => {
  await page.goto('/?lesson=D04&example=C06');
  await page.getByLabel('X linked zoom scope').selectOption('row');
  await page.getByRole('button', { name: 'Change X linked zoom', exact: true }).click();
  const snapshot = await page.evaluate(() => (window as any).__matrixPoc.getSnapshot());
  expect(snapshot.interactive.dataZoom['row-0:column-0/x']).toEqual({ start: 20, end: 80 });
  expect(snapshot.interactive.dataZoom['row-0:column-1/x']).toEqual({ start: 20, end: 80 });
  expect(snapshot.interactive.dataZoom['row-1:column-0/x']).toEqual({ start: 0, end: 100 });
});

test('point-symbol changes keep the line and fixed coupling stays visible', async ({ page }) => {
  await page.goto('/?lesson=D05&example=C11');
  await page.getByRole('button', { name: 'Change Point-symbol visibility', exact: true }).click();
  const option = await page.evaluate(() => (window as any).__matrixPoc.getOption());
  const lines = option.series.filter((series: any) => series.type === 'line');
  expect(lines.length).toBeGreaterThan(0);
  expect(lines.some((series: any) => series.showSymbol === false && series.data.length > 0)).toBe(true);
  await page.goto('/?lesson=D11&example=P04');
  await expect(page.getByLabel('X range scope')).toBeVisible();
  await expect(page.getByLabel('X range scope')).toBeDisabled();
  await expect(page.getByLabel('Y linked zoom scope')).toBeDisabled();
});

test('customer exports are reachable without technical details', async ({ page }) => {
  await page.goto('/?lesson=D19&example=M10');
  await expect(page.locator('#technical-details')).not.toHaveAttribute('open', '');
  const image = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export image', exact: true }).click();
  expect((await image).suggestedFilename()).toMatch(/\.png$/);
  await page.getByLabel('Lesson variant').selectOption('R03');
  await expect(page.locator('#guide-limitation')).toContainText('sample');
  const csv = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
  expect((await csv).suggestedFilename()).toMatch(/\.csv$/);
});

test('advanced controls remain usable without recreating the chart and skip collapsed focus', async ({ page }) => {
  await page.goto('/?lesson=D04&example=C06');
  const count = await page.getByTestId('init-count').textContent();
  const summary = page.getByText('Advanced chart settings', { exact: true });
  await summary.click();
  await page.getByLabel('Deterministic seed').fill('123');
  await page.getByLabel('Deterministic seed').press('Tab');
  expect((await page.evaluate(() => (window as any).__matrixPoc.getSnapshot())).seed).toBe(123);
  await summary.click();
  await summary.focus();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('#common-controls .advanced-content'))).toBe(false);
  await expect(page.getByTestId('init-count')).toHaveText(count!);
  await page.locator('#technical-details > summary').click();
  await expect(page.locator('#classification')).toHaveText('Inconclusive');
});

test('search finds every source variant under exactly one lesson', async ({ page }) => {
  await page.goto('/');
  for (const lesson of LESSONS) {
    for (const variant of lesson.variants) {
      await page.locator('#example-search').fill(variant.exampleId);
      await expect(page.getByTestId('lesson-button')).toHaveCount(1);
      await expect(page.getByTestId('lesson-button')).toContainText(lesson.id);
    }
  }
});

test('non-default variants remain selectable across all chapters', async ({ page }) => {
  for (const [lesson, variant] of [['D04','C07'],['D08','S05'],['D11','P03'],['D15','G05'],['D19','R03'],['D20','G10']]) {
    await page.goto(`/?lesson=${lesson}`);
    await page.getByLabel('Lesson variant').selectOption(variant);
    await expect(page.locator('#chart-status')).toContainText(`${variant} running`);
    await expect(page.getByTestId('example-id')).toHaveText(variant);
    await expect(page.locator('#guide-expected')).not.toBeEmpty();
  }
});

test('appendix-only examples explain a return to the first guided lesson', async ({ page }) => {
  await page.goto('/?example=G01');
  await page.getByLabel('Catalog view').selectOption('guided');
  await expect(page.getByTestId('lesson-id')).toHaveText('D01');
  await expect(page.locator('#navigation-notice')).toContainText('Reset');
  await expect(page.locator('#chart-status')).toContainText('M02 running');
});
