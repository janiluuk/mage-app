import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import VideoStatsService from './VideoStatsService';

vi.mock('axios');

describe('VideoStatsService', () => {
  afterEach(() => {
    vi.clearAllMocks();
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
});
