import { test, expect } from '@playwright/test';

test('Search functionality on the page', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  const searchInput = page.locator('input[placeholder="Potatoes, carrots, beef..."]');
  await expect(searchInput).toBeVisible();

  await searchInput.fill('Potatoes');
  await expect(searchInput).toHaveValue('Potatoes');

  const searchButton = page.locator('button:has-text("Search")');
  await expect(searchButton).toBeVisible();
  await searchButton.click();

  await expect(searchInput).toHaveValue('Potatoes');
});