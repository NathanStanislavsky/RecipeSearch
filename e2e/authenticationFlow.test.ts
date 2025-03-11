import { test, expect, Page } from '@playwright/test';

async function registerUser(page: Page, name: string, email: string, password: string) {
  await page.goto('/register');
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
}

async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
}

test.describe('authentication flow', () => {
  test('should register a user and then log in successfully', async ({ page }) => {
    // Generate a unique email for each test run
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const password = 'password123';
    const name = 'testUser';

    await registerUser(page, name, uniqueEmail, password);

    await loginUser(page, uniqueEmail, password);

    // Assert that user is on the main page
    expect(page.url()).toContain('/');
	
    // Verify that the header is present
    await expect(page.locator('h1')).toHaveText('What is in your fridge?');
  });
});