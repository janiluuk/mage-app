// Single source of truth for API base URL
const API_URL = process.env.VUE_APP_API_URL || '';

// Derive all other API URLs from the single base URL
const API_BASE_URL = API_URL ? `${API_URL}/api` : '';
const API_V1_URL = API_URL ? `${API_URL}/api/v1` : '';
const API_V2_URL = API_URL ? `${API_URL}/api/v2` : '';
const VIDEO_PREVIEW_URL = API_URL ? `${API_URL}/videos/` : '';
const MODEL_PREVIEW_URL = API_URL ? `${API_URL}/preview/model/` : '';
const FALLBACK_IMAGE_URL = process.env.VUE_APP_FALLBACK_IMAGE_URL || (API_URL ? `${API_URL}/images/notfound.jpg` : '');

// App base URL for sharing links - defaults to API_URL if not provided
const APP_BASE_URL = process.env.VUE_APP_APP_URL || API_URL;

// Legacy: Keep STABLE_URL for backward compatibility during transition
// Use fetchStableUrl() to get the stable URL from the backend
const STABLE_URL = process.env.VUE_APP_STABLE_URL || '';

// Other service URLs
const MAGE_API_URL = process.env.VUE_APP_MAGE_API_URL || '';
const SAMPLE_PROCESSED_VIDEO_URL = process.env.VUE_APP_SAMPLE_PROCESSED_VIDEO_URL || '';

/**
 * Fetch the stable URL from the backend configuration endpoint.
 * This replaces the hardcoded VUE_APP_STABLE_URL environment variable.
 * @returns {Promise<string>} The stable URL from the backend
 */
async function fetchStableUrl() {
  try {
    const response = await fetch(`${API_URL}/api/config`);
    if (!response.ok) {
      console.warn('Failed to fetch stable URL from backend, using fallback');
      return STABLE_URL;
    }
    const config = await response.json();
    return config.stableUrl || STABLE_URL;
  } catch (error) {
    console.warn('Error fetching stable URL from backend:', error);
    return STABLE_URL;
  }
}

export {
  API_URL,
  API_BASE_URL,
  API_V1_URL,
  API_V2_URL,
  VIDEO_PREVIEW_URL,
  MODEL_PREVIEW_URL,
  FALLBACK_IMAGE_URL,
  APP_BASE_URL,
  STABLE_URL,
  MAGE_API_URL,
  SAMPLE_PROCESSED_VIDEO_URL,
  fetchStableUrl,
};
