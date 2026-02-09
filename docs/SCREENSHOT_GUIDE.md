# Screenshot Capture Guide

This guide helps you capture screenshots of the Instance Management admin panel features.

## Prerequisites

1. **Start the application**:
   ```bash
   cd mage-app
   npm run dev
   ```

2. **Start the API** (if not already running):
   ```bash
   cd mage-api
   docker compose up -d
   ```

3. **Ensure you have test data**:
   - At least one generator instance configured
   - Some job history (optional, for job history screenshots)

## Screenshots to Capture

### 1. Summary Statistics
**File**: `docs/screenshots/summary-stats.png`
- Navigate to: `/administration/instances`
- Capture: The top section showing 4 summary cards (Total Instances, Online, Total Queue, Processing)

### 2. Instance Cards
**File**: `docs/screenshots/instance-cards.png`
- Navigate to: `/administration/instances`
- Capture: The instance cards section showing one or more instances with their metrics

### 3. Instance Actions
**File**: `docs/screenshots/instance-actions.png`
- Navigate to: `/administration/instances`
- Capture: A close-up of a single instance card showing all action buttons

### 4. Add Instance Dialog
**File**: `docs/screenshots/add-instance-dialog.png`
- Navigate to: `/administration/instances`
- Click: "Add Instance" button
- Capture: The dialog form with all fields visible

### 5. Metrics Chart
**File**: `docs/screenshots/metrics-chart.png`
- Navigate to: `/administration/instances`
- Click: "View Metrics History" button (📊) on any instance
- Capture: The metrics chart dialog showing GPU/CPU/Memory charts

### 6. Job History
**File**: `docs/screenshots/job-history.png`
- Navigate to: `/administration/instances`
- Click: "View Job History" button (📋) on any instance
- Capture: The job history table dialog

### 7. FFMpeg Status
**File**: `docs/screenshots/ffmpeg-status.png`
- Navigate to: `/administration/instances`
- Scroll to: Bottom section
- Capture: The FFMpeg Worker Status section

## Using Browser Developer Tools

### Chrome/Edge
1. Open DevTools (F12)
2. Use Device Toolbar (Ctrl+Shift+M) to set viewport size
3. Recommended size: 1920x1080 or 1440x900
4. Take screenshot: 
   - Right-click → "Capture node screenshot" (for specific elements)
   - Or use full page screenshot extension

### Firefox
1. Open DevTools (F12)
2. Use Responsive Design Mode (Ctrl+Shift+M)
3. Set viewport to 1920x1080
4. Use screenshot tool in DevTools

## Automated Screenshot Script

You can use this script to automate screenshot capture:

```bash
#!/bin/bash
# scripts/capture-screenshots.sh

# Start app if not running
if ! curl -s http://localhost:8080 > /dev/null; then
    echo "Starting app..."
    npm run dev &
    sleep 5
fi

# Use Playwright or Puppeteer to capture screenshots
# Example with Playwright:
npx playwright install chromium
npx playwright codegen http://localhost:8080/administration/instances
```

## Screenshot Specifications

- **Format**: PNG
- **Resolution**: Minimum 1920x1080 (or higher)
- **File Size**: Optimize to < 500KB if possible
- **Naming**: Use kebab-case (e.g., `summary-stats.png`)

## Tips for Better Screenshots

1. **Use Real Data**: Ensure you have actual instances with metrics data
2. **Clean UI**: Close any unnecessary dialogs or notifications
3. **Consistent Theme**: Use the same theme (light/dark) for all screenshots
4. **Highlight Features**: Use browser annotations if needed to highlight key features
5. **Multiple States**: Consider capturing:
   - Empty state (no instances)
   - Loading state
   - Error state
   - Success state with data

## Alternative: Using Playwright

Create a Playwright script for automated screenshots:

```javascript
// scripts/screenshot-admin-panel.js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  // Navigate and login (if needed)
  await page.goto('http://localhost:8080/administration/instances');
  
  // Wait for content
  await page.waitForSelector('.card');
  
  // Take screenshots
  await page.screenshot({ path: 'docs/screenshots/summary-stats.png', fullPage: true });
  
  // Click add instance
  await page.click('button:has-text("Add Instance")');
  await page.waitForSelector('input[placeholder*="Name"]');
  await page.screenshot({ path: 'docs/screenshots/add-instance-dialog.png' });
  
  await browser.close();
})();
```

Run with:
```bash
node scripts/screenshot-admin-panel.js
```

## After Capturing

1. **Review screenshots**: Ensure they're clear and show the features
2. **Optimize**: Use tools like `pngquant` or `optipng` to reduce file size
3. **Update user guide**: Ensure screenshot references in the user guide match the files
4. **Commit**: Add screenshots to git (they're documentation)

## Quick Reference

```bash
# Navigate to admin panel
http://localhost:8080/administration/instances

# Key elements to capture:
- Summary statistics (4 cards at top)
- Instance cards with metrics
- Action buttons on cards
- Add/Edit instance dialogs
- Metrics chart dialog
- Job history dialog
- FFMpeg status section
```


