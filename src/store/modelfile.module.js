import ModelFileService from '@/services/modelfile.service';
const PREVIEW_URL = process.env.VUE_APP_MODEL_PREVIEW_URL;

const state = {
  modelFiles: [],
};

const mutations = {
  SET_MODEL_FILES(state, modelFiles) {
    state.modelFiles = modelFiles;
  },
};
const getters = {
  
  list(state){
    return state.modelFiles;
  },
  findModelName: (state, getters) => (id) => {

    const modelfile = state.modelFiles.find(model => model.id === id);
   return modelfile ? modelfile.name : 'N/A';
  },
  getModelPreviewUrl: (state, getters) => (id) => {

    
    const modelfile = state.modelFiles.find(model => model.id === id);
    return modelfile?.previewUrl ? PREVIEW_URL+modelfile.previewUrl : PREVIEW_URL+'default.png';
  }
}
const actions = {
  async fetchModelFiles({ commit }) {
    try {
      const modelFiles = await ModelFileService.list();

      commit('SET_MODEL_FILES', modelFiles);
      return modelFiles;
    } catch (error) {
        console.log(error);
        throw error;        
    }
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  getters,
  actions,
};
