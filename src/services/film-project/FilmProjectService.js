import requestService from '@/services/request-service/ApiRequestService';

const BASE = '/film-projects';

/**
 * Service for interacting with the Film Project API endpoints.
 * Maps to the Laravel API routes under /film-projects.
 */
const FilmProjectService = {
  // ── Projects ────────────────────────────────────────────────────────

  async getProjects() {
    const response = await requestService.get(BASE);
    return response.data?.data || response.data || [];
  },

  async getProjectById(id) {
    const response = await requestService.get(`${BASE}/${id}`);
    return response.data?.data || response.data;
  },

  async createProject(data) {
    const response = await requestService.post(BASE, data);
    return response.data?.data || response.data;
  },

  async updateProject(id, data) {
    const response = await requestService.put(`${BASE}/${id}`, data);
    return response.data?.data || response.data;
  },

  async deleteProject(id) {
    const response = await requestService.delete(`${BASE}/${id}`);
    return response.data;
  },

  // ── Sequences ───────────────────────────────────────────────────────

  async getSequences(projectId) {
    const response = await requestService.get(`${BASE}/${projectId}/sequences`);
    return response.data?.data || response.data || [];
  },

  async getSequenceById(projectId, sequenceId) {
    const response = await requestService.get(`${BASE}/${projectId}/sequences/${sequenceId}`);
    return response.data?.data || response.data;
  },

  async createSequence(projectId, data) {
    const response = await requestService.post(`${BASE}/${projectId}/sequences`, data);
    return response.data?.data || response.data;
  },

  async updateSequence(projectId, sequenceId, data) {
    const response = await requestService.put(`${BASE}/${projectId}/sequences/${sequenceId}`, data);
    return response.data?.data || response.data;
  },

  async deleteSequence(projectId, sequenceId) {
    const response = await requestService.delete(`${BASE}/${projectId}/sequences/${sequenceId}`);
    return response.data;
  },

  // ── Shots ───────────────────────────────────────────────────────────

  async getShots(projectId, sequenceId) {
    const response = await requestService.get(
      `${BASE}/${projectId}/sequences/${sequenceId}/shots`
    );
    return response.data?.data || response.data || [];
  },

  async getShotById(projectId, sequenceId, shotId) {
    const response = await requestService.get(
      `${BASE}/${projectId}/sequences/${sequenceId}/shots/${shotId}`
    );
    return response.data?.data || response.data;
  },

  async createShot(projectId, sequenceId, data) {
    const response = await requestService.post(
      `${BASE}/${projectId}/sequences/${sequenceId}/shots`,
      data
    );
    return response.data?.data || response.data;
  },

  async updateShot(projectId, sequenceId, shotId, data) {
    const response = await requestService.put(
      `${BASE}/${projectId}/sequences/${sequenceId}/shots/${shotId}`,
      data
    );
    return response.data?.data || response.data;
  },

  async deleteShot(projectId, sequenceId, shotId) {
    const response = await requestService.delete(
      `${BASE}/${projectId}/sequences/${sequenceId}/shots/${shotId}`
    );
    return response.data;
  },

  // ── AI Generation ──────────────────────────────────────────────────

  async generateScript(projectId, prompt, options = {}) {
    const response = await requestService.post(
      `${BASE}/${projectId}/generate/script`,
      { prompt, ...options }
    );
    return response.data?.data || response.data;
  },

  async generateScene(projectId, sequenceId, shotId, prompt, options = {}) {
    const response = await requestService.post(
      `${BASE}/${projectId}/sequences/${sequenceId}/shots/${shotId}/generate/scene`,
      { prompt, ...options }
    );
    return response.data?.data || response.data;
  },

  // ── AI Models ──────────────────────────────────────────────────────

  async getAvailableModels() {
    const response = await requestService.get(`${BASE}/ai/models`);
    return response.data?.data || response.data || [];
  },
};

export default FilmProjectService;

