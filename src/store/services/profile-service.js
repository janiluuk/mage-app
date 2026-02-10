import axios from 'axios';
import Jsona from 'jsona';
import { API_BASE_URL } from '@/utils/api-base-urls';

const url = API_BASE_URL;
const jsona = new Jsona();

const JSON_API_HEADERS = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
};

/**
 * Profile service - slightly different from standard CRUD (uses /me endpoint).
 * Kept as a standalone service since it doesn't follow the standard resource pattern.
 */
function get() {
  return axios
    .get(`${url}/me?include=roles`, { headers: JSON_API_HEADERS })
    .then((response) => ({
      list: jsona.deserialize(response.data),
      meta: response.data.meta,
    }));
}

function update(profile) {
  const payload = jsona.serialize({
    stuff: profile,
    includeNames: [],
  });

  return axios
    .patch(`${url}/me`, payload, { headers: JSON_API_HEADERS })
    .then((response) => jsona.deserialize(response.data));
}

export default { get, update };
