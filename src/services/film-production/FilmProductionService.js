import requestService from '../request-service/ApiRequestService';

const BASE_PATH = '/film-productions';

/**
 * Service for managing film productions, sequences, and shots
 */
class FilmProductionService {
  // Productions
  async getProductions(params = {}) {
    try {
      const response = await requestService.get(BASE_PATH, params, {}, true);
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Error fetching productions:', error);
      throw error;
    }
  }

  async getProductionById(id) {
    try {
      const response = await requestService.get(`${BASE_PATH}/${id}`, {}, {}, true);
      return response.data?.data || response.data || null;
    } catch (error) {
      console.error('Error fetching production:', error);
      throw error;
    }
  }

  async createProduction(data) {
    try {
      const response = await requestService.post(BASE_PATH, data, {}, true);
      return response.data?.data || response.data || null;
    } catch (error) {
      console.error('Error creating production:', error);
      throw error;
    }
  }

  async updateProduction(id, data) {
    try {
      const response = await requestService.put(`${BASE_PATH}/${id}`, data, {}, true);
      return response.data?.data || response.data || null;
    } catch (error) {
      console.error('Error updating production:', error);
      throw error;
    }
  }

  async deleteProduction(id) {
    try {
      await requestService.delete(`${BASE_PATH}/${id}`, {}, {}, true);
      return true;
    } catch (error) {
      console.error('Error deleting production:', error);
      throw error;
    }
  }

  // Sequences
  async getSequences(productionId, params = {}) {
    try {
      const response = await requestService.get(
        `${BASE_PATH}/${productionId}/sequences`,
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

  async getSequenceById(productionId, sequenceId) {
    try {
      const response = await requestService.get(
        `${BASE_PATH}/${productionId}/sequences/${sequenceId}`,
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

  async createSequence(productionId, data) {
    try {
      const response = await requestService.post(
        `${BASE_PATH}/${productionId}/sequences`,
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

  async updateSequence(productionId, sequenceId, data) {
    try {
      const response = await requestService.put(
        `${BASE_PATH}/${productionId}/sequences/${sequenceId}`,
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

  async deleteSequence(productionId, sequenceId) {
    try {
      await requestService.delete(
        `${BASE_PATH}/${productionId}/sequences/${sequenceId}`,
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
  async getShots(productionId, sequenceId, params = {}) {
    try {
      const response = await requestService.get(
        `${BASE_PATH}/${productionId}/sequences/${sequenceId}/shots`,
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

  async getShotById(productionId, sequenceId, shotId) {
    try {
      const response = await requestService.get(
        `${BASE_PATH}/${productionId}/sequences/${sequenceId}/shots/${shotId}`,
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

  async createShot(productionId, sequenceId, data) {
    try {
      const response = await requestService.post(
        `${BASE_PATH}/${productionId}/sequences/${sequenceId}/shots`,
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

  async updateShot(productionId, sequenceId, shotId, data) {
    try {
      const response = await requestService.put(
        `${BASE_PATH}/${productionId}/sequences/${sequenceId}/shots/${shotId}`,
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

  async deleteShot(productionId, sequenceId, shotId) {
    try {
      await requestService.delete(
        `${BASE_PATH}/${productionId}/sequences/${sequenceId}/shots/${shotId}`,
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
  async generateScript(productionId, prompt, options = {}) {
    try {
      const response = await requestService.post(
        `${BASE_PATH}/${productionId}/generate/script`,
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

  async generateScene(productionId, sequenceId, shotId, prompt, options = {}) {
    try {
      const response = await requestService.post(
        `${BASE_PATH}/${productionId}/sequences/${sequenceId}/shots/${shotId}/generate/scene`,
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

export default new FilmProductionService();

