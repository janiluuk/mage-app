import * as mutations from './types/mutations';

export default {
  [mutations.SET_PRODUCTIONS](state, projects) {
    state.projects = projects;
  },
  [mutations.SET_PRODUCTION](state, project) {
    state.project = project;
    if (project?.id) {
      state.projects[project.id] = project;
    }
  },
  [mutations.ADD_PRODUCTION](state, project) {
    if (project?.id) {
      state.projects[project.id] = project;
    }
  },
  [mutations.UPDATE_PRODUCTION_STATE](state, { id, data }) {
    if (state.projects[id]) {
      state.projects[id] = { ...state.projects[id], ...data };
    }
    if (state.project?.id === id) {
      state.project = { ...state.project, ...data };
    }
  },
  [mutations.REMOVE_PRODUCTION](state, id) {
    delete state.projects[id];
    if (state.project?.id === id) {
      state.project = {};
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
    // Merge new shots into existing map so loading shots across multiple
    // sequences doesn't overwrite previously loaded data.
    state.shots = { ...state.shots, ...shots };
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
  [mutations.SET_CURRENT_PRODUCTION](state, projectId) {
    state.currentProjectId = projectId;
  },
  [mutations.SET_CURRENT_SEQUENCE](state, sequenceId) {
    state.currentSequenceId = sequenceId;
  },
};

