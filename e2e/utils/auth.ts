import { Page, expect } from '@playwright/test';

export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /Sign In to Portal/ }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}

/** Clears the persisted session so the next `login()` starts fresh as a different user. */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.clear());
}
