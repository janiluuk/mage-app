import requestService from '@/services/request-service/ApiRequestService';
import env from '@/utils/env';

/**
 * Service for managing generator instances and viewing metrics
 */
const instanceAdminService = {
  getAdminApiRoot() {
    if (env.VITE_API_URL) {
      return `${env.VITE_API_URL.replace(/\/$/, '')}/api`;
    }
    if (env.VITE_API_BASE_URL) {
      return env.VITE_API_BASE_URL.replace(/\/v1$/, '').replace(/\/$/, '');
    }
    return '';
  },

  /**
   * Get all generator instances (management list).
   * @returns {Promise<Object[]>}
   */
  async listInstances() {
    const base = this.getAdminApiRoot();
    const response = await requestService.get(`${base}/administration/generator-instances`);
    return response?.data;
  },

  /**
   * Get comprehensive status of all instances with metrics and FFMpeg worker status
   * @returns {Promise<Object>} Instance status data including instances, ffmpeg, and summary
   */
  async getStatus() {
    const base = this.getAdminApiRoot();
    const response = await requestService.get(`${base}/administration/instances/status`);
    return response?.data;
  },

  /**
   * Get historical metrics for a specific instance (24 hours)
   * @param {number} instanceId - Instance ID
   * @returns {Promise<Object>} Historical metrics data
   */
  async getMetricsHistory(instanceId) {
    const base = this.getAdminApiRoot();
    const response = await requestService.get(`${base}/administration/instances/${instanceId}/metrics-history`);
    return response?.data;
  },

  /**
   * Get job history for a specific instance
   * @param {number} instanceId - Instance ID
   * @returns {Promise<Object>} Job history data
   */
  async getJobHistory(instanceId) {
    const base = this.getAdminApiRoot();
    const response = await requestService.get(`${base}/administration/instances/${instanceId}/job-history`);
    return response?.data;
  },

  /**
   * Create a new generator instance.
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async createInstance(payload) {
    const base = this.getAdminApiRoot();
    const response = await requestService.post(`${base}/administration/generator-instances`, payload);
    return response?.data;
  },

  /**
   * Update an existing generator instance.
   * @param {number} instanceId
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async updateInstance(instanceId, payload) {
    const base = this.getAdminApiRoot();
    const response = await requestService.put(`${base}/administration/generator-instances/${instanceId}`, payload);
    return response?.data;
  },

  /**
   * Toggle enabled status for a generator instance.
   * @param {number} instanceId
   * @returns {Promise<Object>}
   */
  async toggleInstance(instanceId) {
    const base = this.getAdminApiRoot();
    const response = await requestService.patch(`${base}/administration/generator-instances/${instanceId}/toggle`);
    return response?.data;
  },

  /**
   * Delete a generator instance.
   * @param {number} instanceId
   * @returns {Promise<Object>}
   */
  async deleteInstance(instanceId) {
    const base = this.getAdminApiRoot();
    const response = await requestService.delete(`${base}/administration/generator-instances/${instanceId}`);
    return response?.data;
  },
};

export default instanceAdminService;
