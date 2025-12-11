/**
 * Fetch and parse JSON from a URL with error handling.
 * @param {string} url - URL to fetch from
 * @returns {Promise<Object>} Parsed JSON response
 * @throws {Error} If the request fails
 */
async function fetchJson(url) {
  try {
    const response = await fetch(url, {
      timeout: 10000, // 10 second timeout
    });
    
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch from ${url}: ${error.message}`);
  }
}

const MageApiService = {
  getStatus() {
    return fetchJson('/api/status');
  },
  getQueue() {
    return fetchJson('/api/queue');
  },
};

export default MageApiService;
