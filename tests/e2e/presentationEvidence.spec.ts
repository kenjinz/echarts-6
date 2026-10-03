import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('captures guided layouts at wide and constrained sizes', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir('evidence/presentation', { recursive: true });
  const cases = [
    ['D04', 'C06'], ['D08', 'S05'], ['D11', 'P04'],
    ['D14', 'G02'], ['D18', 'R01'], ['D20', 'R07']
  ];
  for (const width of [1440, 900]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [lessonId, exampleId] of cases) {
      await page.goto(`/?lesson=${lessonId}&example=${exampleId}`);
      await expect(page.locator('#chart-status')).toContainText(`${exampleId} running`);
      await expect(page.locator('#guide-steps')).toBeVisible();
      const host = await page.locator('#experiment-chart').boundingBox();
      expect(host!.height).toBeGreaterThanOrEqual(500);
      await page.screenshot({ path: `evidence/presentation/${lessonId}-${width}.png`, fullPage: true });
    }
  }
});

test('technical disclosures and narrow layout stay reachable', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto('/?lesson=D04&example=C06');
  await page.getByText('Advanced chart settings', { exact: true }).click();
  await page.screenshot({ path: 'evidence/presentation/D04-advanced-900.png', fullPage: true });
  await page.locator('#technical-details > summary').click();
  await page.screenshot({ path: 'evidence/presentation/D04-technical-900.png', fullPage: true });
  const box = await page.locator('#technical-details').boundingBox();
  expect(box!.x + box!.width).toBeLessThanOrEqual(900);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel('Catalog view')).toBeVisible();
  await page.getByLabel('Lesson variant').selectOption('C07');
  await expect(page.locator('#chart-status')).toContainText('C07 running');
  expect(await page.locator('.chart-card').evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
  await page.screenshot({ path: 'evidence/presentation/D04-mobile-390.png', fullPage: true });
});
