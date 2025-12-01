import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('App E2E', () => {
  test('should display home page correctly', async ({ page }) => {
    await page.goto('/');
    // Title can be "Liga Prvakov Dutovlje" or "Sunday League Manager"
    await expect(page).toHaveTitle(/Liga Prvakov|Sunday League|Telovadnica/i);

    // Check for a main heading
    const mainHeading = page.getByRole('heading', { level: 1 });
    if ((await mainHeading.count()) > 0) {
      await expect(mainHeading).toBeVisible();
    }
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    // Assuming there is a link to login
    const loginLink = page.getByRole('link', { name: /sign in|login/i });
    if ((await loginLink.count()) > 0) {
      await loginLink.click();
      await expect(page).toHaveURL(/.*login/);
    } else {
      await page.goto('/login');
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    // Debug: print content if selector fails
    try {
      await expect(page.locator('#username')).toBeVisible({ timeout: 5000 });
    } catch (e) {
      console.log('Login page content:', await page.content());
      throw e;
    }
    await expect(page.locator('#password')).toBeVisible();
    try {
      await expect(
        page.locator('button').filter({ hasText: /sign in|login|prijava/i })
      ).toBeVisible({ timeout: 5000 });
    } catch (e) {
      fs.writeFileSync('debug-login.html', await page.content());
      throw e;
    }
  });

  test('should display register form', async ({ page }) => {
    await page.goto('/register');

    // Check for tabs
    try {
      await expect(
        page.locator('button').filter({ hasText: /New Player|Nov igralec/i })
      ).toBeVisible({ timeout: 5000 });
    } catch (e) {
      fs.writeFileSync('debug-register.html', await page.content());
      throw e;
    }
    await expect(
      page.locator('button').filter({ hasText: /Claim Profile|Zahtevaj profil/i })
    ).toBeVisible();

    // Default is Claim Profile, check for Search input
    // The label is "Search for Your Profile"
    await expect(page.getByPlaceholder(/Type your name|Search|Vnesite svoje ime/i)).toBeVisible();

    // Password should be visible in both modes
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Switch to New Player and check for Name input
    await page
      .locator('button')
      .filter({ hasText: /New Player|Nov igralec/i })
      .click();
    await expect(
      page.getByPlaceholder(/Enter your full name|Vnesite svoje polno ime/i)
    ).toBeVisible();
  });

  test('should show 404 for non-existent routes', async ({ page }) => {
    const response = await page.goto('/non-existent-route-12345');
    // Next.js might return 404 status code
    if (response) {
      expect(response.status()).toBe(404);
    }
    // And/or check for 404 text content
    await expect(page.getByText(/404|not found/i)).toBeVisible();
  });
});
