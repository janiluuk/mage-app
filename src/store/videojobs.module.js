import VideoJobService from "@/services/videojobs.service"
/* eslint-disable */
import _ from 'lodash';

const initialState = {
  list: {},
  item: {},
  meta: {},
  url: null,
  progress: {}
};
export const videojobs = {
    namespaced: true,
    state: initialState,
    actions: {
        list({commit, dispatch}, params) {
            return VideoJobService.list(params)
              .then(({list, meta}) => {
                meta = { 'page' : { 'total': list.length}};
                commit('SET_LIST', list);
                commit('SET_META', meta);
              });
          },
        
          get({commit, dispatch}, params) {
            return VideoJobService.get(params)
              .then((item) => { commit('SET_RESOURCE', item); });
          },
        
          add({commit, dispatch}, params) {
            return VideoJobService.add(params)
              .then((item) => { commit('SET_RESOURCE', item); });
          },
        
          update({commit, dispatch}, params) {
            return VideoJobService.update(params)
              .then((item) => { commit('SET_RESOURCE', item); });
          },
        
          destroy({commit, dispatch}, id) {
            commit('REMOVE_JOB', id);

            return VideoJobService.destroy(id);
          },
        
          upload({commit, dispatch}, {item, image}) {
            return VideoJobService.upload(item, image)
              .then((url) => {
                commit('SET_URL', url);
              });
          },
          preview({commit, dispatch}, attributes) {
            return VideoJobService.preview(attributes)
              .then((url) => {
                //commit('SET_URL', url);
              });
          },
          finalize({commit, dispatch}, attributes) {
            return VideoJobService.finalize(attributes)
              .then((url) => {
                //commit('SET_URL', url);
              });
          },
          cancel({commit, dispatch}, id) {
            return VideoJobService.cancelJob(id).then((response) => {
              commit('SET_PROGRESS', 0);
              commit('UPDATE_JOB', response.data);
            });
          },
          progress({commit, dispatch}, {item}) {
            return VideoJobService.getProgress(item)
              .then((progress) => {
                commit('SET_PROGRESS', progress);
              });
          },

          download({commit, dispatch}, item ) {
              return VideoJobService.downloadJob(item.url, item.original_filename);
          }

    },
    mutations: {
        SET_LIST: (state, list) => {
            state.list = list;
        },
        REMOVE_JOB: (state, id) => {
          state.list = state.list.filter(job => job.id != id);
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
        UPDATE_JOB: (state, data) => {
          state.item.status = data.status;
          state.item.progress = data.progress;
          state.item.status = data.status;

        },
        SET_PROGRESS: (state, progress) => {
          state.progress = progress;
        }
    },
    getters: {
        list(state){
            return state.list;
        },
        findById: (state) => (id) => {
          return state.list.find(job => job.id === id)
        },
        listTotal(state){
            return state.meta.page.total;
        },
        progress(state){
          return state.progress;
        },
        job(state){
            return state.item;
        },
        url(state) {
            return state.url
        },
        listWithoutPending: (state, getters) => () => {
          const videojobs = state.list.length ? state.list.filter(job => job.status != 'pending') : [];
          return videojobs;
        },

        listFinished: (state, getters) => () => {
         const videojobs = state.list.filter(job => job.status == 'finished' || job.status.includes('processing'));
         return videojobs;
        }

    }
}
