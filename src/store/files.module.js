import FileService from "@/services/file.service";

const initialState = {
  list: [],
  groupedByTags: [],
  currentTag: null,
  currentTagFiles: [],
  meta: {},
  tags: [],
};

export const files = {
  namespaced: true,
  state: initialState,
  mutations: {
    SET_LIST(state, list) {
      state.list = list;
    },
    SET_META(state, meta) {
      state.meta = meta;
    },
    SET_RESOURCE(state, item) {
      // Update or add a single file in the list
      const index = state.list.findIndex(f => f.id === item.id);
      if (index >= 0) {
        state.list[index] = { ...state.list[index], ...item };
      } else {
        state.list.push(item);
      }
    },
    REMOVE_FILE(state, id) {
      state.list = state.list.filter(f => f.id !== id);
    },
    SET_GROUPED_BY_TAGS(state, grouped) {
      state.groupedByTags = grouped;
    },
    SET_CURRENT_TAG(state, tag) {
      state.currentTag = tag;
    },
    SET_CURRENT_TAG_FILES(state, files) {
      state.currentTagFiles = files;
    },
    SET_TAGS(state, tags) {
      state.tags = tags;
    },
  },
  actions: {
    list({ commit }, params = {}) {
      return FileService.list(params).then((response) => {
        // Handle both paginated and non-paginated responses
        const data = response.data || response.list || [];
        const meta = response.meta || {};
        commit("SET_LIST", data);
        commit("SET_META", meta);
        return { data, meta };
      });
    },

    get({ commit }, id) {
      return FileService.get(id).then((item) => {
        commit("SET_RESOURCE", item);
        return item;
      });
    },

    attachTags({ commit, dispatch }, { id, tagIds }) {
      return FileService.attachTags(id, tagIds).then((response) => {
        if (response.file) {
          commit("SET_RESOURCE", response.file);
        }
        dispatch("list"); // Refresh list to get updated tags
        return response;
      });
    },

    detachTag({ commit, dispatch }, { id, tagId }) {
      return FileService.detachTag(id, tagId).then((response) => {
        if (response.file) {
          commit("SET_RESOURCE", response.file);
        }
        dispatch("list"); // Refresh list to get updated tags
        return response;
      });
    },

    syncTags({ commit, dispatch }, { id, tagIds }) {
      return FileService.syncTags(id, tagIds).then((response) => {
        if (response.file) {
          commit("SET_RESOURCE", response.file);
        }
        dispatch("list"); // Refresh list to get updated tags
        return response;
      });
    },

    listByTags({ commit }) {
      return FileService.listByTags().then((response) => {
        const groups = response.groups || [];
        commit("SET_GROUPED_BY_TAGS", groups);
        return response;
      });
    },

    listByTag({ commit }, { tagId, params = {} }) {
      return FileService.listByTag(tagId, params).then((response) => {
        commit("SET_CURRENT_TAG", response.tag);
        // Handle paginated response
        const files = response.files?.data || response.files || [];
        commit("SET_CURRENT_TAG_FILES", files);
        // Also update main list with files from tag
        commit("SET_LIST", files);
        return response;
      });
    },

    destroy({ commit }, id) {
      commit("REMOVE_FILE", id);
      return FileService.destroy(id);
    },
  },
  getters: {
    list: (state) => state.list,
    meta: (state) => state.meta,
    groupedByTags: (state) => state.groupedByTags,
    currentTag: (state) => state.currentTag,
    currentTagFiles: (state) => state.currentTagFiles,
    tags: (state) => state.tags,
  },
};

