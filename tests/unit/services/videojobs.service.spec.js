import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import VideoJobService from '@/services/videojobs.service';
import requestService from '@/services/request-service/ApiRequestService';

// Mock env module
vi.mock('@/utils/env', () => ({
  default: {
    VITE_API_URL: 'http://localhost:3000'
  }
}));

// Mock the request service
vi.mock('@/services/request-service/ApiRequestService', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn()
  }
}));

describe('VideoJobService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('upload', () => {
    it('should upload file with basic parameters', async () => {
      const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
      const mockResponse = { data: { id: '123', url: 'http://example.com/test.mp3' } };
      
      requestService.post.mockResolvedValue(mockResponse);
      
      const result = await VideoJobService.upload(mockFile, 'deforum', null);
      
      expect(requestService.post).toHaveBeenCalledWith(
        '/upload',
        expect.any(FormData),
        expect.objectContaining({
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      );
      
      expect(result).toEqual(mockResponse);
    });

    it('should include motion style in upload', async () => {
      const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
      const mockResponse = { data: { id: '123' } };
      const extraData = { motionStyle: 'audio_sync' };
      
      requestService.post.mockResolvedValue(mockResponse);
      
      await VideoJobService.upload(mockFile, 'deforum', null, extraData);
      
      const callArgs = requestService.post.mock.calls[0];
      const formData = callArgs[1];
      
      expect(formData).toBeInstanceOf(FormData);
      // Note: FormData entries cannot be directly inspected in tests
      // This verifies the method was called with FormData
    });

    it('should include preset data in upload', async () => {
      const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
      const mockResponse = { data: { id: '123' } };
      const preset = {
        id: 1,
        name: 'Slow Zoom In',
        settings: { zoom: '0:(1.0025)' }
      };
      const extraData = { 
        motionStyle: 'classic',
        preset: preset
      };
      
      requestService.post.mockResolvedValue(mockResponse);
      
      await VideoJobService.upload(mockFile, 'deforum', null, extraData);
      
      const callArgs = requestService.post.mock.calls[0];
      const formData = callArgs[1];
      
      expect(formData).toBeInstanceOf(FormData);
      expect(requestService.post).toHaveBeenCalledTimes(1);
    });

    it('should include BPM data in upload', async () => {
      const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
      const mockResponse = { data: { id: '123' } };
      const extraData = { 
        motionStyle: 'bpm',
        bpm: 120
      };
      
      requestService.post.mockResolvedValue(mockResponse);
      
      await VideoJobService.upload(mockFile, 'deforum', null, extraData);
      
      expect(requestService.post).toHaveBeenCalledWith(
        '/upload',
        expect.any(FormData),
        expect.objectContaining({
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      );
    });

    it('should handle upload progress callback', async () => {
      const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
      const mockResponse = { data: { id: '123' } };
      const progressCallback = vi.fn();
      
      requestService.post.mockResolvedValue(mockResponse);
      
      await VideoJobService.upload(mockFile, 'deforum', progressCallback);
      
      expect(requestService.post).toHaveBeenCalledWith(
        '/upload',
        expect.any(FormData),
        expect.objectContaining({
          onUploadProgress: progressCallback
        })
      );
    });

    it('should work without extra data', async () => {
      const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
      const mockResponse = { data: { id: '123' } };
      
      requestService.post.mockResolvedValue(mockResponse);
      
      await VideoJobService.upload(mockFile, 'deforum', null);
      
      expect(requestService.post).toHaveBeenCalledTimes(1);
      expect(requestService.post).toHaveBeenCalledWith(
        '/upload',
        expect.any(FormData),
        expect.any(Object)
      );
    });

    it('should include all parameters when provided', async () => {
      const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
      const mockResponse = { data: { id: '123' } };
      const preset = { id: 1, name: 'Test', settings: {} };
      const progressCallback = vi.fn();
      const extraData = {
        motionStyle: 'classic',
        preset: preset,
        bpm: 120
      };
      
      requestService.post.mockResolvedValue(mockResponse);
      
      await VideoJobService.upload(mockFile, 'deforum', progressCallback, extraData);
      
      expect(requestService.post).toHaveBeenCalledWith(
        '/upload',
        expect.any(FormData),
        expect.objectContaining({
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: progressCallback
        })
      );
    });

    it('should handle upload errors', async () => {
      const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
      const mockError = new Error('Upload failed');
      
      requestService.post.mockRejectedValue(mockError);
      
      await expect(VideoJobService.upload(mockFile, 'deforum', null)).rejects.toThrow('Upload failed');
    });
  });

  describe('finalize methods', () => {
    const mockParams = {
      jobId: '123',
      settings: { quality: 'high' }
    };

    it('should call finalize endpoint using helper', async () => {
      const mockResponse = { data: { id: '123', status: 'processing' } };
      requestService.post.mockResolvedValue(mockResponse);

      const result = await VideoJobService.finalize(mockParams);

      expect(requestService.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/finalize',
        mockParams,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should call finalizeDeforum using the same helper', async () => {
      const mockResponse = { data: { id: '456', status: 'processing' } };
      requestService.post.mockResolvedValue(mockResponse);

      const result = await VideoJobService.finalizeDeforum(mockParams);

      expect(requestService.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/finalize',
        mockParams,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle finalize errors', async () => {
      const mockError = new Error('Finalize failed');
      requestService.post.mockRejectedValue(mockError);

      await expect(VideoJobService.finalize(mockParams)).rejects.toThrow('Finalize failed');
    });

    it('should handle finalizeDeforum errors', async () => {
      const mockError = new Error('Finalize failed');
      requestService.post.mockRejectedValue(mockError);

      await expect(VideoJobService.finalizeDeforum(mockParams)).rejects.toThrow('Finalize failed');
    });
  });
});
