/**
 * ProjectService - Handles saving and loading video editor projects
 * Stores editor state (timeline, fragments, settings) in user's account
 */

import requestService from '@/services/request-service/ApiRequestService';

class ProjectService {
  /**
   * Save current editor state as a project
   * @param {Object} projectData - Project data to save
   * @param {string} projectData.name - Project name
   * @param {string} projectData.description - Optional description
   * @param {Object} projectData.state - Editor state (timeline, fragments, etc.)
   * @param {string} projectId - Optional project ID for updates
   * @returns {Promise} Saved project data
   */
  async saveProject(projectData, projectId = null) {
    try {
      const payload = {
        name: projectData.name,
        description: projectData.description || '',
        state: projectData.state,
        video_type: projectData.videoType || null,
        video_id: projectData.videoId || null,
      };

      let response;
      if (projectId) {
        // Update existing project
        response = await requestService.put(
          `/video-editor-projects/${projectId}`,
          payload,
          {},
          true // requiresAuth
        );
      } else {
        // Create new project
        response = await requestService.post(
          '/video-editor-projects',
          payload,
          {},
          true // requiresAuth
        );
      }

      return response.data?.data || response.data || response;
    } catch (error) {
      console.error('Failed to save project:', error);
      throw new Error(`Failed to save project: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Load a saved project by ID
   * @param {string|number} projectId - Project ID
   * @returns {Promise} Project data
   */
  async loadProject(projectId) {
    try {
      const response = await requestService.get(
        `/video-editor-projects/${projectId}`,
        {},
        {},
        true // requiresAuth
      );

      const project = response.data?.data || response.data || response;
      
      // Validate project structure
      if (!project.state) {
        throw new Error('Invalid project format: missing state');
      }

      return project;
    } catch (error) {
      console.error('Failed to load project:', error);
      
      if (error.response?.status === 404) {
        throw new Error(`Project with ID ${projectId} not found`);
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to access this project');
      }
      
      throw new Error(`Failed to load project: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * List all projects for the current user
   * @param {Object} params - Query parameters (page, limit, etc.)
   * @returns {Promise} List of projects
   */
  async listProjects(params = {}) {
    try {
      const response = await requestService.get(
        '/video-editor-projects',
        { params },
        {},
        true // requiresAuth
      );

      const projects = response.data?.data || response.data || [];
      return Array.isArray(projects) ? projects : [];
    } catch (error) {
      console.error('Failed to list projects:', error);
      throw new Error(`Failed to list projects: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Delete a project
   * @param {string|number} projectId - Project ID
   * @returns {Promise} Deletion result
   */
  async deleteProject(projectId) {
    try {
      const response = await requestService.delete(
        `/video-editor-projects/${projectId}`,
        {},
        {},
        true // requiresAuth
      );

      return response;
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw new Error(`Failed to delete project: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Serialize editor state for saving
   * @param {Object} editorState - Current editor state from Vuex store
   * @returns {Object} Serialized state
   */
  serializeEditorState(editorState) {
    return {
      timeline: editorState.timeline.map(fragment => ({
        videoId: fragment.video.videoData?.id || fragment.video.videoData?.attributes?.id,
        videoUrl: fragment.video.videoUrl,
        videoType: editorState.videoType,
        start: fragment.start,
        end: fragment.end,
        playbackRate: fragment.playbackRate,
        volume: fragment.volume,
      })),
      videoType: editorState.videoType,
      videoId: editorState.videoId,
      videoMetadata: editorState.videoMetadata,
      player: {
        widthPercent: editorState.player.widthPercent,
      },
      configTimeline: {
        widthPerSecond: editorState.configTimeline.widthPerSecond,
      },
      export: {
        fps: editorState.export.fps,
        bitrate: editorState.export.bitrate,
        customResolution: editorState.export.customResolution,
        width: editorState.export.width,
        height: editorState.export.height,
        interpolate: editorState.export.interpolate,
      },
    };
  }

  /**
   * Deserialize project state for loading
   * @param {Object} projectData - Project data from API
   * @returns {Object} Deserialized state (to be used with store)
   */
  deserializeProjectState(projectData) {
    if (!projectData.state) {
      throw new Error('Invalid project: missing state data');
    }

    return {
      timeline: projectData.state.timeline || [],
      videoType: projectData.state.videoType || null,
      videoId: projectData.state.videoId || null,
      videoMetadata: projectData.state.videoMetadata || null,
      player: {
        widthPercent: projectData.state.player?.widthPercent || 0.75,
      },
      configTimeline: {
        widthPerSecond: projectData.state.configTimeline?.widthPerSecond || 3.5,
      },
      export: projectData.state.export || {},
    };
  }
}

export default new ProjectService();

