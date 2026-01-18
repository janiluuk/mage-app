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
    apiClient.defaults.baseURL = apiClient.defaults.baseURL?.replace('/api/v1', '/api') || '/api';
    
    try {
      const response = await requestService.post('/auth/login', userLoginData);
      // Handle both response formats
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
