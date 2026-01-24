import requestService from '@/services/request-service/ApiRequestService';

/**
 * Service for managing generator instances and viewing metrics
 */
const instanceAdminService = {
  /**
   * Get comprehensive status of all instances with metrics and FFMpeg worker status
   * @returns {Promise<Object>} Instance status data including instances, ffmpeg, and summary
   */
  async getStatus() {
    const response = await requestService.get('/administration/instances/status');
    return response?.data;
  },

  /**
   * Get historical metrics for a specific instance (24 hours)
   * @param {number} instanceId - Instance ID
   * @returns {Promise<Object>} Historical metrics data
   */
  async getMetricsHistory(instanceId) {
    const response = await requestService.get(`/administration/instances/${instanceId}/metrics-history`);
    return response?.data;
  },

  /**
   * Get job history for a specific instance
   * @param {number} instanceId - Instance ID
   * @returns {Promise<Object>} Job history data
   */
  async getJobHistory(instanceId) {
    const response = await requestService.get(`/administration/instances/${instanceId}/job-history`);
    return response?.data;
  }
};

export default instanceAdminService;
