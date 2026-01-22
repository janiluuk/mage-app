/**
 * Unit tests for VideoLoader
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import VideoLoader from '@/services/videoeditor/VideoLoader';
import FileService from '@/services/file.service';
import VideoJobsService from '@/services/videojobs.service';
import VideoFileAdapter from '@/services/videoeditor/VideoFileAdapter';

vi.mock('@/services/file.service');
vi.mock('@/services/videojobs.service');

describe('VideoLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadVideo', () => {
    it('loads file video successfully', async () => {
      const mockFileData = {
        data: {
          id: '123',
          url: 'https://example.com/video.mp4',
          fullPath: 'https://example.com/video.mp4',
          duration: 60,
          fps: 30,
          width: 1920,
          height: 1080,
          has_audio: true,
        },
      };
      
      FileService.get = vi.fn().mockResolvedValue(mockFileData);
      
      const videoFile = await VideoLoader.loadVideo('file', '123');
      
      expect(videoFile).toBeInstanceOf(VideoFileAdapter);
      expect(FileService.get).toHaveBeenCalledWith('123');
      expect(videoFile.videoData).toEqual(mockFileData.data);
    });

    it('loads job video successfully', async () => {
      const mockJobData = {
        id: '456',
        attributes: {
          url: 'https://example.com/job.mp4',
          length: 120,
          fps: 24,
          width: 1280,
          height: 720,
        },
      };
      
      VideoJobsService.get = vi.fn().mockResolvedValue(mockJobData);
      
      const videoFile = await VideoLoader.loadVideo('job', '456');
      
      expect(videoFile).toBeInstanceOf(VideoFileAdapter);
      expect(VideoJobsService.get).toHaveBeenCalledWith('456');
    });

    it('handles file video with 404 error', async () => {
      const error = {
        response: { status: 404 },
        message: 'Not found',
      };
      FileService.get = vi.fn().mockRejectedValue(error);
      
      await expect(VideoLoader.loadVideo('file', '123')).rejects.toThrow(
        'Video file with ID 123 not found'
      );
    });

    it('handles file video with 401 error', async () => {
      const error = {
        response: { status: 401 },
        message: 'Unauthorized',
      };
      FileService.get = vi.fn().mockRejectedValue(error);
      
      await expect(VideoLoader.loadVideo('file', '123')).rejects.toThrow(
        'Unauthorized'
      );
    });

    it('handles file video with 403 error', async () => {
      const error = {
        response: { status: 403 },
        message: 'Forbidden',
      };
      FileService.get = vi.fn().mockRejectedValue(error);
      
      await expect(VideoLoader.loadVideo('file', '123')).rejects.toThrow(
        'Access denied'
      );
    });

    it('handles unknown video type', async () => {
      await expect(VideoLoader.loadVideo('unknown', '123')).rejects.toThrow(
        'Unknown video type'
      );
    });

    it('handles missing video URL in file data', async () => {
      const mockFileData = {
        data: {
          id: '123',
          // No URL
        },
      };
      
      FileService.get = vi.fn().mockResolvedValue(mockFileData);
      
      await expect(VideoLoader.loadVideo('file', '123')).rejects.toThrow(
        'Video URL not found'
      );
    });

    it('handles missing video URL in job data', async () => {
      const mockJobData = {
        id: '456',
        attributes: {
          // No URL
        },
      };
      
      VideoJobsService.get = vi.fn().mockResolvedValue(mockJobData);
      
      await expect(VideoLoader.loadVideo('job', '456')).rejects.toThrow(
        'Video URL not found'
      );
    });
  });

  describe('extractMetadataFromFile', () => {
    it('extracts metadata from file data with attributes', () => {
      const fileData = {
        attributes: {
          duration: 60,
          fps: 30,
          width: 1920,
          height: 1080,
          full_path: 'https://example.com/video.mp4',
          type: 'mp4',
          codec: 'h264',
          bitrate: 5000000,
          has_audio: true,
        },
      };
      
      const metadata = VideoLoader.extractMetadataFromFile(fileData);
      
      expect(metadata.duration).toBe(60);
      expect(metadata.fps).toBe(30);
      expect(metadata.format.filename).toBe('https://example.com/video.mp4');
    });

    it('extracts metadata from direct file data', () => {
      const fileData = {
        duration: 60,
        fps: 30,
        width: 1920,
        height: 1080,
        url: 'https://example.com/video.mp4',
      };
      
      const metadata = VideoLoader.extractMetadataFromFile(fileData);
      
      expect(metadata.duration).toBe(60);
      expect(metadata.fps).toBe(30);
    });

    it('uses default values for missing metadata', () => {
      const fileData = {
        url: 'https://example.com/video.mp4',
      };
      
      const metadata = VideoLoader.extractMetadataFromFile(fileData);
      
      expect(metadata.duration).toBe(0);
      expect(metadata.fps).toBe(30);
      expect(metadata.videoStream.width).toBe(1920);
      expect(metadata.videoStream.height).toBe(1080);
    });
  });

  describe('extractMetadataFromJob', () => {
    it('extracts metadata from job data with attributes', () => {
      const jobData = {
        attributes: {
          url: 'https://example.com/job.mp4',
          length: 120,
          fps: 24,
          width: 1280,
          height: 720,
        },
      };
      
      const metadata = VideoLoader.extractMetadataFromJob(jobData);
      
      expect(metadata.duration).toBe(120);
      expect(metadata.fps).toBe(24);
      expect(metadata.format.filename).toBe('https://example.com/job.mp4');
      expect(metadata.hasAudio).toBe(true);
    });

    it('extracts metadata from direct job data', () => {
      const jobData = {
        url: 'https://example.com/job.mp4',
        length: 120,
        fps: 24,
      };
      
      const metadata = VideoLoader.extractMetadataFromJob(jobData);
      
      expect(metadata.duration).toBe(120);
      expect(metadata.fps).toBe(24);
    });

    it('uses default values for missing metadata', () => {
      const jobData = {
        url: 'https://example.com/job.mp4',
      };
      
      const metadata = VideoLoader.extractMetadataFromJob(jobData);
      
      expect(metadata.duration).toBe(0);
      expect(metadata.fps).toBe(30);
      expect(metadata.videoStream.width).toBe(1920);
      expect(metadata.videoStream.height).toBe(1080);
    });
  });
});

