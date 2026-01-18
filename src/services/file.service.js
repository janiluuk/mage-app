import axios from 'axios';
import { API_BASE_URL } from '@/utils/api-base-urls';

const url = API_BASE_URL;

function list(params = {}) {
  return axios.get(`${url}/files`, { params })
    .then(response => {
      return {
        data: response.data.data || [],
        meta: response.data.meta || {},
        links: response.data.links || {},
      };
    });
}

function get(id) {
  return axios.get(`${url}/files/${id}`)
    .then(response => response.data);
}

function create(fileData) {
  const formData = new FormData();
  if (fileData.file) {
    formData.append('file', fileData.file);
  }
  if (fileData.project_id) {
    formData.append('project_id', fileData.project_id);
  }
  if (fileData.meta) {
    formData.append('meta', JSON.stringify(fileData.meta));
  }

  return axios.post(`${url}/files`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
    .then(response => response.data);
}

function destroy(id) {
  return axios.delete(`${url}/files/${id}`);
}

function attachTags(id, tagIds) {
  return axios.post(`${url}/files/${id}/tags`, {
    tag_ids: Array.isArray(tagIds) ? tagIds : [tagIds],
  })
    .then(response => response.data);
}

function detachTag(id, tagId) {
  return axios.delete(`${url}/files/${id}/tags/${tagId}`)
    .then(response => response.data);
}

function syncTags(id, tagIds) {
  return axios.put(`${url}/files/${id}/tags`, {
    tag_ids: Array.isArray(tagIds) ? tagIds : [],
  })
    .then(response => response.data);
}

function listByTags() {
  return axios.get(`${url}/files/by-tags`)
    .then(response => response.data);
}

function listByTag(tagId, params = {}) {
  return axios.get(`${url}/files/by-tag/${tagId}`, { params })
    .then(response => response.data);
}

function unzip(id) {
  return axios.post(`${url}/files/${id}/unzip`)
    .then(response => response.data);
}

function merge(fileIds, projectId = null, outputName = null) {
  return axios.post(`${url}/files/merge`, {
    file_ids: fileIds,
    project_id: projectId,
    output_name: outputName,
  })
    .then(response => response.data);
}

function importFile(id, projectId) {
  return axios.post(`${url}/files/${id}/import`, {
    project_id: projectId,
  })
    .then(response => response.data);
}

function transcode(id, format, width = null, height = null) {
  return axios.post(`${url}/files/${id}/transcode`, {
    format,
    width,
    height,
  })
    .then(response => response.data);
}

function attachAudio(id, audioFileId, startSeconds = null, endSeconds = null, outputName = null) {
  return axios.post(`${url}/files/${id}/attach-audio`, {
    audio_file_id: audioFileId,
    start_seconds: startSeconds,
    end_seconds: endSeconds,
    output_name: outputName,
  })
    .then(response => response.data);
}

function quota() {
  return axios.get(`${url}/files/quota`)
    .then(response => response.data);
}

export default {
  list,
  get,
  create,
  destroy,
  attachTags,
  detachTag,
  syncTags,
  listByTags,
  listByTag,
  unzip,
  merge,
  importFile,
  transcode,
  attachAudio,
  quota,
};

