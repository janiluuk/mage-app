#!/usr/bin/env node
/**
 * Capture admin/ops screenshots with rich demo data and admin authentication.
 *
 * Usage:
 *   1. Start the app: npm run dev
 *   2. Run: node scripts/screenshot-admin.js
 *
 * To re-seed demo data later, run: node scripts/seed-demo-data.js
 */

const { chromium } = require('playwright');
const path = require('path');
const { execFileSync } = require('child_process');

// Load demo data from seed script
const seedScript = path.join(__dirname, 'seed-demo-data.js');
const seedOutput = execFileSync('node', [seedScript], { encoding: 'utf8' });
const { adminToken: FAKE_JWT, demoData } = JSON.parse(seedOutput);

const SCREENSHOT_DIR = path.join(__dirname, '../docs/screenshots');
const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:8080';

// The API client makes requests directly to the backend port (via apiClient baseURL)
const API_URL = process.env.VITE_API_URL || 'http://localhost:8001';

/**
 * Build mock response map.
 * Keys are the request URLs the browser actually makes.
 * The apiClient baseURL is API_BASE_URL = VITE_API_URL + '/api/v1'
 */
function buildMockResponses() {
  const api = `${API_URL}/api/v1`;
  const d = demoData;
  return {
    // Story endpoints
    [`${api}/stories`]: d.stories || { data: [], meta: { total: 0 } },
    [`${api}/stories/1`]: d.storyDetail || { data: null },
    [`${api}/stories/generate`]: { data: { id: 'batch-1', status: 'processing' } },

    // Instance admin (backend at /api/administration, not /api/v1)
    [`${API_URL}/api/administration/instances/status`]: d.instanceAdminStatus,

    // Tags
    [`${api}/tags`]: d.tags,

    // Categories
    [`${api}/categories`]: d.categories,

    // Roles
    [`${api}/roles`]: d.roles,

    // Video jobs (dashboard)
    [`${api}/video-jobs`]: d.videoJobs,
    [`${api}/videojobs`]: d.videoJobs,

    // Media items (library/browser)
    [`${api}/items`]: d.mediaItems,

    // Film projects
    [`${api}/film-projects`]: d.filmProjects,

    // Presets
    [`${api}/presets`]: d.presets,

    // User profile
    [`${API_URL}/api/auth/me`]: d.userProfile,
    [`${api}/users/me`]: d.userProfile,

    // Login
    [`${API_URL}/api/v2/login`]: {
      accessToken: FAKE_JWT,
      data: { id: 1, name: 'Admin User', email: 'admin@mage.app', role: 'admin' },
    },

    // Register
    [`${API_URL}/api/v2/register`]: { data: { id: 1, name: 'Admin User', email: 'admin@mage.app' } },
  };
}

/**
 * Seed localStorage with auth token before each page screenshot.
 */
async function seedLocalStorage(page) {
  await page.evaluate((token) => {
    localStorage.setItem('auth.accessToken', token);
  }, FAKE_JWT);
}

