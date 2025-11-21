import AuthService from '@/services/auth.service';

const accessToken = localStorage.getItem('auth.accessToken');
const initialState = {
  loggedIn: Boolean(accessToken),
  accessToken,
};

export const auth = {
  namespaced: true,
  state: initialState,
  actions: {
    async login({ commit }, credentials) {
      const data = await AuthService.login(credentials);
      commit('setAuthState', data?.access_token || null);
      return data;
    },
    async logout({ commit }) {
      await AuthService.logout();
      commit('setAuthState', null);
    },
    async register({ commit }, user) {
      try {
        const data = await AuthService.register(user);
        commit('setAuthState', data?.access_token || null);
        return data;
      } catch (error) {
        commit('setAuthState', null);
        throw error;
      }
    },
    async passwordForgot(_, userEmail) {
      await AuthService.passwordForgot(userEmail);
    },
    async passwordReset(_, passwordDTO) {
      await AuthService.passwordReset(passwordDTO);
    },
  },
  mutations: {
    setAuthState(state, token) {
      state.accessToken = token;
      state.loggedIn = Boolean(token);
    },
  },
  getters: {
    isLoggedIn(state) {
      return state.loggedIn;
    },
    accessToken(state) {
      return state.accessToken;
    },
  },
};
