import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/auth/AuthService', () => ({
  default: {
    getToken: vi.fn(),
    getJwtData: vi.fn(),
    hasToken: vi.fn(),
    removeToken: vi.fn()
  }
}));

import AuthService from '@/services/auth/AuthService';
import router from './index.js';

describe('Router auth flow', () => {
  beforeEach(async () => {
    AuthService.getToken.mockReturnValue(null);
    AuthService.getJwtData.mockReturnValue(null);
    AuthService.hasToken.mockReturnValue(false);
    await router.replace('/');
  });

  it('registers verify-email route with handleAuth meta', () => {
    const verifyRoute = router
      .getRoutes()
      .find((route) => route.path === '/verify-email');
    expect(verifyRoute).toBeDefined();
    expect(verifyRoute.meta.handleAuth).toBe(true);
  });

  it('redirects authenticated users away from verify-email', async () => {
    AuthService.getToken.mockReturnValue('token');
    AuthService.getJwtData.mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 3600
    });
    AuthService.hasToken.mockReturnValue(true);

    await router.push('/verify-email');
    await router.isReady();

    expect(router.currentRoute.value.name).toBe('Library');
  });

  it('allows unauthenticated users to access verify-email', async () => {
    await router.push('/verify-email');
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/verify-email');
  });
});
