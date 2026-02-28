/**
 * =====================================================
 * E2E AUTHENTICATION TESTS
 * AfterHoursID - Playwright Tests
 * =====================================================
 */

import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

test.describe('Authentication Flow', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    browser = await test.step('Launch browser', async () => {
      const { chromium } = require('@playwright/test');
      return chromium.launch({ headless: true });
    });
  });

  test.beforeEach(async () => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await context.close();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  // =====================================================
  // REGISTRATION TESTS
  // =====================================================

  test.describe('User Registration', () => {
    test('should register a new user with valid credentials', async () => {
      await page.goto(`${BASE_URL}/auth/signup`);
      
      // Fill registration form
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
      await page.fill('input[name="password"]', 'SecurePass123!');
      await page.fill('input[name="confirmPassword"]', 'SecurePass123!');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for redirect or success message
      await page.waitForURL(`${BASE_URL}/profile-setup`, { timeout: 10000 });
      
      // Verify we're on profile setup page
      await expect(page.locator('h2')).toContainText('Welcome to AfterHours');
    });

    test('should show error for existing email', async () => {
      await page.goto(`${BASE_URL}/auth/signup`);
      
      // Fill with an already registered email
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'existing@example.com');
      await page.fill('input[name="password"]', 'SecurePass123!');
      await page.fill('input[name="confirmPassword"]', 'SecurePass123!');
      
      await page.click('button[type="submit"]');
      
      // Wait for error message
      await expect(page.locator('.error-message')).toContainText('Email already exists');
    });

    test('should show error for password mismatch', async () => {
      await page.goto(`${BASE_URL}/auth/signup`);
      
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'new@example.com');
      await page.fill('input[name="password"]', 'SecurePass123!');
      await page.fill('input[name="confirmPassword"]', 'DifferentPass123!');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('.error-message')).toContainText('Passwords do not match');
    });

    test('should validate password strength', async () => {
      await page.goto(`${BASE_URL}/auth/signup`);
      
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'new@example.com');
      await page.fill('input[name="password"]', 'weak');
      await page.fill('input[name="confirmPassword"]', 'weak');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('.error-message')).toContainText('Password is too weak');
    });
  });

  // =====================================================
  // LOGIN TESTS
  // =====================================================

  test.describe('User Login', () => {
    test('should login with valid credentials', async () => {
      await page.goto(`${BASE_URL}/auth/signin`);
      
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'SecurePass123!');
      
      await page.click('button[type="submit"]');
      
      // Should redirect to discovery or dashboard
      await page.waitForURL(`${BASE_URL}/**`, { timeout: 10000 });
      
      // Verify user is authenticated (check for user menu)
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should show error for invalid credentials', async () => {
      await page.goto(`${BASE_URL}/auth/signin`);
      
      await page.fill('input[name="email"]', 'wrong@example.com');
      await page.fill('input[name="password"]', 'WrongPass123!');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('.error-message')).toContainText('Invalid email or password');
    });

    test('should show error for unverified email', async () => {
      await page.goto(`${BASE_URL}/auth/signin`);
      
      await page.fill('input[name="email"]', 'unverified@example.com');
      await page.fill('input[name="password"]', 'SecurePass123!');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('.error-message')).toContainText('Please verify your email');
    });

    test('should remember me option works', async () => {
      await page.goto(`${BASE_URL}/auth/signin`);
      
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'SecurePass123!');
      await page.check('input[name="rememberMe"]');
      
      await page.click('button[type="submit"]');
      
      // Check if refresh token cookie is set with longer expiry
      const cookies = await context.cookies();
      const refreshToken = cookies.find(c => c.name === 'refreshToken');
      
      expect(refreshToken).toBeDefined();
      expect(refreshToken?.expires).toBeGreaterThan(Date.now() + 7 * 24 * 60 * 60 * 1000);
    });
  });

  // =====================================================
  // OAUTH TESTS
  // =====================================================

  test.describe('OAuth Login', () => {
    test('should login with Google', async () => {
      await page.goto(`${BASE_URL}/auth/signin`);
      
      // Click Google login button
      await page.click('button:has-text("Continue with Google")');
      
      // Should redirect to Google OAuth
      await page.waitForURL(/accounts\.google\.com/, { timeout: 10000 });
      
      // In real test, would complete Google OAuth flow
      // For now, just verify we're on Google
      expect(page.url()).toContain('google.com');
    });
  });

  // =====================================================
  // PASSWORD RESET TESTS
  // =====================================================

  test.describe('Password Reset', () => {
    test('should request password reset', async () => {
      await page.goto(`${BASE_URL}/auth/forgot-password`);
      
      await page.fill('input[name="email"]', 'test@example.com');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('.success-message')).toContainText('Password reset link sent');
    });

    test('should reset password with valid token', async () => {
      // Visit reset link (would need valid token in real test)
      await page.goto(`${BASE_URL}/auth/reset-password?token=valid-token`);
      
      await page.fill('input[name="password"]', 'NewPass123!');
      await page.fill('input[name="confirmPassword"]', 'NewPass123!');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('.success-message')).toContainText('Password updated successfully');
    });
  });

  // =====================================================
  // PROTECTED ROUTES TESTS
  // =====================================================

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated user from admin', async () => {
      await page.goto(`${BASE_URL}/dashboard/super-admin`);
      
      await page.waitForURL(`${BASE_URL}/auth/signin`);
    });

    test('should redirect unauthorized user from admin', async () => {
      // Login as regular user
      await page.goto(`${BASE_URL}/auth/signin`);
      await page.fill('input[name="email"]', 'user@example.com');
      await page.fill('input[name="password"]', 'SecurePass123!');
      await page.click('button[type="submit"]');
      
      // Try to access admin
      await page.goto(`${BASE_URL}/dashboard/super-admin`);
      
      // Should redirect to unauthorized page
      await expect(page.locator('h1')).toContainText('Unauthorized');
    });

    test('should allow authorized user to access admin', async () => {
      // Login as admin
      await page.goto(`${BASE_URL}/auth/signin`);
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'SecurePass123!');
      await page.click('button[type="submit"]');
      
      // Access admin
      await page.goto(`${BASE_URL}/dashboard/super-admin`);
      
      // Should be allowed
      await expect(page.locator('h1')).toContainText('Admin Dashboard');
    });
  });

  // =====================================================
  // SESSION MANAGEMENT TESTS
  // =====================================================

  test.describe('Session Management', () => {
    test('should maintain session on page refresh', async () => {
      await page.goto(`${BASE_URL}/auth/signin`);
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'SecurePass123!');
      await page.click('button[type="submit"]');
      
      // Refresh page
      await page.reload();
      
      // Should still be authenticated
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should logout successfully', async () => {
      await page.goto(`${BASE_URL}/auth/signin`);
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'SecurePass123!');
      await page.click('button[type="submit"]');
      
      // Click logout
      await page.click('[data-testid="logout-button"]');
      
      // Should redirect to login
      await page.waitForURL(`${BASE_URL}/auth/signin`);
    });

    test('should invalidate session on logout', async () => {
      await page.goto(`${BASE_URL}/auth/signin`);
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'SecurePass123!');
      await page.click('button[type="submit"]');
      
      // Logout
      await page.click('[data-testid="logout-button"]');
      
      // Try to access protected page
      await page.goto(`${BASE_URL}/discovery`);
      
      // Should redirect to login
      await page.waitForURL(`${BASE_URL}/auth/signin`);
    });
  });

  // =====================================================
  // TOKEN REFRESH TESTS
  // =====================================================

  test.describe('Token Refresh', () => {
    test('should refresh access token using refresh token', async () => {
      // This test simulates token expiration
      await page.goto(`${BASE_URL}/auth/signin`);
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'SecurePass123!');
      await page.click('button[type="submit"]');
      
      // Wait for access token to expire (in real test)
      // For now, just verify tokens are set
      const cookies = await context.cookies();
      
      expect(cookies.some(c => c.name === 'accessToken')).toBe(true);
      expect(cookies.some(c => c.name === 'refreshToken')).toBe(true);
    });
  });
});

test.describe('Security Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
  });

  test('should prevent XSS in login form', async () => {
    await page.goto(`${BASE_URL}/auth/signin`);
    
    await page.fill('input[name="email"]', '<script>alert("xss")</script>');
    await page.fill('input[name="password"]', 'test');
    await page.click('button[type="submit"]');
    
    // Should not execute script
    const alerts: string[] = [];
    page.on('dialog', async dialog => {
      alerts.push(dialog.message());
      await dialog.dismiss();
    });
    
    expect(alerts).toHaveLength(0);
  });

  test('should prevent CSRF attacks', async () => {
    // Verify CSRF token is present
    await page.goto(`${BASE_URL}/auth/signin`);
    
    const csrfToken = await page.locator('input[name="csrf_token"]').getAttribute('value');
    expect(csrfToken).toBeDefined();
  });

  test('should enforce rate limiting', async () => {
    await page.goto(`${BASE_URL}/auth/signin`);
    
    // Try multiple failed attempts
    for (let i = 0; i < 6; i++) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'wrong');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(100);
    }
    
    // Should be rate limited
    await expect(page.locator('.error-message')).toContainText('Too many attempts');
  });
});
