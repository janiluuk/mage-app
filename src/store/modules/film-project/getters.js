export default {
  projects: (state) => Object.values(state.projects),
  project: (state) => state.project,
  projectById: (state) => (id) => state.projects[id] || null,
  
  sequences: (state) => Object.values(state.sequences),
  sequencesByProject: (state) => (projectId) => {
    return Object.values(state.sequences).filter(
      seq => seq.projectId === projectId
    );
  },
  sequence: (state) => state.sequence,
  sequenceById: (state) => (id) => state.sequences[id] || null,
  
  shots: (state) => Object.values(state.shots),
  shotsBySequence: (state) => (sequenceId) => {
    return Object.values(state.shots).filter(
      shot => shot.sequenceId === sequenceId
    );
  },
  shot: (state) => state.shot,
  shotById: (state) => (id) => state.shots[id] || null,
  
  isLoading: (state) => state.isLoading,
  error: (state) => state.error,
  currentProjectId: (state) => state.currentProjectId,
  currentSequenceId: (state) => state.currentSequenceId,
};

