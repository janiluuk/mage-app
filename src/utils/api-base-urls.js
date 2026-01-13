import env from '@/utils/env';

const API_BASE_URL =
  env.VITE_API_BASE_URL || (env.VITE_API_URL ? `${env.VITE_API_URL}/api/v1` : '');
const API_V1_BASE_URL = API_BASE_URL;

export { API_BASE_URL, API_V1_BASE_URL };
