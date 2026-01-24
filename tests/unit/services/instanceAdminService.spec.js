import { describe, it, expect, beforeEach, vi } from 'vitest';
import instanceAdminService from '@/services/instanceAdminService';
import requestService from '@/services/request-service/ApiRequestService';

// Mock the request service
vi.mock('@/services/request-service/ApiRequestService', () => ({
  default: {
    get: vi.fn()
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
});
