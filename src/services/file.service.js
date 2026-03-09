import requestService from '@/services/request-service/ApiRequestService';

function list(params = {}) {
  return requestService.get('/files', params)
    .then(response => ({
      data: response.data.data || [],
      meta: response.data.meta || {},
      links: response.data.links || {},
    }));
}

function get(id) {
  return requestService.get(`/files/${id}`)
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

  return requestService.post('/files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
    .then(response => response.data);
}

function destroy(id) {
  return requestService.delete(`/files/${id}`);
}

function attachTags(id, tagIds) {
  return requestService.post(`/files/${id}/tags`, {
    tag_ids: Array.isArray(tagIds) ? tagIds : [tagIds],
  })
    .then(response => response.data);
}

function detachTag(id, tagId) {
  return requestService.delete(`/files/${id}/tags/${tagId}`)
    .then(response => response.data);
}

function syncTags(id, tagIds) {
  return requestService.put(`/files/${id}/tags`, {
    tag_ids: Array.isArray(tagIds) ? tagIds : [],
  })
    .then(response => response.data);
}

function listByTags() {
  return requestService.get('/files/by-tags')
    .then(response => response.data);
}

function listByTag(tagId, params = {}) {
  return requestService.get(`/files/by-tag/${tagId}`, params)
    .then(response => response.data);
}

function unzip(id) {
  return requestService.post(`/files/${id}/unzip`)
    .then(response => response.data);
}

function merge(fileIds, projectId = null, outputName = null) {
  return requestService.post('/files/merge', {
    file_ids: fileIds,
    project_id: projectId,
    output_name: outputName,
  })
    .then(response => response.data);
}

function importFile(id, projectId) {
  return requestService.post(`/files/${id}/import`, {
    project_id: projectId,
  })
    .then(response => response.data);
}

function transcode(id, format, width = null, height = null) {
  return requestService.post(`/files/${id}/transcode`, {
    format,
    width,
    height,
  })
    .then(response => response.data);
}

function attachAudio(id, audioFileId, startSeconds = null, endSeconds = null, outputName = null) {
  return requestService.post(`/files/${id}/attach-audio`, {
    audio_file_id: audioFileId,
    start_seconds: startSeconds,
    end_seconds: endSeconds,
    output_name: outputName,
  })
    .then(response => response.data);
}

function quota() {
  return requestService.get('/files/quota')
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
