import { Page } from '@playwright/test';

export async function registerUser(page: Page, name: string, email: string, password: string) {
	await page.goto('/register');
	await page.fill('input[name="name"]', name);
	await page.fill('input[name="email"]', email);
	await page.fill('input[name="password"]', password);
	await page.click('button[type="submit"]');
	await page.waitForNavigation();
}

export async function loginUser(page: Page, email: string, password: string) {
	await page.goto('/login');
	await page.fill('input[name="email"]', email);
	await page.fill('input[name="password"]', password);
	await page.click('button[type="submit"]');
	await page.waitForNavigation();
}
