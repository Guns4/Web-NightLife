import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for AfterHoursID E2E Tests
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',
  
  // Test timeout
  timeout: 30 * 1000,
  
  // Expect timeout
  expect: {
    timeout: 5000,
  },
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail build on CI if tests fail
  forbidOnly: !!process.env.CI,
  
  // Retry failed tests
  retries: process.env.CI ? 2 : 0,
  
  // Workers (parallel tests)
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'playwright-results.json' }],
  ],
  
  // Shared settings
  use: {
    // Base URL
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    
    // Collect traces on failure
    trace: 'on-first-retry',
    
    // Collect screenshots
    screenshot: 'only-on-failure',
    
    // Video recording
    video: 'retain-on-failure',
    
    // Action timeout
    actionTimeout: 10 * 1000,
    
    // Navigation timeout
    navigationTimeout: 30 * 1000,
  },
  
  // Configure projects (browsers)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile tests
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  // Web server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
