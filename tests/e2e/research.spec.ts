import { test, expect } from '@playwright/test';

test('analyst runs demo, inspects evidence, and rejects malformed CSV', async ({ page }) => {
  await page.goto('/research');
  await page.getByRole('button', { name: 'Run labeled DEMO DATA' }).click();
  await expect(page.getByText('DEMO DATA — synthetic seed 42', { exact: true })).toBeVisible();
  await expect(page.getByText('Detection quality and economics')).toBeVisible();
  await expect(page.getByText('Evidence:', { exact: false })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Show flagged only' }).uncheck();
  await expect(page.getByRole('button', { name: 'demo-', exact: false }).first()).toBeVisible();
  await page.getByLabel('Review cost per flag').fill('3');
  await expect(page.getByText('Detection quality and economics')).toHaveCount(0);
  await page.getByRole('button', { name: 'Run labeled DEMO DATA' }).click();
  await expect(page.getByText('Detection quality and economics')).toBeVisible();
  await page.screenshot({ path: 'docs/assets/research-workspace.png', fullPage: true });
  await page.locator('input[type=file]').setInputFiles({ name: 'bad.csv', mimeType: 'text/csv', buffer: Buffer.from('bad,column\n1,2') });
  await page.getByRole('button', { name: 'Analyze my CSV' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Missing columns' })).toContainText('Missing columns');
  await expect(page.getByText('Detection quality and economics')).toHaveCount(0);
});

test('analyst imports actual file bytes through the same-origin proxy', async ({ page, request }) => {
  const response = await request.get('http://127.0.0.1:8182/research/demo');
  await page.goto('/research');
  await page.locator('input[type=file]').setInputFiles({ name: 'transactions.csv', mimeType: 'text/csv', buffer: Buffer.from(await response.text()) });
  await page.getByRole('button', { name: 'Analyze my CSV' }).click();
  await expect(page.getByText('USER CSV', { exact: true })).toBeVisible();
  await expect(page.getByText('DEMO DATA — synthetic seed 42', { exact: true })).toHaveCount(0);
});
