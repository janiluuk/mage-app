import axios from 'axios';
import AuthService from '@/services/auth/AuthService';
import router from '@/router';
import { API_BASE_URL } from '@/utils/api-base-urls';

const API_URL = API_BASE_URL || '';

if (!API_URL) {
  console.warn('Missing VITE_API_URL or VITE_API_BASE_URL. API requests will fail until it is configured.');
}

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
 * Supports request cancellation via AbortController.
 */
const requestService = {
  // Store active requests for cancellation
  _activeRequests: new Map(),
  
  /**
   * Create an AbortController for request cancellation
   */
  createAbortController(requestId) {
    const controller = new AbortController();
    if (requestId) {
      this._activeRequests.set(requestId, controller);
    }
    return controller;
  },
  
  /**
   * Cancel a specific request by ID
   */
  cancelRequest(requestId) {
    const controller = this._activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this._activeRequests.delete(requestId);
    }
  },
  
  /**
   * Cancel all active requests
   */
  cancelAllRequests() {
    this._activeRequests.forEach((controller) => controller.abort());
    this._activeRequests.clear();
  },
  
  /**
   * Perform a GET request with optional query parameters and config overrides.
   */
  get(url, params = {}, config = {}, requestId = null) {
    const abortController = requestId ? this.createAbortController(requestId) : null;
    const requestConfig = {
      ...buildConfig(params, config),
      ...(abortController && { signal: abortController.signal }),
    };
    const promise = apiClient.get(url, requestConfig);
    if (requestId) {
      promise.finally(() => this._activeRequests.delete(requestId));
    }
    return promise;
  },
  /**
   * Perform a POST request.
   */
  post(url, body = {}, config = {}, requestId = null) {
    const abortController = requestId ? this.createAbortController(requestId) : null;
    const requestConfig = {
      ...config,
      ...(abortController && { signal: abortController.signal }),
    };
    const promise = apiClient.post(url, body, requestConfig);
    if (requestId) {
      promise.finally(() => this._activeRequests.delete(requestId));
    }
    return promise;
  },
  /**
   * Perform a PUT request.
   */
  put(url, body = {}, config = {}, requestId = null) {
    const abortController = requestId ? this.createAbortController(requestId) : null;
    const requestConfig = {
      ...config,
      ...(abortController && { signal: abortController.signal }),
    };
    const promise = apiClient.put(url, body, requestConfig);
    if (requestId) {
      promise.finally(() => this._activeRequests.delete(requestId));
    }
    return promise;
  },
  /**
   * Perform a PATCH request.
   */
  patch(url, body = {}, config = {}, requestId = null) {
    const abortController = requestId ? this.createAbortController(requestId) : null;
    const requestConfig = {
      ...config,
      ...(abortController && { signal: abortController.signal }),
    };
    const promise = apiClient.patch(url, body, requestConfig);
    if (requestId) {
      promise.finally(() => this._activeRequests.delete(requestId));
    }
    return promise;
  },
  /**
   * Perform a DELETE request.
   */
  delete(url, config = {}, requestId = null) {
    const abortController = requestId ? this.createAbortController(requestId) : null;
    const requestConfig = {
      ...config,
      ...(abortController && { signal: abortController.signal }),
    };
    const promise = apiClient.delete(url, requestConfig);
    if (requestId) {
      promise.finally(() => this._activeRequests.delete(requestId));
    }
    return promise;
  },
};

export { apiClient };
export default requestService;
