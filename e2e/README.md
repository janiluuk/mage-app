# End-to-End Tests

This directory contains Playwright end-to-end tests for the Mage AI Studio Frontend.

## Test Files

### login.spec.ts
Tests the login page functionality to ensure it loads correctly.

### screenshots.spec.ts
Automated screenshot capture tests for key application pages:

- **Browser Page Screenshots**
  - Main browser/media library view
  - Browser with filters panel open

- **Video Editor Screenshots**
  - Video editor interface
  - Video editor loading state

- **Additional UI Screenshots**
  - Application dashboard
  - Story creator interface

## Running Tests

### Prerequisites
1. Install dependencies: `npm install`
2. Install Playwright browsers: `npx playwright install chromium`
3. Start the development server: `npm run dev`

### Run All Tests
```bash
npm run test:e2e
```

### Run Specific Test
```bash
npm run test:e2e -- login.spec.ts
npm run test:e2e -- screenshots.spec.ts
```

### Run Tests with UI Mode
```bash
npm run test:e2e:ui
```

## Generated Artifacts

### Screenshots
Screenshot tests generate PNG images in the `/screenshots` directory:
- `browser-page.png`
- `browser-page-with-filters.png`
- `video-editor-page.png`
- `video-editor-loading.png`
- `dashboard.png`
- `story-creator.png`

Screenshots are excluded from git (see `.gitignore`).

### Test Reports
After running tests, an HTML report is generated in `playwright-report/`:
```bash
npx playwright show-report
```

## Configuration

Test configuration is in `playwright.config.ts`:
- Base URL: `http://localhost:8080` (configurable via `PLAYWRIGHT_BASE_URL`)
- Test timeout: 30 seconds
- Screenshots: Only on failure (for debugging)
- Video: Retained on failure

## Notes

### Authentication
Protected routes require authentication. The screenshot tests use a mock JWT token in localStorage to simulate an authenticated state for capturing UI screenshots. When backend API is not available, pages may redirect to login, which is expected behavior in development.

### Development vs Production
These tests are designed to work in development mode with the dev server running. For production testing, update the base URL in the Playwright config.
