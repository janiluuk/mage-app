#!/usr/bin/env node

/**
 * Comprehensive screenshot capture for mage-app.
 *
 * Starts a mock API server (Express with CORS) + Vite dev server, then uses
 * Playwright to navigate all views and capture screenshots with realistic demo data.
 *
 * Usage:
 *   node scripts/screenshot-all.mjs
 */

import express from 'express';
import { chromium } from 'playwright';
import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');
const PROJECT_ROOT = path.join(__dirname, '..');

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ──────────────────────────────────────────────
// Admin JWT token (valid JWT format for AuthService)
// ──────────────────────────────────────────────
function generateAdminToken() {
  const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'HS256' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: '1', iss: 'mage-api', iat: 1700000000, exp: 9999999999,
    name: 'Admin User', email: 'admin@mage.app', role: 'admin',
  })).toString('base64url');
  const signature = Buffer.from('fake-signature').toString('base64url');
  return `${header}.${payload}.${signature}`;
}
const ADMIN_TOKEN = generateAdminToken();

function jsonApiCollection(resourceType, items) {
  return {
    data: items.map((item, i) => ({
      id: String(item.id || i + 1), type: resourceType, attributes: { ...item },
    })),
    meta: { total: items.length },
  };
}

// ──────────────────────────────────────────────
// Mock API Server
// ──────────────────────────────────────────────
function startMockApi(port = 8000) {
  return new Promise((resolve) => {
    const app = express();
    // CORS middleware
    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Type');
      if (req.method === 'OPTIONS') return res.status(204).end();
      next();
    });
    app.use(express.json());

    // Health check (HEAD used by AppLayout)
    app.head('/api/v1', (req, res) => res.status(200).end());
    app.get('/api/v1', (req, res) => res.json({ status: 'ok' }));

    // Tags
    app.get('/api/v1/tags', (req, res) => res.json(jsonApiCollection('tags', [
      { id: 1, name: 'animation', created_at: '2025-01-15T10:00:00Z', updated_at: '2025-01-15T10:00:00Z' },
      { id: 2, name: 'deforum', created_at: '2025-01-16T10:00:00Z', updated_at: '2025-01-16T10:00:00Z' },
      { id: 3, name: 'vid2vid', created_at: '2025-01-17T10:00:00Z', updated_at: '2025-01-17T10:00:00Z' },
      { id: 4, name: 'audio-reactive', created_at: '2025-01-18T10:00:00Z', updated_at: '2025-01-18T10:00:00Z' },
      { id: 5, name: 'film-project', created_at: '2025-01-19T10:00:00Z', updated_at: '2025-01-19T10:00:00Z' },
      { id: 6, name: 'upscale', created_at: '2025-01-20T10:00:00Z', updated_at: '2025-01-20T10:00:00Z' },
      { id: 7, name: 'slow-motion', created_at: '2025-01-21T10:00:00Z', updated_at: '2025-01-21T10:00:00Z' },
      { id: 8, name: 'text-to-video', created_at: '2025-01-22T10:00:00Z', updated_at: '2025-01-22T10:00:00Z' },
      { id: 9, name: 'image-to-video', created_at: '2025-01-23T10:00:00Z', updated_at: '2025-01-23T10:00:00Z' },
      { id: 10, name: 'style-transfer', created_at: '2025-01-24T10:00:00Z', updated_at: '2025-01-24T10:00:00Z' },
    ])));
    app.post('/api/v1/tags', (req, res) => res.status(201).json({ data: { id: String(Date.now()), type: 'tags', attributes: { ...req.body?.data?.attributes, created_at: new Date().toISOString() } } }));
    app.patch('/api/v1/tags/:id', (req, res) => res.json({ data: { id: req.params.id, type: 'tags', attributes: { ...req.body?.data?.attributes, updated_at: new Date().toISOString() } } }));
    app.delete('/api/v1/tags/:id', (req, res) => res.status(204).end());

    // Roles
    app.get('/api/v1/roles', (req, res) => res.json(jsonApiCollection('roles', [
      { id: 1, name: 'admin', guard_name: 'api', created_at: '2025-01-01T10:00:00Z', updated_at: '2025-01-01T10:00:00Z' },
      { id: 2, name: 'user', guard_name: 'api', created_at: '2025-01-01T10:00:00Z', updated_at: '2025-01-01T10:00:00Z' },
      { id: 3, name: 'editor', guard_name: 'api', created_at: '2025-01-02T10:00:00Z', updated_at: '2025-01-02T10:00:00Z' },
      { id: 4, name: 'viewer', guard_name: 'api', created_at: '2025-01-03T10:00:00Z', updated_at: '2025-01-03T10:00:00Z' },
      { id: 5, name: 'moderator', guard_name: 'api', created_at: '2025-01-04T10:00:00Z', updated_at: '2025-01-04T10:00:00Z' },
      { id: 6, name: 'developer', guard_name: 'api', created_at: '2025-01-05T10:00:00Z', updated_at: '2025-01-05T10:00:00Z' },
    ])));
    app.post('/api/v1/roles', (req, res) => res.status(201).json({ data: { id: String(Date.now()), type: 'roles', attributes: { ...req.body?.data?.attributes, created_at: new Date().toISOString() } } }));
    app.patch('/api/v1/roles/:id', (req, res) => res.json({ data: { id: req.params.id, type: 'roles', attributes: { ...req.body?.data?.attributes, updated_at: new Date().toISOString() } } }));
    app.delete('/api/v1/roles/:id', (req, res) => res.status(204).end());

    // Categories
    app.get('/api/v1/categories', (req, res) => res.json(jsonApiCollection('categories', [
      { id: 1, name: 'General', description: 'General purpose presets for everyday use', created_at: '2025-01-10T10:00:00Z' },
      { id: 2, name: 'Animation', description: 'Animation style presets for deforum and vid2vid', created_at: '2025-01-11T10:00:00Z' },
      { id: 3, name: 'Cinematic', description: 'Cinematic video presets with film looks', created_at: '2025-01-12T10:00:00Z' },
      { id: 4, name: 'Audio Reactive', description: 'Audio-reactive generation presets', created_at: '2025-01-13T10:00:00Z' },
      { id: 5, name: 'Upscaling', description: 'Video upscaling and enhancement presets', created_at: '2025-01-14T10:00:00Z' },
      { id: 6, name: 'Experimental', description: 'Experimental and community presets', created_at: '2025-01-15T10:00:00Z' },
    ])));
    app.post('/api/v1/categories', (req, res) => res.status(201).json({ data: { id: String(Date.now()), type: 'categories', attributes: { ...req.body?.data?.attributes, created_at: new Date().toISOString() } } }));
    app.patch('/api/v1/categories/:id', (req, res) => res.json({ data: { id: req.params.id, type: 'categories', attributes: { ...req.body?.data?.attributes, updated_at: new Date().toISOString() } } }));
    app.delete('/api/v1/categories/:id', (req, res) => res.status(204).end());

    // Dashboard stats
    app.get('/api/v1/stats', (req, res) => res.json({ totalVideos: 47, processingJobs: 3, completedToday: 12, failedJobs: 1 }));
    app.get('/api/v1/stats/recent', (req, res) => res.json({ activities: [] }));

    // Users
    app.get('/api/v1/users', (req, res) => res.json(jsonApiCollection('users', [
      { id: 1, name: 'Admin User', email: 'admin@mage.app', role: 'admin', created_at: '2025-01-01T00:00:00Z' },
      { id: 2, name: 'Jane Doe', email: 'jane@example.com', role: 'user', created_at: '2025-02-15T00:00:00Z' },
    ])));

    // Profile / auth
    app.get('/api/v1/profile', (req, res) => res.json({
      data: { id: 1, type: 'profiles', attributes: { name: 'Admin User', email: 'admin@mage.app', role: 'admin', created_at: '2025-01-01T00:00:00Z' } },
    }));
    app.get('/auth/me', (req, res) => res.json({
      data: { id: 1, name: 'Admin User', email: 'admin@mage.app', role: 'admin' },
    }));
    app.post('/api/v2/login', (req, res) => res.json({ accessToken: ADMIN_TOKEN, data: { user: { id: 1, name: 'Admin User', email: 'admin@mage.app', role: 'admin' } } }));
    app.post('/v2/login', (req, res) => res.json({ accessToken: ADMIN_TOKEN, data: { user: { id: 1, name: 'Admin User', email: 'admin@mage.app', role: 'admin' } } }));

    // Items / media library
    app.get('/api/v1/items', (req, res) => res.json(jsonApiCollection('items', [])));

    // Video jobs
    app.get('/api/v1/video-jobs', (req, res) => res.json(jsonApiCollection('video-jobs', [
      { id: 1, prompt: 'Serene mountain landscape at sunset with cinematic lighting', status: 'completed', type: 'deforum', progress: 100, frames: 240, created_at: '2025-05-25T14:30:00Z' },
      { id: 2, prompt: 'Abstract fluid art with vibrant neon colors', status: 'processing', type: 'vid2vid', progress: 67, frames: 120, created_at: '2025-05-26T09:15:00Z' },
      { id: 3, prompt: 'Cyberpunk cityscape at night with rain effects', status: 'queued', type: 'deforum', progress: 0, frames: 360, created_at: '2025-05-26T10:00:00Z' },
      { id: 4, prompt: 'Underwater coral reef with tropical fish', status: 'completed', type: 'text-to-video', progress: 100, frames: 180, created_at: '2025-05-24T16:45:00Z' },
      { id: 5, prompt: 'Time-lapse of blooming flowers in a garden', status: 'error', type: 'vid2vid', progress: 34, frames: 90, created_at: '2025-05-25T08:00:00Z' },
    ])));

    // Film projects
    app.get('/api/v1/film-projects', (req, res) => res.json(jsonApiCollection('film-projects', [
      { id: 1, name: 'Music Video Compilation', description: 'Collection of audio-reactive music videos', status: 'in_progress', sequence_count: 3, shot_count: 8, created_at: '2025-05-20T10:00:00Z' },
      { id: 2, name: 'Nature Documentary', description: 'Short documentary about local wildlife', status: 'planning', sequence_count: 0, shot_count: 0, created_at: '2025-05-22T10:00:00Z' },
      { id: 3, name: 'Product Launch Trailer', description: 'Promotional video for new product launch', status: 'completed', sequence_count: 2, shot_count: 6, created_at: '2025-05-15T10:00:00Z' },
    ])));

    // Admin instances status
    app.get('/api/administration/instances/status', (req, res) => res.json({
      instances: [
        { id: 1, name: 'GPU Server #1 - SD Forge', url: 'http://vimage2:7860', type: 'stable_diffusion_forge', enabled: true, health_status: 'online', queue_count: 3, processing_count: 1, metrics: { gpu_utilization: 72, cpu_utilization: 45, memory_utilization: 61, current_model: 'sd_xl_base_1.0.safetensors' } },
        { id: 2, name: 'GPU Server #2 - SD Forge', url: 'http://vimage5:7860', type: 'stable_diffusion_forge', enabled: true, health_status: 'online', queue_count: 1, processing_count: 1, metrics: { gpu_utilization: 88, cpu_utilization: 32, memory_utilization: 54, current_model: 'sd_xl_base_1.0.safetensors' } },
        { id: 3, name: 'Ollama - LLM Server', url: 'http://192.168.1.102:11434', type: 'ollama', enabled: true, health_status: 'degraded', queue_count: 5, processing_count: 2, metrics: { gpu_utilization: 95, cpu_utilization: 78, memory_utilization: 82, current_model: 'llama3:70b' } },
        { id: 4, name: 'ComfyUI Node - Upscaling', url: 'http://192.168.1.103:8188', type: 'comfyui', enabled: false, health_status: 'offline', queue_count: 0, processing_count: 0, metrics: { gpu_utilization: 0, cpu_utilization: 2, memory_utilization: 12, current_model: null } },
      ],
      ffmpeg: { active_count: 2, pending_count: 1, active_jobs: [{ id: 'ffmpeg-001', type: 'transcode', progress: 67 }, { id: 'ffmpeg-002', type: 'soundtrack', progress: 23 }, { id: 'ffmpeg-003', type: 'concat', progress: 0 }] },
      summary: { total_instances: 4, online_instances: 3, total_queue_size: 9 },
    }));

    // Catch-all
    app.all(/\/api\/.*/, (req, res) => res.status(200).json({ data: [] }));

    const server = app.listen(port, () => {
      console.log(`  ✓ Mock API running on :${port}`);
      resolve(server);
    });
  });
}

