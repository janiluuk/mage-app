import requestService from '@/services/request-service/ApiRequestService'
import { normalizeError, getUserFriendlyMessage } from '@/utils/errorHandler'

class StoryService {
  constructor({ request = requestService } = {}) {
    this.request = request
  }

  /**
   * List all stories
   * @param {Object} params - Query parameters (status, search, per_page)
   * @returns {Promise}
   */
  async listStories(params = {}) {
    try {
      const response = await this.request.get('/story', { params })
      return response.data
    } catch (error) {
      const normalized = normalizeError(error, 'StoryService.listStories');
      throw new Error(getUserFriendlyMessage(normalized, 'Failed to load stories'));
    }
  }

  /**
   * Get a single story with jobs for editing
   * @param {number} id - Story ID
   * @returns {Promise}
   */
  async getStory(id) {
    try {
      const response = await this.request.get(`/story/${id}`)
      return response.data
    } catch (error) {
      const normalized = normalizeError(error, `StoryService.getStory(${id})`);
      if (error.response?.status === 404) {
        throw new Error('Story not found');
      }
      throw new Error(getUserFriendlyMessage(normalized, 'Failed to load story'));
    }
  }

  /**
   * Update story metadata
   * @param {number} id - Story ID
   * @param {Object} data - Story data (name, description)
   * @returns {Promise}
   */
  async updateStory(id, data) {
    try {
      const response = await this.request.put(`/story/${id}`, data)
      return response.data
    } catch (error) {
      console.error(`Failed to update story ${id}:`, error)
      if (error.response?.status === 404) {
        throw new Error('Story not found')
      }
      if (error.response?.status === 422) {
        throw new Error(error.message || 'Validation error')
      }
      throw new Error(error.message || 'Failed to update story')
    }
  }

  /**
   * Update job order in story
   * @param {number} id - Story ID
   * @param {Array} jobOrders - Array of {job_id, order, description}
   * @returns {Promise}
   */
  async updateJobOrder(id, jobOrders) {
    try {
      const response = await this.request.put(`/story/${id}/jobs/order`, {
        job_orders: jobOrders
      })
      return response.data
    } catch (error) {
      console.error(`Failed to update job order for story ${id}:`, error)
      if (error.response?.status === 404) {
        throw new Error('Story not found')
      }
      throw new Error(error.message || 'Failed to update job order')
    }
  }

  /**
   * Assign jobs to story
   * @param {number} id - Story ID
   * @param {Array} jobIds - Array of job IDs
   * @param {Object} descriptions - Optional map of job_id to description
   * @returns {Promise}
   */
  async assignJobs(id, jobIds, descriptions = {}) {
    try {
      const response = await this.request.post(`/story/${id}/jobs`, {
        job_ids: jobIds,
        descriptions: descriptions
      })
      return response.data
    } catch (error) {
      console.error(`Failed to assign jobs to story ${id}:`, error)
      if (error.response?.status === 404) {
        throw new Error('Story not found')
      }
      throw new Error(error.message || 'Failed to assign jobs')
    }
  }

  /**
   * Remove jobs from story
   * @param {number} id - Story ID
   * @param {Array} jobIds - Array of job IDs to remove
   * @returns {Promise}
   */
  async removeJobs(id, jobIds) {
    try {
      const response = await this.request.delete(`/story/${id}/jobs`, {
        data: { job_ids: jobIds }
      })
      return response.data
    } catch (error) {
      console.error(`Failed to remove jobs from story ${id}:`, error)
      if (error.response?.status === 404) {
        throw new Error('Story not found')
      }
      throw new Error(error.message || 'Failed to remove jobs')
    }
  }
}

export default StoryService

