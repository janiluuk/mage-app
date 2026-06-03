#!/bin/bash
# Screenshot script for Mage App Browser View
#
# Prerequisites:
#   1. Docker and Docker Compose installed
#   2. Node.js 18+ installed
#   3. Playwright installed: npx playwright install chromium
#
# Usage:
#   ./scripts/take-screenshots.sh
#
# This script:
#   1. Generates fresh demo data
#   2. Builds and starts the stack
#   3. Takes screenshots of all browser states
#   4. Stops the stack

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SCREENSHOTS_DIR="${ROOT_DIR}/screenshots"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.yml"
STACK_FILE="${ROOT_DIR}/docker-compose.stack.yml"

echo "=========================================="
echo " Mage App - Screenshot Capture"
echo "=========================================="

# Step 1: Regenerate demo data
echo ""
echo "[1/4] Generating demo data..."
cd "${ROOT_DIR}"
node -e "
const { generateDemoData } = require('./src/browser/demo/demoData.js');
const fs = require('fs');
const data = generateDemoData();
fs.writeFileSync('demo-data.json', JSON.stringify(data, null, 2));
console.log('  ✓ Generated ' + data.jobs.length + ' jobs and ' + data.files.length + ' files');
"

# Step 2: Kill any running containers from this project
echo ""
echo "[2/4] Stopping existing containers..."
docker compose -f "${COMPOSE_FILE}" down --remove-orphans 2>/dev/null || true
sleep 2

# Step 3: Start the stack
echo ""
echo "[3/4] Starting the stack..."
docker compose -f "${COMPOSE_FILE}" up -d
echo "  Waiting for services to be ready..."
sleep 10

# Check if frontend is up
MAX_RETRIES=30
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>/dev/null | grep -q "200\|302\|304"; then
    echo "  ✓ Frontend is ready!"
    break
  fi
  RETRY=$((RETRY + 1))
  sleep 2
done

if [ $RETRY -eq $MAX_RETRIES ]; then
  echo "  ⚠ Frontend did not become ready in time, continuing anyway..."
fi

# Step 4: Take screenshots
echo ""
echo "[4/4] Taking screenshots..."

# Run the Playwright screenshot script
cd "${ROOT_DIR}"
npx playwright install chromium 2>/dev/null || true

# First, create a simple demo data page for the browser
node -e "
const { generateDemoData } = require('./src/browser/demo/demoData.js');
const fs = require('fs');
const data = generateDemoData();

// Save the demo data as a JSON file that is served
fs.writeFileSync('public/demo-data.json', JSON.stringify(data, null, 2));
console.log('  ✓ Demo data written to public/demo-data.json');
"

# Run the screenshot script
node scripts/screenshots.mjs 2>&1 || {
  echo "  ⚠ Screenshot script failed, trying alternative approach..."
  # Fallback: use a simpler Puppeteer approach
  node -e "
  const { chromium } = require('playwright');
  (async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    
    const shots = [
      ['browser-before.png', '/browser?demo'],
    ];
    
    for (const [name, url] of shots) {
      console.log('  → ' + name);
      await page.goto('http://localhost:8080' + url, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => console.log('    error: ' + e.message));
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: 'screenshots/' + name, fullPage: false });
    }
    
    await browser.close();
    console.log('  ✓ Done');
  })();
  "
}

echo ""
echo "=========================================="
echo " Screenshots saved to: ${SCREENSHOTS_DIR}/"
echo "=========================================="
ls -la "${SCREENSHOTS_DIR}"/browser-*.png 2>/dev/null || echo "  No screenshots found"
