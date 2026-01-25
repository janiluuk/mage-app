import { expect, test } from '@playwright/test';

/**
 * Screenshot tests for all application pages
 * These tests capture visual snapshots of key application pages including
 * user pages, admin pages, and main features with mock data
 */

// Mock data for screenshots
const mockVideos = [
  {
    id: 1,
    filename: 'mountain_sunset.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://via.placeholder.com/320x180/4A90E2/ffffff?text=Mountain+Sunset',
    duration: 15.5,
    width: 1920,
    height: 1080,
    size: 5242880,
    created_at: '2024-01-20T10:30:00Z',
    tags: ['nature', 'landscape']
  },
  {
    id: 2,
    filename: 'ocean_waves.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail: 'https://via.placeholder.com/320x180/50C878/ffffff?text=Ocean+Waves',
    duration: 22.3,
    width: 1920,
    height: 1080,
    size: 8388608,
    created_at: '2024-01-19T14:20:00Z',
    tags: ['nature', 'water']
  },
  {
    id: 3,
    filename: 'city_timelapse.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    thumbnail: 'https://via.placeholder.com/320x180/FF6347/ffffff?text=City+Timelapse',
    duration: 30.0,
    width: 3840,
    height: 2160,
    size: 15728640,
    created_at: '2024-01-18T09:15:00Z',
    tags: ['urban', 'timelapse']
  }
];

const mockJobs = [
  {
    id: 1,
    status: 'completed',
    type: 'vid2vid',
    filename: 'processed_mountain.mp4',
    progress: 100,
    created_at: '2024-01-20T12:00:00Z'
  },
  {
    id: 2,
    status: 'processing',
    type: 'deforum',
    filename: 'animation_ocean.mp4',
    progress: 65,
    created_at: '2024-01-20T13:30:00Z'
  }
];

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  credits: 150,
  role: 'admin'
};

// Mock authentication state and API responses for all pages
test.beforeEach(async ({ page }) => {
  // Set localStorage to simulate authenticated state
  await page.addInitScript(() => {
    // Mock JWT token with far-future expiration for screenshot purposes
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiYWRtaW4ifQ.dummySignatureForScreenshotTestingOnly';
    localStorage.setItem('auth.accessToken', mockToken);
  });

  // Mock API responses to show actual content
  await page.route('**/api/**', (route) => {
    const url = route.request().url();
    
    // Mock files/videos endpoint
    if (url.includes('/files') || url.includes('/videos')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockVideos, total: mockVideos.length })
      });
    }
    // Mock jobs endpoint
    else if (url.includes('/jobs') || url.includes('/video-jobs')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockJobs, total: mockJobs.length })
      });
    }
    // Mock user/profile endpoint
    else if (url.includes('/user') || url.includes('/profile')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockUser })
      });
    }
    // Mock tags endpoint
    else if (url.includes('/tags')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [
          { id: 1, name: 'nature', files_count: 2 },
          { id: 2, name: 'urban', files_count: 1 },
          { id: 3, name: 'timelapse', files_count: 1 }
        ]})
      });
    }
    // Default: continue with request
    else {
      route.continue();
    }
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
    
    // Wait for content to appear (video grid or thumbnails)
    await Promise.race([
      page.waitForSelector('.video-grid img', { timeout: 5000 }).catch(() => null),
      page.waitForSelector('.video-thumbnail', { timeout: 5000 }).catch(() => null),
      page.waitForSelector('.content-region', { timeout: 5000 }).catch(() => null),
    ]);
    
    // Additional wait for images to load
    await page.waitForTimeout(2000);
    
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
    
    // Wait for content to appear
    await Promise.race([
      page.waitForSelector('.video-grid img', { timeout: 5000 }).catch(() => null),
      page.waitForSelector('.video-thumbnail', { timeout: 5000 }).catch(() => null),
      page.waitForSelector('.content-region', { timeout: 5000 }).catch(() => null),
    ]);
    
    // Additional wait for content to render
    await page.waitForTimeout(2000);
    
    // Try to open filters if the button exists
    try {
      const filtersButton = page.locator('[aria-label*="filter" i], button:has-text("Filter")').first();
      if (await filtersButton.isVisible({ timeout: 2000 })) {
        await filtersButton.click();
        // Wait for filters panel animation to complete
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
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
    // Give page time to render content or empty states
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
    await page.goto('/', { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    // Give page time to render content with mock data
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: 'screenshots/dashboard.png',
      fullPage: true
    });
    
    console.log('✓ Dashboard screenshot saved to: screenshots/dashboard.png');
  });
  
  test('capture story creator screenshot', async ({ page }) => {
    await page.goto('/story', { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    // Give page time to render content
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: 'screenshots/story-creator.png',
      fullPage: true
    });
    
    console.log('✓ Story Creator screenshot saved to: screenshots/story-creator.png');
  });

  test('capture soundscape creator screenshot', async ({ page }) => {
    await page.goto('/soundscape', { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    // Give page time to render content
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: 'screenshots/soundscape-creator.png',
      fullPage: true
    });
    
    console.log('✓ Soundscape Creator screenshot saved to: screenshots/soundscape-creator.png');
  });

  test('capture frontpage screenshot', async ({ page }) => {
    await page.goto('/frontpage', { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    // Give page time to render content
    await page.waitForTimeout(2000);
    
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
    // Give page time to render user data
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: 'screenshots/user-profile.png',
      fullPage: true
    });
    
    console.log('✓ User Profile screenshot saved to: screenshots/user-profile.png');
  });

  test('capture library screenshot', async ({ page }) => {
    await page.goto('/library', { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    // Give page time to render library content
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: 'screenshots/library.png',
      fullPage: true
    });
    
    console.log('✓ Library screenshot saved to: screenshots/library.png');
  });

  test('capture stories browser screenshot', async ({ page }) => {
    await page.goto('/stories', { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    // Give page time to render stories
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: 'screenshots/stories-browser.png',
      fullPage: true
    });
    
    console.log('✓ Stories Browser screenshot saved to: screenshots/stories-browser.png');
  });

  test('capture upload page screenshot', async ({ page }) => {
    await page.goto('/upload', { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    // Give page time to render upload interface
    await page.waitForTimeout(2000);
    
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
    // Give page time to render admin content
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: 'screenshots/admin-video-processing.png',
      fullPage: true
    });
    
    console.log('✓ Admin Video Processing screenshot saved to: screenshots/admin-video-processing.png');
  });

  test('capture instance management admin page screenshot', async ({ page }) => {
    await page.goto('/admin/instances', { waitUntil: 'networkidle' });
    
    await page.waitForLoadState('domcontentloaded');
    // Give page time to render admin content
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: 'screenshots/admin-instance-management.png',
      fullPage: true
    });
    
    console.log('✓ Admin Instance Management screenshot saved to: screenshots/admin-instance-management.png');
  });
});
