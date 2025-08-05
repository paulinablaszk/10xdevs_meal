import { test, expect } from '@playwright/test';

test('page loads successfully', async ({ page }) => {
  await page.goto('/');
  
  // Sprawdź, czy główny element strony jest widoczny
  await expect(page.locator('main')).toBeVisible();
  
  // Sprawdź, czy nawigacja jest widoczna
  await expect(page.locator('nav')).toBeVisible();
}); 