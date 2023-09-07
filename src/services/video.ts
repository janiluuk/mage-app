import Vue from 'vue';
import Vuex from 'vuex';
import { convertBase64ToUint8Array } from '@/utils/base64';
import { DEBUG_MODE } from '@/constants';

Vue.use(Vuex);

interface FFmpegProgress {
  ratio: number;
  duration?: number;
  time?: number;
}

type FFmpegProgressExtended = FFmpegProgress & { timeElapsed: number; est: number };

interface FFmpegResult {
  type: "result" | "error" | "progress";
  blob?: Blob;
  error?: any;
  progress?: FFmpegProgress;
}

interface VideoResult {
  type: "result" | "error" | "cancelled";
  result?: string;
  error?: any;
}
const initGenerationData = () => ({
  ratio: 0,
  timeElapsed: 0,
  est: Infinity,
});

export default new Vuex.Store({
  state: {
    initFramerate: 1,
    maxInitFramerate: 10,
    minInitFramerate: 1,
    initFramerateStep: 1,
    finalFramerate: 60,
    maxFinalFramerate: 120,
    minFinalFramerate: 15,
    finalFramerateStep: 15,
    generationData: {
      ratio: 0,
      timeElapsed: 0,
      est: Infinity,
    },
    generatingVideo: false,
    worker: null,
  },
  mutations: {
    setInitFramerate(state, value) {
      state.initFramerate = value;
    },
    setGeneratingVideo(state, value) {
      state.generatingVideo = value;
    },
    setWorker(state, worker) {
      state.worker = worker;
    },
    setGenerationData(state, data) {
      state.generationData = data;
    },
  },
  actions: {
    async processImages({ state, commit }, imgs) {
      if (!window.Worker) {
        return {
          type: "error",
          error: "Your browser doesn't support web workers! Try updating or using a different browser.",
        };
      }
    
      if (!imgs.length) {
        return {
          type: "error",
          error: "No images were submitted!",
        };
      }
    
      const imageArray = await Promise.all(imgs.map(img => convertBase64ToUint8Array(img, "image/jpeg")));
      const worker = new Worker(new URL('../utils/imagesToVideo.worker.js', import.meta.url));
      worker.postMessage({
        imageArray,
        initFramerate: state.initFramerate,
        finalFramerate: state.finalFramerate,
        DEBUG_MODE,
      });
    
      let prevTime = performance.now();
      commit('setWorker', worker);
      commit('setGeneratingVideo', true);
    
      return new Promise((resolve, reject) => {
        function checkCancelled() {
          if (!state.generatingVideo) {
            resolve({ type: "cancelled" });
            return;
          }
          setTimeout(checkCancelled, 1000);
        }
    
        setTimeout(checkCancelled, 1000);
    
        state.worker.onmessage = (e) => {
          const response = e.data;
          if (response.progress) {
            const { progress } = response;
    
            const currTime = performance.now();
            const newGenerationData = { ...state.generationData };
            newGenerationData.timeElapsed += Math.round((currTime - prevTime) / 1000);
            prevTime = currTime;
    
            if (progress.duration) newGenerationData.duration = progress.duration;
            if (progress.time) newGenerationData.time = progress.time;
            newGenerationData.ratio = (newGenerationData.time ?? 0) / (newGenerationData.duration ?? 0);
    
            const remainingTime = (newGenerationData.duration ?? 0) / (newGenerationData.time ?? 0);
            newGenerationData.est = Math.round(remainingTime / newGenerationData.ratio);
    
            if (DEBUG_MODE) console.log("Video progress:", newGenerationData);
            commit('setGenerationData', newGenerationData);
          }
    
          if (response.error) {
            commit('setGeneratingVideo', false);
            reject({ type: "error", error: response.error });
          }
    
          if (response.blob) {
            commit('setGeneratingVideo', false);
            const videoUrl = URL.createObjectURL(response.blob);
            if (DEBUG_MODE) console.log("Video URL:", videoUrl);
            resolve({ type: "result", result: videoUrl });
          }
        };
      });
    }

    },
    cancelGeneration({ state, commit }) {
      commit('setGeneratingVideo', false);
      if (state.worker) {
        state.worker.terminate();
      }
      commit('setGenerationData', initGenerationData());
    }
  },
  getters: {
    // Your getters here, if needed
  },
});
