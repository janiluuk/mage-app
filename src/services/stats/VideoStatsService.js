import axios from 'axios';
import authHeader from '../auth-header';
import { API_V1_BASE_URL as V1_BASE_URL } from '@/utils/api-base-urls';

const API_V1_BASE_URL = V1_BASE_URL;

// Cache for stats to reduce API calls
const statsCache = {
  data: null,
  timestamp: 0,
  maxAge: 30000 // 30 seconds
};

class VideoStatsService {
  /**
   * Get video statistics for dashboard
   * @param {boolean} forceRefresh - Skip cache and fetch fresh data
   * @returns {Promise<Object>} Statistics object
   */
  async getStats(forceRefresh = false) {
    // Return cached data if available and not expired
    const now = Date.now();
    if (!forceRefresh && statsCache.data && (now - statsCache.timestamp) < statsCache.maxAge) {
      return statsCache.data;
    }

    try {
      const { data } = await axios.get(`${API_V1_BASE_URL}/stats`, {
        headers: authHeader()
      });
      const stats = {
        totalVideos: data.totalVideos || 0,
        processingJobs: data.processingJobs || 0,
        completedToday: data.completedToday || 0,
        failedJobs: data.failedJobs || 0
      };
      
      // Update cache
      statsCache.data = stats;
      statsCache.timestamp = now;
      
      return stats;
    } catch (error) {
      console.error('Error fetching video stats:', error);
      // Return cached data if available, otherwise return zeros
      if (statsCache.data) {
        return statsCache.data;
      }
      return {
        totalVideos: 0,
        processingJobs: 0,
        completedToday: 0,
        failedJobs: 0
      };
    }
  }

  /**
   * Get recent activity for user
   * @returns {Promise<Array>} Recent activity items
   */
  async getRecentActivity() {
    try {
      const { data } = await axios.get(`${API_V1_BASE_URL}/stats/recent`, {
        headers: authHeader()
      });
      return data.activities || [];
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  /**
   * Clear the stats cache
   */
  clearCache() {
    statsCache.data = null;
    statsCache.timestamp = 0;
  }
}

export default new VideoStatsService();
