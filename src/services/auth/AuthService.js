import requestService, { apiClient } from '@/services/request-service/ApiRequestService';

const AuthService = {
  /**
   * Register a new user and return the hydrated payload.
   */
  async registerUser(registerData) {
    const originalBaseURL = apiClient.defaults.baseURL;
    apiClient.defaults.baseURL = this._getAuthBaseURL();
    try {
      const response = await requestService.post('/v2/register', registerData);
      return response?.data?.data;
    } finally {
      apiClient.defaults.baseURL = originalBaseURL;
    }
  },
  /**
   * Confirm an email verification token.
   */
  async verifiedEmail(verifiedEmailData) {
    const response = await requestService.post(
      '/auth/verified-email',
      verifiedEmailData
    );

    return response?.data?.data;
  },
  /**
   * Compute the base API URL without the /v1 suffix.
   * e.g. '/api/v1' → '/api', 'http://host/api/v1' → 'http://host/api'
   */
  _getAuthBaseURL() {
    const originalBaseURL = apiClient.defaults.baseURL || '/api';
    try {
      const baseOrigin = originalBaseURL.startsWith('http')
        ? new URL(originalBaseURL).origin
        : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
      const parsed = new URL(originalBaseURL, baseOrigin);
      parsed.pathname = parsed.pathname.replace(/\/api\/v1(\/?)$/, '/api$1');
      return originalBaseURL.startsWith('http') ? parsed.toString() : parsed.pathname;
    } catch {
      return originalBaseURL.replace('/api/v1', '/api');
    }
  },

  async signIn(userLoginData) {
    // Auth routes live at /api/v2/*, not /api/v1/*
    const originalBaseURL = apiClient.defaults.baseURL;
    apiClient.defaults.baseURL = this._getAuthBaseURL();

    try {
      const response = await requestService.post('/v2/login', userLoginData);
      // Handle multiple response formats for compatibility with different API versions
      const token = response?.data?.accessToken || response?.data?.data?.accessToken || response?.data?.token;
      if (token) {
        this.saveToken(token);
      }
      return response?.data?.data || response?.data;
    } finally {
      apiClient.defaults.baseURL = originalBaseURL;
    }
  },
  async toggleCurrentUserEmailNotification() {
    const response = await requestService.patch(
      '/users/toggle-current-user-email-notification'
    );
    return response?.data?.data;
  },

  async forgotPassword(forgotPasswordData) {
    const originalBaseURL = apiClient.defaults.baseURL;
    apiClient.defaults.baseURL = this._getAuthBaseURL();
    try {
      const response = await requestService.post('/v2/password-forgot', forgotPasswordData);
      return response?.data?.data;
    } finally {
      apiClient.defaults.baseURL = originalBaseURL;
    }
  },

  async resetPassword(resetPasswordData) {
    const originalBaseURL = apiClient.defaults.baseURL;
    apiClient.defaults.baseURL = this._getAuthBaseURL();
    try {
      const response = await requestService.post('/v2/password-reset', resetPasswordData);
      return response?.data?.data;
    } finally {
      apiClient.defaults.baseURL = originalBaseURL;
    }
  },

  async signOut() {
    const originalBaseURL = apiClient.defaults.baseURL;
    apiClient.defaults.baseURL = this._getAuthBaseURL();
    try {
      const response = await requestService.post('/v2/logout');
      this.removeToken();
      return response?.data?.data;
    } catch {
      // Even if the API call fails, remove the token locally
      this.removeToken();
    } finally {
      apiClient.defaults.baseURL = originalBaseURL;
    }
  },
  async fetchLoggedUser() {
    const originalBaseURL = apiClient.defaults.baseURL;
    apiClient.defaults.baseURL = this._getAuthBaseURL();
    try {
      const response = await requestService.get('/auth/me');
      return response?.data?.data;
    } finally {
      apiClient.defaults.baseURL = originalBaseURL;
    }
  },
  async changeEmail(data) {
    const response = await requestService.get('/users/change-verify', data);
    return response?.data?.data;
  },
  saveToken(token) {
    localStorage.setItem('auth.accessToken', token);
  },
  removeToken() {
    localStorage.removeItem('auth.accessToken');
  },
  getToken() {
    return localStorage.getItem('auth.accessToken');
  },
  hasToken() {
    return !!localStorage.getItem('auth.accessToken');
  },
  
  getJwtData() {
    const token = localStorage.getItem('auth.accessToken');
    if (!token || token === '') {
      return false;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
   
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to parse JWT token:', error);
      return false;
    }
  },
  async signInByProvider(providerName) {
    const response = await requestService.get('/' + providerName + '/auth');

    return response?.data.url;
  },

  async signInByProviderCallback(providerName, data) {
    const response = await requestService.get(
      '/' + providerName + '/callback',
      data
    );
    this.saveToken(response?.data?.data.accessToken);

    return response?.data?.data;
  }
};

export default AuthService;
