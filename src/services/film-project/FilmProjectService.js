import requestService from '../request-service/ApiRequestService';
import env from '@/utils/env';

const getApiRoot = () => {
  if (env.VITE_API_URL) {
    return `${env.VITE_API_URL.replace(/\/$/, '')}/api`;
  }
  if (env.VITE_API_BASE_URL) {
    return env.VITE_API_BASE_URL.replace(/\/v1$/, '').replace(/\/$/, '');
  }
  return '';
};

/**
 * Service for managing film projects, sequences, and shots
 */
class FilmProjectService {
  // Projects
  async getProjects(params = {}) {
    try {
      const response = await requestService.get(`${getApiRoot()}/film-projects`, params, {}, true);
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  async getProjectById(id) {
    try {
      const response = await requestService.get(`${getApiRoot()}/film-projects/${id}`, {}, {}, true);
      return response.data?.data || response.data || null;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  }

  async createProject(data) {
    try {
      const response = await requestService.post(`${getApiRoot()}/film-projects`, data, {}, true);
      return response.data?.data || response.data || null;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async updateProject(id, data) {
    try {
      const response = await requestService.put(`${getApiRoot()}/film-projects/${id}`, data, {}, true);
      return response.data?.data || response.data || null;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  async deleteProject(id) {
    try {
      await requestService.delete(`${getApiRoot()}/film-projects/${id}`, {}, {}, true);
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  // Sequences
  async getSequences(projectId, params = {}) {
    try {
      const response = await requestService.get(
        `${getApiRoot()}/film-projects/${projectId}/sequences`,
        params,
        {},
        true
      );
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Error fetching sequences:', error);
      throw error;
    }
  }

  async getSequenceById(projectId, sequenceId) {
    try {
      const response = await requestService.get(
        `${getApiRoot()}/film-projects/${projectId}/sequences/${sequenceId}`,
        {},
        {},
        true
      );
      return response.data?.data || response.data || null;
    } catch (error) {
      console.error('Error fetching sequence:', error);
      throw error;
    }
  }

  async createSequence(projectId, data) {
    try {
      const response = await requestService.post(
        `${getApiRoot()}/film-projects/${projectId}/sequences`,
        data,
        {},
        true
      );
      return response.data?.data || response.data || null;
    } catch (error) {
      console.error('Error creating sequence:', error);
      throw error;
    }
  }

  async updateSequence(projectId, sequenceId, data) {
    try {
      const response = await requestService.put(
        `${getApiRoot()}/film-projects/${projectId}/sequences/${sequenceId}`,
        data,
        {},
        true
      );
      return response.data?.data || response.data || null;
    } catch (error) {
      console.error('Error updating sequence:', error);
      throw error;
    }
  }

  async deleteSequence(projectId, sequenceId) {
    try {
      await requestService.delete(
        `${getApiRoot()}/film-projects/${projectId}/sequences/${sequenceId}`,
        {},
        {},
        true
      );
      return true;
    } catch (error) {
      console.error('Error deleting sequence:', error);
      throw error;
    }
  }

  // Shots
  async getShots(projectId, sequenceId, params = {}) {
    try {
      const response = await requestService.get(
        `${getApiRoot()}/film-projects/${projectId}/sequences/${sequenceId}/shots`,
        params,
        {},
        true
      );
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Error fetching shots:', error);
      throw error;
    }
  }

  async getShotById(projectId, sequenceId, shotId) {
    try {
      const response = await requestService.get(
        `${getApiRoot()}/film-projects/${projectId}/sequences/${sequenceId}/shots/${shotId}`,
        {},
        {},
        true
      );
      return response.data?.data || response.data || null;
    } catch (error) {
      console.error('Error fetching shot:', error);
      throw error;
    }
  }

  async createShot(projectId, sequenceId, data) {
    try {
      const response = await requestService.post(
        `${getApiRoot()}/film-projects/${projectId}/sequences/${sequenceId}/shots`,
        data,
        {},
        true
      );
      return response.data?.data || response.data || null;
    } catch (error) {
      console.error('Error creating shot:', error);
      throw error;
    }
  }

  async updateShot(projectId, sequenceId, shotId, data) {
    try {
      const response = await requestService.put(
        `${getApiRoot()}/film-projects/${projectId}/sequences/${sequenceId}/shots/${shotId}`,
        data,
        {},
        true
      );
      return response.data?.data || response.data || null;
    } catch (error) {
      console.error('Error updating shot:', error);
      throw error;
    }
  }

  async deleteShot(projectId, sequenceId, shotId) {
    try {
      await requestService.delete(
        `${getApiRoot()}/film-projects/${projectId}/sequences/${sequenceId}/shots/${shotId}`,
        {},
        {},
        true
      );
      return true;
    } catch (error) {
      console.error('Error deleting shot:', error);
      throw error;
    }
  }

  // AI Generation
  async getAvailableModels() {
    try {
      const response = await requestService.get(`${getApiRoot()}/film-projects/ai/models`, {}, {}, true);
      return response.data?.data || response.data || null;
    } catch (error) {
      console.error('Error fetching available models:', error);
      throw error;
    }
  }

  async generateScript(projectId, prompt, options = {}) {
    try {
      const response = await requestService.post(
        `${getApiRoot()}/film-projects/${projectId}/generate/script`,
        { prompt, options },
        {},
        true
      );
      return response.data?.data || response.data || null;
    } catch (error) {
      console.error('Error generating script:', error);
      throw error;
    }
  }

  async generateScene(projectId, sequenceId, shotId, prompt, options = {}) {
    try {
      const response = await requestService.post(
        `${getApiRoot()}/film-projects/${projectId}/sequences/${sequenceId}/shots/${shotId}/generate/scene`,
        { prompt, options },
        {},
        true
      );
      return response.data?.data || response.data || null;
    } catch (error) {
      console.error('Error generating scene:', error);
      throw error;
    }
  }
}

export default new FilmProjectService();

