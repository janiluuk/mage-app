import { expect, test } from '@playwright/test';

test('loads the login screen', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByText('Welcome!')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
});
