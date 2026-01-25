import { expect, test } from '@playwright/test';

/**
 * Screenshot tests for Browser and VideoEditor pages
 * These tests capture visual snapshots of key application pages
 */

// Mock authentication state for accessing protected routes
test.beforeEach(async ({ page }) => {
  // Set localStorage to simulate authenticated state
  await page.addInitScript(() => {
    // Mock JWT token - this is for screenshot purposes only
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNTE2MjM5MDIyfQ.4Adcj0MqXKe2cdMJ3L8fCkRzfFqJt8xJf7Q9X8qGlKg';
    localStorage.setItem('jwt-token', mockToken);
  });
});

test.describe('Browser Page Screenshots', () => {
  test('capture browser page screenshot', async ({ page }) => {
    // Navigate to browser page
    await page.goto('/browser');
    
    // Wait for the page to be in a stable state
    // Wait for either loading indicator to disappear or content to appear
    await page.waitForTimeout(2000); // Give time for initial render
    
    // Try to wait for loading to complete, but don't fail if it doesn't appear
    try {
      await page.waitForSelector('.loading-indicator', { state: 'hidden', timeout: 5000 });
    } catch {
      // Loading indicator might not appear, continue anyway
    }
    
    // Take full page screenshot
    await page.screenshot({
      path: 'screenshots/browser-page.png',
      fullPage: true
    });
    
    console.log('✓ Browser page screenshot saved to: screenshots/browser-page.png');
  });
  
  test('capture browser page with filters open', async ({ page }) => {
    await page.goto('/browser');
    
    // Wait for page load
    await page.waitForTimeout(2000);
    
    try {
      await page.waitForSelector('.loading-indicator', { state: 'hidden', timeout: 5000 });
    } catch {
      // Continue if loading indicator doesn't appear
    }
    
    // Try to open filters if the button exists
    try {
      const filtersButton = page.locator('[aria-label*="filter" i], button:has-text("Filter")').first();
      if (await filtersButton.isVisible({ timeout: 2000 })) {
        await filtersButton.click();
        await page.waitForTimeout(500); // Wait for filters panel to open
      }
    } catch {
      console.log('Filters button not found, taking screenshot of current state');
    }
    
    // Take screenshot
    await page.screenshot({
      path: 'screenshots/browser-page-with-filters.png',
      fullPage: true
    });
    
    console.log('✓ Browser page with filters screenshot saved to: screenshots/browser-page-with-filters.png');
  });
});

test.describe('Video Editor Screenshots', () => {
  test('capture video editor page screenshot', async ({ page }) => {
    // Navigate to video editor with test parameters
    // Using 'file' type and a test ID
    await page.goto('/editor/file/test-video-id');
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Wait for either the editor or an error/loading state to appear
    await Promise.race([
      page.waitForSelector('.editor-wrapper', { timeout: 5000 }).catch(() => null),
      page.waitForSelector('.loading-container', { timeout: 5000 }).catch(() => null),
      page.waitForSelector('.error-container', { timeout: 5000 }).catch(() => null),
      page.waitForSelector('.empty-state', { timeout: 5000 }).catch(() => null),
    ]);
    
    // Take full page screenshot regardless of state (loading, error, or loaded)
    await page.screenshot({
      path: 'screenshots/video-editor-page.png',
      fullPage: true
    });
    
    console.log('✓ Video editor page screenshot saved to: screenshots/video-editor-page.png');
  });
  
  test('capture video editor loading state', async ({ page }) => {
    await page.goto('/editor/job/test-job-id');
    
    // Capture early state (likely loading or error)
    await page.waitForTimeout(1000);
    
    await page.screenshot({
      path: 'screenshots/video-editor-loading.png',
      fullPage: true
    });
    
    console.log('✓ Video editor loading state screenshot saved to: screenshots/video-editor-loading.png');
  });
});

test.describe('Additional UI Screenshots', () => {
  test('capture dashboard screenshot', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: 'screenshots/dashboard.png',
      fullPage: true
    });
    
    console.log('✓ Dashboard screenshot saved to: screenshots/dashboard.png');
  });
  
  test('capture story creator screenshot', async ({ page }) => {
    await page.goto('/story');
    
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: 'screenshots/story-creator.png',
      fullPage: true
    });
    
    console.log('✓ Story Creator screenshot saved to: screenshots/story-creator.png');
  });
});
