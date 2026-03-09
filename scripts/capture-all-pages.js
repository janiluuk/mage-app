#!/usr/bin/env node
/**
 * Capture screenshots of all mage-app pages.
 *
 * Usage:
 *   1. Start the app: npm run dev
 *   2. Run: node scripts/capture-all-pages.js
 *
 * Optional: set LOGIN_EMAIL and LOGIN_PASSWORD to capture auth-required pages.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '../docs/screenshots');
const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:8080';
const LOGIN_EMAIL = process.env.LOGIN_EMAIL;
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD;

const ALL_PAGES = [
  { path: '/login', name: '01-login-page' },
  { path: '/', name: '02-dashboard' },
  { path: '/library', name: '03-library' },
  { path: '/browser', name: '04-browser' },
  { path: '/upload', name: '05-upload' },
  { path: '/projects', name: '06-film-projects' },
  { path: '/story', name: '07-story-creator' },
  { path: '/soundscape', name: '08-soundscape-creator' },
  { path: '/profile', name: '09-profile' },
  { path: '/admin/instances', name: '10-admin-instances' },
  { path: '/admin/video-processing', name: '11-admin-video-processing' },
  { path: '/admin/tags', name: '12-admin-tags' },
  { path: '/presets', name: '13-preset-library' },
  { path: '/pages/timeline', name: '14-timeline' },
  { path: '/mage', name: '15-mage-helper' },
  { path: '/audio-visualizer', name: '16-audio-visualizer' },
  { path: '/admin/roles', name: '17-admin-roles' },
  { path: '/admin/categories', name: '18-admin-categories' },
  { path: '/stories', name: '19-story-browser' },
];

const START = parseInt(process.env.START || '0', 10);
const END = parseInt(process.env.END || String(ALL_PAGES.length), 10);
const PAGES = ALL_PAGES.slice(START, END);

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function login(page) {
  if (!LOGIN_EMAIL || !LOGIN_PASSWORD) return false;
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email1', LOGIN_EMAIL);
  await page.fill('#password1', LOGIN_PASSWORD);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/^\/(?!login)/, { timeout: 10000 }).catch(() => null);
  return !page.url().includes('/login');
}

async function captureAll() {
  console.log('Screenshot capture for mage-app');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output: ${SCREENSHOT_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  let loggedIn = false;
  if (LOGIN_EMAIL && LOGIN_PASSWORD) {
    console.log('Logging in...');
    loggedIn = await login(page);
    console.log(loggedIn ? 'Logged in successfully\n' : 'Login failed, capturing public pages only\n');
  }

  for (const { path: pagePath, name } of PAGES) {
    const url = `${BASE_URL}${pagePath}`;
    const dest = path.join(SCREENSHOT_DIR, `${name}.png`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const finalUrl = page.url();
      if (finalUrl.includes('/login') && pagePath !== '/login') {
        console.log(`  ${name}: skipped (auth required)`);
        await page.waitForTimeout(500);
        continue;
      }
      await page.waitForTimeout(1500);
      try {
        await page.screenshot({ path: dest, fullPage: true });
        console.log(`  ${name}: saved`);
      } catch (shotErr) {
        await page.screenshot({ path: dest, fullPage: false });
        console.log(`  ${name}: saved (viewport only)`);
      }
      await page.waitForTimeout(1000);
    } catch (err) {
      console.log(`  ${name}: error - ${err.message}`);
    }
  }

  await browser.close();
  console.log(`\nScreenshots saved to ${SCREENSHOT_DIR}`);
}

captureAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
