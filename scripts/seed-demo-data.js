#!/usr/bin/env node
/**
 * Seed demo data into localStorage and IndexedDB for mage-app.
 *
 * This script injects realistic demo data so that screenshots show
 * meaningful content instead of empty states.
 *
 * Run: node scripts/seed-demo-data.js
 *
 * It outputs a JS snippet that should be evaluated in the browser context
 * before capturing screenshots.
 */

/**
 * Generates a fake JWT token for an admin user.
 * This token is accepted by the frontend's AuthService.getJwtData().
 */
function generateAdminToken() {
  const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));
  const payload = btoa(
    JSON.stringify({
      sub: '1',
      iss: 'mage-api',
      iat: 1700000000,
      exp: 9999999999,
      name: 'Admin User',
      email: 'admin@mage.app',
      role: 'admin',
    })
  );
  const signature = btoa('fake-signature');
  return `${header}.${payload}.${signature}`;
}

/**
 * Generates rich, realistic demo data for all admin pages.
 */
function generateDemoData() {
  const now = new Date().toISOString();

  return {
    // Instance Management data (plain JSON, used directly by InstanceManagement.vue)
    instanceAdminStatus: {
      instances: [
        {
          id: 1,
          name: 'GPU Server #1 - SD Forge',
          url: 'http://vimage2:7860',
          type: 'stable_diffusion_forge',
          enabled: true,
          health_status: 'online',
          queue_count: 3,
          processing_count: 1,
          metrics: {
            gpu_utilization: 72,
            cpu_utilization: 45,
            memory_utilization: 61,
            current_model: 'sd_xl_base_1.0.safetensors',
          },
        },
        {
          id: 2,
          name: 'GPU Server #2 - SD Forge',
          url: 'http://vimage5:7860',
          type: 'stable_diffusion_forge',
          enabled: true,
          health_status: 'online',
          queue_count: 1,
          processing_count: 1,
          metrics: {
            gpu_utilization: 88,
            cpu_utilization: 32,
            memory_utilization: 54,
            current_model: 'sd_xl_base_1.0.safetensors',
          },
        },
        {
          id: 3,
          name: 'Ollama - LLM Server',
          url: 'http://192.168.1.102:11434',
          type: 'ollama',
          enabled: true,
          health_status: 'degraded',
          queue_count: 5,
          processing_count: 2,
          metrics: {
            gpu_utilization: 95,
            cpu_utilization: 78,
            memory_utilization: 82,
            current_model: 'llama3:70b',
          },
        },
        {
          id: 4,
          name: 'ComfyUI Node - Upscaling',
          url: 'http://192.168.1.103:8188',
          type: 'comfyui',
          enabled: false,
          health_status: 'offline',
          queue_count: 0,
          processing_count: 0,
          metrics: {
            gpu_utilization: 0,
            cpu_utilization: 2,
            memory_utilization: 12,
            current_model: null,
          },
        },
      ],
      ffmpeg: {
        active_count: 2,
        pending_count: 1,
        active_jobs: [
          { id: 'ffmpeg-001', type: 'transcode', progress: 67 },
          { id: 'ffmpeg-002', type: 'soundtrack', progress: 23 },
          { id: 'ffmpeg-003', type: 'concat', progress: 0 },
        ],
      },
      summary: {
        total_instances: 4,
        online_instances: 3,
        total_queue_size: 9,
      },
    },

    // Tags - JSON:API format
    tags: {
      data: [
        { id: '1', type: 'tags', attributes: { name: 'animation', created_at: '2025-01-15T10:00:00Z', updated_at: '2025-01-15T10:00:00Z' } },
        { id: '2', type: 'tags', attributes: { name: 'deforum', created_at: '2025-01-16T10:00:00Z', updated_at: '2025-01-16T10:00:00Z' } },
        { id: '3', type: 'tags', attributes: { name: 'vid2vid', created_at: '2025-01-17T10:00:00Z', updated_at: '2025-01-17T10:00:00Z' } },
        { id: '4', type: 'tags', attributes: { name: 'audio-reactive', created_at: '2025-01-18T10:00:00Z', updated_at: '2025-01-18T10:00:00Z' } },
        { id: '5', type: 'tags', attributes: { name: 'film-project', created_at: '2025-01-19T10:00:00Z', updated_at: '2025-01-19T10:00:00Z' } },
        { id: '6', type: 'tags', attributes: { name: 'upscale', created_at: '2025-01-20T10:00:00Z', updated_at: '2025-01-20T10:00:00Z' } },
        { id: '7', type: 'tags', attributes: { name: 'slow-motion', created_at: '2025-01-21T10:00:00Z', updated_at: '2025-01-21T10:00:00Z' } },
        { id: '8', type: 'tags', attributes: { name: 'text-to-video', created_at: '2025-01-22T10:00:00Z', updated_at: '2025-01-22T10:00:00Z' } },
        { id: '9', type: 'tags', attributes: { name: 'image-to-video', created_at: '2025-01-23T10:00:00Z', updated_at: '2025-01-23T10:00:00Z' } },
        { id: '10', type: 'tags', attributes: { name: 'style-transfer', created_at: '2025-01-24T10:00:00Z', updated_at: '2025-01-24T10:00:00Z' } },
      ],
      meta: { total: 10 },
    },

    // Categories - JSON:API format
    categories: {
      data: [
        { id: '1', type: 'categories', attributes: { name: 'General', description: 'General purpose presets for everyday use', created_at: '2025-01-10T10:00:00Z' } },
        { id: '2', type: 'categories', attributes: { name: 'Animation', description: 'Animation style presets for deforum and vid2vid', created_at: '2025-01-11T10:00:00Z' } },
        { id: '3', type: 'categories', attributes: { name: 'Cinematic', description: 'Cinematic video presets with film looks', created_at: '2025-01-12T10:00:00Z' } },
        { id: '4', type: 'categories', attributes: { name: 'Audio Reactive', description: 'Audio-reactive generation presets for music videos', created_at: '2025-01-13T10:00:00Z' } },
        { id: '5', type: 'categories', attributes: { name: 'Upscaling', description: 'Video upscaling and enhancement presets', created_at: '2025-01-14T10:00:00Z' } },
        { id: '6', type: 'categories', attributes: { name: 'Experimental', description: 'Experimental and community presets', created_at: '2025-01-15T10:00:00Z' } },
      ],
      meta: { total: 6 },
    },

    // Roles - JSON:API format
    roles: {
      data: [
        { id: '1', type: 'roles', attributes: { name: 'admin', guard_name: 'api', created_at: '2025-01-01T10:00:00Z', updated_at: '2025-01-01T10:00:00Z' } },
        { id: '2', type: 'roles', attributes: { name: 'user', guard_name: 'api', created_at: '2025-01-01T10:00:00Z', updated_at: '2025-01-01T10:00:00Z' } },
        { id: '3', type: 'roles', attributes: { name: 'editor', guard_name: 'api', created_at: '2025-01-02T10:00:00Z', updated_at: '2025-01-02T10:00:00Z' } },
        { id: '4', type: 'roles', attributes: { name: 'viewer', guard_name: 'api', created_at: '2025-01-03T10:00:00Z', updated_at: '2025-01-03T10:00:00Z' } },
        { id: '5', type: 'roles', attributes: { name: 'moderator', guard_name: 'api', created_at: '2025-01-04T10:00:00Z', updated_at: '2025-01-04T10:00:00Z' } },
        { id: '6', type: 'roles', attributes: { name: 'developer', guard_name: 'api', created_at: '2025-01-05T10:00:00Z', updated_at: '2025-01-05T10:00:00Z' } },
      ],
      meta: { total: 6 },
    },

    // Dashboard - video jobs
    videoJobs: {
      data: [
        {
          id: '1', type: 'video-jobs',
          attributes: {
            prompt: 'A serene mountain landscape at sunset with cinematic lighting',
            status: 'completed',
            created_at: '2025-05-25T14:30:00Z',
            type: 'deforum',
            progress: 100,
            frames: 240,
          },
        },
        {
          id: '2', type: 'video-jobs',
          attributes: {
            prompt: 'Abstract fluid art with vibrant neon colors',
            status: 'processing',
            created_at: '2025-05-26T09:15:00Z',
            type: 'vid2vid',
            progress: 67,
            frames: 120,
          },
        },
        {
          id: '3', type: 'video-jobs',
          attributes: {
            prompt: 'Cyberpunk cityscape at night with rain effects',
            status: 'queued',
            created_at: '2025-05-26T10:00:00Z',
            type: 'deforum',
            progress: 0,
            frames: 360,
          },
        },
        {
          id: '4', type: 'video-jobs',
          attributes: {
            prompt: 'Underwater coral reef with tropical fish',
            status: 'completed',
            created_at: '2025-05-24T16:45:00Z',
            type: 'text-to-video',
            progress: 100,
            frames: 180,
          },
        },
        {
          id: '5', type: 'video-jobs',
          attributes: {
            prompt: 'Time-lapse of blooming flowers in a garden',
            status: 'error',
            created_at: '2025-05-25T08:00:00Z',
            type: 'vid2vid',
            progress: 34,
            frames: 90,
          },
        },
      ],
      meta: { total: 5 },
    },

    // Library - media items
    mediaItems: {
      data: [
        { id: '1', type: 'items', attributes: { name: 'Sunset Landscape.mp4', thumbnail: '/demo/images/library/sunset-thumb.jpg', status: 'completed', type: 'deforum', created_at: '2025-05-24T10:00:00Z', size: '45.2 MB', duration: '00:32' } },
        { id: '2', type: 'items', attributes: { name: 'Neon Fluids.mp4', thumbnail: '/demo/images/library/neon-thumb.jpg', status: 'processing', type: 'vid2vid', created_at: '2025-05-26T09:15:00Z', size: '12.8 MB', duration: '00:15' } },
        { id: '3', type: 'items', attributes: { name: 'Cyberpunk Rain.mp4', thumbnail: '/demo/images/library/cyber-thumb.jpg', status: 'queued', type: 'deforum', created_at: '2025-05-26T10:00:00Z', size: '0 B', duration: '00:00' } },
        { id: '4', type: 'items', attributes: { name: 'Coral Reef.mp4', thumbnail: '/demo/images/library/coral-thumb.jpg', status: 'completed', type: 'text-to-video', created_at: '2025-05-24T16:45:00Z', size: '28.5 MB', duration: '00:24' } },
        { id: '5', type: 'items', attributes: { name: 'Flower Bloom.mp4', thumbnail: '/demo/images/library/flower-thumb.jpg', status: 'error', type: 'vid2vid', created_at: '2025-05-25T08:00:00Z', size: '8.1 MB', duration: '00:12' } },
      ],
      meta: { total: 5 },
    },

    // User profile info
    userProfile: {
      id: 1,
      name: 'Admin User',
      email: 'admin@mage.app',
      role: 'admin',
      avatar: '/demo/images/avatar/admin.png',
      created_at: '2025-01-01T00:00:00Z',
      stats: {
        total_videos: 47,
        total_projects: 12,
        storage_used: '2.4 GB',
        storage_limit: '10 GB',
      },
    },

    // Film projects
    filmProjects: {
      data: [
        { id: '1', type: 'film-projects', attributes: { name: 'Music Video Compilation', description: 'Collection of audio-reactive music videos', status: 'in_progress', created_at: '2025-05-20T10:00:00Z', updated_at: '2025-05-25T14:00:00Z', sequence_count: 3, shot_count: 8 } },
        { id: '2', type: 'film-projects', attributes: { name: 'Nature Documentary', description: 'Short documentary about local wildlife', status: 'planning', created_at: '2025-05-22T10:00:00Z', updated_at: '2025-05-22T10:00:00Z', sequence_count: 0, shot_count: 0 } },
        { id: '3', type: 'film-projects', attributes: { name: 'Product Launch Trailer', description: 'Promotional video for new product launch', status: 'completed', created_at: '2025-05-15T10:00:00Z', updated_at: '2025-05-19T16:00:00Z', sequence_count: 2, shot_count: 6 } },
      ],
      meta: { total: 3 },
    },

    // Presets
    presets: {
      data: [
        { id: '1', type: 'presets', attributes: { name: 'Cinematic Landscape', category: 'Cinematic', type: 'deforum', usage_count: 23, favorite: true, created_at: '2025-03-10T10:00:00Z' } },
        { id: '2', type: 'presets', attributes: { name: 'Neon Dreamscape', category: 'Animation', type: 'deforum', usage_count: 18, favorite: true, created_at: '2025-03-12T10:00:00Z' } },
        { id: '3', type: 'presets', attributes: { name: 'Smooth Vid2Vid', category: 'General', type: 'vid2vid', usage_count: 45, favorite: false, created_at: '2025-02-20T10:00:00Z' } },
        { id: '4', type: 'presets', attributes: { name: 'Beat Sync', category: 'Audio Reactive', type: 'audio-reactive', usage_count: 31, favorite: true, created_at: '2025-04-01T10:00:00Z' } },
        { id: '5', type: 'presets', attributes: { name: '4K Upscale', category: 'Upscaling', type: 'upscale', usage_count: 12, favorite: false, created_at: '2025-04-15T10:00:00Z' } },
        { id: '6', type: 'presets', attributes: { name: 'Watercolor Effect', category: 'Experimental', type: 'deforum', usage_count: 7, favorite: false, created_at: '2025-05-01T10:00:00Z' } },
      ],
      meta: { total: 6 },
    },
  };
}

// Generate the admin JWT token and demo data
const adminToken = generateAdminToken();
const demoData = generateDemoData();

// Output the data as JSON so other scripts can consume it
const output = { adminToken, demoData };
process.stdout.write(JSON.stringify(output, null, 2));
