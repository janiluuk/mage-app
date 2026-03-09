import env from '@/utils/env';

/**
 * Return the helper API base URL, or null if not configured.
 */
function getHelperApiUrl() {
  const raw = (env.VITE_HELPER_API_URL || env.VITE_APP_URL || '').replace(/\/$/, '');
  return raw || null;
}

/**
 * Fetch and parse JSON from a URL with error handling and timeout.
 * Validates the response is actually JSON before parsing to avoid
 * "Unexpected token <" errors when the URL hits an SPA fallback.
 */
async function fetchJson(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    // Guard: ensure response is actually JSON, not an HTML SPA fallback
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Response is not JSON (helper API may not be running)');
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out`);
    }
    throw error;
  }
}

const MageApiService = {
  /**
   * Returns true if the helper API URL is configured.
   */
  isConfigured() {
    return getHelperApiUrl() !== null;
  },

  getStatus() {
    const base = getHelperApiUrl();
    if (!base) return Promise.reject(new Error('Helper API URL not configured'));
    return fetchJson(`${base}/api/status`);
  },

  getQueue() {
    const base = getHelperApiUrl();
    if (!base) return Promise.reject(new Error('Helper API URL not configured'));
    return fetchJson(`${base}/api/audio-queue`);
  },
};

export default MageApiService;
