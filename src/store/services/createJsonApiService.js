import qs from 'qs';
import axios from 'axios';
import Jsona from 'jsona';
import { API_BASE_URL, API_V1_BASE_URL } from '@/utils/api-base-urls';
import AuthService from '@/services/auth/AuthService';

const jsona = new Jsona();

const JSON_API_HEADERS = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
};

function getHeaders(extra = {}) {
  const headers = { ...JSON_API_HEADERS, ...extra };
  const token = AuthService.getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Factory that creates a standard JSON:API CRUD service for a given resource.
 *
 * Replaces the old per-resource service files (categories-service, tags-service,
 * roles-service, users-service, items-service, profile-service) which were all
 * copy-paste identical except for the endpoint path.
 *
 * @param {string} resourcePath - API endpoint path, e.g. '/categories', '/tags'
 * @param {Object} [options]
 * @param {string} [options.baseUrl] - Override API base URL (defaults to API_BASE_URL)
 * @param {string} [options.getInclude] - Include params for GET single, e.g. 'roles'
 * @param {string} [options.addInclude] - Include params for POST, e.g. 'category,tags'
 * @param {string} [options.updateInclude] - Include params for PATCH, e.g. 'category,tags'
 * @param {string[]} [options.serializeIncludeNames] - Jsona serialize includeNames for POST
 * @param {boolean} [options.hasUpload] - If true, adds an upload() method
 * @param {string} [options.uploadPath] - Upload endpoint path template (use :id placeholder)
 * @returns {{ list, get, add, update, destroy, [upload] }}
 */
export default function createJsonApiService(resourcePath, options = {}) {
  const baseUrl = options.baseUrl || API_BASE_URL;

  function list(params) {
    return axios
      .get(`${baseUrl}${resourcePath}`, {
        params,
        paramsSerializer: (p) => qs.stringify(p, { encode: false }),
        headers: getHeaders(),
      })
      .then((response) => ({
        list: jsona.deserialize(response.data),
        meta: response.data.meta,
      }));
  }

  function get(id) {
    const include = options.getInclude ? `?include=${options.getInclude}` : '';
    return axios
      .get(`${baseUrl}${resourcePath}/${id}${include}`, {
        headers: getHeaders(),
      })
      .then((response) => {
        const resource = jsona.deserialize(response.data);
        delete resource.links;
        return resource;
      });
  }

  function add(resource) {
    const payload = jsona.serialize({
      stuff: resource,
      includeNames: options.serializeIncludeNames ?? null,
    });

    const include = options.addInclude ? `?include=${options.addInclude}` : '';
    return axios
      .post(`${baseUrl}${resourcePath}${include}`, payload, {
        headers: getHeaders(),
      })
      .then((response) => jsona.deserialize(response.data));
  }

  function update(resource) {
    const payload = jsona.serialize({
      stuff: resource,
      includeNames: [],
    });

    const include = options.updateInclude
      ? `?include=${options.updateInclude}`
      : '';
    return axios
      .patch(
        `${baseUrl}${resourcePath}/${resource.id}${include}`,
        payload,
        { headers: getHeaders() }
      )
      .then((response) => jsona.deserialize(response.data));
  }

  function destroy(id) {
    return axios.delete(`${baseUrl}${resourcePath}/${id}`, {
      headers: getHeaders(),
    });
  }

  const service = { list, get, add, update, destroy };

  // Optionally add upload capability
  if (options.hasUpload && options.uploadPath) {
    service.upload = function upload(resource, image) {
      const bodyFormData = new FormData();
      bodyFormData.append('attachment', image);
      const path = options.uploadPath.replace(':id', resource.id);
      const uploadHeaders = getHeaders();
      delete uploadHeaders['Content-Type'];
      return axios
        .post(`${baseUrl}${path}`, bodyFormData, { headers: uploadHeaders })
        .then((response) => response.data.url);
    };
  }

  return service;
}
