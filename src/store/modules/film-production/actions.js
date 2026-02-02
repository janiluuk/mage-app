import * as actions from './types/actions';
import * as mutations from './types/mutations';
import FilmProductionService from '@/services/film-production/FilmProductionService';
import * as notificationActions from '@/store/modules/notification/types/actions';

const normalizeProduction = (production) => {
  if (!production) return null;
  return {
    id: production.id || production.attributes?.id,
    name: production.attributes?.name || production.name,
    description: production.attributes?.description || production.description,
    status: production.attributes?.status || production.status,
    thumbnail: production.attributes?.thumbnail || production.thumbnail,
    createdAt: production.attributes?.createdAt || production.createdAt,
    updatedAt: production.attributes?.updatedAt || production.updatedAt,
    ...production.attributes,
    ...production,
  };
};

const normalizeSequence = (sequence) => {
  if (!sequence) return null;
  return {
    id: sequence.id || sequence.attributes?.id,
    productionId: sequence.attributes?.productionId || sequence.productionId,
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
    productionId: shot.attributes?.productionId || shot.productionId,
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
  // Productions
  [actions.GET_PRODUCTIONS]: async ({ commit, dispatch }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const productions = await FilmProductionService.getProductions();
      const normalized = productions.reduce((acc, prod) => {
        const normalized = normalizeProduction(prod);
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
      const production = await FilmProductionService.getProductionById(id);
      const normalized = normalizeProduction(production);
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
      const production = await FilmProductionService.createProduction(data);
      const normalized = normalizeProduction(production);
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
      const production = await FilmProductionService.updateProduction(id, data);
      const normalized = normalizeProduction(production);
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
      await FilmProductionService.deleteProduction(id);
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
  [actions.GET_SEQUENCES]: async ({ commit, dispatch }, productionId) => {
    try {
      commit(mutations.SET_LOADING, true);
      const sequences = await FilmProductionService.getSequences(productionId);
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

  [actions.GET_SEQUENCE]: async ({ commit, dispatch }, { productionId, sequenceId }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const sequence = await FilmProductionService.getSequenceById(productionId, sequenceId);
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

  [actions.CREATE_SEQUENCE]: async ({ commit, dispatch }, { productionId, data }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const sequence = await FilmProductionService.createSequence(productionId, data);
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

  [actions.UPDATE_SEQUENCE]: async ({ commit, dispatch }, { productionId, sequenceId, data }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const sequence = await FilmProductionService.updateSequence(productionId, sequenceId, data);
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

  [actions.DELETE_SEQUENCE]: async ({ commit, dispatch }, { productionId, sequenceId }) => {
    try {
      commit(mutations.SET_LOADING, true);
      await FilmProductionService.deleteSequence(productionId, sequenceId);
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
  [actions.GET_SHOTS]: async ({ commit, dispatch }, { productionId, sequenceId }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const shots = await FilmProductionService.getShots(productionId, sequenceId);
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

  [actions.GET_SHOT]: async ({ commit, dispatch }, { productionId, sequenceId, shotId }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const shot = await FilmProductionService.getShotById(productionId, sequenceId, shotId);
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

  [actions.CREATE_SHOT]: async ({ commit, dispatch }, { productionId, sequenceId, data }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const shot = await FilmProductionService.createShot(productionId, sequenceId, data);
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

  [actions.UPDATE_SHOT]: async ({ commit, dispatch }, { productionId, sequenceId, shotId, data }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const shot = await FilmProductionService.updateShot(productionId, sequenceId, shotId, data);
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

  [actions.DELETE_SHOT]: async ({ commit, dispatch }, { productionId, sequenceId, shotId }) => {
    try {
      commit(mutations.SET_LOADING, true);
      await FilmProductionService.deleteShot(productionId, sequenceId, shotId);
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
  [actions.GENERATE_SCRIPT]: async ({ commit, dispatch }, { productionId, prompt, options }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const result = await FilmProductionService.generateScript(productionId, prompt, options);
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

  [actions.GENERATE_SCENE]: async ({ commit, dispatch }, { productionId, sequenceId, shotId, prompt, options }) => {
    try {
      commit(mutations.SET_LOADING, true);
      const result = await FilmProductionService.generateScene(productionId, sequenceId, shotId, prompt, options);
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

