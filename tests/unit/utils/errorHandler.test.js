/**
 * Unit tests for errorHandler utility
 * @module errorHandler.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeError, getUserFriendlyMessage, handleError } from '@/utils/errorHandler';

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeError', () => {
    it('should normalize string errors', () => {
      const result = normalizeError('Test error', 'TestContext');
      
      expect(result.message).toBe('Test error');
      expect(result.context).toBe('TestContext');
      expect(result.code).toBeNull();
      expect(result.timestamp).toBeDefined();
    });

    it('should normalize Error objects', () => {
      const error = new Error('Test error');
      error.code = 500;
      const result = normalizeError(error, 'TestContext');
      
      expect(result.message).toBe('Test error');
      expect(result.code).toBe(500);
      expect(result.context).toBe('TestContext');
      expect(result.original).toBe(error);
    });

    it('should normalize API error responses', () => {
      const error = {
        response: {
          status: 404,
          data: {
            errors: [{
              detail: 'Resource not found',
              title: 'Not Found'
            }]
          }
        }
      };
      const result = normalizeError(error, 'APIContext');
      
      expect(result.message).toBe('Resource not found');
      expect(result.code).toBe(404);
    });

    it('should handle error with message in data', () => {
      const error = {
        response: {
          status: 500,
          data: {
            message: 'Server error occurred'
          }
        }
      };
      const result = normalizeError(error);
      
      expect(result.message).toBe('Server error occurred');
      expect(result.code).toBe(500);
    });

    it('should handle generic objects', () => {
      const error = { error: 'Something went wrong' };
      const result = normalizeError(error);
      
      expect(result.message).toBe('Something went wrong');
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return code-specific messages', () => {
      const error = { response: { status: 404 } };
      const message = getUserFriendlyMessage(error);
      
      expect(message).toBe('The requested resource was not found.');
    });

    it('should return error message if short enough', () => {
      const error = new Error('File not found');
      const message = getUserFriendlyMessage(error);
      
      expect(message).toBe('File not found');
    });

    it('should return default message for long errors', () => {
      const longMessage = 'a'.repeat(300);
      const error = new Error(longMessage);
      const message = getUserFriendlyMessage(error, 'Custom default');
      
      expect(message).toBe('Custom default');
    });

    it('should handle 401 errors', () => {
      const error = { response: { status: 401 } };
      const message = getUserFriendlyMessage(error);
      
      expect(message).toBe('You are not authorized. Please log in.');
    });

    it('should handle 500 errors', () => {
      const error = { response: { status: 500 } };
      const message = getUserFriendlyMessage(error);
      
      expect(message).toBe('A server error occurred. Please try again later.');
    });
  });

  describe('handleError', () => {
    it('should normalize error and return result', () => {
      const error = new Error('Test error');
      const result = handleError(error, { context: 'TestContext' });
      
      expect(result.message).toBe('Test error');
      expect(result.context).toBe('TestContext');
    });

    it('should call toast.add if toast provided', () => {
      const toast = {
        add: vi.fn()
      };
      const error = new Error('Test error');
      
      handleError(error, { toast, context: 'TestContext' });
      
      expect(toast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Test error',
        life: 5000
      });
    });

    it('should use default message in toast', () => {
      const toast = {
        add: vi.fn()
      };
      const error = { response: { status: 500 } };
      
      handleError(error, { 
        toast, 
        defaultMessage: 'Custom error message',
        context: 'TestContext' 
      });
      
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'A server error occurred. Please try again later.'
        })
      );
    });

    it('should not log in production', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalEnv = import.meta.env.DEV;
      
      // Simulate production
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, DEV: false },
        writable: true
      });
      
      handleError(new Error('Test'), { logError: false });
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      // Restore
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, DEV: originalEnv },
        writable: true
      });
      
      consoleSpy.mockRestore();
    });
  });
});

