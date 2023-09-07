import service from '@/services/tags.service';

const state = {
  list: {},
  tag: {},
  meta: {},
};

const mutations = {
  SET_LIST: (state, list) => {
    state.list = list;
  },
  SET_RESOURCE: (state, tag) => {
    state.tag = tag;
  },
  SET_META: (state, meta) => {
    state.meta = meta;
  }
};

const actions = {
  list({commit}, params) {
    return service.list(params)
      .then(({list, meta}) => {
        commit('SET_LIST', list);
        commit('SET_META', meta);
      });
  },

  get({commit}, params) {
    return service.get(params)
      .then((tag) => { commit('SET_RESOURCE', tag); });
  },

  add({commit}, params) {
    return service.add(params)
      .then((tag) => { commit('SET_RESOURCE', tag); });
  },

  update({commit}, params) {
    return service.update(params)
      .then((tag) => { commit('SET_RESOURCE', tag); });
  },

  destroy(params) {
    return service.destroy(params);
  },
};

const getters = {
  list: state => state.list,
  listTotal: state => state.meta.page.total,
  tag: state => state.tag,
  dropdown: (state) => {
    return state.list.map(tag => ({
      id: tag.id,
      name: tag.name
    }));
  }
};

export const tags = {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
