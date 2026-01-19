import axios from "axios";
import Jsona from "jsona";
import qs from "qs";
import requestService from "@/services/request-service/ApiRequestService";
import authHeader from "@/services/auth-header";
import { API_V1_BASE_URL } from "@/utils/api-base-urls";

const jsona = new Jsona();
const url = API_V1_BASE_URL;
const includeParams = "modelfile,user";

export default {
  async list(params) {
    const options = {
      params: params,
      paramsSerializer: function (params) {
        return qs.stringify(params, { encode: false });
      },
    };
    const response = await requestService.get(
      "/video-jobs",
      options,
      {},
      true
    );
    const meta = response.data.meta === undefined 
      ? { page: { total: 1 } } 
      : response.data.meta;
    
    const deserialized = jsona.deserialize(response.data);
    // jsona.deserialize returns an array for collections
    // If it's not an array, it might be wrapped in an object
    let list = [];
    if (Array.isArray(deserialized)) {
      list = deserialized;
    } else if (deserialized && Array.isArray(deserialized.data)) {
      list = deserialized.data;
    } else if (deserialized && deserialized.type === 'video-jobs') {
      // Single item, wrap in array
      list = [deserialized];
    } else {
      console.warn('Unexpected deserialized format:', deserialized);
      list = [];
    }
    
    return {
      list: list,
      meta: meta,
    };
  },

  async get(id) {
    const response = await requestService.get(
      "/video-jobs/" + id + "?include=" + includeParams,
      {},
      {},
      true
    );

    return jsona.deserialize(response.data);
  },

  async add(item) {
    const payload = jsona.serialize({
      ...item,
    });

    const options = {
      headers: authHeader(),
    };

    return axios
      .post(`${url}/video-jobs?filter[generator]=vid2vid&include=modelfile,user`, payload, options)
      .then((response) => {
        return jsona.deserialize(response.data);
      });
  },
  async downloadJob(url, title) {
    try {
      const response = await axios({
        method: "get",
        url,
        responseType: "arraybuffer",
      });
      
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", title);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download error:", error.message);
      throw error;
    }
  },
  async update(item) {
    const payload = jsona.serialize({
      stuff: item,
      includeNames: [],
    });

    const options = {
      headers: authHeader(),
    };

    return axios
      .patch(
        `${url}/video-jobs/${item.id}?include=modelfile,user`,
        payload,
        options
      )
      .then((response) => {
        return jsona.deserialize(response.data);
      });
  },

  async destroy(id) {
    return await requestService.delete(`/video-jobs/${id}`);
  },

  async upload(item, type, onProgress, extraData = {}) {
    const bodyFormData = new FormData();
    bodyFormData.append("attachment", item);
    bodyFormData.append("type", type);
    
    // Add motion style and related data if provided
    if (extraData.motionStyle) {
      bodyFormData.append("motionStyle", extraData.motionStyle);
    }
    if (extraData.preset) {
      bodyFormData.append("preset", JSON.stringify(extraData.preset));
    }
    if (extraData.bpm) {
      bodyFormData.append("bpm", extraData.bpm);
    }
    
    return await requestService.post("/upload", bodyFormData, {
      headers: {
          'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress
    });
  },

  async getModels() {
    const options = {
      headers: authHeader(),
    };
    return axios.get(`${url}/model-files`, options).then((response) => {
      return jsona.deserialize(response.data);
    });
  },

  async finalize(params) {
    return await requestService.post("/finalize", params);
  },

  async cancelJob(id) {
    const params = {
      status: "cancelled",
      videoId: id,
    };
    const response = await requestService.post("/cancelJob/" + id, params);
    return response;
  },

  async preview(params) {
    return await requestService.post("/generate", { ...params, type: "vid2vid" });
  },
  async previewDeforum(params) {
    return await requestService.post("/generate", { ...params, type: "deforum" });
  },
  async finalizeDeforum(params) {
    return await requestService.post("/finalize", params);
  },

  async queue() {
    return await requestService.get("/queue");
  },

  async addSoundtrack(videoId, audioFile, options) {
    const formData = new FormData();
    formData.append('videoId', videoId);
    formData.append('audio', audioFile);
    formData.append('volume', options.volume || 100);
    formData.append('fadeIn', options.fadeIn || 0);
    formData.append('fadeOut', options.fadeOut || 0);
    if (options.audioStart !== undefined && options.audioStart !== null) {
      formData.append('audioStart', options.audioStart);
    }
    if (options.audioEnd !== undefined && options.audioEnd !== null) {
      formData.append('audioEnd', options.audioEnd);
    }
    formData.append('type', 'soundtrack');
    
    return await requestService.post('/video-jobs/add-soundtrack', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  async extendVideo(videoId, options) {
    const payload = jsona.serialize({
      stuff: {
        videoId: videoId,
        method: options.method || 'minterpolate',
        targetDuration: options.targetDuration,
        targetFps: options.targetFps,
        interpolationMode: options.interpolationMode || 'mci',
        type: 'extension'
      },
      includeNames: []
    });
    
    return await requestService.post('/video-jobs/extend', payload, {
      headers: authHeader()
    });
  },

};
