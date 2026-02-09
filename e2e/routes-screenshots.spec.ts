import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const baseUrl =
  process.env.SCREENSHOT_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'http://localhost:8080';
const apiBase = process.env.SCREENSHOT_API_BASE_URL || 'http://localhost/api';
const screenshotRoot =
  process.env.SCREENSHOT_DIR ||
  path.resolve(__dirname, '..', 'screenshots', 'routes');

type RoutePaths = {
  projectId?: string;
  sequenceId?: string;
  shotId?: string;
  videoJobId?: string;
  storyId?: string;
  userId?: string;
};

const routeFiles = [
  path.resolve(__dirname, '..', 'src', 'router', 'index.js'),
  path.resolve(__dirname, '..', 'src', 'router', 'routes.js'),
];

function collectRoutes(): string[] {
  const paths = new Set<string>();

  for (const file of routeFiles) {
    const contents = fs.readFileSync(file, 'utf-8');
    const regex = /path:\s*['"`]([^'"`]+)['"`]/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(contents))) {
      const routePath = match[1];
      if (!routePath || routePath.includes(':pathMatch')) {
        continue;
      }
      paths.add(routePath);
    }
  }

  return Array.from(paths)
    .map((routePath) => (routePath.startsWith('/') ? routePath : `/${routePath}`))
    .filter((routePath) => routePath !== '/*')
    .sort();
}

function resolveDynamicPath(routePath: string, replacements: RoutePaths): string {
  if (routePath.includes('/projects/:id') && replacements.projectId) {
    return routePath.replace(':id', replacements.projectId);
  }

  return routePath.replace(/:([A-Za-z0-9_]+)/g, (match, key) => {
    switch (key) {
      case 'projectId':
        return replacements.projectId || '1';
      case 'sequenceId':
        return replacements.sequenceId || '1';
      case 'shotId':
        return replacements.shotId || '1';
      case 'id':
        return replacements.projectId || replacements.videoJobId || replacements.userId || '1';
      case 'type':
        return 'file';
      case 'storyId':
        return replacements.storyId || '1';
      default:
        return '1';
    }
  });
}

function sanitizeFilename(routePath: string): string {
  return routePath
    .replace(/\//g, '__')
    .replace(/:/g, '_')
    .replace(/\*/g, 'wildcard')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/^__/, '')
    .replace(/__$/, '') || 'root';
}

async function login(request: any, email: string, password: string): Promise<string> {
  const response = await request.post(`${apiBase}/auth/login`, {
    data: { email, password },
  });
  const payload = await response.json();
  return (
    payload?.data?.accessToken ||
    payload?.accessToken ||
    payload?.token ||
    payload?.data?.token ||
    ''
  );
}

async function registerUser(request: any, email: string, password: string): Promise<void> {
  await request.post(`${apiBase}/auth/register`, {
    data: {
      email,
      password,
      password_confirmation: password,
      license: true,
    },
  });
}

async function createFilmProject(request: any, token: string) {
  const response = await request.post(`${apiBase}/film-projects`, {
    data: {
      name: 'Screenshot Project',
      description: 'Project created for screenshots',
      status: 'draft',
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json();
  return payload?.data || payload;
}

async function createSequence(request: any, token: string, projectId: string) {
  const response = await request.post(`${apiBase}/film-projects/${projectId}/sequences`, {
    data: {
      name: 'Sequence 1',
      description: 'Sequence created for screenshots',
      order: 1,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json();
  return payload?.data || payload;
}

async function createShot(
  request: any,
  token: string,
  projectId: string,
  sequenceId: string
) {
  const response = await request.post(
    `${apiBase}/film-projects/${projectId}/sequences/${sequenceId}/shots`,
    {
      data: {
        name: 'Shot 1',
        description: 'Shot created for screenshots',
        duration: 5,
        order: 1,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const payload = await response.json();
  return payload?.data || payload;
}

async function captureRoleScreenshots(
  browser: any,
  routes: string[],
  role: string,
  token: string,
  replacements: RoutePaths
) {
  const outputDir = path.join(screenshotRoot, role);
  fs.mkdirSync(outputDir, { recursive: true });

  const context = await browser.newContext();
  await context.addInitScript((authToken) => {
    localStorage.setItem('auth.accessToken', authToken);
  }, token);

  const page = await context.newPage();

  for (const routePath of routes) {
    const resolved = resolveDynamicPath(routePath, replacements);
    const url = `${baseUrl}${resolved}`;
    const filename = sanitizeFilename(routePath);

    let navigated = true;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1500);
    } catch (error) {
      console.warn(`[${role}] navigation failed for ${url}:`, error);
      try {
        await page.goto(url, { waitUntil: 'commit', timeout: 60000 });
        await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(1500);
      } catch (retryError) {
        navigated = false;
        console.warn(`[${role}] navigation retry failed for ${url}:`, retryError);
      }
    }

    try {
      await page.screenshot({
        path: path.join(outputDir, `${filename}.png`),
        fullPage: true,
        timeout: 15000,
      });
    } catch (error) {
      console.warn(`[${role}] screenshot failed for ${url}:`, error);
      if (!navigated) {
        continue;
      }
      await page.screenshot({
        path: path.join(outputDir, `${filename}.png`),
        fullPage: false,
        timeout: 5000,
      });
    }
  }

  await context.close();
}

test('capture admin and user route screenshots', async ({ browser, request }) => {
  test.setTimeout(15 * 60 * 1000);
  const routes = collectRoutes();
  fs.mkdirSync(screenshotRoot, { recursive: true });

  const adminEmail = process.env.SCREENSHOT_ADMIN_EMAIL || 'admin@jsonapi.com';
  const adminPassword = process.env.SCREENSHOT_ADMIN_PASSWORD || 'secret';
  const userEmail = process.env.SCREENSHOT_USER_EMAIL || 'user@example.com';
  const userPassword = process.env.SCREENSHOT_USER_PASSWORD || 'secret123';

  const adminToken = await login(request, adminEmail, adminPassword);
  if (!adminToken) {
    throw new Error('Failed to login as admin. Ensure migrations and seeders ran.');
  }

  await registerUser(request, userEmail, userPassword).catch(() => null);
  const userToken = await login(request, userEmail, userPassword);
  if (!userToken) {
    throw new Error('Failed to login as regular user.');
  }

  const adminProject = await createFilmProject(request, adminToken);
  const adminProjectId = String(adminProject?.id || adminProject?.data?.id || 1);
  const adminSequence = await createSequence(request, adminToken, adminProjectId);
  const adminSequenceId = String(adminSequence?.id || adminSequence?.data?.id || 1);
  const adminShot = await createShot(
    request,
    adminToken,
    adminProjectId,
    adminSequenceId
  );
  const adminShotId = String(adminShot?.id || adminShot?.data?.id || 1);

  const userProject = await createFilmProject(request, userToken);
  const userProjectId = String(userProject?.id || userProject?.data?.id || 1);
  const userSequence = await createSequence(request, userToken, userProjectId);
  const userSequenceId = String(userSequence?.id || userSequence?.data?.id || 1);
  const userShot = await createShot(request, userToken, userProjectId, userSequenceId);
  const userShotId = String(userShot?.id || userShot?.data?.id || 1);

  await captureRoleScreenshots(browser, routes, 'admin', adminToken, {
    projectId: adminProjectId,
    sequenceId: adminSequenceId,
    shotId: adminShotId,
    videoJobId: '1',
    storyId: '1',
    userId: '1',
  });

  await captureRoleScreenshots(browser, routes, 'user', userToken, {
    projectId: userProjectId,
    sequenceId: userSequenceId,
    shotId: userShotId,
    videoJobId: '1',
    storyId: '1',
    userId: '1',
  });
});

