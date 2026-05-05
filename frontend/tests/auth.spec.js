const { test, expect } = require('@playwright/test');

test.describe('Authentication and 2FA Flow', () => {
  test('Successful login without 2FA redirects to app', async ({ page }) => {
    await page.goto('http://localhost:3002');
    
    // Fill in standard login credentials
    await page.fill('input[type="email"]', 'demo@farmsense.com');
    await page.fill('input[type="password"]', 'farm1234');
    
    // Mock the API response for normal login
    await page.route('**/api/auth/login', async route => {
      const json = {
        success: true,
        data: {
          token: "dummy-jwt-token",
          user: { userId: "demo123", email: "demo@farmsense.com" },
          requiresTwoFactor: false
        }
      };
      await route.fulfill({ json });
    });

    await page.click('button:has-text("Login")');
    
    // Should navigate to app
    await expect(page.locator('text=FarmSense AI')).toBeVisible();
    await expect(page.locator('text=Detect')).toBeVisible();
  });

  test('Login with 2FA enabled redirects to 2FA verification page', async ({ page }) => {
    await page.goto('http://localhost:3002');
    
    // Fill in standard login credentials
    await page.fill('input[type="email"]', 'demo@farmsense.com');
    await page.fill('input[type="password"]', 'farm1234');
    
    // Mock the API response to require 2FA
    await page.route('**/api/auth/login', async route => {
      const json = {
        success: true,
        data: {
          requiresTwoFactor: true,
          tempUserId: "demo123"
        }
      };
      await route.fulfill({ json });
    });

    await page.click('button:has-text("Login")');
    
    // Should navigate to 2FA verification modal/page
    await expect(page.locator('text=Two-Factor Authentication')).toBeVisible();
    await expect(page.locator('input[placeholder*="6-digit"]')).toBeVisible();
    
    // Mock the 2FA verification API response
    await page.route('**/api/auth/verify-2fa', async route => {
      const json = {
        success: true,
        data: {
          token: "dummy-jwt-token-after-2fa",
          user: { userId: "demo123", email: "demo@farmsense.com" }
        }
      };
      await route.fulfill({ json });
    });

    // Enter a dummy 6-digit code and submit
    await page.fill('input[placeholder*="6-digit"]', '123456');
    await page.click('button:has-text("Verify")');
    
    // Should navigate to app
    await expect(page.locator('text=FarmSense AI')).toBeVisible();
    await expect(page.locator('text=Detect')).toBeVisible();
  });
});
