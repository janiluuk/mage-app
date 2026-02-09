import * as actions from './types/actions';
import * as mutations from './types/mutations';
import FilmProjectService from '@/services/film-project/FilmProjectService';
import * as notificationActions from '@/store/modules/notification/types/actions';

const normalizeProject = (project) => {
  if (!project) return null;
  return {
    id: project.id || project.attributes?.id,
    name: project.attributes?.name || project.name,
    description: project.attributes?.description || project.description,
    status: project.attributes?.status || project.status,
    thumbnail: project.attributes?.thumbnail || project.thumbnail,
    createdAt: project.attributes?.createdAt || project.createdAt,
    updatedAt: project.attributes?.updatedAt || project.updatedAt,
    ...project.attributes,
    ...project,
  };
};

const normalizeSequence = (sequence) => {
  if (!sequence) return null;
  return {
    id: sequence.id || sequence.attributes?.id,
    projectId: sequence.attributes?.projectId || sequence.projectId,
    name: sequence.attributes?.name || sequence.name,
    description: sequence.attributes?.description || sequence.description,
    order: sequence.attributes?.order || sequence.order,
    script: sequence.attributes?.script || sequence.script,
    ...sequence.attributes,
    ...sequence,
  };
};

const normalizeShot = (shot) => {
  if (!shot) return null;
  return {
    id: shot.id || shot.attributes?.id,
    sequenceId: shot.attributes?.sequenceId || shot.sequenceId,
    projectId: shot.attributes?.projectId || shot.projectId,
    name: shot.attributes?.name || shot.name,
    description: shot.attributes?.description || shot.description,
    order: shot.attributes?.order || shot.order,
    duration: shot.attributes?.duration || shot.duration,
    sceneData: shot.attributes?.sceneData || shot.sceneData,
    ...shot.attributes,
    ...shot,
  };
};

