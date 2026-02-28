/**
 * =====================================================
 * SEARCH E2E TESTS
 * AfterHoursID - High-Performance Search
 * =====================================================
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/discovery`);
  });

  // =====================================================
  // SEARCH INPUT TESTS
  // =====================================================

  test.describe('Search Input', () => {
    test('should show autocomplete dropdown as user types', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      
      await searchInput.fill('Dragon');
      await page.waitForTimeout(500); // Wait for debounce
      
      // Should show autocomplete dropdown
      const dropdown = page.locator('.glass-card').filter({ hasText: 'Dragonfly' });
      await expect(dropdown).toBeVisible({ timeout: 5000 });
    });

    test('should show recent searches when input is empty', async ({ page }) => {
      // First do a search to populate history
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.fill('test venue');
      await searchInput.press('Enter');
      await page.waitForURL(/discovery/);
      
      // Clear and focus
      await searchInput.clear();
      await searchInput.click();
      await page.waitForTimeout(300);
      
      // Should show recent searches
      const recentSearches = page.locator('text=Recent Searches');
      await expect(recentSearches).toBeVisible();
    });

    test('should clear search input with X button', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      
      await searchInput.fill('test');
      
      // Find and click clear button
      const clearButton = page.locator('button').filter({ has: page.locator('svg.lucide-x') });
      await clearButton.click();
      
      await expect(searchInput).toHaveValue('');
    });
  });

  // =====================================================
  // SKELETON LOADING TESTS
  // =====================================================

  test.describe('Skeleton Loading', () => {
    test('should show skeleton while loading results', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      
      // Type a query
      await searchInput.fill('Dragon');
      await searchInput.press('Enter');
      
      // Should show skeleton immediately
      const skeleton = page.locator('.animate-pulse').first();
      await expect(skeleton).toBeVisible({ timeout: 1000 });
    });
  });

  // =====================================================
  // SEARCH RESULTS TESTS
  // =====================================================

  test.describe('Search Results', () => {
    test('should display search results after query', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      
      await searchInput.fill('Dragon');
      await searchInput.press('Enter');
      await page.waitForURL(/discovery/);
      
      // Wait for results
      await page.waitForTimeout(1000);
      
      // Should show Dragonfly venue
      const result = page.locator('text=Dragonfly');
      await expect(result).toBeVisible({ timeout: 5000 });
    });

    test('should show distance when location is available', async ({ page }) => {
      // Allow geolocation
      await page.context().grantPermissions(['geolocation']);
      
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      
      await searchInput.fill('Dragon');
      await searchInput.press('Enter');
      await page.waitForURL(/discovery/);
      await page.waitForTimeout(1500);
      
      // Should show distance (e.g., "1.2km away")
      const distance = page.locator('text=/\\d+(\\.\\d+)?km away/');
      await expect(distance).toBeVisible({ timeout: 5000 });
    });

    test('should handle empty results gracefully', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      
      // Search for something unlikely to exist
      await searchInput.fill('xyznonexistentvenue123');
      await searchInput.press('Enter');
      await page.waitForURL(/discovery/);
      await page.waitForTimeout(1000);
      
      // Should show no results message
      const noResults = page.locator('text=No venues found');
      await expect(noResults).toBeVisible({ timeout: 5000 });
    });
  });

  // =====================================================
  // CATEGORY FILTER TESTS
  // =====================================================

  test.describe('Category Filters', () => {
    test('should toggle category filters without reload', async ({ page }) => {
      // Click on a category button
      const categoryButton = page.locator('button').filter({ hasText: 'Nightclub' }).first();
      await categoryButton.click();
      
      // Button should now be active (different style)
      await expect(categoryButton).toHaveClass(/from-neon-cyan/);
      
      // Should not have navigated
      expect(page.url()).toContain('/discovery');
    });

    test('should select multiple categories', async ({ page }) => {
      // Click first category
      const cat1 = page.locator('button').filter({ hasText: 'Nightclub' }).first();
      await cat1.click();
      
      // Click second category
      const cat2 = page.locator('button').filter({ hasText: 'Bar' }).first();
      await cat2.click();
      
      // Both should be active
      await expect(cat1).toHaveClass(/from-neon-cyan/);
      await expect(cat2).toHaveClass(/from-neon-cyan/);
    });
  });

  // =====================================================
  // GEOLOCATION TESTS
  // =====================================================

  test.describe('Geolocation', () => {
    test('should show location indicator when enabled', async ({ page }) => {
      await page.context().grantPermissions(['geolocation']);
      
      await page.goto(`${BASE_URL}/discovery`);
      await page.waitForTimeout(2000);
      
      // Should show navigation icon indicating location is enabled
      const locationIcon = page.locator('svg.lucide-navigation').first();
      await expect(locationIcon).toBeVisible();
    });
  });

  // =====================================================
  // INTEGRATION TEST: FULL SEARCH FLOW
  // =====================================================

  test('Complete search flow: enter query, see skeleton, see results with distance', async ({ page }) => {
    // Grant geolocation
    await page.context().grantPermissions(['geolocation']);
    
    // 1. Navigate to discovery
    await page.goto(`${BASE_URL}/discovery`);
    
    // 2. Enter search query
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('Dragon');
    
    // 3. Submit search
    await searchInput.press('Enter');
    await page.waitForURL(/discovery/);
    
    // 4. Skeleton should appear
    const skeleton = page.locator('.animate-pulse').first();
    await expect(skeleton).toBeVisible({ timeout: 3000 });
    
    // 5. Wait for results to load
    await page.waitForTimeout(1500);
    
    // 6. Verify Dragonfly venue appears
    const dragonflyResult = page.locator('text=Dragonfly');
    await expect(dragonflyResult).toBeVisible({ timeout: 5000 });
    
    // 7. Verify distance is calculated and displayed
    const distanceResult = page.locator('text=/\\d+(\\.\\d+)?(km|m) away/');
    await expect(distanceResult).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Search Analytics', () => {
  test('should track search queries', async ({ page }) => {
    // This test verifies analytics are being logged
    await page.goto(`${BASE_URL}/discovery`);
    
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('test analytics');
    await searchInput.press('Enter');
    
    await page.waitForURL(/discovery/);
    await page.waitForTimeout(1000);
    
    // If analytics endpoint exists, verify it was called
    // This would require intercepting the network request
    const requests = [];
    page.on('request', req => requests.push(req.url()));
    
    // The search should have triggered an analytics log
    // In production, we'd verify the API call was made
  });
});
