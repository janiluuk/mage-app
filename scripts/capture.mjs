import { chromium } from 'playwright';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const SCREENSHOTS = resolve(ROOT, 'screenshots');
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const DEMO_URL = `${BASE_URL}/browser?demo`;

const FAKE_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwic3ViIjoiMSIsImVtYWlsIjoiZGVtb0BtYWdlLmFwcCIsIm5hbWUiOiJEZW1vIFVzZXIifQ.fake';

async function shot(page, name) {
  console.log(`  → ${name}`);
  await page.screenshot({ path: resolve(SCREENSHOTS, name), fullPage: false });
}

async function loadBrowser(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.evaluate((token) => {
    localStorage.setItem('auth.accessToken', token);
  }, FAKE_TOKEN);
  await page.goto(DEMO_URL, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(5000);
}

// Switch Browser view mode via Vue component internals
async function setBrowserViewMode(page, mode) {
  await page.evaluate((m) => {
    const walk = (vnode) => {
      if (!vnode) return false;
      if (vnode.component) {
        const s = vnode.component.setupState;
        if (s && s.viewMode !== undefined) {
          s.viewMode.value = m;
          const handler = s.handleViewModeChange;
          if (typeof handler === 'function') handler(m);
          return true;
        }
        if (vnode.component.subTree && walk(vnode.component.subTree)) return true;
      }
      const children = vnode.children || vnode.dynamicChildren;
      if (children && Array.isArray(children)) {
        for (const c of children) if (walk(c)) return true;
      }
      return false;
    };
    walk(document.getElementById('app')._vnode);
  }, mode);
  await page.waitForTimeout(3000);
}

// Toggle grouped-by-tags via Vue component internals
async function toggleBrowserGroupedByTags(page) {
  await page.evaluate(() => {
    const walk = (vnode) => {
      if (!vnode) return false;
      if (vnode.component) {
        const s = vnode.component.setupState;
        if (s && s.viewGroupedByTags !== undefined) {
          s.viewGroupedByTags.value = true;
          const toggle = s.toggleGroupedByTags;
          if (typeof toggle === 'function') toggle();
          return true;
        }
        if (vnode.component.subTree && walk(vnode.component.subTree)) return true;
      }
      const children = vnode.children || vnode.dynamicChildren;
      if (children && Array.isArray(children)) {
        for (const c of children) if (walk(c)) return true;
      }
      return false;
    };
    walk(document.getElementById('app')._vnode);
  });
  await page.waitForTimeout(3000);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Intercept only the health check HEAD request so the AppLayout passes
  await page.route(url => {
    const u = typeof url === 'string' ? url : url.toString();
    return u.includes('/api/v1') && !u.includes('/api/v1/video-jobs') && !u.includes('/api/v1/model-files');
  }, async route => {
    await route.fulfill({ status: 200, contentType: 'application/vnd.api+json', body: '{"data":[]}' });
  });

  // ===================================================================
  // 1. Default state — video jobs grid
  // ===================================================================
  console.log('\n[Browser] 1. Default state');
  await loadBrowser(page);
  const items = page.locator('.video-item');
  const count = await items.count().catch(() => 0);
  console.log(`  found ${count} video items`);
  await shot(page, 'browser-before.png');

  // ===================================================================
  // 2. Selected items
  // ===================================================================
  console.log('[Browser] 2. Selected items');
  await loadBrowser(page);
  const items2 = page.locator('.video-item');
  const c2 = await items2.count().catch(() => 0);
  if (c2 >= 2) {
    await items2.nth(0).click();
    await page.waitForTimeout(200);
    await items2.nth(1).click({ modifiers: ['Control'] });
    await page.waitForTimeout(500);
  }
  await shot(page, 'browser-after.png');

  // ===================================================================
  // 3. Metadata panel with selection
  // ===================================================================
  console.log('[Browser] 3. Metadata panel');
  await loadBrowser(page);
  const items3 = page.locator('.video-item');
  if ((await items3.count()) > 0) {
    await items3.first().click();
    await page.waitForTimeout(500);
  }
  const collapsed = page.locator('.metadata-panel__collapsed-shell');
  if (await collapsed.isVisible().catch(() => false)) {
    await collapsed.click();
    await page.waitForTimeout(800);
  }
  await shot(page, 'browser-error.png');

  // ===================================================================
  // 4. Files view
  // ===================================================================
  console.log('[Browser] 4. Files view');
  await loadBrowser(page);
  await setBrowserViewMode(page, 'files');
  await shot(page, 'browser-empty.png');

  // ===================================================================
  // 5. Filters popover
  // ===================================================================
  console.log('[Browser] 5. Filters popover');
  await loadBrowser(page);
  const filterBtn = page.locator('button:has(.filters-button-label)');
  if (await filterBtn.isVisible().catch(() => false)) {
    await filterBtn.click();
    await page.waitForTimeout(500);
  }
  await shot(page, 'browser-filters.png');

  // ===================================================================
  // 6. Loading state
  // ===================================================================
  console.log('[Browser] 6. Loading state');
  await loadBrowser(page);
  await page.evaluate(() => {
    const viewport = document.querySelector('.content-region__viewport');
    if (viewport) {
      const grid = viewport.querySelector('.video-grid');
      if (grid) grid.style.display = 'none';
      const indicator = document.createElement('div');
      indicator.className = 'loading-indicator';
      indicator.innerHTML = '<div class="loading-indicator__spinner"></div><div class="loading-indicator__text">Loading videos...</div>';
      viewport.prepend(indicator);
    }
  });
  await page.waitForTimeout(500);
  await shot(page, 'browser-loading.png');

  // ===================================================================
  // 7. Grouped by tags
  // ===================================================================
  console.log('[Browser] 7. Grouped by tags');
  await loadBrowser(page);
  await setBrowserViewMode(page, 'files');
  await toggleBrowserGroupedByTags(page);
  await shot(page, 'browser-grouped.png');

  await browser.close();
  console.log('\n✓ All screenshots captured');
}

main().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
