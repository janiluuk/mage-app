import requestService, { apiClient } from '@/services/request-service/ApiRequestService';

const AuthService = {
  /**
   * Register a new user and return the hydrated payload.
   */
  async registerUser(registerData) {
    const response = await requestService.post('/auth/register', registerData);
    return response?.data?.data;
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
  async signIn(userLoginData) {
    // Auth routes are at /api/auth/*, not /api/v1/auth/*
    // Temporarily override baseURL for this request
    const originalBaseURL = apiClient.defaults.baseURL;
    let updatedBaseURL = originalBaseURL;

    if (originalBaseURL) {
      try {
        // Use URL parsing to safely adjust the path segment
        // Determine base origin from originalBaseURL or fall back to window.location
        let baseOrigin = 'http://localhost';
        if (originalBaseURL.startsWith('http://') || originalBaseURL.startsWith('https://')) {
          // Extract origin from full URL
          const tempUrl = new URL(originalBaseURL);
          baseOrigin = tempUrl.origin;
        } else if (typeof window !== 'undefined' && window.location && window.location.origin) {
          baseOrigin = window.location.origin;
        }
        
        const parsedUrl = new URL(originalBaseURL, baseOrigin);
        parsedUrl.pathname = parsedUrl.pathname.replace(/\/api\/v1(\/?)/, '/api$1');
        // Use full URL if original was full URL, otherwise use pathname
        updatedBaseURL = originalBaseURL.startsWith('http') ? parsedUrl.toString() : parsedUrl.pathname;
      } catch (e) {
        // Fallback to simple string replacement
        updatedBaseURL = originalBaseURL.replace('/api/v1', '/api');
      }
    } else {
      // If there was no baseURL configured at all, fall back to /api
      updatedBaseURL = '/api';
    }

    apiClient.defaults.baseURL = updatedBaseURL;
    
    try {
      const response = await requestService.post('/auth/login', userLoginData);
      // Handle multiple response formats for compatibility with different API versions
      // - response.data.accessToken: v1 API direct token
      // - response.data.data.accessToken: v1 API nested token
      // - response.data.token: v2 API token format
      const token = response?.data?.accessToken || response?.data?.data?.accessToken || response?.data?.token;
      if (token) {
        this.saveToken(token);
      }
      return response?.data?.data || response?.data;
    } finally {
      // Restore original baseURL
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
    const response = await requestService.post(
      '/auth/forgot-password',
      forgotPasswordData
    );

    return response?.data?.data;
  },

  async resetPassword(resetPasswordData) {
    const response = await requestService.post(
      '/auth/reset-password',
      resetPasswordData
    );

    return response?.data?.data;
  },

  async signOut() {
    const response = await requestService.post('/auth/logout');
    this.removeToken();
    return response?.data?.data;
  },
  async fetchLoggedUser() {
    const response = await requestService.get('/auth/me');
    return response?.data?.data;
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
