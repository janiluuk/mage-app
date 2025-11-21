import ProfileService from "@/services/profile.service";

const initialState = { userProfile: null };

export const profile = {
  namespaced: true,
  state: initialState,
  actions: {
    async getProfile({ commit }) {
      const userProfile = await ProfileService.getProfile();
      commit('setProfile', userProfile);
    },

    async editProfile({ commit }, modifiedProfile) {
      const userProfile = await ProfileService.editProfile(modifiedProfile);
      commit('setProfile', userProfile);
    },

    async uploadPic({ commit, state }, file) {
      const userId = state?.userProfile?.id;
      if (!userId) return;
      const picURL = (await ProfileService.uploadPic(file, userId)).url;
      commit('setProfileImage', picURL);
    },
  },
  mutations: {
    setProfile(state, userProfile) {
      state.userProfile = userProfile;
    },
    setProfileImage(state, picURL) {
      if (!state.userProfile) return;
      state.userProfile.profile_image = picURL;
    },
  },
  getters: {
    getUserProfile(state) {
      return state.userProfile;
    },
    getUserProfileImage(state) {
      return state.userProfile?.profile_image || null;
    },
  },
};
