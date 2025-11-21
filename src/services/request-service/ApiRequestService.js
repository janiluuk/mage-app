import axios from 'axios';
import AuthService from '@/services/auth/AuthService';
import router from '@/router';

const API_URL = process.env.VUE_APP_API_BASE_URL;

/**
 * Dedicated Axios instance for API calls to avoid polluting the global Axios state
 * and to apply shared behavior (headers, error normalization) consistently.
 */
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: 'application/vnd.api+json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = AuthService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const payload = error?.response?.data?.error;

    if (payload?.code === 404) {
      router.push({ name: 'Error404' });
    }

    if (payload === 'Unauthorized' || error?.response?.status === 401) {
      AuthService.removeToken();
    }

    const normalizedError = new Error(payload?.message || error.message || 'Request failed');

    if (payload?.validator) {
      const validatorError = {};

      for (const errorName in payload.validator) {
        validatorError[errorName] = payload.validator[errorName][0];
      }

      normalizedError.validatorError = validatorError;
    }

    normalizedError.response = error.response;
    return Promise.reject(normalizedError);
  }
);

function buildConfig(params = {}, config = {}) {
  const mergedConfig = {
    ...config,
    ...(Object.keys(params || {}).length ? { params } : {}),
    headers: {
      ...apiClient.defaults.headers.common,
      ...config.headers,
    },
  };

  return mergedConfig;
}

/**
 * Lightweight wrapper around axios to keep call sites concise and consistent.
 */
const requestService = {
  /**
   * Perform a GET request with optional query parameters and config overrides.
   */
  get(url, params = {}, config = {}) {
    return apiClient.get(url, buildConfig(params, config));
  },
  /**
   * Perform a POST request.
   */
  post(url, body = {}, config = {}) {
    return apiClient.post(url, body, config);
  },
  /**
   * Perform a PUT request.
   */
  put(url, body = {}, config = {}) {
    return apiClient.put(url, body, config);
  },
  /**
   * Perform a PATCH request.
   */
  patch(url, body = {}, config = {}) {
    return apiClient.patch(url, body, config);
  },
  /**
   * Perform a DELETE request.
   */
  delete(url, config = {}) {
    return apiClient.delete(url, config);
  },
};

export { apiClient };
export default requestService;
