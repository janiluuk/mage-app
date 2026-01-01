import axios from 'axios';
import authHeader from '../auth-header';

const API_V1_BASE_URL = process.env.VUE_APP_API_V1_BASE_URL;

class VideoStatsService {
  /**
   * Get video statistics for dashboard
   * @returns {Promise<Object>} Statistics object
   */
  async getStats() {
    try {
      const { data } = await axios.get(`${API_V1_BASE_URL}/stats`, {
        headers: authHeader()
      });
      return {
        totalVideos: data.totalVideos || 0,
        processingJobs: data.processingJobs || 0,
        completedToday: data.completedToday || 0,
        failedJobs: data.failedJobs || 0
      };
    } catch (error) {
      console.error('Error fetching video stats:', error);
      // Return zeros as fallback
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
}

export default new VideoStatsService();
