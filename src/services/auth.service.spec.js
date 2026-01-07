import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import authService from './auth.service';
import authHeader from './auth-header';

// Mock modules
vi.mock('axios');
vi.mock('./auth-header');

describe('auth.service', () => {
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = value; },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; }
    };
  })();
  
  beforeEach(() => {
    global.localStorage = localStorageMock;
    localStorageMock.clear();
    vi.clearAllMocks();
  });
  
  describe('login', () => {
    it('authenticates user and stores access token', async () => {
      const user = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const mockResponse = {
        data: {
          access_token: 'mock-token-12345',
          user: { id: 1, email: 'test@example.com' }
        }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      const result = await authService.login(user);
      
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/login'),
        {
          email: user.email,
          password: user.password
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json'
          })
        })
      );
      
      expect(localStorage.getItem('auth.accessToken')).toBe('mock-token-12345');
      expect(result).toEqual(mockResponse.data);
    });
    
    it('does not store token when not present', async () => {
      const user = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const mockResponse = {
        data: {
          user: { id: 1, email: 'test@example.com' }
        }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      await authService.login(user);
      
      expect(localStorage.getItem('auth.accessToken')).toBeNull();
    });
    
    it('handles login errors', async () => {
      const user = {
        email: 'test@example.com',
        password: 'wrong-password'
      };
      
      axios.post.mockRejectedValue(new Error('Invalid credentials'));
      
      await expect(authService.login(user)).rejects.toThrow('Invalid credentials');
    });
  });
  
  describe('logout', () => {
    it('terminates session and clears token', async () => {
      localStorage.setItem('auth.accessToken', 'existing-token');
      
      const mockHeaders = { Authorization: 'Bearer existing-token' };
      authHeader.mockReturnValue(mockHeaders);
      
      axios.post.mockResolvedValue({ status: 200 });
      
      await authService.logout();
      
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/logout'),
        {},
        { headers: mockHeaders }
      );
      
      expect(localStorage.getItem('auth.accessToken')).toBeNull();
    });
    
    it('does not clear token if server request fails', async () => {
      localStorage.setItem('auth.accessToken', 'existing-token');
      authHeader.mockReturnValue({});
      
      axios.post.mockRejectedValue(new Error('Network error'));
      
      await expect(authService.logout()).rejects.toThrow('Network error');
      
      // Token should not be cleared if logout request fails
      expect(localStorage.getItem('auth.accessToken')).toBe('existing-token');
    });
  });
  
  describe('register', () => {
    it('registers new user and stores token', async () => {
      const user = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };
      
      const mockResponse = {
        data: {
          access_token: 'new-user-token',
          user: { id: 1, name: 'Test User', email: 'test@example.com' }
        }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      const result = await authService.register(user);
      
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/register'),
        {
          name: user.name,
          email: user.email,
          password: user.password,
          password_confirmation: user.confirmPassword
        }
      );
      
      expect(localStorage.getItem('auth.accessToken')).toBe('new-user-token');
      expect(result).toEqual(mockResponse.data);
    });
    
    it('does not store token when not present', async () => {
      const user = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };
      
      const mockResponse = {
        data: {
          user: { id: 1, name: 'Test User' }
        }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      await authService.register(user);
      
      expect(localStorage.getItem('auth.accessToken')).toBeNull();
    });
    
    it('handles registration errors', async () => {
      const user = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };
      
      axios.post.mockRejectedValue(new Error('Email already exists'));
      
      await expect(authService.register(user)).rejects.toThrow('Email already exists');
    });
  });
  
  describe('passwordForgot', () => {
    it('requests password reset email', async () => {
      const email = 'test@example.com';
      
      axios.post.mockResolvedValue({ status: 200 });
      
      const status = await authService.passwordForgot(email);
      
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/password-forgot'),
        {
          redirect_url: expect.stringContaining('/password-reset'),
          email: email
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: 'application/vnd.api+json'
          })
        })
      );
      
      expect(status).toBe(200);
    });
    
    it('handles password forgot errors', async () => {
      const email = 'nonexistent@example.com';
      
      axios.post.mockRejectedValue(new Error('User not found'));
      
      await expect(authService.passwordForgot(email)).rejects.toThrow('User not found');
    });
  });
  
  describe('passwordReset', () => {
    it('completes password reset', async () => {
      const passwordDTO = {
        email: 'test@example.com',
        token: 'reset-token-12345',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      };
      
      axios.post.mockResolvedValue({ status: 200 });
      
      const status = await authService.passwordReset(passwordDTO);
      
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/password-reset'),
        {
          password: passwordDTO.newPassword,
          password_confirmation: passwordDTO.confirmPassword,
          email: passwordDTO.email,
          token: passwordDTO.token
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: 'application/vnd.api+json'
          })
        })
      );
      
      expect(status).toBe(200);
    });
    
    it('handles password reset errors', async () => {
      const passwordDTO = {
        email: 'test@example.com',
        token: 'invalid-token',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      };
      
      axios.post.mockRejectedValue(new Error('Invalid or expired token'));
      
      await expect(authService.passwordReset(passwordDTO)).rejects.toThrow('Invalid or expired token');
    });
  });
});
