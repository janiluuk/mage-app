import { describe, it, expect, beforeEach, vi } from 'vitest';
import modelfileService from './modelfile.service';
import requestService from '@/services/request-service/ApiRequestService';

vi.mock('@/services/request-service/ApiRequestService');

describe('modelfile.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('fetches enabled model files successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            { type: 'model-files', id: '1', attributes: { name: 'Model 1', enabled: true } },
            { type: 'model-files', id: '2', attributes: { name: 'Model 2', enabled: true } }
          ]
        }
      };

      requestService.get.mockResolvedValue(mockResponse);

      const result = await modelfileService.list({ page: 1 });

      expect(requestService.get).toHaveBeenCalledWith(
        '/model-files?filter[enabled]=1',
        { page: 1 }
      );
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('handles empty list response', async () => {
      const mockResponse = {
        data: {
          data: []
        }
      };

      requestService.get.mockResolvedValue(mockResponse);

      const result = await modelfileService.list({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('handles errors and logs them', async () => {
      const error = new Error('Network error');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      requestService.get.mockRejectedValue(error);

      await expect(modelfileService.list({})).rejects.toThrow('Network error');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch model files:',
        'Network error'
      );

      consoleErrorSpy.mockRestore();
    });

    it('propagates errors after logging', async () => {
      const error = new Error('API Error');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      requestService.get.mockRejectedValue(error);

      await expect(modelfileService.list({})).rejects.toThrow('API Error');

      consoleErrorSpy.mockRestore();
    });

    it('filters by enabled=1', async () => {
      const mockResponse = {
        data: {
          data: [
            { type: 'model-files', id: '1', attributes: { enabled: true } }
          ]
        }
      };

      requestService.get.mockResolvedValue(mockResponse);

      await modelfileService.list({});

      // Verify the filter query parameter is included
      expect(requestService.get).toHaveBeenCalledWith(
        expect.stringContaining('filter[enabled]=1'),
        expect.anything()
      );
    });

    it('passes additional parameters to request service', async () => {
      const mockResponse = {
        data: {
          data: []
        }
      };

      requestService.get.mockResolvedValue(mockResponse);

      const params = { page: 2, sort: 'name' };
      await modelfileService.list(params);

      expect(requestService.get).toHaveBeenCalledWith(
        expect.any(String),
        params
      );
    });
  });
});