async function captureScreenshots() {
  console.log('=== mage-app Admin Screenshot Capture ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  // Rebuild mock responses to ensure fresh state
  let MOCK_RESPONSES = buildMockResponses();

  // ---- Intercept and mock API requests ----
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Exact match
    const exactKey = Object.keys(MOCK_RESPONSES).find(k => url === k);
    if (exactKey) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_RESPONSES[exactKey]),
      });
      return;
    }

    // Prefix match (for paginated queries with query params)
    for (const key of Object.keys(MOCK_RESPONSES)) {
      if (url.startsWith(key)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_RESPONSES[key]),
        });
        return;
      }
    }

    // POST/PUT/PATCH — echo back the body
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const body = JSON.parse(await route.request().postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: body, meta: {} }),
        });
      } catch {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: {}, meta: {} }),
        });
      }
      return;
    }

    // DELETE
    if (method === 'DELETE') {
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    // Fallback
    try {
      await route.continue();
    } catch {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    }
  });

  // ---- Intercept missing image assets ----
  await page.route('**/demo/images/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
    });
  });

  // ---- First, seed and capture login page ----
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await seedLocalStorage(page);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '01-login-page.png'),
    fullPage: true,
  });
  console.log('  01-login-page: saved');

  // ---- Capture all main pages ----
  const PAGES = [
    { path: '/admin/instances',        name: '10-admin-instances' },
    { path: '/admin/video-processing', name: '11-admin-video-processing' },
    { path: '/admin/tags',             name: '12-admin-tags' },
    { path: '/admin/roles',            name: '17-admin-roles' },
    { path: '/admin/categories',       name: '18-admin-categories' },
    { path: '/',                       name: '02-dashboard' },
    { path: '/library',                name: '03-library' },
    { path: '/browser',                name: '04-browser' },
    { path: '/upload',                 name: '05-upload' },
    { path: '/projects',               name: '06-film-projects' },
    { path: '/story',                  name: '07-story-creator' },
    { path: '/stories',                name: '19-story-browser' },
    { path: '/soundscape',             name: '08-soundscape-creator' },
    { path: '/profile',                name: '09-profile' },
    { path: '/presets',                name: '13-preset-library' },
    { path: '/pages/timeline',         name: '14-timeline' },
    { path: '/mage',                   name: '15-mage-helper' },
    { path: '/audio-visualizer',       name: '16-audio-visualizer' },
  ];

  for (const { path: pagePath, name } of PAGES) {
    const url = `${BASE_URL}${pagePath}`;
    const dest = path.join(SCREENSHOT_DIR, `${name}.png`);

    try {
      // Re-seed before each navigation to ensure token is present
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await seedLocalStorage(page);

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2500);

      const finalUrl = page.url();
      if (finalUrl.includes('/login')) {
        console.log(`  ${name}: skipped (redirected to login)`);
        continue;
      }

      await page.screenshot({ path: dest, fullPage: true });
      console.log(`  ${name}: saved`);
      await page.waitForTimeout(500);
    } catch (err) {
      console.log(`  ${name}: error - ${err.message}`);
    }
  }

  // ---- Detailed admin instance screenshots ----
  console.log('\n  -- Admin instance detail screenshots --');
  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await seedLocalStorage(page);
    await page.goto(`${BASE_URL}/admin/instances`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2500);

    // Full page overview
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'admin-instance-overview.png'),
      fullPage: true,
    });
    console.log('  admin-instance-overview: saved');

    // --- Metrics Dialog ---
    const viewHistoryBtns = page.locator('[data-testid="view-history-button"]');
    if (await viewHistoryBtns.count() > 0) {
      await viewHistoryBtns.first().click();
      await page.waitForTimeout(2000);
      const dialog = page.locator('.p-dialog');
      if (await dialog.count() > 0) {
        await dialog.first().screenshot({
          path: path.join(SCREENSHOT_DIR, 'admin-metrics-dialog.png'),
        });
        console.log('  admin-metrics-dialog: saved');
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // --- Job History Dialog ---
    const viewJobsBtns = page.locator('[data-testid="view-jobs-button"]');
    if (await viewJobsBtns.count() > 0) {
      await viewJobsBtns.first().click();
      await page.waitForTimeout(2000);
      const jobDialog = page.locator('.p-dialog');
      if (await jobDialog.count() > 0) {
        await jobDialog.first().screenshot({
          path: path.join(SCREENSHOT_DIR, 'admin-job-history.png'),
        });
        console.log('  admin-job-history: saved');
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // --- Add Instance Dialog ---
    const addBtn = page.locator('button:has-text("Add Instance")');
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(1500);
      const addDialog = page.locator('.p-dialog');
      if (await addDialog.count() > 0) {
        await addDialog.first().screenshot({
          path: path.join(SCREENSHOT_DIR, 'admin-add-instance-dialog.png'),
        });
        console.log('  admin-add-instance-dialog: saved');
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // --- Edit Instance Dialog ---
    const editBtns = page.locator('[data-testid="edit-instance-button"]');
    if (await editBtns.count() > 0) {
      await editBtns.first().click();
      await page.waitForTimeout(1500);
      const editDialog = page.locator('.p-dialog');
      if (await editDialog.count() > 0) {
        await editDialog.first().screenshot({
          path: path.join(SCREENSHOT_DIR, 'admin-edit-instance-dialog.png'),
        });
        console.log('  admin-edit-instance-dialog: saved');
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // --- Instance Card close-up ---
    const card = page.locator('.card').first();
    if (await card.count() > 0) {
      await card.screenshot({
        path: path.join(SCREENSHOT_DIR, 'admin-instance-card.png'),
      });
      console.log('  admin-instance-card: saved');
    }

    // --- FFMpeg Worker Status Section ---
    const ffmpegSection = page.locator('h6:has-text("FFmpeg")');
    if (await ffmpegSection.count() > 0) {
      const sectionCard = ffmpegSection.locator('..').locator('..');
      await sectionCard.screenshot({
        path: path.join(SCREENSHOT_DIR, 'admin-ffmpeg-status.png'),
      });
      console.log('  admin-ffmpeg-status: saved');
    }
  } catch (err) {
    console.log(`  Admin detail screenshots error: ${err.message}`);
  }

  await browser.close();
  console.log(`\nScreenshots saved to ${SCREENSHOT_DIR}`);
}

captureScreenshots().catch((err) => {
  console.error(err);
  process.exit(1);
});