export default {
  // Projects
  [actions.GET_PRODUCTIONS]: async ({ commit, dispatch }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const projects = await FilmProjectService.getProjects();
      const normalized = projects.reduce((acc, prod) => {
        const normalized = normalizeProject(prod);
        if (normalized?.id) {
          acc[normalized.id] = normalized;
        }
        return acc;
      }, {});
      commit(mutations.SET_PRODUCTIONS, normalized);
      commit(mutations.SET_LOADING, false);
    } catch (error) {
      commit(mutations.SET_LOADING, false);
      commit(mutations.SET_ERROR, error);
      dispatch(
        'notification/' + notificationActions.SET_ERROR_NOTIFICATION,
        error,
        { root: true }
      );
    }
  },

  [actions.GET_PRODUCTION]: async ({ commit, dispatch }, id) => {
    try {
      commit(mutations.SET_LOADING, true);
      const project = await FilmProjectService.getProjectById(id);
      const normalized = normalizeProject(project);
      commit(mutations.SET_PRODUCTION, normalized);
      commit(mutations.SET_CURRENT_PRODUCTION, id);
      commit(mutations.SET_LOADING, false);
      return normalized;
    } catch (error) {
      commit(mutations.SET_LOADING, false);
      commit(mutations.SET_ERROR, error);
      dispatch(
        'notification/' + notificationActions.SET_ERROR_NOTIFICATION,
        error,
        { root: true }
      );
      throw error;
    }
  },

  [actions.CREATE_PRODUCTION]: async ({ commit, dispatch }, data) => {
    try {
      commit(mutations.SET_LOADING, true);
      const project = await FilmProjectService.createProject(data);
      const normalized = normalizeProject(project);
      commit(mutations.ADD_PRODUCTION, normalized);
      commit(mutations.SET_LOADING, false);
      return normalized;
    } catch (error) {
      commit(mutations.SET_LOADING, false);
      commit(mutations.SET_ERROR, error);
      dispatch(
        'notification/' + notificationActions.SET_ERROR_NOTIFICATION,
        error,
        { root: true }
      );
      throw error;
    }
  },

  [actions.UPDATE_PRODUCTION]: async ({ commit, dispatch }, { id, data }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const project = await FilmProjectService.updateProject(id, data);
      const normalized = normalizeProject(project);
      commit(mutations.UPDATE_PRODUCTION_STATE, { id, data: normalized });
      commit(mutations.SET_LOADING, false);
      return normalized;
    } catch (error) {
      commit(mutations.SET_LOADING, false);
      commit(mutations.SET_ERROR, error);
      dispatch(
        'notification/' + notificationActions.SET_ERROR_NOTIFICATION,
        error,
        { root: true }
      );
      throw error;
    }
  },

  [actions.DELETE_PRODUCTION]: async ({ commit, dispatch }, id) => {
    try {
      commit(mutations.SET_LOADING, true);
      await FilmProjectService.deleteProject(id);
      commit(mutations.REMOVE_PRODUCTION, id);
      commit(mutations.SET_LOADING, false);
    } catch (error) {
      commit(mutations.SET_LOADING, false);
      commit(mutations.SET_ERROR, error);
      dispatch(
        'notification/' + notificationActions.SET_ERROR_NOTIFICATION,
        error,
        { root: true }
      );
      throw error;
    }
  },

  // Sequences
  [actions.GET_SEQUENCES]: async ({ commit, dispatch }, projectId) => {
    try {
      commit(mutations.SET_LOADING, true);
      const sequences = await FilmProjectService.getSequences(projectId);
      const normalized = sequences.reduce((acc, seq) => {
        const normalized = normalizeSequence(seq);
        if (normalized?.id) {
          acc[normalized.id] = normalized;
        }
        return acc;
      }, {});
      commit(mutations.SET_SEQUENCES, normalized);
      commit(mutations.SET_LOADING, false);
    } catch (error) {
      commit(mutations.SET_LOADING, false);
      commit(mutations.SET_ERROR, error);
      dispatch(
        'notification/' + notificationActions.SET_ERROR_NOTIFICATION,
        error,
        { root: true }
      );
    }
  },

  [actions.GET_SEQUENCE]: async ({ commit, dispatch }, { projectId, sequenceId }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const sequence = await FilmProjectService.getSequenceById(projectId, sequenceId);
      const normalized = normalizeSequence(sequence);
      commit(mutations.SET_SEQUENCE, normalized);
      commit(mutations.SET_CURRENT_SEQUENCE, sequenceId);
      commit(mutations.SET_LOADING, false);
      return normalized;
    } catch (error) {
      commit(mutations.SET_LOADING, false);
      commit(mutations.SET_ERROR, error);
      dispatch(
        'notification/' + notificationActions.SET_ERROR_NOTIFICATION,
        error,
        { root: true }
      );
      throw error;
    }
  },

  [actions.CREATE_SEQUENCE]: async ({ commit, dispatch }, { projectId, data }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const sequence = await FilmProjectService.createSequence(projectId, data);
      const normalized = normalizeSequence(sequence);
      commit(mutations.ADD_SEQUENCE, normalized);
      commit(mutations.SET_LOADING, false);
      return normalized;
    } catch (error) {
      commit(mutations.SET_LOADING, false);
      commit(mutations.SET_ERROR, error);
      dispatch(
        'notification/' + notificationActions.SET_ERROR_NOTIFICATION,
        error,
        { root: true }
      );
      throw error;
    }
  },

  [actions.UPDATE_SEQUENCE]: async ({ commit, dispatch }, { projectId, sequenceId, data }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const sequence = await FilmProjectService.updateSequence(projectId, sequenceId, data);
      const normalized = normalizeSequence(sequence);
      commit(mutations.UPDATE_SEQUENCE_STATE, { id: sequenceId, data: normalized });
      commit(mutations.SET_LOADING, false);
      return normalized;
    } catch (error) {
      commit(mutations.SET_LOADING, false);
      commit(mutations.SET_ERROR, error);
      dispatch(
        'notification/' + notificationActions.SET_ERROR_NOTIFICATION,
        error,
        { root: true }
      );
      throw error;
    }
  },

  [actions.DELETE_SEQUENCE]: async ({ commit, dispatch }, { projectId, sequenceId }) => {
    try {
      commit(mutations.SET_LOADING, true);
      await FilmProjectService.deleteSequence(projectId, sequenceId);
      commit(mutations.REMOVE_SEQUENCE, sequenceId);
      commit(mutations.SET_LOADING, false);
    } catch (error) {
      commit(mutations.SET_LOADING, false);
      commit(mutations.SET_ERROR, error);
      dispatch(
        'notification/' + notificationActions.SET_ERROR_NOTIFICATION,
        error,
        { root: true }
      );
      throw error;
    }
  },

  // Shots
  [actions.GET_SHOTS]: async ({ commit, dispatch }, { projectId, sequenceId }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const shots = await FilmProjectService.getShots(projectId, sequenceId);
      const normalized = shots.reduce((acc, shot) => {
        const normalized = normalizeShot(shot);
        if (normalized?.id) {
          acc[normalized.id] = normalized;
        }
        return acc;
      }, {});
      commit(mutations.SET_SHOTS, normalized);
      commit(mutations.SET_LOADING, false);
    } catch (error) {
      commit(mutations.SET_LOADING, false);
      commit(mutations.SET_ERROR, error);
      dispatch(
        'notification/' + notificationActions.SET_ERROR_NOTIFICATION,
        error,
        { root: true }
      );
    }
  },

  [actions.GET_SHOT]: async ({ commit, dispatch }, { projectId, sequenceId, shotId }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const shot = await FilmProjectService.getShotById(projectId, sequenceId, shotId);
      const normalized = normalizeShot(shot);
      commit(mutations.SET_SHOT, normalized);
      commit(mutations.SET_LOADING, false);
      return normalized;
    } catch (error) {
      commit(mutations.SET_LOADING, false);
      commit(mutations.SET_ERROR, error);
      dispatch(
        'notification/' + notificationActions.SET_ERROR_NOTIFICATION,
        error,
        { root: true }
      );
      throw error;
    }
  },

  [actions.CREATE_SHOT]: async ({ commit, dispatch }, { projectId, sequenceId, data }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const shot = await FilmProjectService.createShot(projectId, sequenceId, data);
      const normalized = normalizeShot(shot);
      commit(mutations.ADD_SHOT, normalized);
      commit(mutations.SET_LOADING, false);
      return normalized;
    } catch (error) {
      commit(mutations.SET_LOADING, false);
      commit(mutations.SET_ERROR, error);
      dispatch(
        'notification/' + notificationActions.SET_ERROR_NOTIFICATION,
        error,
        { root: true }
      );
      throw error;
    }
  },

  [actions.UPDATE_SHOT]: async ({ commit, dispatch }, { projectId, sequenceId, shotId, data }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const shot = await FilmProjectService.updateShot(projectId, sequenceId, shotId, data);
      const normalized = normalizeShot(shot);
      commit(mutations.UPDATE_SHOT_STATE, { id: shotId, data: normalized });
      commit(mutations.SET_LOADING, false);
      return normalized;
    } catch (error) {
      commit(mutations.SET_LOADING, false);
      commit(mutations.SET_ERROR, error);
      dispatch(
        'notification/' + notificationActions.SET_ERROR_NOTIFICATION,
        error,
        { root: true }
      );
      throw error;
    }
  },

  [actions.DELETE_SHOT]: async ({ commit, dispatch }, { projectId, sequenceId, shotId }) => {
    try {
      commit(mutations.SET_LOADING, true);
      await FilmProjectService.deleteShot(projectId, sequenceId, shotId);
      commit(mutations.REMOVE_SHOT, shotId);
      commit(mutations.SET_LOADING, false);
    } catch (error) {
      commit(mutations.SET_LOADING, false);
      commit(mutations.SET_ERROR, error);
      dispatch(
        'notification/' + notificationActions.SET_ERROR_NOTIFICATION,
        error,
        { root: true }
      );
      throw error;
    }
  },

  // AI Generation
  [actions.GENERATE_SCRIPT]: async ({ commit, dispatch }, { projectId, prompt, options }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const result = await FilmProjectService.generateScript(projectId, prompt, options);
      commit(mutations.SET_LOADING, false);
      return result;
    } catch (error) {
      commit(mutations.SET_LOADING, false);
      commit(mutations.SET_ERROR, error);
      dispatch(
        'notification/' + notificationActions.SET_ERROR_NOTIFICATION,
        error,
        { root: true }
      );
      throw error;
    }
  },

  [actions.GENERATE_SCENE]: async ({ commit, dispatch }, { projectId, sequenceId, shotId, prompt, options }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const result = await FilmProjectService.generateScene(projectId, sequenceId, shotId, prompt, options);
      commit(mutations.SET_LOADING, false);
      return result;
    } catch (error) {
      commit(mutations.SET_LOADING, false);
      commit(mutations.SET_ERROR, error);
      dispatch(
        'notification/' + notificationActions.SET_ERROR_NOTIFICATION,
        error,
        { root: true }
      );
      throw error;
    }
  },
};

