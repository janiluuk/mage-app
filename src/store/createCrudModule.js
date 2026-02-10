/**
 * Factory that creates a standard namespaced Vuex CRUD module.
 *
 * Replaces the old per-resource module files (categories-module, tags-module,
 * roles-module, users-module, items-module) which were all copy-paste identical
 * except for the service import and resource name.
 *
 * @param {Object} service - The JSON:API service (must expose list/get/add/update/destroy)
 * @param {Object} [options]
 * @param {string} options.resourceName - Singular name for state key, e.g. 'category', 'tag'
 * @param {boolean} [options.hasUpload=false] - If true, adds upload action and url state
 * @param {Function} [options.dropdownMapper] - Custom mapper for the dropdown getter
 *   Receives a single list item, returns { id, name } or similar
 * @returns {Object} Vuex module definition (namespaced: true)
 */
export default function createCrudModule(service, options = {}) {
  const { resourceName = 'resource', hasUpload = false, dropdownMapper } = options;

  const state = () => ({
    list: {},
    [resourceName]: {},
    meta: {},
    ...(hasUpload ? { url: null } : {}),
  });

  const mutations = {
    SET_LIST(state, list) {
      state.list = list;
    },
    SET_RESOURCE(state, resource) {
      state[resourceName] = resource;
    },
    SET_META(state, meta) {
      state.meta = meta;
    },
    ...(hasUpload
      ? {
          SET_URL(state, url) {
            state.url = url;
          },
        }
      : {}),
  };

  const actions = {
    list({ commit }, params) {
      return service.list(params).then(({ list, meta }) => {
        commit('SET_LIST', list);
        commit('SET_META', meta);
      });
    },

    get({ commit }, params) {
      return service.get(params).then((resource) => {
        commit('SET_RESOURCE', resource);
      });
    },

    add({ commit }, params) {
      return service.add(params).then((resource) => {
        commit('SET_RESOURCE', resource);
      });
    },

    update({ commit }, params) {
      return service.update(params).then((resource) => {
        commit('SET_RESOURCE', resource);
      });
    },

    destroy(_, params) {
      return service.destroy(params);
    },

    ...(hasUpload && service.upload
      ? {
          upload({ commit }, { [resourceName]: resource, image }) {
            return service.upload(resource, image).then((url) => {
              commit('SET_URL', url);
            });
          },
        }
      : {}),
  };

  const defaultDropdownMapper = (item) => ({
    id: item.id,
    name: item.name,
  });

  const getters = {
    list: (state) => state.list,
    listTotal: (state) => state.meta?.page?.total,
    [resourceName]: (state) => state[resourceName],
    dropdown: (state) => {
      if (!Array.isArray(state.list)) return [];
      return state.list.map(dropdownMapper || defaultDropdownMapper);
    },
    ...(hasUpload ? { url: (state) => state.url } : {}),
  };

  return {
    namespaced: true,
    state,
    mutations,
    actions,
    getters,
  };
}
