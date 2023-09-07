import ItemService from "@/services/items.service"
/* eslint-disable */

const initialState = {
  list: {},
  item: {},
  meta: {},
  url: null
};
export const items = {
    namespaced: true,
    state: initialState,
    actions: {
        list({commit, dispatch}, params) {
            return ItemService.list(params)
              .then(({list, meta}) => {
                meta = { 'page' : { 'total': list.length}};
                commit('SET_LIST', list);
                commit('SET_META', meta);
              });
          },
        
          get({commit, dispatch}, params) {
            return ItemService.get(params)
              .then((item) => { commit('SET_RESOURCE', item); });
          },
        
          add({commit, dispatch}, params) {
            return ItemService.add(params)
              .then((item) => { commit('SET_RESOURCE', item); });
          },
        
          update({commit, dispatch}, params) {
            return ItemService.update(params)
              .then((item) => { commit('SET_RESOURCE', item); });
          },
        
          destroy({commit, dispatch}, params) {
            return ItemService.destroy(params);
          },
        
          upload({commit, dispatch}, {item, image}) {
            return ItemService.upload(item, image)
              .then((url) => {
                commit('SET_URL', url);
              });
          }
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
        }
    },
    getters: {
        list(state){
            return state.list;
        },
        listTotal(state){
            return state.meta.page.total;
        },
        item(state){
            return state.item;
        },
        url(state) {
            return state.url
        }

    }
}
