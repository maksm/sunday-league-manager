import { test, expect } from '@playwright/test';
import { prisma } from '../src/lib/prisma';

test.describe('User Authentication', () => {
  const timestamp = Date.now();
  const password = 'password123';
  const fullName = `Test User ${timestamp}`;

  const createdUsernames: string[] = [];

  test.afterEach(async () => {
    // Clean up all users created during tests based on patterns
    // This is more robust than tracking IDs which might be missed if tests fail early
    try {
      await prisma.user.deleteMany({
        where: {
          OR: [
            { username: { startsWith: 'testuser' } }, // Derived from "Test User..."
            { username: { startsWith: 'loginuser' } },
            { player: { name: { startsWith: 'Test User' } } },
            { player: { name: { startsWith: 'LoginUser' } } },
          ],
        },
      });
    } catch (error) {
      console.error('Failed to clean up auth test users:', error);
    }
  });

  test('should register a new user', async ({ page }) => {
    await page.goto('/register');

    // Switch to New Player tab
    await page
      .locator('button')
      .filter({ hasText: /New Player|Nov igralec/i })
      .click();

    // Fill in the form
    await page.getByPlaceholder(/Enter your full name|Vnesite svoje polno ime/i).fill(fullName);
    await page.locator('input[type="password"]').fill(password);

    // Intercept the registration request to capture the response
    // Setup wait for response before clicking
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/register') && response.status() === 201
    );

    // Submit
    await page
      .locator('button')
      .filter({ hasText: /Create Account|Ustvari račun/i })
      .click();

    // Wait for the response
    let registrationUsername = '';
    try {
      const response = await responsePromise;
      const body = await response.json();
      registrationUsername = body.user.username;
    } catch (e) {
      console.error('Failed to capture register response:', e);
    }

    // Wait a moment for the response to be captured
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Track created user for cleanup
    if (registrationUsername) {
      createdUsernames.push(registrationUsername);
    } else {
      // Fallback to derived username if response wasn't captured
      const nameParts = fullName.split(/\s+/);
      let derivedUsername = nameParts[0] || 'user';
      if (nameParts.length > 1) {
        derivedUsername += nameParts[nameParts.length - 1][0];
      }
      derivedUsername = derivedUsername.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      createdUsernames.push(derivedUsername);
    }

    // Verify redirection or success state
    await expect(page).not.toHaveURL(/\/register/);
  });

  test('should login as the registered user', async ({ page }) => {
    const timestamp = Date.now();
    const loginName = `LoginUser${timestamp}`;
    let actualUsername = '';

    // Register flow
    await page.goto('/register');
    await page
      .locator('button')
      .filter({ hasText: /New Player|Nov igralec/i })
      .click();
    await page.getByPlaceholder(/Enter your full name|Vnesite svoje polno ime/i).fill(loginName);
    await page.locator('input[type="password"]').fill(password);

    // Intercept registration response to get actual username
    // Setup wait for response before clicking
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/register') && response.status() === 201
    );

    await page
      .locator('button')
      .filter({ hasText: /Create Account|Ustvari račun/i })
      .click();

    try {
      const response = await responsePromise;
      const body = await response.json();
      actualUsername = body.user.username;
    } catch (e) {
      console.error('Failed to capture register response:', e);
    }

    // Wait for response to be captured
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Track created user for cleanup
    if (actualUsername) {
      createdUsernames.push(actualUsername);
    } else {
      // Fallback if response wasn't captured
      createdUsernames.push(`loginuser${timestamp}`);
      actualUsername = `loginuser${timestamp}`;
    }

    // Wait for navigation (likely to dashboard or login)
    await page.waitForURL(/dashboard|login/);

    // If redirected to dashboard, logout first to test login
    if (page.url().includes('/dashboard')) {
      await page.goto('/api/auth/signout');
    }

    // Now go to login page
    await page.goto('/login');

    // Fill login form
    await page.locator('#username').fill(actualUsername);
    await page.locator('#password').fill(password);
    await page
      .locator('button')
      .filter({ hasText: /sign in|login|prijava/i })
      .click();

    // Verify successful login (redirect to dashboard)
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
