import { describe, it, expect, vi, beforeEach } from 'vitest';
import customJobService from './customJobService';
import requestService from '@/services/request-service/ApiRequestService';

vi.mock('@/services/request-service/ApiRequestService', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('customJobService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('process', () => {
    it('should send formData to the correct endpoint', async () => {
      const mockFormData = new FormData();
      mockFormData.append('job_type', 'beat-match');
      
      const mockResponse = {
        data: {
          success: true,
          job_id: 'test-job-123',
        },
      };

      requestService.post.mockResolvedValue(mockResponse);

      const result = await customJobService.process(mockFormData);

      expect(requestService.post).toHaveBeenCalledWith(
        '/v1/custom-jobs/process',
        mockFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors gracefully', async () => {
      const mockFormData = new FormData();
      const mockError = new Error('Upload failed');

      requestService.post.mockRejectedValue(mockError);

      await expect(customJobService.process(mockFormData)).rejects.toThrow('Upload failed');
      expect(requestService.post).toHaveBeenCalledTimes(1);
    });

    it('should log errors to console', async () => {
      const mockFormData = new FormData();
      const mockError = new Error('Network error');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      requestService.post.mockRejectedValue(mockError);

      await expect(customJobService.process(mockFormData)).rejects.toThrow('Network error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error processing custom job:', mockError);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getStatus', () => {
    it('should fetch job status by ID', async () => {
      const jobId = 'test-job-456';
      const mockResponse = {
        data: {
          status: 'completed',
          progress: 100,
          url: 'https://example.com/output.mp4',
        },
      };

      requestService.get.mockResolvedValue(mockResponse);

      const result = await customJobService.getStatus(jobId);

      expect(requestService.get).toHaveBeenCalledWith(`/v1/custom-jobs/${jobId}/status`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle status fetch errors', async () => {
      const jobId = 'test-job-789';
      const mockError = new Error('Job not found');

      requestService.get.mockRejectedValue(mockError);

      await expect(customJobService.getStatus(jobId)).rejects.toThrow('Job not found');
      expect(requestService.get).toHaveBeenCalledTimes(1);
    });

    it('should log status errors to console', async () => {
      const jobId = 'test-job-999';
      const mockError = new Error('API error');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      requestService.get.mockRejectedValue(mockError);

      await expect(customJobService.getStatus(jobId)).rejects.toThrow('API error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting job status:', mockError);

      consoleErrorSpy.mockRestore();
    });
  });
});
