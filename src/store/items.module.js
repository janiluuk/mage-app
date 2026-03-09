import service from '@/services/items.service';

/* eslint-disable */

/**
 * Items module – wraps the video-jobs endpoint used by the legacy "items" views.
 * Note: this module uses the items.service.js which calls /video-jobs and has
 * additional methods like upload, finalize, preview etc.
 * It is NOT the same as the store/modules/items-module (ItemsV2) which uses
 * the JSON:API /items endpoint.
 */
const initialState = {
  list: {},
  item: {},
  meta: {},
  url: null,
};

export const items = {
  namespaced: true,
  state: initialState,
  actions: {
    list({ commit }, params) {
      return service.list(params).then(({ list, meta }) => {
        meta = { page: { total: list.length } };
        commit('SET_LIST', list);
        commit('SET_META', meta);
      });
    },

    get({ commit }, params) {
      return service.get(params).then((item) => {
        commit('SET_RESOURCE', item);
      });
    },

    add({ commit }, params) {
      return service.add(params).then((item) => {
        commit('SET_RESOURCE', item);
      });
    },

    update({ commit }, params) {
      return service.update(params).then((item) => {
        commit('SET_RESOURCE', item);
      });
    },

    destroy(_, params) {
      return service.destroy(params);
    },

    upload({ commit }, { item, image }) {
      return service.upload(item, image).then((url) => {
        commit('SET_URL', url);
      });
    },
  },
  mutations: {
    SET_LIST: (state, list) => {
      state.list = list;
    },
    SET_RESOURCE: (state, item) => {
      state.item = item;
    },
    SET_META: (state, meta) => {
      state.meta = meta;
    },
    SET_URL: (state, url) => {
      state.url = url;
    },
  },
  getters: {
    list: (state) => state.list,
    listTotal: (state) => state.meta?.page?.total,
    item: (state) => state.item,
    url: (state) => state.url,
  },
};