// ──────────────────────────────────────────────
// Vite via child process
// ──────────────────────────────────────────────
function startVite(wantedPort = 8080) {
  return new Promise((resolve, reject) => {
    const proc = spawn('npm', ['run', 'dev'], {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, VITE_API_URL: 'http://localhost:8000' },
    });

    let started = false;
    let actualPort = wantedPort;

    const onData = (data) => {
      const text = data.toString();
      process.stdout.write(`  [vite] ${text.replace(/\n$/, '')}\n`);
      // Parse actual port from Vite output
      const portMatch = text.match(/Local:\s+http:\/\/localhost:(\d+)/);
      if (portMatch) {
        actualPort = parseInt(portMatch[1]);
      }
      if (!started && text.includes('ready in')) {
        started = true;
        setTimeout(() => resolve({ proc, port: actualPort }), 1000);
      }
    };

    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (!started) reject(new Error(`Vite exited with code ${code}`));
    });
  });
}

// ──────────────────────────────────────────────
// Playwright screenshot capture
// ──────────────────────────────────────────────
async function main() {
  // Kill any stale processes on our ports
  try { execSync('lsof -ti:8000 | xargs -r kill -9 2>/dev/null', { stdio: 'ignore' }); } catch (e) {}
  try { execSync('lsof -ti:8080 | xargs -r kill -9 2>/dev/null', { stdio: 'ignore' }); } catch (e) {}
  try { execSync('lsof -ti:8081 | xargs -r kill -9 2>/dev/null', { stdio: 'ignore' }); } catch (e) {}
  await new Promise(r => setTimeout(r, 1000));

  let mockServer, viteProc, vitePort;

  try {
    // 1. Start mock API
    console.log('Starting mock API server...');
    mockServer = await startMockApi(8000);

    // 2. Start Vite
    console.log('Starting Vite dev server...');
    const { proc, port } = await startVite(8080);
    viteProc = proc;
    vitePort = port;
    console.log(`  ✓ Vite ready at http://localhost:${vitePort}`);

    // 3. Launch Playwright
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    const baseUrl = `http://localhost:${vitePort}`;

    async function injectToken() {
      await page.evaluate((t) => localStorage.setItem('auth.accessToken', t), ADMIN_TOKEN);
    }

    async function goto(url, opts = {}) {
      const { waitFor, waitMs = 2000 } = opts;
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      } catch (e) {
        // ignore navigation timeout
      }
      if (waitFor) {
        try { await page.waitForSelector(waitFor, { timeout: 10000 }); } catch (e) {
          console.log(`     ⚠ waitFor('${waitFor}') timed out`);
        }
      }
      if (waitMs) await page.waitForTimeout(waitMs);
    }

    async function shot(name) {
      const fp = path.join(SCREENSHOT_DIR, name);
      await page.screenshot({ path: fp, fullPage: true });
      const size = fs.statSync(fp).size;
      const sizeStr = size > 1024 ? `${(size / 1024).toFixed(0)}KB` : `${size}B`;
      console.log(`  ✓ ${name} (${sizeStr})`);
    }

    async function navAndShot(url, name, opts = {}) {
      console.log(`\n📸 ${name}  → ${url.replace(baseUrl, '')}`);
      await goto(url, opts);
      await shot(name);
    }

    // ─── Step 1: Login page, inject token ───
    console.log('\n═══ Step 1: Inject admin session ═══');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(800);
    await injectToken();
    console.log('  ✓ Admin JWT injected');

    // ─── Capture all screens ───
    await navAndShot(`${baseUrl}/`,                 'dashboard-default.png',            { waitMs: 5000 });
    await navAndShot(`${baseUrl}/library`,          'library-default.png',              { waitMs: 4000 });
    await navAndShot(`${baseUrl}/browser`,          'browser-default.png',              { waitMs: 4000 });
    await navAndShot(`${baseUrl}/admin/instances`,  'admin-instances-default.png',      { waitMs: 5000 });
    await navAndShot(`${baseUrl}/admin/video-processing`, 'admin-video-processing-default.png', { waitMs: 4000 });
    await navAndShot(`${baseUrl}/admin/tags`,       'admin-tags-default.png',           { waitMs: 4000 });
    await navAndShot(`${baseUrl}/admin/roles`,      'admin-roles-default.png',          { waitMs: 4000 });
    await navAndShot(`${baseUrl}/admin/categories`, 'admin-categories-default.png',     { waitMs: 4000 });
    await navAndShot(`${baseUrl}/profile`,          'user-profile-default.png',         { waitMs: 4000 });
    await navAndShot(`${baseUrl}/presets`,          'presets-default.png',              { waitMs: 4000 });
    await navAndShot(`${baseUrl}/projects`,         'film-projects-default.png',        { waitMs: 4000 });
    await navAndShot(`${baseUrl}/jobs`,             'video-jobs-default.png',           { waitMs: 4000 });
    await navAndShot(`${baseUrl}/upload`,           'upload-default.png',               { waitMs: 4000 });
    await navAndShot(`${baseUrl}/story`,            'story-creator-default.png',        { waitMs: 4000 });
    await navAndShot(`${baseUrl}/stories`,          'story-browser-default.png',        { waitMs: 4000 });
    await navAndShot(`${baseUrl}/soundscape`,       'soundscape-default.png',           { waitMs: 4000 });
    await navAndShot(`${baseUrl}/audio-visualizer`, 'audio-visualizer-default.png',     { waitMs: 4000 });
    await navAndShot(`${baseUrl}/mage`,             'mage-helper-default.png',          { waitMs: 4000 });
    await navAndShot(`${baseUrl}/frontpage`,        'frontpage-default.png',            { waitMs: 3000 });
    await navAndShot(`${baseUrl}/landing`,          'landing-default.png',              { waitMs: 3000 });
    await navAndShot(`${baseUrl}/dev`,              'dev-board-default.png',            { waitMs: 4000 });

    // Login (clear token first)
    await page.evaluate(() => localStorage.removeItem('auth.accessToken'));
    await navAndShot(`${baseUrl}/login`,            'login-page-default.png',           { waitMs: 1000 });
    await injectToken();

    // Error / 404
    await navAndShot(`${baseUrl}/auth/access`,      'access-denied-default.png',        { waitMs: 2000 });
    await navAndShot(`${baseUrl}/auth/error`,       'error-page-default.png',           { waitMs: 2000 });
    await navAndShot(`${baseUrl}/pages/notfound`,   'notfound-default.png',             { waitMs: 2000 });

    // Users list
    await navAndShot(`${baseUrl}/users`,            'users-list-default.png',           { waitMs: 4000 });

    // UI Kit
    await navAndShot(`${baseUrl}/uikit/table`,      'uikit-table-default.png',          { waitMs: 4000 });
    await navAndShot(`${baseUrl}/uikit/charts`,     'uikit-charts-default.png',         { waitMs: 4000 });
    await navAndShot(`${baseUrl}/uikit/formlayout`, 'uikit-formlayout-default.png',     { waitMs: 4000 });
    await navAndShot(`${baseUrl}/uikit/input`,      'uikit-input-default.png',          { waitMs: 4000 });

    // Admin UI Demo (no auth)
    await navAndShot(`${baseUrl}/demo/admin-ui`,    'admin-ui-demo-default.png',        { waitMs: 2000 });

    // Summary
    const files = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png') && !f.startsWith('.'));
    console.log(`\n═══ ✅ Done: ${files.length} screenshots ═══`);

    await browser.close();

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    console.log('\nCleaning up...');
    if (viteProc) { viteProc.kill('SIGTERM'); await new Promise(r => setTimeout(r, 1000)); }
    if (mockServer) { await new Promise(r => mockServer.close(r)); }
    console.log('  ✓ Cleanup complete');
  }
}

main();
