#!/usr/bin/env node
/**
 * Automated screenshot capture script for Admin Panel
 * 
 * Usage:
 *   1. Start the app: npm run dev
 *   2. Run this script: node scripts/capture-screenshots.js
 * 
 * Requires: playwright (install with: npm install -D playwright)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '../docs/screenshots');
const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:8080';
const ADMIN_URL = `${BASE_URL}/administration/instances`;

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function captureScreenshots() {
  console.log('🚀 Starting screenshot capture...');
  console.log(`📸 Target URL: ${ADMIN_URL}`);
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    // Navigate to admin panel
    console.log('📍 Navigating to admin panel...');
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
    
    // Wait for main content
    await page.waitForSelector('.card', { timeout: 10000 });
    console.log('✅ Page loaded');

    // 1. Summary Statistics
    console.log('📸 Capturing summary statistics...');
    const summarySection = await page.locator('.grid.mb-4').first();
    if (await summarySection.count() > 0) {
      await summarySection.screenshot({ 
        path: path.join(SCREENSHOT_DIR, 'summary-stats.png') 
      });
      console.log('✅ Saved: summary-stats.png');
    }

    // 2. Instance Cards
    console.log('📸 Capturing instance cards...');
    await page.waitForSelector('[data-testid="instance-card"], .card', { timeout: 5000 });
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'instance-cards.png'),
      fullPage: true 
    });
    console.log('✅ Saved: instance-cards.png');

    // 3. Instance Actions (close-up of one card)
    console.log('📸 Capturing instance actions...');
    const firstCard = page.locator('.card').nth(1); // Skip the main card
    if (await firstCard.count() > 0) {
      await firstCard.screenshot({ 
        path: path.join(SCREENSHOT_DIR, 'instance-actions.png') 
      });
      console.log('✅ Saved: instance-actions.png');
    }

    // 4. Add Instance Dialog
    console.log('📸 Capturing add instance dialog...');
    try {
      await page.click('button:has-text("Add Instance")');
      await page.waitForSelector('input[type="text"]', { timeout: 3000 });
      await page.waitForTimeout(500); // Wait for animation
      const dialog = page.locator('.p-dialog');
      if (await dialog.count() > 0) {
        await dialog.screenshot({ 
          path: path.join(SCREENSHOT_DIR, 'add-instance-dialog.png') 
        });
        console.log('✅ Saved: add-instance-dialog.png');
      }
      // Close dialog
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } catch (e) {
      console.log('⚠️  Could not capture add instance dialog:', e.message);
    }

    // 5. Metrics Chart (if available)
    console.log('📸 Capturing metrics chart...');
    try {
      const metricsButton = page.locator('button:has-text("View Metrics"), button[aria-label*="metrics"]').first();
      if (await metricsButton.count() > 0) {
        await metricsButton.click();
        await page.waitForSelector('canvas, .p-dialog', { timeout: 3000 });
        await page.waitForTimeout(1000); // Wait for chart to render
        const metricsDialog = page.locator('.p-dialog');
        if (await metricsDialog.count() > 0) {
          await metricsDialog.screenshot({ 
            path: path.join(SCREENSHOT_DIR, 'metrics-chart.png') 
          });
          console.log('✅ Saved: metrics-chart.png');
        }
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    } catch (e) {
      console.log('⚠️  Could not capture metrics chart:', e.message);
    }

    // 6. Job History (if available)
    console.log('📸 Capturing job history...');
    try {
      const jobButton = page.locator('button:has-text("View Job History"), button[aria-label*="job"]').first();
      if (await jobButton.count() > 0) {
        await jobButton.click();
        await page.waitForSelector('.p-datatable, .p-dialog', { timeout: 3000 });
        await page.waitForTimeout(1000);
        const jobDialog = page.locator('.p-dialog');
        if (await jobDialog.count() > 0) {
          await jobDialog.screenshot({ 
            path: path.join(SCREENSHOT_DIR, 'job-history.png') 
          });
          console.log('✅ Saved: job-history.png');
        }
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    } catch (e) {
      console.log('⚠️  Could not capture job history:', e.message);
    }

    // 7. FFMpeg Status
    console.log('📸 Capturing FFMpeg status...');
    try {
      // Scroll to bottom to find FFMpeg section
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      const ffmpegSection = page.locator('text=FFMpeg, text=Encoding').first();
      if (await ffmpegSection.count() > 0) {
        const section = ffmpegSection.locator('..').locator('..');
        await section.screenshot({ 
          path: path.join(SCREENSHOT_DIR, 'ffmpeg-status.png') 
        });
        console.log('✅ Saved: ffmpeg-status.png');
      }
    } catch (e) {
      console.log('⚠️  Could not capture FFMpeg status:', e.message);
    }

    console.log('\n✨ Screenshot capture complete!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}`);

  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Check if Playwright is available
try {
  require('playwright');
  captureScreenshots().catch(console.error);
} catch (e) {
  console.error('❌ Playwright not found. Install it with:');
  console.error('   npm install -D playwright');
  console.error('   npx playwright install chromium');
  process.exit(1);
}


