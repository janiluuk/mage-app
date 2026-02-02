import * as mutations from './types/mutations';

export default {
  [mutations.SET_PRODUCTIONS](state, productions) {
    state.productions = productions;
  },
  [mutations.SET_PRODUCTION](state, production) {
    state.production = production;
    if (production?.id) {
      state.productions[production.id] = production;
    }
  },
  [mutations.ADD_PRODUCTION](state, production) {
    if (production?.id) {
      state.productions[production.id] = production;
    }
  },
  [mutations.UPDATE_PRODUCTION_STATE](state, { id, data }) {
    if (state.productions[id]) {
      state.productions[id] = { ...state.productions[id], ...data };
    }
    if (state.production?.id === id) {
      state.production = { ...state.production, ...data };
    }
  },
  [mutations.REMOVE_PRODUCTION](state, id) {
    delete state.productions[id];
    if (state.production?.id === id) {
      state.production = {};
    }
  },
  [mutations.SET_SEQUENCES](state, sequences) {
    state.sequences = sequences;
  },
  [mutations.SET_SEQUENCE](state, sequence) {
    state.sequence = sequence;
    if (sequence?.id) {
      state.sequences[sequence.id] = sequence;
    }
  },
  [mutations.ADD_SEQUENCE](state, sequence) {
    if (sequence?.id) {
      state.sequences[sequence.id] = sequence;
    }
  },
  [mutations.UPDATE_SEQUENCE_STATE](state, { id, data }) {
    if (state.sequences[id]) {
      state.sequences[id] = { ...state.sequences[id], ...data };
    }
    if (state.sequence?.id === id) {
      state.sequence = { ...state.sequence, ...data };
    }
  },
  [mutations.REMOVE_SEQUENCE](state, id) {
    delete state.sequences[id];
    if (state.sequence?.id === id) {
      state.sequence = {};
    }
  },
  [mutations.SET_SHOTS](state, shots) {
    state.shots = shots;
  },
  [mutations.SET_SHOT](state, shot) {
    state.shot = shot;
    if (shot?.id) {
      state.shots[shot.id] = shot;
    }
  },
  [mutations.ADD_SHOT](state, shot) {
    if (shot?.id) {
      state.shots[shot.id] = shot;
    }
  },
  [mutations.UPDATE_SHOT_STATE](state, { id, data }) {
    if (state.shots[id]) {
      state.shots[id] = { ...state.shots[id], ...data };
    }
    if (state.shot?.id === id) {
      state.shot = { ...state.shot, ...data };
    }
  },
  [mutations.REMOVE_SHOT](state, id) {
    delete state.shots[id];
    if (state.shot?.id === id) {
      state.shot = {};
    }
  },
  [mutations.SET_LOADING](state, isLoading) {
    state.isLoading = isLoading;
  },
  [mutations.SET_ERROR](state, error) {
    state.error = error;
  },
  [mutations.SET_CURRENT_PRODUCTION](state, productionId) {
    state.currentProductionId = productionId;
  },
  [mutations.SET_CURRENT_SEQUENCE](state, sequenceId) {
    state.currentSequenceId = sequenceId;
  },
};

