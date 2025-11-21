const API_URL = process.env.VUE_APP_API_URL || '';
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || (API_URL ? `${API_URL}/api` : '');
const API_V1_URL = process.env.VUE_APP_API_V1_BASE_URL || (API_URL ? `${API_URL}/v1` : '');
const VIDEO_PREVIEW_URL = process.env.VUE_APP_VIDEO_PREVIEW_URL || (API_URL ? `${API_URL}/videos/` : '');
const MODEL_PREVIEW_URL = process.env.VUE_APP_MODEL_PREVIEW_URL || (API_URL ? `${API_URL}/preview/model/` : '');
const FALLBACK_IMAGE_URL = process.env.VUE_APP_FALLBACK_IMAGE_URL || (API_URL ? `${API_URL}/images/notfound.jpg` : '');
const APP_BASE_URL = process.env.VUE_APP_APP_URL || process.env.VUE_APP_BASE_URL || '';
const STABLE_URL = process.env.VUE_APP_STABLE_URL || '';
const VIMAGE_API_URL = process.env.VUE_APP_VIMAGE_API_URL || '';
const SAMPLE_PROCESSED_VIDEO_URL = process.env.VUE_APP_SAMPLE_PROCESSED_VIDEO_URL || '';

export {
  API_URL,
  API_BASE_URL,
  API_V1_URL,
  VIDEO_PREVIEW_URL,
  MODEL_PREVIEW_URL,
  FALLBACK_IMAGE_URL,
  APP_BASE_URL,
  STABLE_URL,
  VIMAGE_API_URL,
  SAMPLE_PROCESSED_VIDEO_URL,
};
