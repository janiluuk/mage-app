import axios from 'axios';
import authHeader from './auth-header';
import { API_URL, APP_BASE_URL } from '@/utils/domains';

const API_V2_URL = API_URL ? `${API_URL}/api/v2` : '';
const BASE_URL = APP_BASE_URL;
const jsonApiHeaders = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
};

/**
 * Authenticate the user and persist the returned access token.
 * Attempts v1 JWT endpoint first, then falls back to v2 if v1 returns 404.
 */
async function login(user) {
  // Try v1 JWT endpoint first
  try {
    const { data } = await axios.post(
      `${API_URL}/api/auth/login`,
      {
        email: user.email,
        password: user.password,
      }
    );

    // Standardize token field name to access_token
    if (data?.access_token) {
      localStorage.setItem('auth.accessToken', data.access_token);
    } else if (data?.token) {
      // Fallback for legacy v1 responses
      localStorage.setItem('auth.accessToken', data.token);
    }

    return data;
  } catch (error) {
    // Only fallback to v2 if v1 endpoint doesn't exist (404)
    // For other errors (401, 500, etc.), throw immediately
    if (error.response?.status !== 404) {
      console.error('Login failed at v1 endpoint:', error.message);
      throw error;
    }
    
    console.log('v1 auth endpoint not found, falling back to v2');
    
    // Fallback to v2 endpoint
    const { data } = await axios.post(
      `${API_V2_URL}/login`,
      {
        email: user.email,
        password: user.password,
      },
      { headers: jsonApiHeaders }
    );

    if (data?.access_token) {
      localStorage.setItem('auth.accessToken', data.access_token);
    }

    return data;
  }
}

/**
 * Terminate the active session on the server and clear the local token.
 */
async function logout() {
  await axios.post(`${API_V2_URL}/logout`, {}, { headers: authHeader() });
  localStorage.removeItem('auth.accessToken');
}

/**
 * Register a new account and store the issued token when present.
 */
async function register(user) {
  const { data } = await axios.post(`${API_V2_URL}/register`, {
    name: user.name,
    email: user.email,
    password: user.password,
    password_confirmation: user.confirmPassword,
  });

  if (data?.access_token) {
    localStorage.setItem('auth.accessToken', data.access_token);
  }

  return data;
}

/**
 * Request a password reset email for the supplied address.
 */
async function passwordForgot(userEmail) {
  const response = await axios.post(
    `${API_V2_URL}/password-forgot`,
    {
      redirect_url: `${BASE_URL}/password-reset`,
      email: userEmail,
    },
    { headers: jsonApiHeaders }
  );

  return response.status;
}

/**
 * Complete a password reset with the provided token and new credentials.
 */
async function passwordReset(passwordDTO) {
  const response = await axios.post(
    `${API_V2_URL}/password-reset`,
    {
      password: passwordDTO.newPassword,
      password_confirmation: passwordDTO.confirmPassword,
      email: passwordDTO.email,
      token: passwordDTO.token,
    },
    { headers: jsonApiHeaders }
  );

  return response.status;
}

export default { login, logout, register, passwordForgot, passwordReset };
