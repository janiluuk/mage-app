import env from '@/utils/env';

/**
 * Fetch and parse JSON from a URL with error handling and timeout.
 * @param {string} url - URL to fetch from
 * @param {number} timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns {Promise<Object>} Parsed JSON response
 * @throws {Error} If the request fails or times out
 */
async function fetchJson(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw new Error(`Failed to fetch from ${url}: ${error.message}`);
  }
}

const MageApiService = {
  getStatus() {
    // Mage Helper API is served from the app gateway (/api/*).
    const API_URL = (env.VITE_HELPER_API_URL || env.VITE_APP_URL || '').replace(/\/$/, '');
    return fetchJson(`${API_URL}/api/status`);
  },
  getQueue() {
    // Use audio-queue endpoint to avoid conflict with video queue
    const API_URL = (env.VITE_HELPER_API_URL || env.VITE_APP_URL || '').replace(/\/$/, '');
    return fetchJson(`${API_URL}/api/audio-queue`);
  },
};

export default MageApiService;
