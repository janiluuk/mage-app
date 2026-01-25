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

  describe('OAuth callback routes', () => {
    it('registers Discord callback route with handleAuth meta', () => {
      const discordRoute = router
        .getRoutes()
        .find((route) => route.path === '/discord/callback');
      expect(discordRoute).toBeDefined();
      expect(discordRoute.meta.handleAuth).toBe(true);
      expect(discordRoute.name).toBe('DiscordCallback');
    });

    it('registers Google callback route with handleAuth meta', () => {
      const googleRoute = router
        .getRoutes()
        .find((route) => route.path === '/google/callback');
      expect(googleRoute).toBeDefined();
      expect(googleRoute.meta.handleAuth).toBe(true);
      expect(googleRoute.name).toBe('GoogleCallback');
    });

    it('registers Facebook callback route with handleAuth meta', () => {
      const facebookRoute = router
        .getRoutes()
        .find((route) => route.path === '/facebook/callback');
      expect(facebookRoute).toBeDefined();
      expect(facebookRoute.meta.handleAuth).toBe(true);
      expect(facebookRoute.name).toBe('FacebookCallback');
    });

    it('Discord callback route has correct provider prop', () => {
      const discordRoute = router
        .getRoutes()
        .find((route) => route.path === '/discord/callback');
      expect(discordRoute.props).toEqual({ default: { provider: 'discord' } });
    });

    it('Google callback route has correct provider prop', () => {
      const googleRoute = router
        .getRoutes()
        .find((route) => route.path === '/google/callback');
      expect(googleRoute.props).toEqual({ default: { provider: 'google' } });
    });

    it('redirects authenticated users away from OAuth callback routes', async () => {
      AuthService.getToken.mockReturnValue('token');
      AuthService.getJwtData.mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600
      });
      AuthService.hasToken.mockReturnValue(true);

      await router.push('/discord/callback?code=test123');
      await router.isReady();

      expect(router.currentRoute.value.name).toBe('Library');
    });

    it('allows unauthenticated users to access OAuth callback routes', async () => {
      await router.push('/google/callback?code=test456');
      await router.isReady();

      expect(router.currentRoute.value.path).toBe('/google/callback');
    });
  });
});
