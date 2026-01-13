import axios from 'axios';
import authHeader from './auth-header';
import { API_URL, APP_BASE_URL } from '@/utils/domains';

const API_URL_V2 = API_URL ? `${API_URL}/api/v2` : '';
const BASE_URL = APP_BASE_URL;
const jsonApiHeaders = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
};

/**
 * Authenticate the user and persist the returned access token.
 */
async function login(user) {
  const { data } = await axios.post(
    `${API_URL_V2}/login`,
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

/**
 * Terminate the active session on the server and clear the local token.
 */
async function logout() {
  await axios.post(`${API_URL_V2}/logout`, {}, { headers: authHeader() });
  localStorage.removeItem('auth.accessToken');
}

/**
 * Register a new account and store the issued token when present.
 */
async function register(user) {
  const { data } = await axios.post(`${API_URL_V2}/register`, {
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
    `${API_URL_V2}/password-forgot`,
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
    `${API_URL_V2}/password-reset`,
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
