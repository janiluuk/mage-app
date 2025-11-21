import axios from "axios";
import Jsona from "jsona";
import requestService from "@/services/request-service/ApiRequestService";

const jsona = new Jsona();

import qs from "qs";
const url = process.env.VUE_APP_API_V1_BASE_URL;
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
      "/v1/video-jobs",
      options,
      {},
      true
    );
    if (undefined === response.data.meta) {
      var meta = { page: { total: 1 } };
    }
    return {
      list: jsona.deserialize(response.data),
      meta: meta ? meta : response.data.meta,
    };
  },

  async get(id) {
    const response = await requestService.get(
      "/v1/video-jobs/" + id + "?include=" + includeParams,
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
    await axios({
      method: "get",
      url,
      responseType: "arraybuffer",
    })
      .then((response) => {
        const new_url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = new_url;
        link.setAttribute("download", title);
        document.body.appendChild(link);
        link.click();
      })
      .catch((e) => console.log("error occured:" + e.message));
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
    return await requestService.delete(`/v1/video-jobs/${id}`);
  },

  async upload(item, type, onProgress) {
    const bodyFormData = new FormData();
    bodyFormData.append("attachment", item);
    bodyFormData.append("type", type);
    
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

};
