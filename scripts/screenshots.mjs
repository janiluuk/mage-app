import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const SCREENSHOTS = resolve(ROOT, 'screenshots');

mkdirSync(SCREENSHOTS, { recursive: true });

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Set auth token if available
  if (AUTH_TOKEN) {
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate((token) => {
      localStorage.setItem('auth_token', token);
    }, AUTH_TOKEN);
  }

  async function shot(name, url) {
    console.log(`  → ${name}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: resolve(SCREENSHOTS, name),
      fullPage: false,
    });
  }

  // Helper: wait for browser grid to render
  async function waitForBrowser() {
    await page.waitForSelector('.video-browser .video-grid', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
  }

  console.log('\nTaking screenshots...\n');

  // ===== BROWSER VIEW =====
  console.log('[Browser View]');

  // 1. Default state — video jobs
  await shot('browser-default.png', `${BASE_URL}/browser`);
  await waitForBrowser();

  // 2. With selected items (select first two cards)
  await page.goto(`${BASE_URL}/browser`, { waitUntil: 'networkidle' }).catch(() => {});
  await waitForBrowser();
  const cards = page.locator('.video-browser .video-item');
  const count = await cards.count();
  if (count >= 2) {
    await cards.nth(0).click({ modifiers: ['Control'] });
    await cards.nth(1).click({ modifiers: ['Control'] });
    await page.waitForTimeout(500);
  }
  await shot('browser-selected.png', `${BASE_URL}/browser`);
  await waitForBrowser();

  // 3. With metadata panel open and selection
  await page.goto(`${BASE_URL}/browser`, { waitUntil: 'networkidle' }).catch(() => {});
  await waitForBrowser();
  const c = page.locator('.video-browser .video-item');
  const cnt = await c.count();
  if (cnt >= 1) {
    await c.nth(2).click();
    await page.waitForTimeout(500);
  }
  // Try clicking the details toggle if panel is collapsed
  const collapsedBtn = page.locator('.video-browser .metadata-panel__collapsed-shell');
  if (await collapsedBtn.isVisible().catch(() => false)) {
    await collapsedBtn.click();
    await page.waitForTimeout(500);
  }
  await shot('browser-metadata.png', `${BASE_URL}/browser`);

  // 4. Files view mode
  await page.goto(`${BASE_URL}/browser`, { waitUntil: 'networkidle' }).catch(() => {});
  await waitForBrowser();
  // Switch to Files view
  const viewSelect = page.locator('.video-browser .select-control[title="Select view mode"]');
  if (await viewSelect.isVisible().catch(() => false)) {
    await viewSelect.selectOption('files');
    await page.waitForTimeout(1000);
  }
  await shot('browser-files.png', `${BASE_URL}/browser`);
  await waitForBrowser();

  // 5. Files grouped by tags
  await page.goto(`${BASE_URL}/browser`, { waitUntil: 'networkidle' }).catch(() => {});
  await waitForBrowser();
  const viewSelect2 = page.locator('.video-browser .select-control[title="Select view mode"]');
  if (await viewSelect2.isVisible().catch(() => false)) {
    await viewSelect2.selectOption('files');
    await page.waitForTimeout(500);
  }
  const groupBtn = page.locator('.video-browser .toggle-button:has(.pi-tag), .video-browser .toggle-button:has(svg)').last();
  // Click the "Group by Tags" button
  const groupBtns = page.locator('.video-browser .toggle-button');
  const btnCount = await groupBtns.count();
  for (let i = 0; i < btnCount; i++) {
    const text = await groupBtns.nth(i).textContent().catch(() => '');
    if (text.includes('Group') || text.includes('Tags')) {
      await groupBtns.nth(i).click();
      await page.waitForTimeout(1000);
      break;
    }
  }
  await shot('browser-grouped.png', `${BASE_URL}/browser`);
  await waitForBrowser();

  // 6. Filter popover open
  await page.goto(`${BASE_URL}/browser`, { waitUntil: 'networkidle' }).catch(() => {});
  await waitForBrowser();
  const filterBtn = page.locator('.video-browser .toggle-button:has(.filters-button-label)');
  if (await filterBtn.isVisible().catch(() => false)) {
    await filterBtn.click();
    await page.waitForTimeout(500);
  }
  await shot('browser-filters.png', `${BASE_URL}/browser`);
  await waitForBrowser();

  // 7. Loading state (simulate)
  await page.goto(`${BASE_URL}/browser`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.evaluate(() => {
    document.querySelector('.video-browser')?.classList.add('simulate-loading');
    const grid = document.querySelector('.video-browser .video-grid');
    if (grid) grid.style.display = 'none';
    const overlay = document.createElement('div');
    overlay.className = 'loading-indicator';
    overlay.innerHTML = '<div class="loading-indicator__spinner"></div><div class="loading-indicator__text">Loading videos...</div>';
    document.querySelector('.video-browser .content-region__viewport')?.prepend(overlay);
  });
  await page.waitForTimeout(500);
  await shot('browser-loading.png', `${BASE_URL}/browser`);

  // 8. Empty state (simulate by navigating to empty data)
  await page.goto(`${BASE_URL}/browser`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.evaluate(() => {
    // Force empty state by clearing the grid
    const grid = document.querySelector('.video-browser .video-grid');
    if (grid) grid.style.display = 'none';
    const viewport = document.querySelector('.video-browser .content-region__viewport');
    if (viewport) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'drop-zone';
      emptyDiv.innerHTML = '<h2>Library is empty</h2><p>Click the refresh button to load your library.</p>';
      viewport.prepend(emptyDiv);
    }
    // Also hide loading
    const loading = document.querySelector('.video-browser .loading-indicator');
    if (loading) loading.remove();
  });
  await page.waitForTimeout(500);
  await shot('browser-empty.png', `${BASE_URL}/browser`);

  await browser.close();
  console.log('\n✓ All screenshots saved to screenshots/');
}

main().catch((err) => {
  console.error('Screenshot script failed:', err);
  process.exit(1);
});
