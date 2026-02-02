export default {
  productions: (state) => Object.values(state.productions),
  production: (state) => state.production,
  productionById: (state) => (id) => state.productions[id] || null,
  
  sequences: (state) => Object.values(state.sequences),
  sequencesByProduction: (state) => (productionId) => {
    return Object.values(state.sequences).filter(
      seq => seq.productionId === productionId
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
  currentProductionId: (state) => state.currentProductionId,
  currentSequenceId: (state) => state.currentSequenceId,
};

