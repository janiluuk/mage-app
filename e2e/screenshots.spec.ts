import { expect, test } from '@playwright/test';

/**
 * Screenshot tests for all application pages
 * These tests capture visual snapshots of key application pages including
 * user pages, admin pages, and main features
 */

// Mock authentication state for accessing protected routes
test.beforeEach(async ({ page }) => {
  // Set localStorage to simulate authenticated state
  await page.addInitScript(() => {
    // Mock JWT token with far-future expiration for screenshot purposes
    // This token uses the correct localStorage key that AuthService expects
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiYWRtaW4ifQ.dummySignatureForScreenshotTestingOnly';
    localStorage.setItem('auth.accessToken', mockToken);
  });
});

test.describe('Browser Page Screenshots', () => {
  test('capture browser page screenshot', async ({ page }) => {
    // Navigate to browser page
    await page.goto('/browser', { waitUntil: 'networkidle' });
    
    // Wait for page to be in a stable state
    try {
      await page.waitForSelector('.loading-indicator', { state: 'hidden', timeout: 5000 });
    } catch {
      // Loading indicator might not appear, continue anyway
    }
    
    // Ensure page is fully loaded
    await page.waitForLoadState('domcontentloaded');
    
    // Take full page screenshot
    await page.screenshot({
      path: 'screenshots/browser-page.png',
      fullPage: true
    });
    
    console.log('✓ Browser page screenshot saved to: screenshots/browser-page.png');
  });
  
  test('capture browser page with filters open', async ({ page }) => {
    await page.goto('/browser', { waitUntil: 'networkidle' });
    
    // Wait for page to be stable
    await page.waitForLoadState('domcontentloaded');
    
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
        // Wait for filters panel animation to complete
        await page.waitForLoadState('networkidle');
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
    await page.goto('/editor/file/test-video-id', { waitUntil: 'networkidle' });
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    
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
    await page.goto('/editor/job/test-job-id', { waitUntil: 'domcontentloaded' });
    
    // Capture early state (likely loading or error)
    await page.waitForLoadState('domcontentloaded');
    
    await page.screenshot({
      path: 'screenshots/video-editor-loading.png',
      fullPage: true
    });
    
    console.log('✓ Video editor loading state screenshot saved to: screenshots/video-editor-loading.png');
  });
});

test.describe('Additional UI Screenshots', () => {
  test('capture dashboard screenshot', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    
    await page.screenshot({
      path: 'screenshots/dashboard.png',
      fullPage: true
    });
    
    console.log('✓ Dashboard screenshot saved to: screenshots/dashboard.png');
  });
  
  test('capture story creator screenshot', async ({ page }) => {
    await page.goto('/story', { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    
    await page.screenshot({
      path: 'screenshots/story-creator.png',
      fullPage: true
    });
    
    console.log('✓ Story Creator screenshot saved to: screenshots/story-creator.png');
  });

  test('capture soundscape creator screenshot', async ({ page }) => {
    await page.goto('/soundscape', { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    
    await page.screenshot({
      path: 'screenshots/soundscape-creator.png',
      fullPage: true
    });
    
    console.log('✓ Soundscape Creator screenshot saved to: screenshots/soundscape-creator.png');
  });

  test('capture frontpage screenshot', async ({ page }) => {
    await page.goto('/frontpage', { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    
    await page.screenshot({
      path: 'screenshots/frontpage.png',
      fullPage: true
    });
    
    console.log('✓ Frontpage screenshot saved to: screenshots/frontpage.png');
  });
});

test.describe('User Pages Screenshots', () => {
  test('capture user profile screenshot', async ({ page }) => {
    await page.goto('/profile', { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    
    await page.screenshot({
      path: 'screenshots/user-profile.png',
      fullPage: true
    });
    
    console.log('✓ User Profile screenshot saved to: screenshots/user-profile.png');
  });

  test('capture library screenshot', async ({ page }) => {
    await page.goto('/library', { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    
    await page.screenshot({
      path: 'screenshots/library.png',
      fullPage: true
    });
    
    console.log('✓ Library screenshot saved to: screenshots/library.png');
  });

  test('capture stories browser screenshot', async ({ page }) => {
    await page.goto('/stories', { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    
    await page.screenshot({
      path: 'screenshots/stories-browser.png',
      fullPage: true
    });
    
    console.log('✓ Stories Browser screenshot saved to: screenshots/stories-browser.png');
  });

  test('capture upload page screenshot', async ({ page }) => {
    await page.goto('/upload', { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    
    await page.screenshot({
      path: 'screenshots/upload-page.png',
      fullPage: true
    });
    
    console.log('✓ Upload Page screenshot saved to: screenshots/upload-page.png');
  });
});

test.describe('Admin Pages Screenshots', () => {
  test('capture video processing admin page screenshot', async ({ page }) => {
    await page.goto('/admin/video-processing', { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    
    await page.screenshot({
      path: 'screenshots/admin-video-processing.png',
      fullPage: true
    });
    
    console.log('✓ Admin Video Processing screenshot saved to: screenshots/admin-video-processing.png');
  });

  test('capture instance management admin page screenshot', async ({ page }) => {
    await page.goto('/admin/instances', { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    
    await page.screenshot({
      path: 'screenshots/admin-instance-management.png',
      fullPage: true
    });
    
    console.log('✓ Admin Instance Management screenshot saved to: screenshots/admin-instance-management.png');
  });
});
