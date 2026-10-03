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
