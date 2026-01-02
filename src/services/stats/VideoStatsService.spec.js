import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import VideoStatsService from './VideoStatsService';

vi.mock('axios');

describe('VideoStatsService', () => {
  afterEach(() => {
    vi.clearAllMocks();
    VideoStatsService.clearCache();
  });

  describe('getStats', () => {
    it('returns stats from API', async () => {
      const mockData = {
        totalVideos: 10,
        processingJobs: 2,
        completedToday: 5,
        failedJobs: 1
      };
      
      axios.get.mockResolvedValue({ data: mockData });
      
      const stats = await VideoStatsService.getStats();
      
      expect(stats).toEqual(mockData);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/stats'),
        expect.any(Object)
      );
    });

    it('returns zeros on API error', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));
      
      const stats = await VideoStatsService.getStats();
      
      expect(stats).toEqual({
        totalVideos: 0,
        processingJobs: 0,
        completedToday: 0,
        failedJobs: 0
      });
    });

    it('returns zeros for missing data fields', async () => {
      axios.get.mockResolvedValue({ data: { totalVideos: 5 } });
      
      const stats = await VideoStatsService.getStats();
      
      expect(stats).toEqual({
        totalVideos: 5,
        processingJobs: 0,
        completedToday: 0,
        failedJobs: 0
      });
    });

    it('uses cached data when available and not expired', async () => {
      const mockData = {
        totalVideos: 10,
        processingJobs: 2,
        completedToday: 5,
        failedJobs: 1
      };
      
      axios.get.mockResolvedValue({ data: mockData });
      
      // First call - should fetch from API
      await VideoStatsService.getStats();
      expect(axios.get).toHaveBeenCalledTimes(1);
      
      // Second call - should use cache
      await VideoStatsService.getStats();
      expect(axios.get).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('bypasses cache with forceRefresh parameter', async () => {
      const mockData = {
        totalVideos: 10,
        processingJobs: 2,
        completedToday: 5,
        failedJobs: 1
      };
      
      axios.get.mockResolvedValue({ data: mockData });
      
      // First call
      await VideoStatsService.getStats();
      expect(axios.get).toHaveBeenCalledTimes(1);
      
      // Second call with forceRefresh
      await VideoStatsService.getStats(true);
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    it('returns cached data on error if available', async () => {
      const mockData = {
        totalVideos: 10,
        processingJobs: 2,
        completedToday: 5,
        failedJobs: 1
      };
      
      // First call succeeds
      axios.get.mockResolvedValueOnce({ data: mockData });
      const firstStats = await VideoStatsService.getStats();
      expect(firstStats).toEqual(mockData);
      
      // Clear cache and make it expire
      VideoStatsService.clearCache();
      
      // Second call fails
      axios.get.mockRejectedValueOnce(new Error('Network error'));
      const secondStats = await VideoStatsService.getStats();
      
      // Should return zeros since cache was cleared
      expect(secondStats).toEqual({
        totalVideos: 0,
        processingJobs: 0,
        completedToday: 0,
        failedJobs: 0
      });
    });
  });

  describe('getRecentActivity', () => {
    it('returns recent activity from API', async () => {
      const mockActivities = [
        { id: 1, type: 'upload', timestamp: '2024-01-01' },
        { id: 2, type: 'process', timestamp: '2024-01-02' }
      ];
      
      axios.get.mockResolvedValue({ data: { activities: mockActivities } });
      
      const activity = await VideoStatsService.getRecentActivity();
      
      expect(activity).toEqual(mockActivities);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/stats/recent'),
        expect.any(Object)
      );
    });

    it('returns empty array on API error', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));
      
      const activity = await VideoStatsService.getRecentActivity();
      
      expect(activity).toEqual([]);
    });
  });

  describe('clearCache', () => {
    it('clears the stats cache', async () => {
      const mockData = {
        totalVideos: 10,
        processingJobs: 2,
        completedToday: 5,
        failedJobs: 1
      };
      
      axios.get.mockResolvedValue({ data: mockData });
      
      // Populate cache
      await VideoStatsService.getStats();
      expect(axios.get).toHaveBeenCalledTimes(1);
      
      // Clear cache
      VideoStatsService.clearCache();
      
      // Next call should fetch from API again
      await VideoStatsService.getStats();
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });
});
