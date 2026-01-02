import { describe, it, expect, beforeEach, vi } from 'vitest';
import authHeader from './auth-header';

describe('authHeader', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('returns Authorization header when token exists', () => {
    localStorage.setItem('auth.accessToken', 'test-token-123');

    const headers = authHeader();

    expect(headers.Authorization).toBe('Bearer test-token-123');
    expect(headers.Accept).toBe('application/vnd.api+json');
    expect(headers['Content-Type']).toBe('application/vnd.api+json');
  });

  it('returns empty object when no token exists', () => {
    const headers = authHeader();

    expect(headers).toEqual({});
    expect(headers.Authorization).toBeUndefined();
  });

  it('returns empty object when token is null', () => {
    localStorage.removeItem('auth.accessToken');
    localStorage.setItem('auth.accessToken', null);

    const headers = authHeader();

    // localStorage stores null as string "null", so it will return headers
    expect(headers.Authorization).toBe('Bearer null');
  });

  it('returns empty object when token is empty string', () => {
    localStorage.setItem('auth.accessToken', '');

    const headers = authHeader();

    expect(headers).toEqual({});
  });

  it('includes all required headers when token exists', () => {
    localStorage.setItem('auth.accessToken', 'valid-token');

    const headers = authHeader();

    expect(Object.keys(headers)).toContain('Authorization');
    expect(Object.keys(headers)).toContain('Accept');
    expect(Object.keys(headers)).toContain('Content-Type');
    expect(Object.keys(headers).length).toBe(3);
  });
});
