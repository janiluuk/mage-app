import { describe, it, expect, beforeEach, vi } from 'vitest';
import instanceAdminService from '@/services/instanceAdminService';
import requestService from '@/services/request-service/ApiRequestService';
import env from '@/utils/env';

// Mock the request service
vi.mock('@/services/request-service/ApiRequestService', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}));

// Mock the env module
vi.mock('@/utils/env', () => ({
  default: {
    VITE_API_URL: undefined,
    VITE_API_BASE_URL: undefined
  }
}));

describe('instanceAdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStatus', () => {
    it('should fetch comprehensive instance status', async () => {
      const mockResponse = {
        data: {
          instances: [
            {
              id: 1,
              name: 'ComfyUI-1',
              type: 'comfyui',
              health_status: 'online',
              queue_count: 2,
              metrics: {
                gpu_utilization: 75.5,
                cpu_utilization: 45.2,
                memory_utilization: 60.8,
                current_model: 'stable-diffusion-xl'
              }
            }
          ],
          ffmpeg: {
            active_count: 2,
            pending_count: 1,
            active_jobs: [
              { id: 101, filename: 'video_123.mp4', progress: 40 }
            ]
          },
          summary: {
            total_instances: 1,
            online_instances: 1,
            total_queue: 2
          }
        }
      };

      requestService.get.mockResolvedValue(mockResponse);

      const result = await instanceAdminService.getStatus();

      expect(requestService.get).toHaveBeenCalledWith('/administration/instances/status');
      expect(result).toEqual(mockResponse.data);
      expect(result.instances).toHaveLength(1);
      expect(result.ffmpeg.active_count).toBe(2);
    });

    it('should handle errors when fetching status', async () => {
      const mockError = new Error('Network error');
      requestService.get.mockRejectedValue(mockError);

      await expect(instanceAdminService.getStatus()).rejects.toThrow('Network error');
    });
  });

  describe('getMetricsHistory', () => {
    it('should fetch historical metrics for an instance', async () => {
      const instanceId = 1;
      const mockResponse = {
        data: {
          history: [
            {
              timestamp: '2024-01-24T00:00:00Z',
              gpu_utilization: 70.0,
              cpu_utilization: 40.0,
              memory_utilization: 55.0
            },
            {
              timestamp: '2024-01-24T01:00:00Z',
              gpu_utilization: 75.0,
              cpu_utilization: 45.0,
              memory_utilization: 60.0
            }
          ]
        }
      };

      requestService.get.mockResolvedValue(mockResponse);

      const result = await instanceAdminService.getMetricsHistory(instanceId);

      expect(requestService.get).toHaveBeenCalledWith('/administration/instances/1/metrics-history');
      expect(result).toEqual(mockResponse.data);
      expect(result.history).toHaveLength(2);
    });

    it('should handle errors when fetching metrics history', async () => {
      const mockError = new Error('Instance not found');
      requestService.get.mockRejectedValue(mockError);

      await expect(instanceAdminService.getMetricsHistory(1)).rejects.toThrow('Instance not found');
    });
  });

  describe('getJobHistory', () => {
    it('should fetch job history for an instance', async () => {
      const instanceId = 1;
      const mockResponse = {
        data: {
          jobs: [
            {
              id: 101,
              status: 'completed',
              processing_time: 120.5,
              created_at: '2024-01-24T00:00:00Z',
              completed_at: '2024-01-24T00:02:00Z'
            },
            {
              id: 102,
              status: 'completed',
              processing_time: 95.3,
              created_at: '2024-01-24T00:05:00Z',
              completed_at: '2024-01-24T00:06:35Z'
            }
          ]
        }
      };

      requestService.get.mockResolvedValue(mockResponse);

      const result = await instanceAdminService.getJobHistory(instanceId);

      expect(requestService.get).toHaveBeenCalledWith('/administration/instances/1/job-history');
      expect(result).toEqual(mockResponse.data);
      expect(result.jobs).toHaveLength(2);
    });

    it('should handle errors when fetching job history', async () => {
      const mockError = new Error('Access denied');
      requestService.get.mockRejectedValue(mockError);

      await expect(instanceAdminService.getJobHistory(1)).rejects.toThrow('Access denied');
    });
  });

  describe('getAdminApiRoot', () => {
    beforeEach(() => {
      // Reset env mocks
      env.VITE_API_URL = undefined;
      env.VITE_API_BASE_URL = undefined;
    });

    it('should return API root from VITE_API_URL', () => {
      env.VITE_API_URL = 'https://api.example.com';
      const root = instanceAdminService.getAdminApiRoot();
      expect(root).toBe('https://api.example.com/api');
    });

    it('should handle VITE_API_URL with trailing slash', () => {
      env.VITE_API_URL = 'https://api.example.com/';
      const root = instanceAdminService.getAdminApiRoot();
      expect(root).toBe('https://api.example.com/api');
    });

    it('should return API root from VITE_API_BASE_URL', () => {
      env.VITE_API_BASE_URL = 'https://api.example.com/v1';
      const root = instanceAdminService.getAdminApiRoot();
      expect(root).toBe('https://api.example.com');
    });

    it('should handle VITE_API_BASE_URL with trailing slash', () => {
      env.VITE_API_BASE_URL = 'https://api.example.com/v1/';
      const root = instanceAdminService.getAdminApiRoot();
      // The regex /\/v1$/ only matches if string ends with /v1 (no trailing slash)
      // So /v1/ becomes /v1 after removing trailing slash, then /v1 is not removed
      expect(root).toBe('https://api.example.com/v1');
    });

    it('should handle VITE_API_BASE_URL without /v1', () => {
      env.VITE_API_BASE_URL = 'https://api.example.com/';
      const root = instanceAdminService.getAdminApiRoot();
      expect(root).toBe('https://api.example.com');
    });

    it('should prefer VITE_API_URL over VITE_API_BASE_URL', () => {
      env.VITE_API_URL = 'https://api.example.com';
      env.VITE_API_BASE_URL = 'https://other.example.com/v1';
      const root = instanceAdminService.getAdminApiRoot();
      expect(root).toBe('https://api.example.com/api');
    });

    it('should return empty string when no env vars are set', () => {
      env.VITE_API_URL = undefined;
      env.VITE_API_BASE_URL = undefined;
      const root = instanceAdminService.getAdminApiRoot();
      expect(root).toBe('');
    });
  });

  describe('listInstances', () => {
    it('should fetch all generator instances', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            name: 'ComfyUI-1',
            type: 'comfyui',
            url: 'http://192.168.1.100:8188',
            enabled: true
          },
          {
            id: 2,
            name: 'SD-Forge-1',
            type: 'stable_diffusion_forge',
            url: 'http://192.168.1.101:7860',
            enabled: false
          }
        ]
      };

      requestService.get.mockResolvedValue(mockResponse);

      const result = await instanceAdminService.listInstances();

      expect(requestService.get).toHaveBeenCalledWith('/administration/generator-instances');
      expect(result).toEqual(mockResponse.data);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('ComfyUI-1');
    });

    it('should handle errors when listing instances', async () => {
      const mockError = new Error('Unauthorized');
      requestService.get.mockRejectedValue(mockError);

      await expect(instanceAdminService.listInstances()).rejects.toThrow('Unauthorized');
    });

    it('should handle empty response', async () => {
      const mockResponse = { data: [] };
      requestService.get.mockResolvedValue(mockResponse);

      const result = await instanceAdminService.listInstances();
      expect(result).toEqual([]);
    });
  });

  describe('createInstance', () => {
    it('should create a new generator instance', async () => {
      const payload = {
        name: 'New ComfyUI Instance',
        url: 'http://192.168.1.200:8188',
        type: 'comfyui',
        enabled: true
      };

      const mockResponse = {
        data: {
          id: 3,
          ...payload,
          created_at: '2024-01-24T00:00:00Z'
        }
      };

      requestService.post.mockResolvedValue(mockResponse);

      const result = await instanceAdminService.createInstance(payload);

      expect(requestService.post).toHaveBeenCalledWith(
        '/administration/generator-instances',
        payload
      );
      expect(result).toEqual(mockResponse.data);
      expect(result.id).toBe(3);
      expect(result.name).toBe('New ComfyUI Instance');
    });

    it('should handle validation errors when creating instance', async () => {
      const payload = {
        name: '',
        url: 'invalid-url',
        type: 'invalid_type'
      };

      const mockError = new Error('Validation failed');
      requestService.post.mockRejectedValue(mockError);

      await expect(instanceAdminService.createInstance(payload)).rejects.toThrow('Validation failed');
    });
  });

  describe('updateInstance', () => {
    it('should update an existing generator instance', async () => {
      const instanceId = 1;
      const payload = {
        name: 'Updated Instance Name',
        url: 'http://192.168.1.150:8188',
        type: 'comfyui'
      };

      const mockResponse = {
        data: {
          id: instanceId,
          ...payload,
          enabled: true,
          updated_at: '2024-01-24T01:00:00Z'
        }
      };

      requestService.put.mockResolvedValue(mockResponse);

      const result = await instanceAdminService.updateInstance(instanceId, payload);

      expect(requestService.put).toHaveBeenCalledWith(
        `/administration/generator-instances/${instanceId}`,
        payload
      );
      expect(result).toEqual(mockResponse.data);
      expect(result.id).toBe(instanceId);
      expect(result.name).toBe('Updated Instance Name');
    });

    it('should handle errors when updating instance', async () => {
      const mockError = new Error('Instance not found');
      requestService.put.mockRejectedValue(mockError);

      await expect(instanceAdminService.updateInstance(999, { name: 'Test' })).rejects.toThrow('Instance not found');
    });
  });

  describe('toggleInstance', () => {
    it('should toggle instance enabled status', async () => {
      const instanceId = 1;
      const mockResponse = {
        data: {
          id: instanceId,
          name: 'Test Instance',
          enabled: false,
          updated_at: '2024-01-24T02:00:00Z'
        }
      };

      requestService.patch.mockResolvedValue(mockResponse);

      const result = await instanceAdminService.toggleInstance(instanceId);

      expect(requestService.patch).toHaveBeenCalledWith(
        `/administration/generator-instances/${instanceId}/toggle`
      );
      expect(result).toEqual(mockResponse.data);
      expect(result.enabled).toBe(false);
    });

    it('should handle errors when toggling instance', async () => {
      const mockError = new Error('Instance not found');
      requestService.patch.mockRejectedValue(mockError);

      await expect(instanceAdminService.toggleInstance(999)).rejects.toThrow('Instance not found');
    });
  });

  describe('deleteInstance', () => {
    it('should delete a generator instance', async () => {
      const instanceId = 1;
      const mockResponse = {
        data: {
          message: 'Generator instance deleted successfully'
        }
      };

      requestService.delete.mockResolvedValue(mockResponse);

      const result = await instanceAdminService.deleteInstance(instanceId);

      expect(requestService.delete).toHaveBeenCalledWith(
        `/administration/generator-instances/${instanceId}`
      );
      expect(result).toEqual(mockResponse.data);
      expect(result.message).toBe('Generator instance deleted successfully');
    });

    it('should handle errors when deleting instance', async () => {
      const mockError = new Error('Cannot delete instance');
      requestService.delete.mockRejectedValue(mockError);

      await expect(instanceAdminService.deleteInstance(1)).rejects.toThrow('Cannot delete instance');
    });
  });
});
